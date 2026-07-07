'use strict';

// Deterministic PreToolUse guard for the autonomous loop.
//
// ⚠️ SCOPE — READ THIS. This guard is DEFENSE-IN-DEPTH, not a sandbox. As long
// as the loop can run `node`, `npm`, `git`, and `gh` (it must, to build/test/
// ship), a prompt-injected agent has a general-purpose interpreter with network
// and env access, and no in-process regex can fully contain that. The REAL
// boundary lives below the agent and is configured in the workflow:
//   - egress filtering at the runner (step-security/harden-runner, egress-policy
//     block + host allowlist) — this is what actually stops exfiltration;
//   - least-privilege / job split so write scopes + secrets aren't live while
//     untrusted issue text is read;
//   - `npm ci --ignore-scripts` so a malicious dependency can't run postinstall;
//   - CODEOWNERS + branch protection on .github/** so a human approves anyway;
//   - human merge (the loop never merges its own PRs).
// See docs/loop-decisions.md (threat model). This file closes the *known* cheap
// bypasses so they cost an attacker something; it is not the security boundary.
//
// Blocks (exit code 2) on the Bash / Edit / Write / WebFetch paths:
//   - git force-push (`--force`, `-f`, and the `+<refspec>` form)
//   - pushing to / adding a non-origin remote or an explicit URL (exfil setup)
//   - `gh api` with a write verb (POST/PUT/PATCH/DELETE / -f / --field)
//   - raw network egress: curl/wget/nc/ssh/… (incl. absolute paths & bash -c),
//     inline interpreter eval (`node -e`, `python -c`, …), and /dev/tcp
//   - reading secrets: `$*_TOKEN`/`process.env.*_KEY`/credential files/env dumps
//   - `rm -rf` / other destructive primitives outside worktree/scratch/build
//   - writes to `.github/actions/*/action.yml` (public API) unless authorized
//   - WebFetch to a host not on the allowlist
//
// Core logic is the pure `evaluate()` function so it can be unit-tested; the CLI
// at the bottom wires it to hook stdin/exit codes.

const fs = require('fs');
const path = require('path');

// Paths under which `rm -rf` (and other destructive ops) are acceptable.
const RM_ALLOWED_PREFIXES = [
  '.worktrees/', 'dist', 'coverage', 'node_modules', 'annual-cycle-src',
  '/tmp/', '/private/tmp/', '/var/folders/',
];

