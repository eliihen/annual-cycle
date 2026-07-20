# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-16 (landed on `main` by 2026-07-20) — Lint warnings: unused `React`/`MAX_RINGS` etc. across `src/**` — commit `8bce58b` "Remove unused React default imports" — `npm run lint` now clean
- 2026-07-16 (landed on `main` by 2026-07-20) — Dep drift: `@vitejs/plugin-react`/`vite` patch+minor bumps — commit `65fbd46` "Bump vite to 8.1.4 and @vitejs/plugin-react to 6.0.3" (further bumped to vite 8.1.5 via `2224696`)
- 2026-07-16 (landed on `main` by 2026-07-20) — Dep drift: `marked` 12.0.2→18.0.6 (major) — commit `761902f` "Bump marked from 12.0.2 to 18.0.6" — landed despite earlier `[needs-human]` tag; verify no runtime regressions if issues surface
- 2026-07-09 — Issue #1 (test coverage tooling) — closed on GitHub; no longer open
- 2026-07-09 — PR #2 "Add Vitest testing and coverage tooling" — closed without merging; superseded by the minimal Vitest setup from `loop/bootstrap`, which is on `main` (`npm test` — 24 tests passing across 2 files)

## In progress

- 2026-07-20 — Issue #18 "Make proper GitHub actions" — [needs-human] — open PR #32 "Convert build & notify-slack actions to bundled JavaScript" (branch `claude/issue-18-implementer-verifier-xsxokd`) awaiting human review/merge
- 2026-07-20 — Issue #15 "Implement a react library as well" — [needs-human] — open PR #31 "Implement React library export with reusable Vite plugin" (branch `claude/issue-15-implementer-verifier-4phr6t`) awaiting human review/merge

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

_(none — 2026-07-20 triage found no new items: CI on `main` is green for the last 10 runs, `npm test`/`npm run lint` pass clean, `npm outdated` reports nothing, and no TODO/FIXME markers in `src/`/`tasks/`/`scripts/`. The only open issues (#15, #18) already have PRs open (#31, #32) awaiting human review — see "In progress".)
