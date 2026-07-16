# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-16 — Issue #1 (no test coverage tooling) and PR #2 (Vitest setup) — both closed/merged upstream of this watermark; `npm test` now runs 24 passing tests via Vitest. Confirmed resolved during 2026-07-16 triage, no action needed.
- 2026-07-16 — Unused import `categoryColor` in `src/App.jsx` and unused `React`/`MAX_RINGS` lint warnings — resolved upstream (`8bce58b` "Remove unused React default imports"); `npm run lint` is clean as of 2026-07-16 triage.
- 2026-07-16 — Dep drift: `vite` → 8.1.5, `@vitejs/plugin-react` current, `marked` → 18.0.6 — all resolved upstream via merged bump PRs (#27, #28) and Dependabot runs; `npm outdated` reports nothing as of 2026-07-16 triage.

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — RESOLVED, see Done. Do not re-file.
- 2026-07-07 — PR #2: "Add Vitest testing and coverage tooling" — RESOLVED, see Done. Do not re-file.
- 2026-07-07 — Unused import `categoryColor` in `src/App.jsx:4` — RESOLVED, see Done.
- 2026-07-07 — Lint warnings: unused `React`/`MAX_RINGS` etc. — RESOLVED, see Done.
- 2026-07-07 — Dep drift: `@vitejs/plugin-react`, `vite` — RESOLVED, see Done.
- 2026-07-07 — Dep drift: `marked` major bump — RESOLVED, see Done (merged as #27, 12.0.2→18.0.6).
- 2026-07-16 — Issue #18: "Make proper GitHub actions" (rewrite composite actions in `.github/actions/` to proper published GitHub Actions, bundling deps so no `npm ci` at buildtime) — [needs-human] — repo label says "auto-fixable" but this touches `.github/actions/*/action.yml` public interfaces and is an architectural rewrite, not a single small diff; excluded from auto-fix per project rules. Flagging for human review.
- 2026-07-16 — Issue #15: "Implement a react library" (publish the wheel + iframe as an importable React component / npm package, changing the markdown-import mechanism to load on demand from a configurable path) — [needs-human] — repo label says "auto-fixable" but this is a multi-file architectural change (new build target, package publishing) well beyond a small diff; not auto-fixable.
- 2026-07-16 — CI health check (`gh`/GitHub Actions, last 20 runs on `main`): all completed runs are `success` (CI, Build & Deploy, Dependabot updates); one `Build & Deploy` run for the vite 8.1.4→8.1.5 bump shows `cancelled` (superseded by the next push in the same concurrency group, not a failure) — no action needed.
- 2026-07-16 — `npm test`, `npm run lint`, `npm outdated`: all clean as of this triage (24/24 tests pass, zero lint warnings, no outdated deps). No new auto-fixable findings from tooling gates.
