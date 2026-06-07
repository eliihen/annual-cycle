# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server with hot reload (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Serve the dist/ build locally
npm run notify     # Send Slack notification (requires SLACK_WEBHOOK_URL env var)
```

There are no tests or linter configured.

## Architecture

This is a React SPA (Vite) that renders an interactive annual-cycle wheel from Markdown task files.

### Data flow

1. `tasks/*.md` — each file is one recurring task. Frontmatter fields:
   - `title`, `category`, `responsible`, `responsible_slack_handle`, `priority`, `tags[]`
   - Month-based: `start_month`, `end_month` (1–12)
   - Week-based (alternative): `start_week`, `end_week` (1–52)
   - Optional: `color` (hex override), `repeat` (repeat cadence — see below)
2. **`vite.config.js`** includes a custom `markdownPlugin` that transforms `.md` files via `gray-matter` + `marked` into `{ frontmatter, html }` JSON modules at build time.
3. **`src/App.jsx`** uses `import.meta.glob('../tasks/*.md', { eager: true })` to load all task modules, then passes them to `processTasks()`. Also groups the sidebar task list by starting month, inserting a `.month-divider` before the first task of each month (month derived from `Math.floor(startFrac * 12)` via `startMonthOf()`).
4. **`src/utils/tasks.js`** — `processTasks()` normalises fields, computes `startFrac`/`endFrac` (fractional year position 0–1 used for overlap detection), expands `repeat` tasks into multiple instances via `expandRepeats()` (IDs suffixed `--r2`, `--r3`, …), runs `assignRings()` (greedy first-fit into up to 4 concentric rings), and resolves `displayColor`.
5. **`src/components/Wheel.jsx`** — pure SVG rendered by React. All geometry is computed inline (no canvas). Key radii constants at the top of the file control the layout. Includes a `useZoomPan` hook (scroll-to-zoom, drag-to-pan, button controls). Arc labels render as curved `<textPath>` elements following guide arcs in `<defs>`; `wrapLabel()` wraps long titles onto up to 3 lines (truncating the last with `…`), with each line on its own guide arc offset from `midR` — offset direction flips between the wheel's upper and lower halves to keep reading order top-to-bottom.
6. **`src/components/TaskCard.jsx`** — collapsible sidebar card.

### Repeating tasks

Add `repeat` to a task's frontmatter (`weekly`, `biweekly`, `monthly`, `tertial`, `quarterly`, or `biannual`/`semiannual` for month-based tasks) to place it multiple times around the wheel. `expandRepeats()` in `src/utils/tasks.js` (and an equivalent in `src/notify.js`) generates the additional instances using fixed gaps (e.g. `monthly` = every 4 weeks or 1 month, `tertial` = every ~17 weeks or 4 months). See the README for the full gap table.

### Week vs month precision

Tasks default to month precision. Adding `start_week`/`end_week` instead switches to week precision. Both share the same 360° circle: months use 30°/month, weeks use 360°/52 ≈ 6.92°/week. The outer ring of the wheel always shows all 52 week date ranges regardless of task precision.

### Ring assignment

Tasks with overlapping time ranges are placed in different concentric rings (ring 0 = outermost, ring 3 = innermost). Overlap is detected via fractional year positions so month- and week-based tasks compare on the same scale. Tasks beyond 4 rings overflow into ring 3.

### Slack notifications (`src/notify.js`)

Standalone Node.js script (no build step needed). Reads `tasks/` directly with `gray-matter`, expanding `repeat` tasks the same way as `processTasks()`. Sends weekly/monthly/quarterly digests based on the current date, or respects a `NOTIFY_PERIOD=week|month|quarter|all` env var. If a task sets `responsible_slack_handle`, it's tagged as `<@handle>` in the digest (falls back to the plain `responsible` name otherwise). Triggered by `.github/workflows/notify-slack.yml` every Monday at 07:00 UTC.

### Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main` that touches `tasks/`, `src/`, or `package.json`.
