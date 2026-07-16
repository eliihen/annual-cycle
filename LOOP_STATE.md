# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE

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
- 2026-07-07 — Dep drift: `marked` 12.0.2→18.0.5 (major) — [needs-human] — major version, breaking-change risk; not auto-fixable. RESOLVED — bumped to 18.0.6 in #27 (merged to main).
- 2026-07-07 — Lint warnings: unused `React`/`MAX_RINGS` etc across `src/**` — [auto-fixable] — RESOLVED — `npm run lint` is clean on current `main` (2026-07-16); no remaining warnings.
- 2026-07-07 — Dep drift: `@vitejs/plugin-react` / `vite` patch+minor bumps — [auto-fixable] — RESOLVED — both bumped via Dependabot PRs already merged to `main` (currently `@vitejs/plugin-react` 6.0.3, `vite` 8.1.5).
- 2026-07-16 — Run #15 triage: `npm outdated` clean, no TODO/FIXME markers in `src/`/`tasks/`/`scripts/`, CI green on `main` (run #2, `ci.yml`, conclusion success).
- 2026-07-16 — Issue #18: "Make proper GitHub actions" — rewrite the four composite actions in `.github/actions/*/action.yml` into proper (non-composite) GitHub Actions bundling all deps so consumers don't need `checkout`+`npm ci` at build time — [needs-human] — GitHub label says `auto-fixable` but explorer agent confirmed `needs-human`: necessarily rewrites all 4 `action.yml` files (public interface, external consumers pin `@main` per README), and requires upfront human decisions (JS vs. Docker action, bundler + committed-vs-generated dist, versioning/migration story for existing consumers) before any diff can be written. No auto-fixable slice exists.
- 2026-07-16 — Issue #15: "Implement a react library as well" — publish the wheel (and iframe) as an importable React component on npmjs.com, with the markdown task loader made configurable/on-demand instead of the current build-time `import.meta.glob` — [needs-human] — explorer agent confirmed `needs-human`: touches package.json/vite configs/App.jsx/IframeApp.jsx/CSS distribution, requires a new library build target and npm-publish workflow, and needs an upfront task-loading API design (props vs. loader fn vs. runtime fetch) that the SPA refactor can't proceed without. No auto-fixable slice exists.

## Run log

- 2026-07-16 — Run #15 (branch `claude/run-15-agent-pipeline-m3el4s`): triage found no new small auto-fixable diffs — `npm outdated` clean, no TODO/FIXME, CI green on `main`, and both open issues (#18, #15) confirmed `needs-human` by the explorer agent (see backlog entries above). Implementer/verifier not invoked — no eligible item to hand off. No code changes this run.
