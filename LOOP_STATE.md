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

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — superseded by open PR #2 and by the minimal Vitest setup added in `loop/bootstrap`; do not re-file. Close #1 once test tooling lands on `main`.
- 2026-07-07 — PR #2: "Add Vitest testing and coverage tooling" (branch `claude/awesome-maxwell-5ifjig`) — [needs-human] — awaiting human review/merge; comprehensive suite that supersedes the bootstrap minimal setup.
- 2026-07-07 — Unused import `categoryColor` in `src/App.jsx:4` (surfaced by new linter) — [auto-fixable] — SELECTED for Phase-7 dry run.
- 2026-07-07 — Lint warnings: unused `React`/`MAX_RINGS` etc. across `src/**` (React 19 automatic runtime) — [auto-fixable] — low priority style cleanup; safe to batch.
- 2026-07-07 — Dep drift (triage `npm outdated`): `@vitejs/plugin-react` 6.0.2→6.0.3 (patch), `vite` 8.0.16→8.1.3 (minor) — [auto-fixable] — safe bumps; batch after dry run.
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable.
- 2026-07-16 — Housekeeping: gitignore `.claude/worktrees/` (the actual path the implementer agent's `isolation: worktree` uses; the existing `.worktrees/` entry didn't match it, tripping the stop hook with untracked files) — [auto-fixable] — done.
