# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE, merged to `main`
- 2026-07-09 — PR #11: add missing `id-token: write` permission to `loop-triage.yml` (was failing every run at the OIDC token fetch step) — branch `copilot/fix-triage-and-fix-job` — merged
- 2026-07-09 — Remove unused `React` default imports across `src/**` (React 19 automatic JSX runtime) — PR #12, branch `loop/rm-unused-react-imports` — verifier APPROVE, merged
- 2026-07-09 — Bump `vite` 8.0.16→8.1.4 and `@vitejs/plugin-react` 6.0.2→6.0.3 — PR #13, branch `loop/bump-vite` — verifier APPROVE, merged

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — PR #2 (the comprehensive Vitest+coverage suite) was closed on 2026-07-09 *without* merging; `main` only has the minimal bootstrap Vitest setup (`npm test` passes, 24 tests, no coverage script/dep). Human should decide whether to re-attempt the coverage tooling or close #1 as "good enough" — not auto-fixable, ambiguous scope decision.
- 2026-07-10 — Node warning on every `npm run lint`: "Module type of file eslint.config.js is not specified... Reparsing as ES module" — [auto-fixable] — add `"type": "module"` to `package.json` (repo only ships ESM: `vite.config.js`/`eslint.config.js` use `import`/`export`); eliminates the perf-overhead warning, no behavior change. SELECTED for this run.
- 2026-07-10 — `npm audit`: moderate DoS advisory in transitive `js-yaml@3.14.2` (via `gray-matter`) — [auto-fixable] — `npm audit fix` bumps to `js-yaml@3.15.0`, within `gray-matter`'s existing `^3.13.1` range, lockfile-only change. Note: Dependabot has independently merged 3 `js-yaml` bumps this week (see CI history) and may pick this up on its own; harmless to also fix directly. SELECTED for this run.
- 2026-07-10 — Dep drift: `marked` 12.0.2→18.0.6 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable. (still current as of this triage pass)
