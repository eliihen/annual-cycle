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
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable. STALE as of 2026-07-29: `marked` is now at 18.0.6 on `main` (dependabot already carried it past this major bump). No action needed; leaving entry for history.
- 2026-07-07 — Lint warnings: unused `React`/`MAX_RINGS` etc. — STALE as of 2026-07-29: `npm run lint` is clean (0 warnings) on current `main`. Already resolved upstream; no action needed.
- 2026-07-07 — Dep drift: `vite` 8.0.16→8.1.3 (minor) — STALE as of 2026-07-29: `vite` is now 8.1.5 (latest) on `main`, not in `npm outdated` output. Already resolved; no action needed.
- 2026-07-29 — Triage: `npm audit` finds 1 high-severity `brace-expansion` DoS ([GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg)) — [auto-fixable] — already tracked, see open PR #42 "Fix high-severity brace-expansion DoS vuln via npm audit fix" (branch `claude/focused-cerf-dhu8jz`); awaiting review/merge. Do not re-file.
- 2026-07-29 — Dep drift (dependabot, all currently open as separate PRs, patch/minor, awaiting review): PR #41 `react-dom` 19.2.7→19.2.8, PR #40 `globals` 17.7.0→17.8.0, PR #39 `eslint` 10.7.0→10.8.0, PR #38 `react` 19.2.7→19.2.8, PR #37 `marked` 18.0.6→18.0.7 — [needs-human] — already tracked via dependabot PRs; do not re-file or duplicate with loop-generated bump PRs.
- 2026-07-29 — Loop-generated PR #36 "Bump eslint and globals devDependencies (patch)" (branch `loop/bump-eslint-globals-patch`) and PR #34 "Bump marked, react, react-dom (patch)" (branch `loop/bump-marked-react-patch`) — [needs-human] — now superseded by newer per-package dependabot PRs (#37–#41) at higher patch versions; awaiting human review/merge or close-in-favor-of-dependabot decision.
- 2026-07-29 — Issue #18 "Make proper GitHub actions" — [needs-human] — already has an open PR: #32 "Convert build & notify-slack actions to bundled JavaScript" (branch `claude/issue-18-implementer-verifier-xsxokd`); touches `.github/actions/*/action.yml` interfaces, so not auto-fixable regardless. Awaiting human review/merge. Do not re-file.
- 2026-07-29 — Issue #15 "Implement a react library as well" — [needs-human] — already has an open PR: #31 "Implement React library export with reusable Vite plugin" (branch `claude/issue-15-implementer-verifier-4phr6t`); architecturally significant, not auto-fixable. Awaiting human review/merge. Do not re-file.
- 2026-07-29 — Triage sweep: CI on `main` green for all runs since 2026-07-23 watermark (dependabot updates, CI, Build & Deploy all `success`); `npm test`/`npm run lint`/`npm run build` all pass clean on current `main` after `npm install`. No new gate breakage found.
