'use strict';

// Deterministic PreToolUse guard for the autonomous loop.
//
// Blocks (exit code 2), regardless of how politely the agent was asked:
//   1. `git push --force` / `git push -f`   (never force-push shared history)
//   2. `rm -rf` targeting anything outside a worktree / scratch / build dir
//   3. edits to `.github/actions/*/action.yml` (the public composite-action API)
//      unless the current backlog item explicitly authorizes it, signalled by
//      env `LOOP_ALLOW_ACTION_EDITS=1` or the sentinel file
//      `.claude/loop-allow-action-edits`.
//   4. raw outbound network tools (curl/wget/nc/...) — the loop uses `gh`/`git`
//      for GitHub and `npm` for installs; nothing else needs egress. This is the
//      anti-exfiltration control for a prompt-injected agent.
//   5. any command that references a secret env var (`$*_TOKEN`, `$*_API_KEY`,
//      `SLACK_WEBHOOK_URL`, …) or dumps the environment (`printenv`, `env |`) —
//      so an injection can't echo a secret into a branch name, comment, or pipe.
//
// The core logic is the pure `evaluate()` function so it can be unit-tested;
// the CLI at the bottom wires it to hook stdin/exit codes.

const fs = require('fs');
const path = require('path');

// Paths under which `rm -rf` is acceptable (ephemeral / rebuildable).
const RM_ALLOWED_PREFIXES = [
  '.worktrees/',
  'dist',
  'coverage',
  'node_modules',
  'annual-cycle-src',
  '/tmp/',
  '/private/tmp/',
  '/var/folders/', // macOS tmp
];

