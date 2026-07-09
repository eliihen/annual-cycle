const REPEAT_GAPS_WEEK  = { weekly: 1, biweekly: 2, monthly: 4, tertial: 17, quarterly: 13 };
const REPEAT_GAPS_MONTH = { monthly: 1, quarterly: 3, tertial: 4, biannual: 6, semiannual: 6 };

function expandRepeats(task) {
  const repeat = task.repeat;
  if (!repeat) return [task];

  const instances = [task];

  if (task.unit === 'week') {
    const gap = REPEAT_GAPS_WEEK[repeat];
    if (!gap) return instances;
    const duration = task.end_week - task.start_week;
    for (let n = 1; ; n++) {
      const sw = task.start_week + gap * n;
      if (sw > 52) break;
      const ew = Math.min(sw + duration, 52);
      instances.push({
        ...task,
        id: `${task.id}--r${n + 1}`,
        start_week: sw,
        end_week:   ew,
        startFrac:  (sw - 1) / 52,
        endFrac:    ew / 52,
      });
    }
  } else {
    const gap = REPEAT_GAPS_MONTH[repeat];
    if (!gap) return instances;
    const duration = task.end_month - task.start_month;
    for (let n = 1; ; n++) {
      const sm = task.start_month + gap * n;
      if (sm > 12) break;
      const em = Math.min(sm + duration, 12);
      instances.push({
        ...task,
        id: `${task.id}--r${n + 1}`,
        start_month: sm,
        end_month:   em,
        startFrac:   (sm - 1) / 12,
        endFrac:     em / 12,
      });
    }
  }

  return instances;
}

const CAT_COLORS = {
  finance:      '#E74C3C',
  hr:           '#3498DB',
  strategy:     '#27AE60',
  management:   '#2980B9',
  it:           '#8E44AD',
  technology:   '#8E44AD',
  marketing:    '#E67E22',
  sales:        '#F39C12',
  operations:   '#16A085',
  compliance:   '#C0392B',
  legal:        '#C0392B',
  communication:'#D35400',
};

export function categoryColor(category, colorOverride) {
  if (colorOverride) return colorOverride;
  const key = (category || '').toLowerCase().trim();
  if (CAT_COLORS[key]) return CAT_COLORS[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (key.charCodeAt(i) + ((h << 5) - h)) | 0;
  return `hsl(${Math.abs(h) % 360},60%,52%)`;
}

function overlap(a, b) {
  return !(a.endFrac <= b.startFrac || b.endFrac <= a.startFrac);
}

// Greedy first-fit into concentric rings. No cap on ring count — when more
// than 4 tasks mutually overlap, additional rings are added rather than
// stacking tasks on top of each other (which made labels unreadable). The
// renderer shrinks each ring's band width to fit however many rings a given
// year actually needs.
export function assignRings(tasks) {
  const rings = [];
  return tasks.map(t => {
    const slot = { startFrac: t.startFrac, endFrac: t.endFrac };
    let ring = -1;
    for (let r = 0; r < rings.length; r++) {
      if (!rings[r].some(s => overlap(s, slot))) {
        rings[r].push(slot);
        ring = r;
        break;
      }
    }
    if (ring === -1) {
      ring = rings.length;
      rings.push([slot]);
    }
    return { ...t, ring };
  });
}

export function processTasks(modules) {
  const tasks = Object.entries(modules).map(([filePath, mod]) => {
    const id = filePath.replace(/^.*\/tasks\//, '').replace(/\.md$/, '');
    const data = mod.default?.frontmatter ?? {};
    const html = mod.default?.html ?? '';

    // A task needs an explicit start_week or start_month to be placeable on
    // the wheel — without one there's no sensible position, so it's omitted
    // entirely rather than silently defaulting onto month 1.
    if (data.start_week == null && data.start_month == null) return null;

    const hasWeeks = data.start_week != null;
    const sm = parseInt(data.start_month) || 1;
    const em = parseInt(data.end_month)   || sm;
    const sw = hasWeeks ? (parseInt(data.start_week) || 1) : null;
    const ew = hasWeeks ? (parseInt(data.end_week)   || sw) : null;

    const startFrac = hasWeeks ? (sw - 1) / 52 : (sm - 1) / 12;
    const endFrac   = hasWeeks ? ew / 52        : em / 12;

    const repeat = data.repeat ? (data.repeat + '').toLowerCase().trim() : null;

    return {
      id,
      title:       data.title       || id,
      start_month: Math.min(Math.max(sm, 1), 12),
      end_month:   Math.min(Math.max(em, 1), 12),
      start_week:  hasWeeks ? Math.min(Math.max(sw, 1), 52) : null,
      end_week:    hasWeeks ? Math.min(Math.max(ew, 1), 52) : null,
      category:    data.category    || 'Other',
      color:       data.color       || null,
      responsible: data.responsible || null,
      priority:    data.priority    || 'medium',
      tags:        Array.isArray(data.tags) ? data.tags : [],
      repeat,
      unit:        hasWeeks ? 'week' : 'month',
      startFrac,
      endFrac,
      html,
    };
  }).filter(Boolean).flatMap(expandRepeats).sort((a, b) => a.startFrac - b.startFrac);

  return assignRings(tasks).map(t => ({
    ...t,
    displayColor: categoryColor(t.category, t.color),
  }));
}
