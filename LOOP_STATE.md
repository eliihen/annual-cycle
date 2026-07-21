# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-07 — Issue #1: No test coverage tooling configured — resolved; Vitest suite landed on `main` (`npm test` — 24/24 pass). Issue closed.
- 2026-07-07 — PR #2: "Add Vitest testing and coverage tooling" — merged/closed; superseded by the Vitest setup now on `main`.
- 2026-07-07 — Unused import `categoryColor` in `src/App.jsx:4` — merged to `main` (commit `99ba39c`).
- 2026-07-09 — Lint warnings: unused `React` default imports across `src/**` (React 19 automatic runtime) — merged via PR #12 (commit `8bce58b`). `npm run lint` is clean.
- 2026-07-09 — Dep drift: `vite` → 8.1.4, `@vitejs/plugin-react` → 6.0.3 — merged via PR #13.
- 2026-07-13 — Add Dependabot config for npm + GitHub Actions — merged (closes #16).
- 2026-07-13 — Rename `eslint.config.js` → `eslint.config.mjs` (silence Node ESM warning) — merged via PR #21.
- 2026-07-15 — Bump eslint to 10.7.0 (patch) — merged via PR #19.
- 2026-07-16 — Dep drift: `marked` 12.0.2→18.0.6 (major, dependabot) — merged via PR #27.
- 2026-07-16 — Dep drift: `vite` 8.1.4→8.1.5 (patch) — merged via PR #28.
- 2026-07-16 — Add CI workflow (test/lint/build on PRs) — merged via PR #30 (closes #17's regression-guard gap).
- 2026-07-16 — Fix missing/overflowing wheel arc labels — merged via PR #29 (closes #17).
- 2026-07-13/16 — GitHub Actions dependabot bumps: `actions/checkout` 4→7, `actions/setup-node` 4→6, `actions/deploy-pages` 4→5, `actions/upload-pages-artifact` 3→5 — merged via PRs #22–#25.

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-21 — Issue #18: "Make proper GitHub actions" (composite → bundled JS actions) — [needs-human] — open PR #32 already implements this end-to-end; awaiting human review/merge. Do not re-file or re-implement.
- 2026-07-21 — Issue #15: "Implement a react library as well" — [needs-human] — open PR #31 already implements this end-to-end; awaiting human review/merge. Do not re-file or re-implement.
- 2026-07-21 — PR #33: dependabot bump `actions/setup-node` 6→7 (major) — [needs-human] — major version bump on a workflow action; not auto-fixable per policy, awaiting human review/merge.
- 2026-07-21 — Triage sweep: CI on `main` green (last runs all `success`), `npm test` 24/24 pass, `npm run lint` clean, `npm outdated` reports no drift, no `TODO`/`FIXME`/`XXX`/`HACK` markers in `src/`/`tasks/`/`scripts/`. No new auto-fixable findings this run.
