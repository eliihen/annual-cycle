# Annual Cycle

An interactive wheel visualization for recurring annual tasks. Create a GitHub repository with a `tasks/` folder, add two workflow files, and you get a live site on GitHub Pages — automatically rebuilt every time you update your tasks.

![Annual Cycle wheel showing task arcs across months and weeks](docs/image.png)

## Features

- **Calendar wheel** — 12 months divided into 52 ISO weeks, with task arcs spanning their active period
- **Month or week precision** — schedule tasks by month or down to a specific ISO week range
- **Automatic ring placement** — overlapping tasks are separated into concentric rings automatically
- **Category colors** — tasks grouped and colored by category
- **Search & filter** — live text search and category filter in the sidebar
- **Zoom & pan** — scroll, pinch, drag, or use the +/− buttons to explore the wheel
- **Embeddable iframe** — a wheel-only build (`iframe.html`) ready to embed in any page
- **Slack digests** — weekly/monthly/quarterly task reminders via a GitHub Actions workflow

---

## Quick start

### 1. Create your repository

Create a new GitHub repository (any name). You do not need to fork or copy this project — everything is pulled in automatically at build time.

### 2. Enable GitHub Pages

Go to **Settings → Pages** in your new repository and set **Source** to **GitHub Actions**.

### 3. Add the deploy workflow

Create `.github/workflows/deploy.yml` in your repository with the following content (or copy it from [`examples/workflows/deploy.yml`](examples/workflows/deploy.yml)):

```yaml
name: Deploy Annual Cycle

on:
  push:
    branches: [main]
    paths:
      - 'tasks/**'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    uses: eliihen/annual-cycle/.github/workflows/build-deploy.yml@main
```

### 4. Add your first task

