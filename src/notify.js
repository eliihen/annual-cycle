#!/usr/bin/env node
'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const matter = require('gray-matter');

const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ISO 8601 week number
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function loadTasks(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const { data } = matter(fs.readFileSync(path.join(dir, file), 'utf-8'));
      const hasWeeks = data.start_week != null;
      const sm = parseInt(data.start_month) || 1;
      const em = parseInt(data.end_month)   || sm;
      const sw = hasWeeks ? (parseInt(data.start_week) || 1) : null;
      const ew = hasWeeks ? (parseInt(data.end_week)   || sw) : null;
      return {
        title:       data.title       || file.replace(/\.md$/, ''),
        category:    data.category    || 'Other',
        responsible: data.responsible || null,
        start_month: Math.min(Math.max(sm, 1), 12),
        end_month:   Math.min(Math.max(em, 1), 12),
        start_week:  hasWeeks ? Math.min(Math.max(sw, 1), 52) : null,
        end_week:    hasWeeks ? Math.min(Math.max(ew, 1), 52) : null,
        _unit:       hasWeeks ? 'week' : 'month',
      };
    });
}

// Approximate month from ISO week number
function weekToMonth(week) {
  return Math.min(12, Math.max(1, Math.ceil(week * 12 / 52)));
}

function taskOverlapsWeek(task, week) {
  if (task._unit !== 'week') return false;
  return task.start_week <= week && week <= task.end_week;
}

function taskOverlapsMonth(task, month) {
  if (task._unit === 'week') {
    return weekToMonth(task.start_week) <= month && month <= weekToMonth(task.end_week);
  }
  return task.start_month <= month && month <= task.end_month;
}

function taskOverlapsQuarter(task, qStart, qEnd) {
  if (task._unit === 'week') {
    const sm = weekToMonth(task.start_week);
    const em = weekToMonth(task.end_week);
    return sm <= qEnd && em >= qStart;
  }
  return task.start_month <= qEnd && task.end_month >= qStart;
}

function formatRange(task) {
  if (task._unit === 'week') {
    return task.start_week === task.end_week
      ? `Week ${task.start_week}`
      : `Week ${task.start_week}–${task.end_week}`;
  }
  return task.start_month === task.end_month
    ? MONTHS_FULL[task.start_month - 1]
    : `${MONTHS_FULL[task.start_month - 1]} – ${MONTHS_FULL[task.end_month - 1]}`;
}

function formatTaskLine(task) {
  const resp = task.responsible ? ` · ${task.responsible}` : '';
  return `• *${task.title}* (${task.category}) — ${formatRange(task)}${resp}`;
}

function buildBlocks(sections) {
  const blocks = [{
    type: 'header',
    text: { type: 'plain_text', text: '📅 Annual Cycle – Task Reminder', emoji: true },
  }];

  for (const { heading, tasks } of sections) {
    if (tasks.length === 0) continue;
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${heading}*` },
    });
    const lines = tasks.map(formatTaskLine);
    // Slack mrkdwn blocks max ~3000 chars; chunk at 20 lines to be safe
    for (let i = 0; i < lines.length; i += 20) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: lines.slice(i, i + 20).join('\n') },
      });
    }
  }

  return blocks;
}

function postToSlack(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url  = new URL(webhookUrl);
    const req  = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`Slack HTTP ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const dryRun     = process.env.DRY_RUN === '1';
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!dryRun && !webhookUrl) {
    console.error('SLACK_WEBHOOK_URL is not set');
    process.exit(1);
  }

  const now     = new Date();
  const month   = now.getMonth() + 1;
  const week    = isoWeek(now);
  const quarter = Math.ceil(month / 3);
  const qStart  = (quarter - 1) * 3 + 1;
  const qEnd    = quarter * 3;

  // Explicit period override, or auto-detect from date
  const explicitPeriod = (process.env.NOTIFY_PERIOD || '').toLowerCase();
  const isFirstWeekOfMonth   = now.getDate() <= 7;
  const isFirstWeekOfQuarter = [1, 4, 7, 10].includes(month) && isFirstWeekOfMonth;

  const sendWeek    = !explicitPeriod || explicitPeriod === 'week'    || explicitPeriod === 'all';
  const sendMonth   = explicitPeriod === 'month'   || explicitPeriod === 'all' || (!explicitPeriod && isFirstWeekOfMonth);
  const sendQuarter = explicitPeriod === 'quarter' || explicitPeriod === 'all' || (!explicitPeriod && isFirstWeekOfQuarter);

  const tasks = loadTasks(path.join(__dirname, '..', 'tasks'));

  const sections = [];

  if (sendWeek) {
    sections.push({
      heading: `This week (week ${week})`,
      tasks:   tasks.filter(t => taskOverlapsWeek(t, week)),
    });
  }

  if (sendMonth) {
    sections.push({
      heading: `This month (${MONTHS_FULL[month - 1]})`,
      tasks:   tasks.filter(t => taskOverlapsMonth(t, month)),
    });
  }

  if (sendQuarter) {
    sections.push({
      heading: `This quarter (Q${quarter}: ${MONTHS_FULL[qStart - 1]}–${MONTHS_FULL[qEnd - 1]})`,
      tasks:   tasks.filter(t => taskOverlapsQuarter(t, qStart, qEnd)),
    });
  }

  if (!sections.some(s => s.tasks.length > 0)) {
    console.log('No tasks for the current period — skipping notification');
    return;
  }

  const payload = { blocks: buildBlocks(sections) };

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  await postToSlack(webhookUrl, payload);
  console.log('✓ Slack notification sent');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
