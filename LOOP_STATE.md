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

- 2026-07-17 — Issue #18: "Make proper GitHub actions" (rewrite composite actions in `.github/actions/*` to proper Actions bundling deps) — [needs-human] — explicitly touches `.github/actions/*/action.yml` (public interface), which the loop's own auto-fixable criteria excludes regardless of the GitHub-side "auto-fixable" label; large-scope rewrite, not a single small diff.
- 2026-07-17 — Issue #15: "Implement a react library as well" — tracked, not backlog — already has open PR #31 (`claude/issue-15-implementer-verifier-4phr6t`, CI green as of 2026-07-16T23:56) implementing it; awaiting human review/merge, do not re-file.
- 2026-07-17 — Triage sweep: no new auto-fixable items found. `npm outdated` clean (gray-matter/marked/react/react-dom/vite/eslint all current), `npm test` (24/24) and `npm run lint` both clean, no TODO/FIXME/XXX/HACK in `src|tasks|scripts`, no failing CI runs on `main` since last watermark (2026-07-07). Prior backlog entries below this line have all resolved since 2026-07-07 and were removed as stale: Issue #1 (closed — Vitest tooling landed), PR #2 (closed unmerged — superseded by bootstrap's minimal Vitest setup), unused `categoryColor` import (shipped, see Done), unused-import lint warnings (fixed by commit `8bce58b`), `@vitejs/plugin-react`/`vite` patch/minor bumps (landed via `65fbd46`/`2224696`), `marked` major bump (landed via `761902f`).
