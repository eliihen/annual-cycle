# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-08 — Remove unused React default imports (React 19 automatic JSX runtime) — branch `loop/rm-unused-react-imports` — PR #12 merged
- 2026-07-08 — Bump `vite` to 8.1.4 and `@vitejs/plugin-react` to 6.0.3 — branch `loop/bump-vite` — PR #13 merged
- 2026-07-09 — Bump transitive `js-yaml` to 3.15.0 (fix GHSA-h67p-54hq-rp68) — branch `loop/bump-js-yaml` — PR #14 merged
- 2026-07-09/13 — Add Dependabot config for npm and GitHub Actions; rename `eslint.config.js`→`.mjs`; bump eslint to 10.7.0; bump `actions/setup-node` 4→6 and `actions/checkout` 4→7 — PRs #19, #20, #21, #22, #23 merged
- 2026-07-07 — Issue #1 / PR #2 (Vitest tooling) — resolved; Vitest suite (2 files, 24 tests) is live on `main` and green.

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-16 — Triage run: CI green on `main` for every run since 2026-07-07 (one `Loop – daily triage & auto-fix` run failed 2026-07-09T07:32Z but was followed by passing runs; no action needed). `npm test` (24 passed) and `npm run lint` both clean on current `main`. No TODO/FIXME markers in `src/`, `tasks/`, `scripts/`. `npm outdated` shows only the already-tracked `marked` major bump — **no auto-fixable items found this round**.
- 2026-07-16 — PR #27: Dependabot "Bump marked from 12.0.2 to 18.0.6" — [needs-human] — supersedes the prior marked-drift note below; major version, review breaking changes before merge.
- 2026-07-16 — PR #25: Dependabot "Bump actions/deploy-pages from 4 to 5" — [needs-human] — major version GitHub Action bump.
- 2026-07-16 — PR #24: Dependabot "Bump actions/upload-pages-artifact from 3 to 5" — [needs-human] — major version GitHub Action bump.
- 2026-07-16 — Issue #15: "Implement a react library as well" (publish wheel as npm React component) — [needs-human] — large feature, changes the markdown-import mechanism; needs design discussion.
- 2026-07-16 — Issue #17: "Text rendering issues" (small wheel items missing text; long words overflow their box) — [needs-human] — real bug in `wrapLabel()`/label layout in `src/components/Wheel.jsx`, but fix needs visual verification in a browser; not safely auto-fixable without human review of the rendered wheel.
- 2026-07-16 — Issue #18: "Make proper GitHub actions" (rewrite composite actions to standalone GitHub Actions, bundle deps so no `npm ci` at build time) — [needs-human] — touches `.github/actions/*/action.yml` public interface; explicitly excluded from auto-fixable scope.
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — now tracked via Dependabot PR #27 above; superseded, do not re-file separately.
