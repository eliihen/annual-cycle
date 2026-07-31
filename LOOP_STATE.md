# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-16 — Issue #15: Implement a React library — extracted the markdown vite plugin to `src/lib/vitePlugin.js` (reusable by a consuming app's own vite config, pointed at their own tasks dir), added `src/lib/index.js` exporting `Wheel` + `processTasks`, and a new `vite.lib.config.js` producing `dist-lib/annual-cycle.{js,cjs}` (ES+CJS, React externalized) with matching `package.json` `main`/`module`/`exports`/`files`/`peerDependencies`/`build:lib` — PR #31 (branch `claude/issue-15-implementer-verifier-4phr6t`) — implementer + verifier pipeline, verifier VERDICT: APPROVE (`npm test` 24/24, `npm run lint` 0 errors, `npm run build` and `npm run build:lib` both pass).
- 2026-07-16 — Issue #15 follow-up: README "Using the React library" section + npm publish automation — scoped the package to `@eliihen/annual-cycle`, removed `private`, added npm metadata (`license`/`author`/`repository`/`keywords`/`publishConfig: public`) and a `prepublishOnly` build hook, and added `.github/workflows/publish-npm.yml` (publishes on GitHub Release via `NPM_TOKEN` secret). Package name + Release trigger chosen by the human via AskUserQuestion. Verified with `npm publish --dry-run` (tarball = LICENSE, README, both dist-lib bundles, package.json, vitePlugin.js) plus test/lint/build/build:lib all green — PR #31 — pushed. NOTE for human: set the `NPM_TOKEN` repo secret and ensure the npm `@eliihen` scope exists before the first Release.
- 2026-07-16 — CI fix on PR #31: the `test` check failed under `npm ci` because the library-packaging commit had inadvertently carried dependency-range downgrades from the implementer's worktree (marked ^18.0.6→^12.0.0, vite ^8.1.5→^8.0.16, @vitejs/plugin-react ^6.0.3→^6.0.2, eslint ^10.7.0→^10.6.0) while `package-lock.json` kept the originals — the mismatch is fatal to `npm ci` (local gates missed it by running `npm install`). Restored the ranges to match the lockfile; reproduced and verified green with `npm ci` + test/lint/build/build:lib — commit `7d7ce4c`, pushed.
- 2026-07-16 — Merged latest `main` into PR #31 to resolve conflicts (main had advanced with setup-node v6→v7 and `@vitejs/plugin-react` 6.0.3→6.0.4); kept both sides' Done entries here, took main's `@vitejs/plugin-react ^6.0.4` in `package.json`/lockfile — branch `claude/issue-15-implementer-verifier-4phr6t`.
- 2026-07-26 — Adversarial review fixes on PR #31, six commits: (1) run `npm run build:lib` in `ci.yml` so the library build is gated on every PR, not just at release; (2) document in `tasks.js` + README that `processTasks` id generation requires a literal `tasks/` path segment; (3) strip dead UMD/CSS-split config from `vite.lib.config.js` (`name`, `output.globals`, `cssCodeSplit` — none apply to `formats: ['es','cjs']` with no CSS in the entry; verified identical `dist-lib` output before/after); (4) move `react`/`react-dom` from `dependencies` to `devDependencies` (kept in `peerDependencies`) so library consumers no longer get a forced second copy installed — regenerated `package-lock.json`, verified clean `npm ci` + test/lint/build/build:lib; (5) bump `publish-npm.yml`'s `actions/setup-node` v6→v7 to match the rest of the repo; (6) added `src/lib/vitePlugin.test.js` covering the now-public `markdownPlugin` export. All commits verified individually with `npm test`/`npm run lint`/`npm run build`/`npm run build:lib` (26/26 tests, 0 lint errors) — branch `claude/issue-15-implementer-verifier-4phr6t`, pushed.
- 2026-07-31 — Docusaurus consumption docs for the npm library (PR #31). Validated the integration against a real `create-docusaurus@latest classic` site (Docusaurus 3.10.2, React 19.2.8) installed from `npm pack` of this package, which surfaced two real bugs rather than just doc gaps: (a) `Wheel.jsx` passed four adjacent JSX children to an SVG `<title>`, but React 19 requires a single string there — `react-dom/server` emitted `<title></title>` while the client rendered it populated, a hydration mismatch (React error #418) hitting every SSR consumer; fixed with a template string plus a `react-dom/server` regression test (`src/components/Wheel.ssr.test.jsx`, confirmed failing before / passing after). (b) The README's "Load your own tasks" example unwrapped modules to `mod.default`, but `processTasks` reads `mod.default.frontmatter`, so that shape yielded zero tasks and an empty wheel. Also tightened the task-id note (the regex matches `/tasks/` **with** the leading slash). New README section documents that the exported Vite plugin is unusable in Docusaurus (webpack/Rspack) and that a small Node generator needs no `docusaurus.config.js` or webpack changes. Final verification: static HTML contains the prerendered SVG with populated tooltips, browser hydration reports zero console errors, task arcs clickable — `npm test` 28/28, lint clean, `npm run build` + `build:lib` green — branch `claude/issue-15-implementer-verifier-4phr6t`, pushed.
- 2026-07-23 — Bump `@vitejs/plugin-react` devDependency `^6.0.3` → `^6.0.4` (patch) — branch `loop/bump-vitejs-plugin-react-patch` — PR opened, verifier APPROVE

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — superseded by open PR #2 and by the minimal Vitest setup added in `loop/bootstrap`; do not re-file. Close #1 once test tooling lands on `main`.
- 2026-07-07 — PR #2: "Add Vitest testing and coverage tooling" (branch `claude/awesome-maxwell-5ifjig`) — [needs-human] — awaiting human review/merge; comprehensive suite that supersedes the bootstrap minimal setup.
- 2026-07-07 — Unused import `categoryColor` in `src/App.jsx:4` (surfaced by new linter) — [auto-fixable] — SELECTED for Phase-7 dry run.
- 2026-07-07 — Lint warnings: unused `React`/`MAX_RINGS` etc. across `src/**` (React 19 automatic runtime) — [auto-fixable] — low priority style cleanup; safe to batch.
- 2026-07-07 — Dep drift (triage `npm outdated`): `vite` 8.0.16→8.1.3 (minor) — [auto-fixable] — safe bump; batch after dry run. (`@vitejs/plugin-react` half of this finding shipped separately, see Done.)
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable.
- 2026-07-16 — Housekeeping: gitignore `.claude/worktrees/` (the actual path the implementer agent's `isolation: worktree` uses; the existing `.worktrees/` entry didn't match it, tripping the stop hook with untracked files) — [auto-fixable] — done.
