# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-23 — Bump `@vitejs/plugin-react` devDependency `^6.0.3` → `^6.0.4` (patch) — branch `loop/bump-vitejs-plugin-react-patch` — PR opened, verifier APPROVE
- 2026-07-31 — Bump `@vitejs/plugin-react` devDependency `^6.0.3` → `^6.0.5` (patch; two patch releases had landed since the last bump), bump `vite` devDependency `^8.1.5` → `^8.2.0` (minor), and fix `.gitignore` worktree mismatch — branch `claude/focused-cerf-w6x26c` — PR #43 opened, both verifiers APPROVE; `npm test` 24/24, `npm run lint` clean, `npm run build` both configs pass. Note: vite 8.2.0 introduces a new (harmless) `configLoader: 'native'` info warning about ESM-in-CommonJS in `vite.config.js`/`vite.iframe.config.js`/`vitest.config.js`; fixing it means renaming those to `.mjs` (cannot set `"type": "module"` in package.json — would break the CommonJS `src/notify.js` / `notify-slack` action). Filed as a new backlog item below, not fixed in this run (out of scope). **UPDATE 2026-07-31: repo owner closed PR #43 without merging.** The `.gitignore` fix, the plugin-react bump, and the vite bump all remain unmerged on `main`. Do not reopen #43 or re-file a new PR for the same diff — treat as a deliberate human decision (e.g. may prefer letting dependabot own these bumps) unless the owner says otherwise.

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
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable. Superseded: `marked` is now at 18.0.6 on `main` (major bump already landed via dependabot); remaining drift is patch-level, see 2026-07-31 entry.
- 2026-07-31 — Triage sweep: CI green on `main` since 2026-07-23 (all runs success); `npm test` (24 passed) and `npm run lint` (clean) both pass after `npm install` — no gate regressions.
- 2026-07-31 — Issue #1 / PR #2 (test tooling) — resolved — Vitest is present and `npm test` passes; both appear closed/merged on GitHub. No action needed.
- 2026-07-31 — Lint warnings (unused `React`/`MAX_RINGS` etc.) — resolved — `npm run lint` is clean; no warnings remain. Removing from active backlog.
- 2026-07-31 — 10 open PRs on GitHub awaiting human review/merge: #31 (issue #15, React library export), #32 (issue #18, bundled JS actions), #34 (loop: marked/react/react-dom patch bump), #36 (loop: eslint/globals patch bump), #37 (dependabot: marked 18.0.6→18.0.7), #38 (dependabot: react 19.2.7→19.2.8), #39 (dependabot: eslint 10.7.0→10.8.0), #40 (dependabot: globals 17.7.0→17.8.0), #41 (dependabot: react-dom 19.2.7→19.2.8), #42 (security: npm audit fix for brace-expansion high-severity DoS, GHSA-mh99-v99m-4gvg) — [needs-human] — all already tracked as open PRs; do not re-file or duplicate work.
- 2026-07-31 — `npm audit`: 1 high-severity vuln, `brace-expansion` <=5.0.7 (GHSA-mh99-v99m-4gvg), fixed by `npm audit fix` — [needs-human] — already covered by open PR #42; do not re-file.
- 2026-07-31 — Vite 8.2.0's `configLoader: 'native'` warns that `vite.config.js`, `vite.iframe.config.js`, and `vitest.config.js` use ESM syntax while loaded as CommonJS — [needs-human] — fix is renaming those three files to `.mjs` (do NOT add `"type": "module"` to `package.json`, that breaks the CommonJS `src/notify.js` / `notify-slack` action per `project-conventions`); purely cosmetic/future-proofing, no functional impact today. Only relevant if the vite 8.2.0 bump (below) actually lands — currently moot since PR #43 was closed without merging.
- 2026-07-31 — `.gitignore` ignored `.worktrees/` but the Agent tool's `isolation: 'worktree'` actually creates worktrees under `.claude/worktrees/`, so every worktree-isolated implementer run left untracked files behind and tripped the Stop hook's git-check — [needs-human] — fix was written and verified (see Done) but shipped in PR #43, which the repo owner closed without merging on 2026-07-31. Fix is still sitting on branch `claude/focused-cerf-w6x26c`, unmerged. Do not re-file/re-open without human direction — this and the `@vitejs/plugin-react`/`vite` bumps in the same PR appear to have been deliberately declined.
