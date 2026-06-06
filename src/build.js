#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// ── SVG geometry ──────────────────────────────────────────────────────────────
const SVG_SIZE  = 820;
const CX        = SVG_SIZE / 2;   // 410
const CY        = SVG_SIZE / 2;   // 410
const OUTER_R   = 385;            // wheel outer edge
const LABEL_R   = 353;            // centre of month-label arc
const LABEL_RING_INNER = 318;     // inner edge of month-label ring
const TASK_OUTER_START = 308;     // outer edge of ring 0
const TASK_BAND = 46;             // radial height per ring (incl. gap)
const TASK_GAP  = 4;              // inner padding per ring
const CENTER_R  = 95;             // centre circle radius
const MAX_RINGS = 4;

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL  = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

// ── Maths helpers ─────────────────────────────────────────────────────────────
function deg2rad(d) { return d * Math.PI / 180; }

function polar(r, angleDeg) {
  const rad = deg2rad(angleDeg);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

// Month 1 (Jan) starts at the top (-90°), clockwise 30° per month
function mStart(m) { return -90 + (m - 1) * 30; }
function mEnd(m)   { return -90 + m * 30; }

// ISO week 1 starts at the top (-90°), clockwise 360/52° per week
const DEG_PER_WEEK = 360 / 52;
function wStart(w) { return -90 + (w - 1) * DEG_PER_WEEK; }
function wEnd(w)   { return -90 + w * DEG_PER_WEEK; }

function taskStartDeg(t) {
  return t._unit === 'week' ? wStart(t.data.start_week) : mStart(t.data.start_month);
}
function taskEndDeg(t) {
  return t._unit === 'week' ? wEnd(t.data.end_week) : mEnd(t.data.end_month);
}

function f(n) { return n.toFixed(3); }

// Filled annular sector (ring slice)
function annularSector(outerR, innerR, startDeg, endDeg, gapDeg = 1.2) {
  const s = startDeg + gapDeg;
  const e = endDeg   - gapDeg;
  const span = e - s;
  const large = span > 180 ? 1 : 0;

  const oS = polar(outerR, s);
  const oE = polar(outerR, e);
  const iS = polar(innerR, s);
  const iE = polar(innerR, e);

  return [
    `M ${f(oS.x)},${f(oS.y)}`,
    `A ${outerR},${outerR} 0 ${large},1 ${f(oE.x)},${f(oE.y)}`,
    `L ${f(iE.x)},${f(iE.y)}`,
    `A ${innerR},${innerR} 0 ${large},0 ${f(iS.x)},${f(iS.y)}`,
    'Z'
  ].join(' ');
}

// ── Ring assignment (greedy first-fit) ────────────────────────────────────────
function overlap(a, b) {
  return !(a.endFrac <= b.startFrac || b.endFrac <= a.startFrac);
}

function assignRings(tasks) {
  const rings = [];
  for (const t of tasks) {
    const slot = { startFrac: t._startFrac, endFrac: t._endFrac };
    let placed = false;
    for (let r = 0; r < rings.length && r < MAX_RINGS; r++) {
      if (!rings[r].some(s => overlap(s, slot))) {
        rings[r].push(slot);
        t._ring = r;
        placed = true;
        break;
      }
    }
    if (!placed && rings.length < MAX_RINGS) {
      t._ring = rings.length;
      rings.push([slot]);
    } else if (!placed) {
      t._ring = MAX_RINGS - 1; // overflow into last ring
    }
  }
  return rings.length || 1;
}

function ringRadii(ring) {
  const outer = TASK_OUTER_START - ring * TASK_BAND;
  const inner = outer - TASK_BAND + TASK_GAP;
  return { outer, inner };
}

// ── Color helpers ─────────────────────────────────────────────────────────────
const CAT_COLORS = {
  økonomi:    '#E74C3C',
  finans:     '#E74C3C',
  hr:         '#3498DB',
  personal:   '#3498DB',
  strategi:   '#27AE60',
  ledelse:    '#2980B9',
  it:         '#8E44AD',
  teknologi:  '#8E44AD',
  marked:     '#E67E22',
  salg:       '#F39C12',
  drift:      '#16A085',
  operasjon:  '#1ABC9C',
  compliance: '#C0392B',
  juridisk:   '#C0392B',
  kommunikasjon: '#D35400',
};

function categoryColor(task) {
  if (task.data.color) return task.data.color;
  const key = (task.data.category || '').toLowerCase().trim();
  if (CAT_COLORS[key]) return CAT_COLORS[key];
  // deterministic hue from category name
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (key.charCodeAt(i) + ((h << 5) - h)) | 0;
  return `hsl(${Math.abs(h) % 360},60%,52%)`;
}

// ── Task loading ──────────────────────────────────────────────────────────────
function loadTasks(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { data, content } = matter(raw);

      const hasWeeks = data.start_week != null;
      const sm = parseInt(data.start_month) || 1;
      const em = parseInt(data.end_month)   || sm;
      const sw = hasWeeks ? (parseInt(data.start_week) || 1) : null;
      const ew = hasWeeks ? (parseInt(data.end_week)   || sw) : null;

      // Fractional year position [0..1] used for ring overlap detection
      const startFrac = hasWeeks ? (sw - 1) / 52 : (sm - 1) / 12;
      const endFrac   = hasWeeks ? ew / 52        : em / 12;

      return {
        id:   file.replace(/\.md$/, ''),
        data: {
          title:       data.title       || file.replace(/\.md$/, ''),
          start_month: Math.min(Math.max(sm, 1), 12),
          end_month:   Math.min(Math.max(em, 1), 12),
          start_week:  hasWeeks ? Math.min(Math.max(sw, 1), 52) : null,
          end_week:    hasWeeks ? Math.min(Math.max(ew, 1), 52) : null,
          category:    data.category    || 'Annet',
          color:       data.color       || null,
          responsible: data.responsible || null,
          priority:    data.priority    || 'medium',
          tags:        Array.isArray(data.tags) ? data.tags : [],
        },
        _unit:      hasWeeks ? 'week' : 'month',
        _startFrac: startFrac,
        _endFrac:   endFrac,
        content,
        html: marked(content),
      };
    })
    .sort((a, b) => a._startFrac - b._startFrac);
}

