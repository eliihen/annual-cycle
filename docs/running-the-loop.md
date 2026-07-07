# Running the loop

This repo is set up for autonomous "loop engineering": a scheduled loop discovers
work, isolated sub-agents draft and verify fixes, and PRs open themselves. This
doc is the operator's manual — how to arm it, in the cloud and locally.

## The pieces

| Piece | File(s) | Role |
|---|---|---|
| State spine | `LOOP_STATE.md` | The loop's memory. Read first, appended last, every run. |
| Skills | `.claude/skills/{project-conventions,triage,ship}/SKILL.md` | Written-down intent. |
| Agents | `.claude/agents/{explorer,implementer,verifier}.md` | Maker/checker split. |
| Guardrails | `.claude/settings.json` + `scripts/hooks/*.js` | Deterministic hooks. |
| Cloud heartbeat | `.github/workflows/loop-triage.yml` | Daily cron. |
| Connectors | `.mcp.json` | GitHub MCP (issues/PRs). |

The flow every run: **triage → (per auto-fixable item) explorer → implementer
(worktree) → verifier → ship (PR)**, capped at 3 items, with `LOOP_STATE.md`
updated at the end.

## Cloud tier — the daily job (recommended default)

`.github/workflows/loop-triage.yml` runs Mon–Fri at 06:00 UTC as **two jobs**: a
read-only `triage` job (ingests untrusted issue text with a read-only token,
emits a sanitized backlog artifact) and a write-scoped `autofix` job (consumes
only that artifact and opens PRs). Both run under `step-security/harden-runner`
with an egress allowlist. To arm it:

1. Add the repo secret **`ANTHROPIC_API_KEY`**
   (Settings → Secrets and variables → Actions → New repository secret).
2. **Enable branch protection on `main`** with *Require a pull request before
   merging* + *Require review from Code Owners* (Settings → Branches). This is
   what makes `.github/CODEOWNERS` binding — without it a self-modifying agent's
   PR to the workflow/guard could merge without a human. It also enforces the
   "humans merge, the loop never does" backstop.
3. It runs on the next cron tick. To test immediately:
   ```bash
   gh workflow run loop-triage.yml
   gh run watch
   ```

> Why two jobs? So the GitHub write token is **not live while the agent reads
> attacker-controlled issue/PR text** — the classic prompt-injection blast-radius
> reducer. See `docs/loop-decisions.md` → D10 for the full threat model.

To create/adjust the schedule from inside a Claude Code session instead, use the
`/schedule` skill:

```
/schedule daily at 06:00 UTC — run the triage skill, then push each auto-fixable
item through explorer → implementer → verifier and open a PR via the ship skill;
cap at 3 items; read and update LOOP_STATE.md.
```

## Local tier — an in-session recurring run

Use the `/loop` skill to run the same playbook on an interval in your local
session (good for supervised bursts or when you don't want cloud tokens):

```
/loop 1h triage the repo, then work the backlog: for each auto-fixable item run
explorer → implementer → verifier and open a PR with ship. Read LOOP_STATE.md
first and update it before finishing. Cap at 3 items per pass.
```

- `1h` is the interval; use `30m`, `4h`, etc. Omit the interval to let the model
  self-pace between passes.
- Stop it any time by interrupting the session.

## Run-until-done (the `/goal` pattern)

For a bounded push with a **verifiable stop condition** rather than a recurring
tick, frame the work as a goal with an explicit, checkable finish line:

```
Goal: clear every `auto-fixable` item in LOOP_STATE.md.
Stop condition (all must hold): `npm test` passes, `npm run lint` is clean (no
errors), `npm run build` succeeds for both index.html and iframe.html, and no
`auto-fixable` items remain unshipped in LOOP_STATE.md.
Work autonomously through explorer → implementer → verifier → ship for each item;
do not stop until the stop condition is verified and printed as a checklist.
```

The key is that the stop condition is machine-checkable (gate commands + a state
of the backlog), so the loop knows when it's actually done instead of guessing.

## Adding more connectors later

`.mcp.json` currently wires the **GitHub** MCP server (issues + PRs), which needs
a `GITHUB_TOKEN`/`GITHUB_PERSONAL_ACCESS_TOKEN` in your environment. To extend:

- **Slack** — add an MCP entry for a Slack server so the loop can post digests /
  ask for human input in a channel. It will need a bot token
  (`SLACK_BOT_TOKEN`) — not configured here because those credentials aren't
  available in this repo.
- **Linear** — add the Linear MCP server to pull issues from Linear instead of
  (or alongside) GitHub. Needs a `LINEAR_API_KEY`.

Add each as another key under `mcpServers` in `.mcp.json`, following the GitHub
entry as a template, and supply its credential as an environment variable /
secret. Do **not** commit tokens — reference them via `${ENV_VAR}`. If you supply
`GITHUB_PERSONAL_ACCESS_TOKEN` for the GitHub MCP server, scope it to **this repo
only** (a fine-grained PAT) — a classic broad PAT would widen the blast radius
well past this repo, past the ephemeral job token.

## Safety model — layered, honest about what enforces what

The controls are layered from strongest (structural, below the agent) to weakest
(soft, in-prompt). **Do not treat the guard hook as a sandbox** — see
`docs/loop-decisions.md` → D10.

1. **Runner egress filter (the real boundary).** `harden-runner` with
   `egress-policy: block` + a host allowlist means a prompt-injected agent
   *cannot reach an attacker host*, whatever it runs. This is what actually stops
   exfiltration.
2. **Least privilege.** Two-job split so the GitHub write token isn't live while
   untrusted issue text is read; `npm ci --ignore-scripts`; top-level
   `permissions: {}`.
3. **Human approval.** CODEOWNERS + branch protection on `.github/**` and the
   guard hooks; the loop **never merges** its own PRs.
4. **Deterministic guard** (`scripts/hooks/guard.js`, PreToolUse) — defense in
   depth: blocks force-push (incl. `+refspec`), non-origin push, `gh api` writes,
   `rm -rf`/destructive ops outside safe dirs, `action.yml` writes, raw egress
   (curl/wget/interpreter-eval/`/dev/tcp`), secret/credential reads, and WebFetch
   to non-allowlisted hosts. A denylist — a speed bump, not the boundary.
5. **`PostToolUse` lint** surfaces real errors on changed JS/JSX; the **`Stop`**
   hook refuses to end a file-changing run without a `LOOP_STATE.md` update.
6. **Untrusted-data framing + author trust boundary + maker/checker** (soft, but
   the verifier is a stronger, different model and no PR opens without
   `VERDICT: APPROVE`).