const ACTION_FILE_RE = /\.github\/actions\/[^\s'"]*\/action\.ya?ml/;

// Hosts a WebFetch may target. Everything else is denied.
const WEBFETCH_ALLOWED_HOSTS = new Set([
  'github.com', 'api.github.com', 'raw.githubusercontent.com',
  'objects.githubusercontent.com', 'api.anthropic.com',
  'registry.npmjs.org', 'nodejs.org',
]);

// Egress binaries the loop never needs. Matched on the token BASENAME so an
// absolute path (/usr/bin/curl) can't slip past a token boundary.
const NETWORK_BINS = new Set([
  'curl', 'wget', 'nc', 'ncat', 'netcat', 'telnet', 'scp', 'sftp', 'ssh',
  'socat', 'ftp', 'tftp',
]);

// Credential material the loop has no reason to read.
const CREDENTIAL_PATH_RE = /(\.git-credentials|(^|\/)\.netrc|id_rsa|id_ed25519|id_ecdsa|id_dsa|\.aws\/credentials|\.ssh\/|\.npmrc|gh\/hosts\.yml|\.docker\/config\.json|\.git-credentials)/;

const SECRET_VAR_RE = /\$\{?\s*[A-Z0-9_]*(TOKEN|SECRET|API_?KEY|PASSWORD|PASSWD|WEBHOOK|CREDENTIAL|PRIVATE_KEY)[A-Z0-9_]*\s*\}?/;
const PROCESS_ENV_SECRET_RE = /process\.env(\.\s*[A-Z0-9_]*|\[\s*['"][A-Z0-9_]*)(TOKEN|SECRET|KEY|PASSWORD|WEBHOOK|CREDENTIAL)/i;

// Split a command into whitespace tokens, stripping surrounding quotes.
function tokens(cmd) {
  return cmd.split(/\s+/).map(t => t.replace(/^['"]+|['"]+$/g, '')).filter(Boolean);
}

// Pull out the payloads of `bash -c "..."` / `sh -c '...'` so they get re-scanned.
function innerShellPayloads(cmd) {
  const out = [];
  const re = /\b(?:ba|z|da)?sh\s+-c\s+(['"])([\s\S]*?)\1/g;
  let m;
  while ((m = re.exec(cmd)) !== null) out.push(m[2]);
  return out;
}

function isNetworkEgress(cmd) {
  if (/\/dev\/(tcp|udp)\//.test(cmd)) return true;                 // bash net builtin
  if (/(^|[\s;|&(`])(node|nodejs)\s+(-e|--eval|-p|--print|-pe)\b/.test(cmd)) return true;
  if (/(^|[\s;|&(`])(python3?|ruby|perl|php)\s+(-e|-c|-pe)\b/.test(cmd)) return true;
  for (const t of tokens(cmd)) {
    const base = t.split('/').pop();
    if (NETWORK_BINS.has(base)) return true;
  }
  return innerShellPayloads(cmd).some(isNetworkEgress);
}

function referencesSecret(cmd) {
  if (SECRET_VAR_RE.test(cmd)) return true;
  if (PROCESS_ENV_SECRET_RE.test(cmd)) return true;
  if (CREDENTIAL_PATH_RE.test(cmd)) return true;
  if (/(^|[\s;|&(`])printenv(\s|$|[;|&)])/.test(cmd)) return true;
  if (/(^|[\s;|&(`])env\s*(\||$|>)/.test(cmd)) return true;        // bare `env`, `env |`, `env >`
  return innerShellPayloads(cmd).some(referencesSecret);
}

function isForcePush(cmd) {
  if (!/\bgit\b/.test(cmd) || !/\bpush\b/.test(cmd)) return false;
  if (/--force-with-lease/.test(cmd)) return false;               // the safe variant
  if (/(^|\s)(--force|-f)(\s|$|=)/.test(cmd)) return true;
  if (/\bpush\b[^\n;&|]*\s\+[\w./-]+/.test(cmd)) return true;      // `git push origin +main` (+refspec)
  return false;
}

// Pushing to anything other than `origin`, or wiring up a new remote, is how an
// injected agent would ship repo contents / a staged secret off-box.
function isBadGitRemoteOp(cmd) {
  if (/\bgit\s+remote\s+(add|set-url)\b/.test(cmd)) return true;
  if (/\bgit\s+push\b/.test(cmd) && /(https?:\/\/|git@|ssh:\/\/|ftp:\/\/)/.test(cmd)) return true;
  return false;
}

// `gh api` with a write verb is unrestricted egress-within-GitHub. Reads are fine.
function isGhWrite(cmd) {
  if (!/\bgh\s+api\b/.test(cmd)) return false;
  if (/(-X|--method)\s+(POST|PUT|PATCH|DELETE)/i.test(cmd)) return true;
  if (/(^|\s)(-f|--field|-F|--raw-field|--input)\b/.test(cmd)) return true;
  return false;
}

function pathAllowed(t) {
  return RM_ALLOWED_PREFIXES.some(p => t === p || t.startsWith(p));
}

function rmTargetsOutsideSafe(cmd) {
  const rmRe = /\brm\s+(-[a-zA-Z]*\s+|--[a-z-]+\s+)*[^\n;&|]*/g;
  let m;
  while ((m = rmRe.exec(cmd)) !== null) {
    const segment = m[0];
    const hasR = /(^|\s)-[a-zA-Z]*r/i.test(segment) || /--recursive/.test(segment);
    const hasF = /(^|\s)-[a-zA-Z]*f/i.test(segment) || /--force/.test(segment);
    if (!(hasR && hasF)) continue;
    const targets = segment.replace(/\brm\b/, '').split(/\s+/).filter(Boolean).filter(t => !t.startsWith('-'));
    for (const raw of targets) {
      const t = raw.replace(/^['"]|['"]$/g, '');
      if (!t) continue;
      if (t === '/' || t === '~' || t === '.' || t === '..' || t === '*' || t === '/*') return t;
      if (t.startsWith('~') || t.startsWith('..') || t.includes('/../')) return t;
      if (!pathAllowed(t)) return t;
    }
  }
  return null;
}

// Other destructive primitives (availability, not exfil — lower severity, but
// the guard shouldn't pretend `rm` is the only way to wreck the tree).
function isDestructive(cmd) {
  if (/\bshred\b/.test(cmd)) return true;
  if (/\btruncate\b/.test(cmd)) return true;
  if (/\bfind\b[^\n]*\s-delete\b/.test(cmd)) return true;
  if (/\bfind\b[^\n]*-exec\s+rm\b/.test(cmd)) return true;
  if (/\bgit\s+clean\b[^\n]*-[a-z]*f/.test(cmd)) return true;     // git clean -fd / -xfd
  return false;
}

function bashTouchesActionFile(cmd) {
  if (!ACTION_FILE_RE.test(cmd)) return false;
  // Broadened write-primitive list. Still a denylist (see the SCOPE note) — the
  // real protection for these files is CODEOWNERS + branch protection.
  if (/(^|[\s;|&(`])(sed\s+-i|tee|cp|mv|touch|rm|dd|install|patch|ex|ed|node|nodejs|python3?|perl|ruby|awk)\b/.test(cmd)) return true;
  const redirectRe = />>?\s*([^\s'"|&;]+)/g;
  let r;
  while ((r = redirectRe.exec(cmd)) !== null) {
    if (ACTION_FILE_RE.test(r[1])) return true;
  }
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

function webFetchHostAllowed(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return WEBFETCH_ALLOWED_HOSTS.has(host);
  } catch {
    return false; // unparseable URL → deny
  }
}

// Pure decision function. Returns { block, reason }.
function evaluate(input, env = process.env, repoRoot = process.cwd()) {
  const tool = input.tool_name;
  const ti = input.tool_input || {};

  if (tool === 'Bash') {
    const cmd = ti.command || '';
    if (isForcePush(cmd)) {
      return { block: true, reason: 'Blocked: force-push (--force / -f / +refspec) is not allowed.' };
    }
    if (isBadGitRemoteOp(cmd)) {
      return { block: true, reason: 'Blocked: pushing to a non-origin remote or adding/rewiring a remote — an exfiltration channel. Push to origin only.' };
    }
    if (isGhWrite(cmd)) {
      return { block: true, reason: 'Blocked: `gh api` with a write verb is unrestricted egress-within-GitHub. Use gh pr/issue commands for their intended actions only.' };
    }
    const badTarget = rmTargetsOutsideSafe(cmd);
    if (badTarget) {
      return { block: true, reason: `Blocked: "rm -rf ${badTarget}" targets a path outside the worktree/scratch/build dirs.` };
    }
    if (isDestructive(cmd)) {
      return { block: true, reason: 'Blocked: destructive command (shred/truncate/find -delete/git clean -f) outside allowed dirs.' };
    }
    if (bashTouchesActionFile(cmd) && !actionEditsAllowed(env, repoRoot)) {
      return { block: true, reason: 'Blocked: shell write to .github/actions/*/action.yml (public API). Set LOOP_ALLOW_ACTION_EDITS=1 only if the backlog item explicitly targets it.' };
    }
    if (isNetworkEgress(cmd)) {
      return { block: true, reason: 'Blocked: raw network egress (curl/wget/nc/ssh/interpreter-eval/dev-tcp). The loop uses gh/git for GitHub and npm for installs. (Note: the real egress control is harden-runner in the workflow, not this check.)' };
    }
    if (referencesSecret(cmd)) {
      return { block: true, reason: 'Blocked: command references a secret env var / credential file / process.env secret, or dumps the environment.' };
    }
    return { block: false, reason: '' };
  }

  if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') {
    const fp = (ti.file_path || ti.notebook_path || '').replace(/\\/g, '/');
    if (ACTION_FILE_RE.test(fp) && !actionEditsAllowed(env, repoRoot)) {
      return { block: true, reason: `Blocked: editing ${fp} changes the public composite-action API. Set LOOP_ALLOW_ACTION_EDITS=1 (or add .claude/loop-allow-action-edits) only when the backlog item explicitly targets it.` };
    }
    return { block: false, reason: '' };
  }

  if (tool === 'WebFetch' || tool === 'WebSearch') {
    const url = ti.url || ti.prompt || '';
    if (tool === 'WebFetch' && !webFetchHostAllowed(url)) {
      return { block: true, reason: `Blocked: WebFetch to a non-allowlisted host (${url}). Allowed: ${[...WEBFETCH_ALLOWED_HOSTS].join(', ')}.` };
    }
    return { block: false, reason: '' };
  }

  return { block: false, reason: '' };
}

module.exports = {
  evaluate, isForcePush, isBadGitRemoteOp, isGhWrite, rmTargetsOutsideSafe,
  isDestructive, actionEditsAllowed, isNetworkEgress, referencesSecret,
  bashTouchesActionFile, webFetchHostAllowed,
};

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
