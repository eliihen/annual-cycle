# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-08 — Issue #1 (no test coverage tooling) resolved — Vitest landed on `main` (24 tests, 2 suites); PR #2 closed unmerged as superseded — outcome: closed
- 2026-07-08 — Remove unused `React` default imports across `src/**` (React 19 automatic JSX runtime) — PR #12 — merged
- 2026-07-09 — Bump `vite` 8.0.16→8.1.4 and `@vitejs/plugin-react` 6.0.2→6.0.3 — PR #13 — merged
- 2026-07-09 — Bump transitive `js-yaml` to 3.15.0 (fix GHSA-h67p-54hq-rp68) — merged to `main`
- 2026-07-09 — Add Dependabot config for npm + GitHub Actions — PR #20 — merged
- 2026-07-13 — Bump `actions/checkout` 4→7 and `actions/setup-node` 4→6 (dependabot) — PR #22, #23 — merged

## In progress

- 2026-07-14 — PR #19 `loop/bump-eslint-10-7-0` ("Bump eslint to 10.7.0 (patch)") — open, awaiting merge — **duplicates dependabot PR #26** ("Bump eslint from 10.6.0 to 10.7.0") which opened the same day; one should be closed by a human to avoid a merge race.
- 2026-07-14 — PR #21 `loop/rename-eslint-config-mjs` ("Rename eslint.config.js to eslint.config.mjs") — open, awaiting merge — fixes the `MODULE_TYPELESS_PACKAGE_JSON` warning still observed on `npm run lint` from this branch.
- 2026-07-14 — Dependabot PR #24 (`actions/upload-pages-artifact` 3→5) and #25 (`actions/deploy-pages` 4→5) — open, awaiting human review/merge (workflow-file changes, not auto-fixable by the loop).
- 2026-07-14 — Dependabot PR #27 (`marked` 12.0.2→18.0.6, major) — open, awaiting human review/merge; breaking-change risk, not auto-fixable.

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-14 — Issue #15: "Implement a react library as well" (publish wheel as an npm-consumable React component/library) — [needs-human] — large feature, changes the markdown-import build mechanism; needs design input.
- 2026-07-14 — Issue #17: "Text rendering issues" (some small wheel segments render no text; some overflow on long words) — [needs-human] — real bug in `wrapLabel()`/label-arc logic in `src/components/Wheel.jsx`, but fixing it safely requires visual verification (no snapshot/visual tests exist); flag for a run with browser-based before/after screenshots rather than a blind text-only diff.
- 2026-07-14 — Issue #18: "Make proper GitHub actions" (rewrite composite actions under `.github/actions/` into standalone actions bundling all deps, no `npm ci` at build time) — [needs-human] — explicitly touches `.github/actions/*/action.yml`, excluded from auto-fixable by policy; architectural change.
- 2026-07-14 — Dep drift: `marked` 12.0.2→18.0.6 (major) — [needs-human] — tracked by open PR #27 above; not auto-fixable.

### Triage pass 2026-07-14

- Re-ran `npm test` (24/24 pass) and `npm run lint` (0 errors/warnings) after a fresh `npm install` — gates are green on this branch.
- `npm outdated`: only `eslint` 10.6.0→10.7.0 remains, already covered by open PRs #19/#26 (see "In progress").
- No `TODO`/`FIXME`/`XXX`/`HACK` markers found in `src/`, `tasks/`, `scripts/`.
- No failed CI runs since the last triage; all recent `Build & Deploy Årshjul`, `Loop – daily triage & auto-fix`, and dependabot-update workflow runs on `main` are green.
- **Result: 0 new auto-fixable items identified.** Every previously-flagged auto-fixable candidate already has a merged PR or an open PR awaiting human merge (see "In progress"); nothing was pushed through explorer → implementer → verifier → ship this run.