// ── SVG generation ────────────────────────────────────────────────────────────
function buildSVG(tasks) {
  const parts = [];
  const now = new Date();
  const curMonth = now.getMonth() + 1;

  // Outer circle background
  parts.push(`<circle cx="${CX}" cy="${CY}" r="${OUTER_R}" fill="#EEF0F3" stroke="#CDD0D6" stroke-width="1.5"/>`);

  // 12 sector backgrounds
  for (let m = 1; m <= 12; m++) {
    const isCurrent = m === curMonth;
    const isEven    = m % 2 === 0;
    const fill = isCurrent ? '#D6E8FF' : (isEven ? '#E5E8EE' : '#F0F2F5');
    const d = annularSector(LABEL_RING_INNER, CENTER_R, mStart(m), mEnd(m), 0);
    parts.push(`<path d="${d}" fill="${fill}" stroke="none"/>`);
  }

  // Month-label ring (slightly darker band)
  for (let m = 1; m <= 12; m++) {
    const isCurrent = m === curMonth;
    const fill = isCurrent ? '#A8CBF0' : (m % 2 === 0 ? '#D0D5DF' : '#D8DCE8');
    const d = annularSector(OUTER_R, LABEL_RING_INNER, mStart(m), mEnd(m), 0);
    parts.push(`<path d="${d}" fill="${fill}" stroke="none"/>`);
  }

  // Radial divider lines
  for (let m = 0; m < 12; m++) {
    const ang = -90 + m * 30;
    const inner = polar(CENTER_R, ang);
    const outer = polar(OUTER_R,  ang);
    parts.push(`<line x1="${f(inner.x)}" y1="${f(inner.y)}" x2="${f(outer.x)}" y2="${f(outer.y)}" stroke="white" stroke-width="1.8"/>`);
  }

  // Quarter markers (slightly bolder lines)
  for (let q = 0; q < 4; q++) {
    const ang = -90 + q * 90;
    const inner = polar(CENTER_R, ang);
    const outer = polar(OUTER_R,  ang);
    parts.push(`<line x1="${f(inner.x)}" y1="${f(inner.y)}" x2="${f(outer.x)}" y2="${f(outer.y)}" stroke="white" stroke-width="3"/>`);
  }

  // Quarter labels (Q1–Q4)
  const qLabels = ['Q1','Q2','Q3','Q4'];
  for (let q = 0; q < 4; q++) {
    // Mid-angle of each quarter
    const midAng = -90 + q * 90 + 45;
    const pos = polar(OUTER_R + 18, midAng);
    parts.push(`<text x="${f(pos.x)}" y="${f(pos.y)}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-family="system-ui,sans-serif" font-weight="700" fill="#8A8FA0" letter-spacing="0.5">${qLabels[q]}</text>`);
  }

  // Task arcs
  for (const task of tasks) {
    const { outer, inner } = ringRadii(task._ring ?? 0);
    if (inner < CENTER_R + 4) continue;

    const color    = categoryColor(task);
    const startDeg = taskStartDeg(task);
    const endDeg   = taskEndDeg(task);
    const spanDeg  = endDeg - startDeg;
    const d = annularSector(outer, inner, startDeg, endDeg, 2);

    const rangeLabel = task._unit === 'week'
      ? `Uke ${task.data.start_week}–${task.data.end_week}`
      : `${MONTHS_SHORT[task.data.start_month-1]}–${MONTHS_SHORT[task.data.end_month-1]}`;

    parts.push(
      `<path d="${d}" fill="${color}" stroke="white" stroke-width="1" opacity="0.88" ` +
      `data-id="${task.id}" class="task-arc" style="cursor:pointer">` +
      `<title>${task.data.title} (${rangeLabel})</title>` +
      `</path>`
    );

    // Inline label for arcs ≥ 2 months (60°) wide
    if (spanDeg >= 60) {
      const midAng = (startDeg + endDeg) / 2;
      const midR   = (outer + inner) / 2;
      const tp     = polar(midR, midAng);
      const rot    = midAng + 90; // tangent rotation
      const maxChars = Math.max(4, Math.floor(spanDeg / 8));
      const label  = task.data.title.length > maxChars
        ? task.data.title.slice(0, maxChars - 1) + '…'
        : task.data.title;
      parts.push(
        `<text transform="translate(${f(tp.x)},${f(tp.y)}) rotate(${f(rot)})" ` +
        `text-anchor="middle" dominant-baseline="middle" ` +
        `font-size="10" font-family="system-ui,sans-serif" font-weight="600" ` +
        `fill="white" pointer-events="none" opacity="0.95">${label}</text>`
      );
    }
  }

  // Month labels
  for (let m = 1; m <= 12; m++) {
    const midAng = mStart(m) + 15;
    const pos = polar(LABEL_R, midAng);
    const isCurrent = m === curMonth;
    const weight = isCurrent ? '800' : '600';
    const fill   = isCurrent ? '#1A4A8A' : '#3A3F52';
    parts.push(
      `<text x="${f(pos.x)}" y="${f(pos.y)}" text-anchor="middle" dominant-baseline="middle" ` +
      `font-size="13" font-family="system-ui,sans-serif" font-weight="${weight}" fill="${fill}">${MONTHS_SHORT[m-1]}</text>`
    );
  }

  // Centre circle
  parts.push(`<circle cx="${CX}" cy="${CY}" r="${CENTER_R}" fill="white" stroke="#CDD0D6" stroke-width="1.5"/>`);
  parts.push(
    `<text x="${CX}" y="${CY - 14}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-size="20" font-family="system-ui,sans-serif" font-weight="800" fill="#1A1A2E">Annual Cycle</text>`
  );
  parts.push(
    `<text x="${CX}" y="${CY + 12}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-size="13" font-family="system-ui,sans-serif" fill="#6C6F7D">${now.getFullYear()}</text>`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" ` +
         `width="${SVG_SIZE}" height="${SVG_SIZE}" id="wheel">\n${parts.join('\n')}\n</svg>`;
}

// ── HTML generation ───────────────────────────────────────────────────────────
function buildHTML(tasks, svgContent) {
  // Unique categories for legend
  const seen = new Map();
  for (const t of tasks) {
    if (!seen.has(t.data.category)) seen.set(t.data.category, categoryColor(t));
  }

  const legendHTML = [...seen.entries()].map(([cat, col]) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${col}"></span>
      <span>${cat}</span>
    </div>`).join('');

  const taskCardsHTML = tasks.map(t => {
    const col  = categoryColor(t);
    const sm   = t.data.start_month;
    const em   = t.data.end_month;
    const when = t._unit === 'week'
      ? (t.data.start_week === t.data.end_week
        ? `Week ${t.data.start_week}`
        : `Week ${t.data.start_week} – ${t.data.end_week}`)
      : (sm === em
        ? MONTHS_FULL[sm - 1]
        : `${MONTHS_FULL[sm - 1]} – ${MONTHS_FULL[em - 1]}`);

    const tagsHTML = [
      `<span class="chip chip-cat" style="--c:${col}">${t.data.category}</span>`,
      `<span class="chip">${when}</span>`,
      ...(t.data.responsible ? [`<span class="chip">👤 ${t.data.responsible}</span>`] : []),
      ...(t.data.tags.map(tag => `<span class="chip">${tag}</span>`)),
    ].join('');

    return `
    <article class="task-card" id="card-${t.id}" data-id="${t.id}">
      <div class="task-card-head" style="border-left:4px solid ${col}">
        <div class="task-title">${t.data.title}</div>
        <div class="task-chips">${tagsHTML}</div>
      </div>
      <div class="task-body">${t.html || '<p><em>No description.</em></p>'}</div>
    </article>`;
  }).join('');

  const buildTime = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Annual Cycle</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:   #F0F2F6;
      --card: #FFFFFF;
      --text: #1A1A2E;
      --sub:  #6C6F7D;
      --border: #DDE0E8;
      --accent: #1A4A8A;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    /* ── Header ── */
    header {
      background: var(--text);
      color: white;
      padding: 18px 32px;
      display: flex;
      align-items: baseline;
      gap: 16px;
    }
    header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
    header p  { font-size: 13px; opacity: .6; }

    /* ── Layout ── */
    .layout {
      display: grid;
      grid-template-columns: minmax(0,1fr) 400px;
      gap: 20px;
      max-width: 1360px;
      margin: 0 auto;
      padding: 24px 20px;
    }
    @media (max-width: 960px) {
      .layout { grid-template-columns: 1fr; }
    }

    /* ── Wheel panel ── */
    .wheel-panel {
      background: var(--card);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,.07);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .wheel-panel svg { max-width: 100%; height: auto; }

    /* ── Legend ── */
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      justify-content: center;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--sub);
      font-weight: 500;
    }
    .legend-dot {
      width: 11px; height: 11px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    /* ── Sidebar ── */
    .sidebar { display: flex; flex-direction: column; gap: 12px; }
    .sidebar-header {
      background: var(--card);
      border-radius: 12px;
      padding: 14px 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sidebar-header h2 { font-size: 15px; font-weight: 700; }
    .sidebar-header span { font-size: 12px; color: var(--sub); }

    /* ── Task cards ── */
    .task-list { display: flex; flex-direction: column; gap: 10px; }

    .task-card {
      background: var(--card);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 6px rgba(0,0,0,.06);
      transition: box-shadow .2s, transform .15s;
    }
    .task-card.active {
      box-shadow: 0 4px 20px rgba(0,0,0,.14);
      transform: translateY(-1px);
    }
    .task-card-head {
      padding: 12px 16px 10px;
      cursor: pointer;
      user-select: none;
    }
    .task-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
      line-height: 1.3;
    }
    .task-chips { display: flex; flex-wrap: wrap; gap: 5px; }

    .chip {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 20px;
      background: #F0F2F6;
      color: var(--sub);
      font-weight: 500;
      white-space: nowrap;
    }
    .chip-cat {
      background: color-mix(in srgb, var(--c) 15%, transparent);
      color: color-mix(in srgb, var(--c) 80%, #000);
    }

    .task-body {
      display: none;
      padding: 0 16px 14px;
      border-top: 1px solid var(--border);
      margin-top: 2px;
      padding-top: 12px;
      font-size: 13.5px;
      line-height: 1.65;
      color: #3A3F52;
    }
    .task-body.open { display: block; }
    .task-body p  { margin-bottom: 8px; }
    .task-body h2,
    .task-body h3 { font-size: 13px; font-weight: 700; margin: 10px 0 4px; }
    .task-body ul,
    .task-body ol { padding-left: 18px; margin-bottom: 8px; }
    .task-body li { margin-bottom: 3px; }
    .task-body code {
      background: #F0F2F6;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 12px;
    }

    /* ── Arc hover ── */
    .task-arc { transition: opacity .15s, filter .15s; }
    .task-arc:hover { opacity: 1 !important; filter: brightness(1.08); }
    .task-arc.active { opacity: 1 !important; filter: brightness(1.12) drop-shadow(0 0 4px rgba(0,0,0,.3)); }

    /* ── Empty state ── */
    .empty {
      background: var(--card);
      border-radius: 12px;
      padding: 40px 24px;
      text-align: center;
      color: var(--sub);
      font-size: 14px;
      line-height: 1.6;
      box-shadow: 0 1px 6px rgba(0,0,0,.06);
    }
    .empty strong { display: block; margin-bottom: 6px; color: var(--text); font-size: 15px; }

    /* ── Footer ── */
    footer {
      text-align: center;
      padding: 12px;
      font-size: 11px;
      color: var(--sub);
      opacity: .7;
    }
  </style>
</head>
<body>

<header>
  <h1>Annual Cycle</h1>
  <p>Overview of recurring tasks throughout the year</p>
</header>

<div class="layout">
  <div class="wheel-panel">
    ${svgContent}
    ${seen.size > 0 ? `<div class="legend">${legendHTML}</div>` : ''}
  </div>

  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Tasks</h2>
      <span>${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
    </div>

    <div class="task-list">
      ${tasks.length > 0 ? taskCardsHTML : `
        <div class="empty">
          <strong>No tasks yet</strong>
          Add <code>.md</code> files to the <code>tasks/</code> folder<br>
          and run <code>npm run build</code>.
        </div>`}
    </div>
  </aside>
</div>

<footer>Generated ${buildTime} · <a href="https://github.com" style="color:inherit">GitHub Pages</a></footer>

<script>
(function () {
  // Toggle task card body on header click
  document.querySelectorAll('.task-card-head').forEach(function (head) {
    head.addEventListener('click', function () {
      const card = head.closest('.task-card');
      const body = card.querySelector('.task-body');
      const open = body.classList.toggle('open');
      card.classList.toggle('active', open);
    });
  });

  // Click on arc → highlight card
  document.querySelectorAll('.task-arc').forEach(function (arc) {
    arc.addEventListener('click', function () {
      const id   = arc.dataset.id;
      const card = document.getElementById('card-' + id);
      if (!card) return;

      // clear previous
      document.querySelectorAll('.task-arc.active').forEach(function (a) { a.classList.remove('active'); });

      arc.classList.add('active');
      card.querySelector('.task-body').classList.add('open');
      card.classList.add('active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
})();
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const root     = path.resolve(__dirname, '..');
  const tasksDir = path.join(root, 'tasks');
  const distDir  = path.join(root, 'dist');

  fs.mkdirSync(distDir, { recursive: true });

  const tasks = loadTasks(tasksDir);
  assignRings(tasks);

  const svg  = buildSVG(tasks);
  const html = buildHTML(tasks, svg);

  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf-8');

  const numRings = tasks.length ? Math.max(...tasks.map(t => t._ring ?? 0)) + 1 : 0;
  console.log(`✓  Built årshjul — ${tasks.length} task(s) across ${numRings} ring(s)`);
  console.log(`   → dist/index.html`);
}

main();
