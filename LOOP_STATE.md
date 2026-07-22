# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE
- 2026-07-09 — Remove unused React default imports (React 19 automatic runtime) — PR #12 — merged; resolves the 2026-07-07 lint-warnings backlog item.
- 2026-07-09 — Bump vite 8.0.16→8.1.4 and @vitejs/plugin-react →6.0.3 — PR #13 — merged; resolves the 2026-07-07 vite dep-drift backlog item. Later bumped again to vite 8.1.5 via PR #28.
- 2026-07-16 — Bump `marked` 12.0.2→18.0.6 (major) — PR #27 (dependabot) — merged; resolves the 2026-07-07 needs-human major-bump backlog item. `marked` is now on a patch-drift track instead (see Backlog).
- 2026-07-22 — Bump `marked` 18.0.6→18.0.7, `react` 19.2.7→19.2.8, `react-dom` 19.2.7→19.2.8 (all patch) — branch `loop/bump-marked-react-patch` — PR opened, verifier APPROVE (npm test 24/24, lint clean, build clean for both configs).

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-07 — Issue #1: No test coverage tooling configured — [needs-human] — PR #2 (which would have closed it) was closed unmerged 2026-07-09, superseded by the minimal Vitest setup from `loop/bootstrap` plus the CI gate added in PR #30. Recommend closing #1 as superseded; do not re-file.
- 2026-07-22 — PR #31: "Implement React library export with reusable Vite plugin" (branch `claude/issue-15-implementer-verifier-4phr6t`) — [needs-human] — closes issue #15; open since 2026-07-16, awaiting human review/merge.
- 2026-07-22 — PR #32: "Convert build & notify-slack actions to bundled JavaScript" (branch `claude/issue-18-implementer-verifier-xsxokd`) — [needs-human] — closes issue #18; open since 2026-07-18, awaiting human review/merge; touches `.github/actions/*/action.yml` interfaces, do not auto-modify.
- 2026-07-22 — PR #33: Dependabot bump `actions/setup-node` 6→7 across `.github/workflows/*.yml` (ci.yml, deploy-demo.yml, loop-triage.yml, notify-slack-demo.yml) — [auto-fixable] — no composite `.github/actions/*/action.yml` touched; simplest path is merging the existing dependabot PR directly rather than re-implementing.
- 2026-07-22 — CI health check: last 15 workflow runs on `main` all green (CI, Build & Deploy Årshjul, Dependabot updates); `npm test` (24/24) and `npm run lint` both clean as of this run — no new findings.
