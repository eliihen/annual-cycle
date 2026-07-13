# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-10 — Vitest testing/coverage tooling landed on `main` (superseded the bootstrap minimal setup); issue #1 and PR #2 both closed — merged via PR #11 (`copilot/fix-triage-and-fix-job`)
- 2026-07-10 — Remove unused React default imports across `src/**` (React 19 automatic JSX runtime) — PR #12 (`loop/rm-unused-react-imports`) — merged
- 2026-07-10 — Bump `vite` 8.0.16→8.1.4 and `@vitejs/plugin-react` 6.0.2→6.0.3 — PR #13 (`loop/bump-vite`) — merged
- 2026-07-10 — Bump transitive `js-yaml` to 3.15.0 (fix GHSA-h67p-54hq-rp68) — PR #14 (`loop/bump-js-yaml`) — merged

## In progress

- 2026-07-13 — Bump `eslint` 10.6.0→10.7.0 (patch) — explorer/implementer/verifier chain running
- 2026-07-13 — Issue #16: add `.github/dependabot.yml` — explorer/implementer/verifier chain running
- 2026-07-13 — Rename `eslint.config.js` → `eslint.config.mjs` to silence Node ESM-reparse warning — explorer/implementer/verifier chain running
- 2026-07-13 — Housekeeping: `.gitignore` had `.worktrees/` but the Agent tool's `isolation: worktree` actually creates worktrees under `.claude/worktrees/`, leaving them untracked and tripping the Stop hook — added `.claude/worktrees/` to `.gitignore`

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.6 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable.
- 2026-07-13 — Issue #15: "Implement a react library as well" (publish an npm-consumable React component) — [needs-human] — large feature request, changes the markdown-import mechanism; not a small diff.
- 2026-07-13 — Issue #16: Set up dependabot to keep dependencies (incl. `.github/actions` deps) up to date — [auto-fixable] — adding `.github/dependabot.yml` is a small, well-scoped config addition; doesn't touch `.github/actions/*/action.yml` interfaces. SELECTED for this run.
- 2026-07-13 — Issue #17: Text rendering issues in the wheel (missing/overflowing labels on small arcs) — [needs-human] — visual bug in `wrapLabel()`/`Wheel.jsx` geometry; needs screenshot verification against real data, not safely auto-fixable.
- 2026-07-13 — Issue #18: Rewrite composite GitHub Actions (`.github/actions/*`) as proper (non-composite) Actions bundling all deps — [needs-human] — explicitly touches `.github/actions/*/action.yml` public interface; excluded from auto-fix per triage rules.
- 2026-07-13 — Dep drift (triage `npm outdated`): `eslint` 10.6.0→10.7.0 (patch) — [auto-fixable] — safe patch bump. SELECTED for this run.
- 2026-07-13 — `eslint.config.js` triggers a Node `MODULE_TYPELESS_PACKAGE_JSON` warning + ESM reparse on every `npm run lint` (package.json has no `"type"` field, but the config file uses `import`) — [auto-fixable] — do NOT add `"type": "module"` to `package.json`, that breaks CommonJS runtime files (`src/notify.js`, `src/build.js`, `scripts/hooks/*.js` all use `require()`/`module.exports`); instead rename `eslint.config.js` → `eslint.config.mjs` (ESLint flat config auto-discovers `.mjs`) and check whether the `'*.config.js'` glob inside it needs updating. SELECTED for this run.
