---
name: project-conventions
description: >
  Ground-truth conventions for the annual-cycle repo: the Vite/React/SVG stack,
  the tasks/*.md frontmatter data model, the category color table, the dual
  (index.html + iframe.html) build, the public composite-action API in
  .github/actions/, and how to build, test, and lint. Read this before editing
  any file in this repo so you don't guess at conventions.
---

# Project conventions — annual-cycle

Everything an agent would otherwise guess. All of it is derived from the actual
code; if code and this file disagree, the code wins — fix this file.

## What this project is
- A **Vite + React 19 single-page app** that renders an interactive annual-cycle
  ("årshjul") **wheel as inline SVG** (no canvas, no backend, no database).
- Two builds from one source (the "dual build"):
  - `index.html` → full app (`src/main.jsx` → `src/App.jsx`).
  - `iframe.html` → embeddable build (`src/iframe.jsx` → `src/IframeApp.jsx`),
    built with `vite.iframe.config.js`. The iframe link target is baked in at
    build time via `__IFRAME_LINK_TARGET__` (env `IFRAME_LINK_TARGET`).
- `npm run build` runs **both** (`vite build && vite build --config vite.iframe.config.js`).
  A change that builds the main app but breaks the iframe build is still broken.

## Data model — `tasks/*.md`
One Markdown file per recurring task. Frontmatter (parsed by `gray-matter`):

| Field | Meaning |
|---|---|
| `title` | Display name (defaults to filename) |
| `category` | Drives color (see table below); defaults to `Other` |
| `responsible` | Person/role name |
| `responsible_slack_handle` | Slack handle for notify tagging (`@handle`) |
| `priority` | `low` / `medium` (default) / `high` |
| `tags` | list |
| `start_month` / `end_month` | 1–12 — **month precision (default)** |
| `start_week` / `end_week` | 1–52 — **week precision** (used if `start_week` is present) |
| `color` | hex override, beats the category table |
| `repeat` | cadence, expands to multiple instances (see below) |

- Precision: a task is **week-precision iff `start_week` is present**, else
  month-precision. Both map onto the same 360° circle (months 30°, weeks ≈6.92°)
  via `startFrac`/`endFrac` in `src/utils/tasks.js`.
- `repeat` gaps (from `src/utils/tasks.js` and mirrored in `src/notify.js`):
  - week unit: `weekly`=1, `biweekly`=2, `monthly`=4, `tertial`=17, `quarterly`=13
  - month unit: `monthly`=1, `quarterly`=3, `tertial`=4, `biannual`/`semiannual`=6
  - Instances get IDs suffixed `--r2`, `--r3`, … . **If you touch repeat logic in
    `tasks.js`, mirror it in `notify.js`** — they intentionally duplicate it.

### Category color table (`CAT_COLORS` in `src/utils/tasks.js`)
`finance`=#E74C3C, `hr`=#3498DB, `strategy`=#27AE60, `management`=#2980B9,
`it`/`technology`=#8E44AD, `marketing`=#E67E22, `sales`=#F39C12,
`operations`=#16A085, `compliance`/`legal`=#C0392B, `communication`=#D35400.
Unknown categories hash deterministically to an `hsl(...)`. `color` frontmatter
overrides everything.

## Ring assignment
`assignRings()` greedily first-fits tasks into up to 4 concentric rings
(0 = outer, 3 = inner). Overlap is computed on `startFrac`/`endFrac` so month and
week tasks compare on one scale. A 5th mutually-overlapping task overflows to
ring 3.

## The public API — `.github/actions/`
`build`, `deploy`, `build-deploy`, and `notify-slack` are **composite actions
consumed by other repositories**. Their `inputs:` and `outputs:` are a public
contract. **Never remove or rename an input/output, change a default in a
breaking way, or alter an output's meaning** unless the backlog item explicitly
targets these files. A PreToolUse hook blocks edits to `action.yml` otherwise.
`deploy`/`build-deploy` document required `permissions:`/`environment:` in the
consuming job — keep that documentation accurate.

## Build / test / lint (verified)
```bash
npm run build   # dual build → dist/ ; both index.html and iframe.html must build
npm test        # vitest run — unit tests for src/utils/tasks.js (pure logic)
npm run lint    # eslint . — flat config; errors block, style issues are warnings
```
- Tests live next to code as `src/**/*.test.js`, run in a **node** environment
  (the tested modules are pure logic; SVG/React components aren't unit-tested —
  the build exercises them).
- `src/notify.js` is **CommonJS** (`require`). Do **not** add `"type":"module"`
  to `package.json` — it would break notify and the `notify-slack` action.

## Definition of done for any change here
1. `npm test` passes. 2. `npm run lint` passes (no errors). 3. `npm run build`
succeeds (both builds). 4. Composite-action interfaces unchanged (unless the item
targets them). 5. `LOOP_STATE.md` updated.
