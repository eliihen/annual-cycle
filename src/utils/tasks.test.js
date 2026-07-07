import { describe, it, expect } from 'vitest';
import { categoryColor, assignRings, processTasks } from './tasks.js';

// Helper: build a fake markdown module map the way import.meta.glob would.
function mod(frontmatter) {
  return { default: { frontmatter, html: '' } };
}

describe('categoryColor', () => {
  it('returns the explicit override when provided', () => {
    expect(categoryColor('finance', '#123456')).toBe('#123456');
  });

  it('maps a known category to its table color (case-insensitive)', () => {
    expect(categoryColor('Finance')).toBe('#E74C3C');
    expect(categoryColor('HR')).toBe('#3498DB');
  });

  it('falls back to a deterministic hashed hsl for unknown categories', () => {
    const a = categoryColor('somethingelse');
    const b = categoryColor('somethingelse');
    expect(a).toBe(b);
    expect(a).toMatch(/^hsl\(/);
  });
});

describe('assignRings', () => {
  it('keeps non-overlapping tasks on ring 0', () => {
    const rings = assignRings([
      { startFrac: 0, endFrac: 0.2 },
      { startFrac: 0.3, endFrac: 0.5 },
    ]);
    expect(rings.map(r => r.ring)).toEqual([0, 0]);
  });

  it('pushes overlapping tasks onto separate rings', () => {
    const rings = assignRings([
      { startFrac: 0, endFrac: 0.5 },
      { startFrac: 0.1, endFrac: 0.6 },
    ]);
    expect(rings.map(r => r.ring)).toEqual([0, 1]);
  });

  it('overflows a 5th mutually-overlapping task into the innermost ring (3)', () => {
    const overlapping = Array.from({ length: 5 }, () => ({ startFrac: 0.1, endFrac: 0.9 }));
    const rings = assignRings(overlapping);
    expect(rings.map(r => r.ring)).toEqual([0, 1, 2, 3, 3]);
  });
});

describe('processTasks', () => {
  it('defaults month precision and computes fractional positions', () => {
    const [task] = processTasks({
      '../tasks/budget.md': mod({ title: 'Budget', start_month: 1, end_month: 3 }),
    });
    expect(task.unit).toBe('month');
    expect(task.startFrac).toBeCloseTo(0);
    expect(task.endFrac).toBeCloseTo(3 / 12);
  });

  it('switches to week precision when start_week is present', () => {
    const [task] = processTasks({
      '../tasks/audit.md': mod({ title: 'Audit', start_week: 1, end_week: 4 }),
    });
    expect(task.unit).toBe('week');
    expect(task.endFrac).toBeCloseTo(4 / 52);
  });

  it('expands a monthly repeat into multiple instances', () => {
    const tasks = processTasks({
      '../tasks/standup.md': mod({ title: 'Standup', start_month: 1, end_month: 1, repeat: 'quarterly' }),
    });
    // quarterly = every 3 months starting month 1 → months 1,4,7,10 = 4 instances
    expect(tasks.length).toBe(4);
    expect(tasks.every(t => t.title === 'Standup')).toBe(true);
  });
});
