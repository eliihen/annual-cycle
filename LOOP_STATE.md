# LOOP_STATE — the loop's memory

> The agent forgets; the repo doesn't. **Every loop run reads this file first and
> appends to it before finishing.** The `Stop` hook refuses to end a run that
> changed files without updating this file.

Entry format: `- YYYY-MM-DD — <one-line description> — <branch/PR link> — <outcome>`
Tag each backlog item `[auto-fixable]` or `[needs-human]`.

## Done

- 2026-07-07 — Bootstrap loop-engineering architecture (skills, agents, hooks, cloud triage workflow, state file) — branch `loop/bootstrap` — in review
- 2026-07-07 — Dry run: remove unused `categoryColor` import in `src/App.jsx` (surfaced by new linter) — branch `loop/rm-unused-import` — PR opened, verifier APPROVE, since merged (import confirmed gone from `src/App.jsx` on `main`)
- 2026-07-23 — Bump `@vitejs/plugin-react` devDependency `^6.0.3` → `^6.0.4` (patch) — branch `loop/bump-vitejs-plugin-react-patch` — PR opened, verifier APPROVE, since merged
- 2026-07-27 (triage) — Confirmed via `npm outdated`/`package.json` that prior dep-drift backlog items are already resolved on `main` (merged outside this loop's own PRs, e.g. via dependabot): `vite` now `^8.1.5` (was 8.0.16, PR #28), `marked` now `^18.0.6` (was 12.0.2, PR #27), `eslint` now `10.7.0` (PR #26). Removing the corresponding stale Backlog entries below.
- 2026-07-27 (triage) — Confirmed lint is clean (`npm run lint` — no output/warnings): the "unused React/MAX_RINGS lint warnings" backlog item is stale/resolved, removing it.
- 2026-07-27 (triage) — Issue #1 (no test coverage tooling) is closed on GitHub; PR #2 was closed unmerged (superseded), and a minimal Vitest setup is live on `main` (`npm test` — 24/24 passing). Item fully resolved, removing stale Backlog entries for both.
- 2026-07-27 — Bump `eslint` devDependency `^10.7.0` → `^10.8.0` and `globals` devDependency `^17.7.0` → `^17.8.0` (both patch) — branch `loop/bump-eslint-globals-patch`, PR opened https://github.com/eliihen/annual-cycle/pull/36 — verifier APPROVE, `npm test` pass (24/24), `npm run lint` pass (18 files, 0 errors/warnings), `npm run build` pass (both index.html + iframe.html)

## In progress

_(none)_

## Backlog

<!-- Seeded from GitHub state at bootstrap. triage appends here; check for
     duplicates before adding. -->

- 2026-07-27 — PR #34 "Bump marked, react, react-dom (patch)" (branch `loop/bump-marked-react-patch`) — [needs-human] — open, awaiting human review/merge; already covers `marked` 18.0.6→18.0.7, `react`/`react-dom` 19.2.7→19.2.8. Do not re-file these as a new dep-drift item.
- 2026-07-27 — Issue #18 "Make proper GitHub actions" — [needs-human] — already has open PR #32 (`claude/issue-18-implementer-verifier-xsxokd`, converts `build`/`notify-slack` composite actions to bundled JS) awaiting review. Touches `.github/actions/*/action.yml`, so not auto-fixable even if re-attempted; do not duplicate.
- 2026-07-27 — Issue #15 "Implement a react library as well" — [needs-human] — already has open PR #31 (`claude/issue-15-implementer-verifier-4phr6t`, library build + reusable Vite plugin) awaiting review. Do not duplicate.
- 2026-07-27 (triage) — `npm audit`: `brace-expansion` <=5.0.7 high-severity DoS (transitive via `eslint@10.8.0 → minimatch@10.2.5`) — [needs-human] — `npm audit fix --dry-run` doesn't cleanly bump just the transitive dep; it pulls in ~10 unrelated `@rolldown/*` native-binding packages (looks like an unrelated peer/optional-dep resolution shift, not a minimal patch). Flagging for human judgement rather than auto-fixing blindly; may resolve on its own once `eslint`/`minimatch` patch upstream. (Confirmed still pre-existing after the eslint 10.8.0 patch bump below — that bump did not touch minimatch's own version.)
