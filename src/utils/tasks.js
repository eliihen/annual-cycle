const CAT_COLORS = {
  økonomi: '#E74C3C', finans:   '#E74C3C',
  hr:      '#3498DB', personal: '#3498DB',
  strategi:'#27AE60', ledelse:  '#2980B9',
  it:      '#8E44AD', teknologi:'#8E44AD',
  marked:  '#E67E22', salg:     '#F39C12',
  drift:   '#16A085', operasjon:'#1ABC9C',
  compliance:'#C0392B', juridisk:'#C0392B',
  kommunikasjon:'#D35400',
  // English equivalents
  finance: '#E74C3C', economics:'#E74C3C',
  strategy:'#27AE60', management:'#2980B9',
  technology:'#8E44AD', marketing:'#E67E22',
  sales:   '#F39C12', operations:'#1ABC9C',
  legal:   '#C0392B', communication:'#D35400',
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

export function assignRings(tasks) {
  const MAX_RINGS = 4;
  const rings = [];
  return tasks.map(t => {
    const slot = { startFrac: t.startFrac, endFrac: t.endFrac };
    let ring = -1;
    for (let r = 0; r < rings.length && r < MAX_RINGS; r++) {
      if (!rings[r].some(s => overlap(s, slot))) {
        rings[r].push(slot);
        ring = r;
        break;
      }
    }
    if (ring === -1 && rings.length < MAX_RINGS) {
      ring = rings.length;
      rings.push([slot]);
    } else if (ring === -1) {
      ring = MAX_RINGS - 1;
    }
    return { ...t, ring };
  });
}

export function processTasks(modules) {
  const tasks = Object.entries(modules).map(([filePath, mod]) => {
    const id = filePath.replace(/^.*\/tasks\//, '').replace(/\.md$/, '');
    const data = mod.default?.frontmatter ?? {};
    const html = mod.default?.html ?? '';

    const hasWeeks = data.start_week != null;
    const sm = parseInt(data.start_month) || 1;
    const em = parseInt(data.end_month)   || sm;
    const sw = hasWeeks ? (parseInt(data.start_week) || 1) : null;
    const ew = hasWeeks ? (parseInt(data.end_week)   || sw) : null;

    const startFrac = hasWeeks ? (sw - 1) / 52 : (sm - 1) / 12;
    const endFrac   = hasWeeks ? ew / 52        : em / 12;

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
      unit:        hasWeeks ? 'week' : 'month',
      startFrac,
      endFrac,
      html,
    };
  }).sort((a, b) => a.startFrac - b.startFrac);

  return assignRings(tasks).map(t => ({
    ...t,
    displayColor: categoryColor(t.category, t.color),
  }));
}
