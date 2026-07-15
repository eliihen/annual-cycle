# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-08 — Remove unused `React` default imports across `src/**` (React 19 automatic JSX runtime) — PR #12 (`loop/rm-unused-react-imports`) — merged; resolves prior "lint warnings" backlog item
- 2026-07-08 — Bump `vite` 8.0.16→8.1.4 and `@vitejs/plugin-react` 6.0.2→6.0.3 — PR #13 (`loop/bump-vite`) — merged; resolves prior dep-drift backlog item
- 2026-07-08 — Bump transitive `js-yaml` to 3.15.0 (fix GHSA-h67p-54hq-rp68) — PR #14 (`loop/bump-js-yaml`) — merged
- 2026-07-09 — Add Dependabot config for npm and GitHub Actions — PR #20 (`loop/add-dependabot-config`) — merged
- 2026-07-09 — Bump eslint to 10.7.0 (patch) — PR #19 (`loop/bump-eslint-10-7-0`) — merged
- 2026-07-09 — Rename `eslint.config.js` to `eslint.config.mjs` — PR #21 (`loop/rename-eslint-config-mjs`) — merged
- 2026-07-13 — Bump `actions/setup-node` 4→6 and `actions/checkout` 4→7 (Dependabot) — PR #23, PR #22 — merged

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — RESOLVED: minimal Vitest setup is on `main` (`npm test` = 24 passing tests, 2 files). Close #1 next time a human touches GitHub issues.
- ~~2026-07-07 — PR #2: "Add Vitest testing and coverage tooling"~~ — RESOLVED: PR #2 was closed (not merged) on 2026-07-09; superseded by the minimal Vitest setup from `loop/bootstrap` that's now on `main`. No action needed.
- 2026-07-15 — Issue #17: Text rendering issues in wheel labels — small items missing text entirely, others overflow due to long unbroken words — [needs-human] — touches `wrapLabel()`/`textPath` geometry in `src/components/Wheel.jsx`; fix needs visual verification (rendered SVG) beyond what unit tests/lint can confirm, so not auto-fixable per this loop's gates.
- 2026-07-15 — Issue #18: Rewrite composite GitHub Actions as proper (non-composite) Actions, bundling all deps so consumers don't need `npm ci` at buildtime — [needs-human] — directly touches `.github/actions/*/action.yml`; excluded from auto-fixable scope by policy.
- 2026-07-15 — Issue #15: Publish a React component library (npm package) for the wheel + iframe — [needs-human] — large feature requiring new build/publish pipeline and API design; not a small diff.
- 2026-07-15 — PR #27 (Dependabot): Bump `marked` 12.0.2→18.0.6 — [needs-human] — major version, breaking-change risk; matches/updates prior "Dep drift: marked" entry — now an actual open PR to review, not just a triage note.
- 2026-07-15 — PR #25 (Dependabot): Bump `actions/deploy-pages` 4→5 — [needs-human] — major version bump to a deploy-pipeline action; review before merge.
- 2026-07-15 — PR #24 (Dependabot): Bump `actions/upload-pages-artifact` 3→5 — [needs-human] — major version bump (v4 dropped dotfiles from artifacts) to a deploy-pipeline action; review before merge.
- 2026-07-15 — Triage sweep (issues/PRs/CI/TODO/npm outdated) found no new auto-fixable items — [n/a] — `npm test` (24/24) and `npm run lint` both clean on `main`; only remaining `npm outdated` drift is the already-tracked `marked` major bump; no TODO/FIXME markers in `src/tasks/scripts`; transient CI failures on the loop workflow (runs #7/#8/#10, 2026-07-09) self-resolved by run #9/#11 same day, no action needed.
