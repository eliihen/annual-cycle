import { describe, it, expect } from 'vitest';
import notify from './notify.js';

const {
  isoWeek,
  expandRepeats,
  weekToMonth,
  taskOverlapsWeek,
  taskOverlapsMonth,
  taskOverlapsQuarter,
  formatRange,
  formatTaskLine,
  buildBlocks,
} = notify;

describe('isoWeek', () => {
  it('returns week 1 for the first Monday-containing week of the year', () => {
    expect(isoWeek(new Date(Date.UTC(2026, 0, 1)))).toBe(1);
  });

  it('handles a mid-year date', () => {
    expect(isoWeek(new Date(Date.UTC(2026, 6, 4)))).toBe(27);
  });
});

describe('weekToMonth', () => {
  it('clamps into the 1-12 range', () => {
    expect(weekToMonth(1)).toBe(1);
    expect(weekToMonth(52)).toBe(12);
  });
});

describe('expandRepeats', () => {
  it('returns just the task when no repeat is set', () => {
    const task = { _unit: 'month', start_month: 1, end_month: 1 };
    expect(expandRepeats(task)).toEqual([task]);
  });

  it('expands monthly week-based tasks using the weekly gap table', () => {
    const task = { _unit: 'week', _repeat: 'monthly', start_week: 1, end_week: 1 };
    const instances = expandRepeats(task);
    expect(instances.map(t => t.start_week)).toEqual([1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49]);
  });

  it('expands quarterly month-based tasks using the month gap table', () => {
    const task = { _unit: 'month', _repeat: 'quarterly', start_month: 1, end_month: 1 };
    const instances = expandRepeats(task);
    expect(instances.map(t => t.start_month)).toEqual([1, 4, 7, 10]);
  });
});

describe('taskOverlaps*', () => {
  it('matches week-based tasks directly', () => {
    const task = { _unit: 'week', start_week: 10, end_week: 12 };
    expect(taskOverlapsWeek(task, 11)).toBe(true);
    expect(taskOverlapsWeek(task, 13)).toBe(false);
  });

  it('matches month-based tasks directly', () => {
    const task = { _unit: 'month', start_month: 3, end_month: 5 };
    expect(taskOverlapsMonth(task, 4)).toBe(true);
    expect(taskOverlapsMonth(task, 6)).toBe(false);
  });

  it('matches a quarter range for month-based tasks', () => {
    const task = { _unit: 'month', start_month: 2, end_month: 4 };
    expect(taskOverlapsQuarter(task, 1, 3)).toBe(true);
    expect(taskOverlapsQuarter(task, 7, 9)).toBe(false);
  });
});

describe('formatRange', () => {
  it('formats a single month', () => {
    expect(formatRange({ _unit: 'month', start_month: 3, end_month: 3 })).toBe('March');
  });

  it('formats a month range', () => {
    expect(formatRange({ _unit: 'month', start_month: 3, end_month: 5 })).toBe('March – May');
  });

  it('formats a single week', () => {
    expect(formatRange({ _unit: 'week', start_week: 10, end_week: 10 })).toBe('Week 10');
  });

  it('formats a week range', () => {
    expect(formatRange({ _unit: 'week', start_week: 10, end_week: 12 })).toBe('Week 10–12');
  });
});

describe('formatTaskLine', () => {
  it('prefers the slack handle when present', () => {
    const line = formatTaskLine({
      title: 'Audit',
      category: 'Finance',
      _unit: 'month',
      start_month: 1,
      end_month: 1,
      responsible: 'Jane',
      responsible_slack_handle: 'jane',
    });
    expect(line).toContain('<@jane>');
    expect(line).not.toContain('Jane');
  });

  it('falls back to the plain responsible name', () => {
    const line = formatTaskLine({
      title: 'Audit',
      category: 'Finance',
      _unit: 'month',
      start_month: 1,
      end_month: 1,
      responsible: 'Jane',
    });
    expect(line).toContain('· Jane');
  });
});

describe('buildBlocks', () => {
  it('skips empty sections and includes a header', () => {
    const blocks = buildBlocks([
      { heading: 'This week', tasks: [] },
      {
        heading: 'This month',
        tasks: [{ title: 'Audit', category: 'Finance', _unit: 'month', start_month: 1, end_month: 1 }],
      },
    ]);
    expect(blocks[0]).toEqual({
      type: 'header',
      text: { type: 'plain_text', text: '📅 Annual Cycle – Task Reminder', emoji: true },
    });
    const headings = blocks
      .filter(b => b.type === 'section' && b.text.text.startsWith('*'))
      .map(b => b.text.text);
    expect(headings).toEqual(['*This month*']);
  });
});
