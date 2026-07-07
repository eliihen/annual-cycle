# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Fix failing `triage` GitHub Actions job by allowlisting `release-assets.githubusercontent.com` for Bun downloads in `.github/workflows/loop-triage.yml` — branch `copilot/fix-triage-job-failure` — root cause confirmed from Actions job 85657446866; local test + build pass, lint unchanged (warnings only)
- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — PR in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — [PR #3](https://github.com/eliihen/annual-cycle/pull/3), branch `loop/rm-unused-import` — full explorer(haiku)→implementer(sonnet,worktree)→verifier(opus) chain, VERDICT: APPROVE, PR opened
- 2026-07-07 — Harden PreToolUse guard: redirect-target check no longer false-positives when an action.yml path merely appears in text after an unrelated `2>&1` — branch `loop/bootstrap` — fixed + regression test (24 tests pass)
- 2026-07-07 — Prompt-injection hardening (security review response): guard egress + secret-reference denylists; untrusted-data framing + author trust boundary in triage skill, verifier agent, and loop-triage.yml; threat model written to docs/loop-decisions.md — branch `loop/bootstrap` — 33 tests pass, lint clean
- 2026-07-07 — Adversarial review round 2 (enforcement below the agent): loop-triage.yml split into read-only triage + write autofix jobs, both under step-security/harden-runner egress allowlist, `npm ci --ignore-scripts`; guard closes verified holes (+refspec, non-origin push, `gh api` writes, absolute-path/interpreter/bash -c egress, /dev/tcp, process.env + credential-file secret reads, destructive ops, WebFetch host allowlist, broadened action-write); CODEOWNERS on .github/** + hooks; require-loop-state.js NUL parsing; notify.js Slack host pin; docs D10 maps every finding — branch `loop/bootstrap` — 48 tests pass, lint + build clean. See docs/loop-decisions.md D10.

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — superseded by open PR #2 and by the minimal Vitest setup added in `loop/bootstrap`; do not re-file. Close #1 once test tooling lands on `main`.
- 2026-07-07 — PR #2: "Add Vitest testing and coverage tooling" (branch `claude/awesome-maxwell-5ifjig`) — [needs-human] — awaiting human review/merge; comprehensive suite that supersedes the bootstrap minimal setup.
- 2026-07-07 — Unused import `categoryColor` in `src/App.jsx:4` (surfaced by new linter) — [auto-fixable] — ✅ DONE via PR #3 (dry run); do not re-file.
- 2026-07-07 — Lint warnings: unused `React`/`MAX_RINGS` etc. across `src/**` (React 19 automatic runtime) — [auto-fixable] — low priority style cleanup; safe to batch.
- 2026-07-07 — Dep drift (triage `npm outdated`): `@vitejs/plugin-react` 6.0.2→6.0.3 (patch), `vite` 8.0.16→8.1.3 (minor) — [auto-fixable] — safe bumps; batch after dry run.
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable.
