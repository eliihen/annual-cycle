# Annual Cycle

An interactive wheel visualization for recurring annual tasks. Add Markdown files to describe your tasks — the app renders them as arcs on a calendar wheel, grouped by category and ordered by time of year.

![Annual Cycle wheel showing task arcs across months and weeks](https://placehold.co/900x500/EEF0F3/3A3F52?text=Annual+Cycle+Wheel)

## Features

- **Calendar wheel** — 12 months divided into 52 ISO weeks, with task arcs spanning their active period
- **Month or week precision** — tasks can be scheduled at month granularity or down to a specific ISO week range
- **Automatic ring placement** — overlapping tasks are separated into concentric rings automatically
- **Category colors** — tasks are colored by category; unknown categories get a deterministic hue
- **Search & filter** — live text search and category filter in the sidebar
- **Zoom & pan** — scroll, drag, or use the ⊙ +/− buttons to explore the wheel
- **Slack notifications** — weekly/monthly/quarterly digests via a GitHub Actions workflow
- **GitHub Pages deployment** — push to `main` and the site deploys automatically

## Getting started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

## Adding tasks

Create a `.md` file in the `tasks/` directory. The filename becomes the task ID.

### Month-based task

```yaml
---
title: Annual Budget
start_month: 10
end_month: 12
category: Finance
responsible: CFO
priority: high
tags: [budget, planning]
---

Describe the task in Markdown here. This content appears in the sidebar card.
```

### Week-based task

```yaml
---
title: Sprint Planning
start_week: 10
end_week: 12
category: Strategy
responsible: CEO
---
```

`start_week` and `end_week` are ISO 8601 week numbers (1–52). When present, month fields are ignored.

### All frontmatter fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | Display name |
| `start_month` | 1–12 | yes (month tasks) | First active month |
| `end_month` | 1–12 | yes (month tasks) | Last active month |
| `start_week` | 1–52 | yes (week tasks) | First active ISO week |
| `end_week` | 1–52 | yes (week tasks) | Last active ISO week |
| `category` | string | no | Groups tasks by color |
| `responsible` | string | no | Person shown on the card |
| `priority` | low / medium / high | no | For reference only |
| `tags` | list | no | Shown as chips on the card |
| `color` | hex string | no | Overrides the category color |

## Category colors

Built-in color mappings (Norwegian and English names both work):

| Category | Color |
|---|---|
| Finance / Økonomi / Finans | Red `#E74C3C` |
| HR / Personal | Blue `#3498DB` |
| Strategy / Strategi | Green `#27AE60` |
| Management / Ledelse | Dark blue `#2980B9` |
| IT / Technology / Teknologi | Purple `#8E44AD` |
| Marketing / Marked | Orange `#E67E22` |
| Sales / Salg | Yellow `#F39C12` |
| Operations / Drift | Teal `#16A085` |
| Compliance / Juridisk / Legal | Dark red `#C0392B` |
| Communication / Kommunikasjon | Burnt orange `#D35400` |

Any other category gets a deterministic color derived from its name.

## Slack notifications

The notify script (`src/notify.js`) sends task digests to a Slack channel via an incoming webhook.

```bash
npm run notify          # send (requires SLACK_WEBHOOK_URL)
npm run notify:debug    # print the Block Kit payload without sending
```

**Environment variables:**

| Variable | Description |
|---|---|
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |
| `NOTIFY_PERIOD` | `week`, `month`, `quarter`, or `all` (default: auto from date) |
| `DRY_RUN` | Set to `1` to print the payload instead of sending |

**Auto-scheduling logic** (no `NOTIFY_PERIOD` set):
- Every run sends the **weekly** digest
- If the current date is in the first 7 days of the month → also sends the **monthly** digest
- If in the first 7 days of January, April, July, or October → also sends the **quarterly** digest

### GitHub Actions setup

1. Go to **Settings → Secrets → Actions** in your repository
2. Add a secret named `SLACK_WEBHOOK_URL`
3. The workflow (`.github/workflows/notify-slack.yml`) runs every Monday at 07:00 UTC

You can also trigger it manually via **Actions → Annual Cycle – Slack Notification → Run workflow**, with an optional `period` input.

## Deployment

The site deploys to GitHub Pages automatically on every push to `main` that changes files in `tasks/`, `src/`, or `package.json`.

**Manual setup (first time):**
1. Go to **Settings → Pages**
2. Set source to **GitHub Actions**

## Project structure

```
tasks/          ← one .md file per recurring task
src/
  App.jsx       ← layout, filtering, state
  components/
    Wheel.jsx   ← SVG wheel + zoom/pan
    TaskCard.jsx
  utils/
    tasks.js    ← task loading, ring assignment, colors
  notify.js     ← Slack notification script
  index.css
vite.config.js  ← includes custom Markdown → JSON plugin
```

## License

MIT
