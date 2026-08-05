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
- 2026-07-28 — `npm audit fix`: bump `brace-expansion` 5.0.7 → 5.0.8 (transitive dev dep, via eslint→minimatch), resolving high-severity DoS GHSA-mh99-v99m-4gvg — branch `claude/focused-cerf-dhu8jz`, PR #42 — verifier APPROVE, PR opened
- 2026-08-04 — `npm audit fix`: brace-expansion 5.0.8→5.0.9 (high, DoS bypass) + postcss 8.5.19→8.5.25 (moderate, incomplete fix) — branch `loop/npm-audit-fix-brace-postcss`, PR #49 — merged to main; `npm audit` now clean (0 vulnerabilities)

## In progress

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — superseded by open PR #2 and by the minimal Vitest setup added in `loop/bootstrap`; do not re-file. Close #1 once test tooling lands on `main`.
- 2026-07-07 — PR #2: "Add Vitest testing and coverage tooling" (branch `claude/awesome-maxwell-5ifjig`) — [needs-human] — awaiting human review/merge; comprehensive suite that supersedes the bootstrap minimal setup.
- 2026-07-07 — Unused import `categoryColor` in `src/App.jsx:4` (surfaced by new linter) — [auto-fixable] — SELECTED for Phase-7 dry run.
- 2026-07-07 — Lint warnings: unused `React`/`MAX_RINGS` etc. across `src/**` (React 19 automatic runtime) — [auto-fixable] — low priority style cleanup; safe to batch. RESOLVED 2026-08-05: `npm run lint` now passes with zero warnings; no action needed.
- 2026-07-07 — Dep drift (triage `npm outdated`): `vite` 8.0.16→8.1.3 (minor) — [auto-fixable] — safe bump; batch after dry run. (`@vitejs/plugin-react` half of this finding shipped separately, see Done.) RESOLVED 2026-08-05: `vite` now at `^8.2.0` via merged Dependabot PR #48 (see below); no action needed.
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable.
- 2026-07-28 — Issue #15 "Implement a react library as well" — [needs-human] — already has open PR #31 "Implement React library export with reusable Vite plugin" (branch `claude/issue-15-implementer-verifier-4phr6t`) awaiting review; do not re-file.
- 2026-07-28 — Issue #18 "Make proper GitHub actions" — [needs-human] — already has open PR #32 "Convert build & notify-slack actions to bundled JavaScript" (branch `claude/issue-18-implementer-verifier-xsxokd`) awaiting review; do not re-file.
- 2026-07-28 — Redundant open PRs: loop PR #34 (bump marked/react/react-dom, patch) and PR #36 (bump eslint/globals, patch) are superseded by newer Dependabot PRs #37–#41 targeting slightly newer versions of the same packages — [needs-human] — merge/close decision to avoid conflicting bump PRs; not auto-fixable.
- 2026-08-04 — `npm audit`: new high-severity `brace-expansion` DoS (range 4.0.0–5.0.8, GHSA-rgw5-rvv9-x895, bypasses the CVE-2026-14257 mitigation shipped 2026-07-28) plus moderate `postcss` incomplete-fix (≤8.5.22, GHSA-fxqj-rqcc-2cmp, arbitrary `.map` read when `from` unset) — [auto-fixable] — `npm audit fix` resolves both: brace-expansion 5.0.8→5.0.9 (transitive via eslint→minimatch) and postcss 8.5.19→8.5.25 (transitive via vite); no `.github/actions/*/action.yml` touched.
- 2026-08-04 — Redundant open PRs: loop PR #44 (bump vite 8.1.5→8.2.0) and PR #45 (bump @vitejs/plugin-react 6.0.4→6.0.5) are duplicated by newer Dependabot PRs #48 and #47 targeting the identical versions; PR #46 (bump globals 17.8.0→17.9.0) has no Dependabot duplicate yet — [needs-human] — merge/close decision to avoid conflicting bump PRs; not auto-fixable.
- 2026-08-05 — Dependabot PRs #47 (`@vitejs/plugin-react` 6.0.4→6.0.5) and #48 (`vite` 8.1.5→8.2.0) merged to `main`; package.json now pins `@vitejs/plugin-react ^6.0.5` and `vite ^8.2.0` — resolved, no action needed. Loop PR #46 (`globals` 17.8.0→17.9.0) still open with no duplicate — merge/close decision stands, see above.
- 2026-08-05 — triage `npm outdated`: `marked` 18.0.7→18.0.9 (patch) — [auto-fixable] — safe patch bump within already-adopted major (v18); no `.github/actions/*/action.yml` touched.
