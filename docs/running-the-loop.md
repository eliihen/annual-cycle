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

`.github/workflows/loop-triage.yml` already runs Mon–Fri at 06:00 UTC. To arm it:

1. Add the repo secret **`ANTHROPIC_API_KEY`**
   (Settings → Secrets and variables → Actions → New repository secret).
2. That's it — it will run on the next cron tick. To test immediately, trigger it
   by hand:
   ```bash
   gh workflow run loop-triage.yml
   gh run watch
   ```

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
secret. Do **not** commit tokens — reference them via `${ENV_VAR}`.

## Safety model (what can't go wrong)

- The `PreToolUse` guard (`scripts/hooks/guard.js`) blocks force-pushes,
  `rm -rf` outside worktrees/build dirs, and any edit to
  `.github/actions/*/action.yml` unless `LOOP_ALLOW_ACTION_EDITS=1` — the
  composite actions are a public API.
- The `PostToolUse` hook lints changed JS/JSX and surfaces real errors.
- The `Stop` hook refuses to end a run that changed files without updating
  `LOOP_STATE.md`.
- The verifier is a **different, stronger model** than the implementer, and no
  PR opens without `VERDICT: APPROVE`. Humans still merge.
