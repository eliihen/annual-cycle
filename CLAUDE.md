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
   - `title`, `category`, `responsible`, `priority`, `tags[]`
   - Month-based: `start_month`, `end_month` (1–12)
   - Week-based (alternative): `start_week`, `end_week` (1–52)
   - Optional: `color` (hex override)
2. **`vite.config.js`** includes a custom `markdownPlugin` that transforms `.md` files via `gray-matter` + `marked` into `{ frontmatter, html }` JSON modules at build time.
3. **`src/App.jsx`** uses `import.meta.glob('../tasks/*.md', { eager: true })` to load all task modules, then passes them to `processTasks()`.
4. **`src/utils/tasks.js`** — `processTasks()` normalises fields, computes `startFrac`/`endFrac` (fractional year position 0–1 used for overlap detection), runs `assignRings()` (greedy first-fit into up to 4 concentric rings), and resolves `displayColor`.
5. **`src/components/Wheel.jsx`** — pure SVG rendered by React. All geometry is computed inline (no canvas). Key radii constants at the top of the file control the layout. Includes a `useZoomPan` hook (scroll-to-zoom, drag-to-pan, button controls).
6. **`src/components/TaskCard.jsx`** — collapsible sidebar card.

### Week vs month precision

Tasks default to month precision. Adding `start_week`/`end_week` instead switches to week precision. Both share the same 360° circle: months use 30°/month, weeks use 360°/52 ≈ 6.92°/week. The outer ring of the wheel always shows all 52 week date ranges regardless of task precision.

### Ring assignment

Tasks with overlapping time ranges are placed in different concentric rings (ring 0 = outermost, ring 3 = innermost). Overlap is detected via fractional year positions so month- and week-based tasks compare on the same scale. Tasks beyond 4 rings overflow into ring 3.

### Slack notifications (`src/notify.js`)

Standalone Node.js script (no build step needed). Reads `tasks/` directly with `gray-matter`. Sends weekly/monthly/quarterly digests based on the current date, or respects a `NOTIFY_PERIOD=week|month|quarter|all` env var. Triggered by `.github/workflows/notify-slack.yml` every Monday at 07:00 UTC.

### Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main` that touches `tasks/`, `src/`, or `package.json`.
