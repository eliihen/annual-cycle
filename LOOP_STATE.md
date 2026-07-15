# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-09 — Remove unused `React` default imports across `src/**` (React 19 automatic JSX runtime) — PR #12 (`loop/rm-unused-react-imports`) — merged; lint now clean
- 2026-07-09 — Bump `vite` 8.0.16→8.1.4 and `@vitejs/plugin-react` 6.0.2→6.0.3 — PR #13 (`loop/bump-vite`) — merged; confirmed no longer in `npm outdated`
- 2026-07-09 — Bump transitive `js-yaml` to 3.15.0 (fix GHSA-h67p-54hq-rp68) — PR #14 (`loop/bump-js-yaml`) — merged

## In progress

- 2026-07-13 — PR #19 "Bump eslint to 10.7.0 (patch)" (branch `loop/bump-eslint-10-7-0`) — verifier APPROVE, awaiting human merge — **note:** Dependabot opened PR #26 for the same bump; one of #19/#26 should be closed as duplicate before merge.
- 2026-07-13 — PR #21 "Rename eslint.config.js to eslint.config.mjs" (branch `loop/rename-eslint-config-mjs`) — verifier APPROVE, `mergeable_state: clean`, awaiting human merge.

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — superseded by open PR #2 and by the minimal Vitest setup added in `loop/bootstrap`; do not re-file. Close #1 once test tooling lands on `main`.
- 2026-07-07 — PR #2: "Add Vitest testing and coverage tooling" (branch `claude/awesome-maxwell-5ifjig`) — [needs-human] — awaiting human review/merge; comprehensive suite that supersedes the bootstrap minimal setup.
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.6 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable. Now tracked by Dependabot PR #27.
- 2026-07-15 — PR #26 (Dependabot) "Bump eslint from 10.6.0 to 10.7.0" duplicates open PR #19 — [needs-human] — pick one, close the other before merge (closing a PR is a human/shared-state action, not something the loop does unilaterally).
- 2026-07-15 — PR #24 (Dependabot) "Bump actions/upload-pages-artifact from 3 to 5" — [needs-human] — awaiting review/merge; GitHub Actions version bump in `.github/workflows/*`, doesn't touch `.github/actions/*/action.yml`.
- 2026-07-15 — PR #25 (Dependabot) "Bump actions/deploy-pages from 4 to 5" — [needs-human] — awaiting review/merge, same as above.
- 2026-07-15 — Issue #15 "Implement a react library as well" (publish as npm-consumable React component) — [needs-human] — architectural change to the markdown-import mechanism; out of scope for auto-fix.
- 2026-07-15 — Issue #17 "Text rendering issues" (small wheel segments render no text; long words overflow their box) — [needs-human] — visual/rendering bug in `Wheel.jsx` label wrapping, needs human judgement + visual verification, not auto-fixable.
- 2026-07-15 — Issue #18 "Make proper GitHub actions" (rewrite composite actions in `.github/actions/*` as proper standalone Actions with bundled deps) — [needs-human] — explicitly touches `.github/actions/*/action.yml` public interface; excluded from auto-fix by policy.
- 2026-07-15 — Workflow run 29001846229 "Loop – daily triage & auto-fix" on `main` (2026-07-09T07:32:22Z) concluded `failure`, with two adjacent `cancelled` runs the same morning — [needs-human] — all later runs on `main` (including same-day) succeeded; looks transient/self-resolved, flagging for awareness only, no action taken.

**Triage 2026-07-15 summary:** repo is healthy — `npm test` (24/24 pass) and `npm run lint` (clean) both green locally after `npm install`. No new auto-fixable code-level finding this pass: the only remaining dependency drift is the major `marked` bump (needs-human) and a duplicate eslint patch-bump PR pair (needs-human to resolve). PRs #19 and #21 from a prior loop run are still open and unmerged — nothing new was pushed through explorer/implementer/verifier/ship this run since there is no fresh auto-fixable backlog item to select.
