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
- 2026-07-10 — Bump transitive `js-yaml` 3.14.2→3.15.0 (via `gray-matter`, fixes moderate DoS advisory GHSA-h67p-54hq-rp68) — [PR #14](https://github.com/eliihen/annual-cycle/pull/14), branch `loop/bump-js-yaml` — verifier APPROVE, PR opened (awaiting human merge)

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — PR #2 (the comprehensive Vitest+coverage suite) was closed on 2026-07-09 *without* merging; `main` only has the minimal bootstrap Vitest setup (`npm test` passes, 24 tests, no coverage script/dep). Human should decide whether to re-attempt the coverage tooling or close #1 as "good enough" — not auto-fixable, ambiguous scope decision.
- 2026-07-10 — Node warning on every `npm run lint`: "Module type of file eslint.config.js is not specified... Reparsing as ES module" — [needs-human] — RECLASSIFIED after explorer investigation: repo is mixed-module (`eslint.config.js`/`vite*.config.js` are ESM, but `src/notify.js`, `scripts/hooks/guard.js`, `scripts/hooks/lint-changed.js`, `scripts/hooks/require-loop-state.js` are all CommonJS, and `guard.test.js` imports `guard.js` via ESM `import`). Adding `"type": "module"` would break all 4 CJS scripts; fixing the warning requires converting them to ESM as one coordinated change — too large/risky for auto-fix.
- 2026-07-10 — Dep drift: `marked` 12.0.2→18.0.6 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable. (still current as of this triage pass)