const ACTION_FILE_RE = /\.github\/actions\/[^\s'"]*\/action\.ya?ml/;

// Raw egress tools the loop never legitimately needs (GitHub is reached via
// `gh`/`git`; package installs via `npm`). Matched as whole command tokens so
// substrings like "occurred" don't trip.
const NETWORK_TOOLS_RE = /(^|[\s;|&(`$])(curl|wget|nc|ncat|netcat|telnet|scp|sftp|ssh)([\s;|&)]|$)/;

// A `$VAR` / `${VAR}` reference whose name looks like a credential.
const SECRET_VAR_RE = /\$\{?\s*[A-Z0-9_]*(TOKEN|SECRET|API_?KEY|PASSWORD|PASSWD|WEBHOOK|CREDENTIAL|PRIVATE_KEY)[A-Z0-9_]*\s*\}?/;

function isNetworkEgress(cmd) {
  return NETWORK_TOOLS_RE.test(cmd);
}

function referencesSecret(cmd) {
  if (SECRET_VAR_RE.test(cmd)) return true;
  // Dumping the whole environment is an exfil primitive.
  if (/(^|[\s;|&(`])printenv(\s|$|[;|&)])/.test(cmd)) return true;
  if (/(^|[\s;|&(`])env\s*(\||$|>)/.test(cmd)) return true; // bare `env`, `env |`, `env >`
  return false;
}

function actionEditsAllowed(env, repoRoot) {
  if (env.LOOP_ALLOW_ACTION_EDITS && env.LOOP_ALLOW_ACTION_EDITS !== '0') return true;
  try {
    return fs.existsSync(path.join(repoRoot || '.', '.claude', 'loop-allow-action-edits'));
  } catch {
    return false;
  }
}

function isForcePush(cmd) {
  if (!/\bgit\b/.test(cmd) || !/\bpush\b/.test(cmd)) return false;
  // --force-with-lease is the safe variant; allow it, block the blunt ones.
  if (/--force-with-lease/.test(cmd)) return false;
  return /(^|\s)(--force|-f)(\s|$|=)/.test(cmd) || /-[a-z]*f[a-z]*\s+.*--force/.test(cmd);
}

function rmTargetsOutsideSafe(cmd) {
  // Find `rm` invocations with both recursive and force flags.
  const rmRe = /\brm\s+(-[a-zA-Z]*\s+|--[a-z-]+\s+)*[^\n;&|]*/g;
  let m;
  while ((m = rmRe.exec(cmd)) !== null) {
    const segment = m[0];
    const hasR = /(^|\s)-[a-zA-Z]*r/i.test(segment) || /--recursive/.test(segment);
    const hasF = /(^|\s)-[a-zA-Z]*f/i.test(segment) || /--force/.test(segment);
    if (!(hasR && hasF)) continue;

    // Extract non-flag tokens as targets.
    const tokens = segment
      .replace(/\brm\b/, '')
      .split(/\s+/)
      .filter(Boolean)
      .filter(t => !t.startsWith('-'));

    for (const raw of tokens) {
      const t = raw.replace(/^['"]|['"]$/g, '');
      if (!t) continue;
      // Obvious catastrophes.
      if (t === '/' || t === '~' || t === '.' || t === '..' || t === '*' || t === '/*') return t;
      if (t.startsWith('~') || t.startsWith('..') || t.includes('/../')) return t;
      const allowed = RM_ALLOWED_PREFIXES.some(p => t === p || t.startsWith(p));
      if (!allowed) return t;
    }
  }
  return null;
}

function bashTouchesActionFile(cmd) {
  if (!ACTION_FILE_RE.test(cmd)) return false;
  // Only care about *mutating* references, not `cat`/`grep`/`git diff`.
  // A mutation is either a known write tool applied to the file, or a shell
  // redirection (`>`/`>>`) whose target is an action.yml path.
  if (/(^|\s)(sed\s+-i|tee|cp|mv|touch|rm)\b/.test(cmd)) return true;
  // A redirection mutates an action file only if the file is the *target* of a
  // `>`/`>>` — i.e. the first token right after the operator. Matching the
  // whole tail would false-positive on any command that merely mentions the
  // path after an unrelated redirect (e.g. a `2>&1` earlier in the line).
  const redirectRe = />>?\s*([^\s'"|&;]+)/g;
  let r;
  while ((r = redirectRe.exec(cmd)) !== null) {
    if (ACTION_FILE_RE.test(r[1])) return true;
  }
  return false;
}

// Pure decision function. Returns { block, reason }.
function evaluate(input, env = process.env, repoRoot = process.cwd()) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};

  if (tool === 'Bash') {
    const cmd = ti.command || '';
    if (isForcePush(cmd)) {
      return { block: true, reason: 'Blocked: force-push is not allowed. Use --force-with-lease only with explicit human approval.' };
    }
    const badTarget = rmTargetsOutsideSafe(cmd);
    if (badTarget) {
      return { block: true, reason: `Blocked: "rm -rf ${badTarget}" targets a path outside the worktree/scratch/build dirs.` };
    }
    if (bashTouchesActionFile(cmd) && !actionEditsAllowed(env, repoRoot)) {
      return { block: true, reason: 'Blocked: shell edit to .github/actions/*/action.yml (public API). Set LOOP_ALLOW_ACTION_EDITS=1 only if the backlog item explicitly targets it.' };
    }
    if (isNetworkEgress(cmd)) {
      return { block: true, reason: 'Blocked: raw network egress (curl/wget/nc/ssh/…) is not allowed in the loop. Use gh/git for GitHub and npm for installs. This prevents a prompt-injected agent from exfiltrating data.' };
    }
    if (referencesSecret(cmd)) {
      return { block: true, reason: 'Blocked: command references a secret env var or dumps the environment. Secrets must never be echoed into branch names, commit messages, comments, or pipes.' };
    }
    return { block: false, reason: '' };
  }

  if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') {
    const fp = ti.file_path || ti.notebook_path || '';
    if (ACTION_FILE_RE.test(fp.replace(/\\/g, '/')) && !actionEditsAllowed(env, repoRoot)) {
      return { block: true, reason: `Blocked: editing ${fp} changes the public composite-action API. Set LOOP_ALLOW_ACTION_EDITS=1 (or add .claude/loop-allow-action-edits) only when the backlog item explicitly targets it.` };
    }
    return { block: false, reason: '' };
  }

  return { block: false, reason: '' };
}

module.exports = { evaluate, isForcePush, rmTargetsOutsideSafe, actionEditsAllowed, isNetworkEgress, referencesSecret };

// CLI entry: read hook JSON from stdin, exit 2 to block.
if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    let input = {};
    try { input = JSON.parse(raw || '{}'); } catch { /* treat as empty */ }
    const { block, reason } = evaluate(input);
    if (block) {
      process.stderr.write(reason + '\n');
      process.exit(2);
    }
    process.exit(0);
  });
}
