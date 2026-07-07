# Loop engineering — decisions & inventory

This file records the recon inventory and every ambiguous decision made while
bootstrapping the autonomous "loop engineering" architecture, so future runs
(and humans) can see *why* things are the way they are.

## Phase 0 — Recon inventory (2026-07-07)

### Stack
- **Vite + React 19 SPA** that renders an interactive annual-cycle wheel (SVG,
  no canvas, no backend). Entry points: `index.html` (full app) and
  `iframe.html` (embeddable build).
- **Data model:** `tasks/*.md`, one file per recurring task, frontmatter parsed
  by `gray-matter`. Month precision (`start_month`/`end_month`, 1–12) or week
  precision (`start_week`/`end_week`, 1–52); optional `repeat`, `color`,
  `category`, `responsible`, `responsible_slack_handle`, `priority`, `tags[]`.
- **Node-only tooling:** `src/notify.js` (CommonJS, Slack digest) and the
  `markdownPlugin` in `vite.config.js`.

### Commands (verified working on this branch)
| Purpose | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Vite, port 5173 |
| Build | `npm run build` | Dual build: `vite build` + `vite build --config vite.iframe.config.js` |
| Preview | `npm run preview` | Serves `dist/` |
| Test | `npm test` | **Added in this bootstrap** — `vitest run` |
| Test (watch) | `npm run test:watch` | **Added** |
| Lint | `npm run lint` | **Added** — `eslint .` (flat config) |
| Slack notify | `npm run notify` / `npm run notify:debug` | Needs `SLACK_WEBHOOK_URL` |

### CI
- `.github/workflows/deploy-demo.yml` — build + deploy to GitHub Pages on push
  to `main` touching `tasks/`, `src/`, `package.json`, `package-lock.json`.
- `.github/workflows/notify-slack-demo.yml` — Monday 07:00 UTC Slack digest.
- **Composite actions** in `.github/actions/` (`build`, `deploy`,
  `build-deploy`, `notify-slack`) are a **public API** consumed by other repos.
  Their `inputs`/`outputs` must stay backward compatible.

### GitHub state at bootstrap
- Open **issue #1** — "No test coverage tooling configured".
- Open **PR #2** — "Add Vitest testing and coverage tooling"
  (branch `claude/awesome-maxwell-5ifjig`).

## Decisions

### D1 — Test framework: Vitest
The repo had no tests. Chose **Vitest** because it shares Vite's config/transform
pipeline (zero extra bundler config) and is the idiomatic choice for a Vite
project. Added a minimal `vitest.config.js` (node environment) plus a real test
suite for `src/utils/tasks.js`.

### D2 — Overlap with open PR #2
PR #2 already adds a more comprehensive Vitest setup (incl. coverage and
`notify.js` tests). Rather than block on it, this bootstrap adds a **minimal,
self-contained** Vitest setup so the loop has a working `npm test` gate today.
The two are compatible; when PR #2 merges, its suite supersedes/extends this one.
Recorded so the loop's `triage` won't re-file "no tests" as a new backlog item.

### D3 — Linter: ESLint flat config, warnings-not-errors for style
Added ESLint (`@eslint/js` recommended) with a flat config. JSX enabled via
`ecmaFeatures.jsx`; `.html` files ignored (inline scripts). `no-unused-vars` is
a **warning**, not an error, so pre-existing React-19 `import React` lines and
similar don't break the gate on day one. The gate fails only on real errors
(undefined vars, parse errors). Style warnings become optional `auto-fixable`
backlog items instead of hard blocks.

### D4 — Did NOT add `"type": "module"` to package.json
ESLint suggests it, but `src/notify.js` is CommonJS (`require`). Adding it would
break the notify script and the composite `notify-slack` action. Left as-is; the
resulting ESLint perf warning on `eslint.config.js` is cosmetic.

### D5 — Verifier uses a stronger model than the implementer
Per the maker/checker split: `explorer` = haiku (fast, read-only),
`implementer` = sonnet (default, worktree-isolated), `verifier` = opus
(adversarial review). The verifier must never share a model with the implementer
so a blind spot isn't rubber-stamped.

### D6 — Cloud loop cap = 3 items/run
`loop-triage.yml` processes at most 3 `auto-fixable` items per daily run to bound
token cost. Overflow stays in the backlog for the next run.

### D7 — Worktrees live under `.worktrees/` (gitignored)
The implementer agent uses `isolation: worktree`. Worktree checkouts are ignored
so they never get committed.

### D8 — Dry-run acceptance item
See `LOOP_STATE.md`. The Phase-7 dry run picked one small, safe `auto-fixable`
finding (an unused import surfaced by the new linter) and pushed it through the
full explorer → implementer → verifier → PR chain.