Create a `tasks/` folder in your repository and add a Markdown file (see [Adding tasks](#adding-tasks) below). Commit and push — the site deploys automatically.

Your site will be live at `https://<your-username>.github.io/<your-repo>/`.

---

## Adding tasks

Create one `.md` file per recurring task inside your `tasks/` directory. The filename becomes the task ID.

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

Describe the task in Markdown here.
This content appears in the sidebar when you click the arc.
```

### Week-based task

```yaml
---
title: Q1 Business Review
start_week: 11
end_week: 13
category: Strategy
responsible: CEO
---
```

`start_week` and `end_week` use ISO 8601 week numbers (1–52). When present, month fields are ignored.

### All frontmatter fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | Display name |
| `start_month` | 1–12 | month tasks | First active month |
| `end_month` | 1–12 | month tasks | Last active month |
| `start_week` | 1–52 | week tasks | First active ISO week |
| `end_week` | 1–52 | week tasks | Last active ISO week |
| `category` | string | no | Groups tasks by color |
| `responsible` | string | no | Person shown on the card |
| `responsible_slack_handle` | string | no | Slack handle — tagged with `@` in Slack digests |
| `priority` | low / medium / high | no | For reference only |
| `tags` | list | no | Shown as chips on the card |
| `color` | hex string | no | Overrides the category color |
| `repeat` | string | no | Repeat cadence — see below |

### Repeating tasks

Add `repeat` to any task to place it multiple times around the wheel and include all instances in Slack digests.

**Week-based tasks:**

| Value | Interval |
|---|---|
| `weekly` | Every week |
| `biweekly` | Every 2 weeks |
| `monthly` | Every 4 weeks |
| `tertial` | Every 17 weeks (3× per year) |
| `quarterly` | Every 13 weeks |

**Month-based tasks:**

| Value | Interval |
|---|---|
| `monthly` | Every month |
| `quarterly` | Every 3 months |
| `tertial` | Every 4 months (3× per year) |
| `biannual` | Every 6 months |

Example — a 1-week task that repeats every month starting in week 3:

```yaml
---
title: Monthly Planning
start_week: 3
end_week: 3
repeat: monthly
category: Management
---
```

This produces arcs at weeks 3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47.

See [`examples/tasks/`](examples/tasks/) for ready-to-use sample files.

### Category colors

Built-in color mappings:

| Category           | Color                  |
| ------------------ | ---------------------- |
| Finance            | Red `#E74C3C`          |
| HR                 | Blue `#3498DB`         |
| Strategy           | Green `#27AE60`        |
| Management         | Dark blue `#2980B9`    |
| IT / Technology    | Purple `#8E44AD`       |
| Marketing          | Orange `#E67E22`       |
| Sales              | Yellow `#F39C12`       |
| Operations         | Teal `#16A085`         |
| Compliance / Legal | Dark red `#C0392B`     |
| Communication      | Burnt orange `#D35400` |

Any other category name gets a deterministic color derived from its name.

---

## Slack notifications (optional)

Get a Slack digest every Monday with the tasks active that week, month, and quarter.

### Setup

1. Create a Slack incoming webhook at <https://api.slack.com/messaging/webhooks>
2. Add it as a repository secret named `SLACK_WEBHOOK_URL` (**Settings → Secrets → Actions → New repository secret**)
3. Create `.github/workflows/notify-slack.yml` (or copy [`examples/workflows/notify-slack.yml`](examples/workflows/notify-slack.yml)):

```yaml
name: Annual Cycle – Slack Notification

on:
  schedule:
    - cron: '0 7 * * 1'   # Every Monday at 07:00 UTC
  workflow_dispatch:
    inputs:
      period:
        description: 'Period to notify for (week / month / quarter / all)'
        required: false

jobs:
  notify:
    uses: eliihen/annual-cycle/.github/workflows/notify-slack.yml@main
    secrets:
      slack_webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
    with:
      period: ${{ inputs.period || '' }}
```

You can also trigger a one-off notification manually from **Actions → Annual Cycle – Slack Notification → Run workflow**.

---

## Embedding the wheel (iframe)

Every build also produces an `iframe.html` alongside `index.html`. It contains only the wheel — no header, sidebar, or footer — making it suitable for embedding in intranets, Notion pages, or dashboards.

```html
<iframe
  src="https://<you>.github.io/<your-repo>/iframe.html"
  width="600"
  height="600"
  style="border: none;">
</iframe>
```

Clicking a task arc in the iframe navigates the top-level frame to your full site. This link target is baked in at build time and is set automatically from your repository name. See [Advanced configuration](#advanced-configuration) if you use a custom domain.

---

## Advanced configuration

All advanced options are optional. The defaults work for standard GitHub Pages setups.

### Custom domain

If your site is served from a custom domain (e.g. `https://cycle.example.com/`), set `base_path` and `site_url` in your deploy workflow:

```yaml
jobs:
  deploy:
    uses: eliihen/annual-cycle/.github/workflows/build-deploy.yml@main
    with:
      base_path: /
      site_url: https://cycle.example.com/
```

### Custom tasks directory

If your tasks live somewhere other than `tasks/`:

```yaml
jobs:
  deploy:
    uses: eliihen/annual-cycle/.github/workflows/build-deploy.yml@main
    with:
      tasks_path: content/annual-tasks
```

### Pinning to a specific version

Replace `@main` with a tag to pin to a stable release:

```yaml
uses: eliihen/annual-cycle/.github/workflows/build-deploy.yml@v1.0.0
```

---

## Local development

Clone this repository if you want to develop the visualization itself:

```bash
git clone https://github.com/eliihen/annual-cycle.git
cd annual-cycle
npm install
npm run dev       # dev server at http://localhost:5173/annual-cycle/
npm run build     # production build → dist/
npm run preview   # serve the dist/ build locally
```

### Debug Slack notification

```bash
npm run notify:debug    # prints the Block Kit payload without sending
```

---

## Project structure (for contributors)

```
tasks/              ← sample tasks used by this repo's own deployment
examples/
  workflows/        ← copy-paste workflow files for consumers
  tasks/            ← example task files
src/
  App.jsx           ← main app (wheel + sidebar + filters)
  IframeApp.jsx     ← iframe-only app (wheel only)
  components/
    Wheel.jsx       ← SVG wheel with zoom/pan and pinch support
    TaskCard.jsx    ← collapsible sidebar card
  utils/
    tasks.js        ← task loading, ring assignment, category colors
  notify.js         ← Slack notification script (Node.js, no build step)
  index.css         ← main app styles
  iframe.css        ← iframe-only styles
vite.config.js      ← Vite config with Markdown plugin and multi-page build
.github/workflows/
  deploy.yml                    ← deploys this repo to GitHub Pages
  notify-slack.yml              ← sends Slack notifications for this repo
  build-deploy.yml     ← reusable workflow for consumers
  notify-slack.yml     ← reusable workflow for consumers
```

## License

MIT
