import { describe, it, expect } from 'vitest';
import { processTasks, assignRings, categoryColor } from './tasks.js';

function makeModule(frontmatter, html = '<p>body</p>') {
  return { default: { frontmatter, html } };
}

describe('categoryColor', () => {
  it('returns the override color when provided', () => {
    expect(categoryColor('finance', '#123456')).toBe('#123456');
  });

  it('returns a known category color case-insensitively', () => {
    expect(categoryColor('Finance')).toBe('#E74C3C');
  });

  it('derives a deterministic hsl color for unknown categories', () => {
    const a = categoryColor('some-unknown-category');
    const b = categoryColor('some-unknown-category');
    expect(a).toBe(b);
    expect(a).toMatch(/^hsl\(\d+,60%,52%\)$/);
  });
});

describe('assignRings', () => {
  it('keeps non-overlapping tasks in ring 0', () => {
    const tasks = [
      { startFrac: 0, endFrac: 0.2 },
      { startFrac: 0.3, endFrac: 0.5 },
    ];
    const result = assignRings(tasks);
    expect(result.map(t => t.ring)).toEqual([0, 0]);
  });

  it('pushes overlapping tasks into subsequent rings', () => {
    const tasks = [
      { startFrac: 0, endFrac: 0.5 },
      { startFrac: 0.1, endFrac: 0.4 },
    ];
    const result = assignRings(tasks);
    expect(result[0].ring).toBe(0);
    expect(result[1].ring).toBe(1);
  });

  it('overflows tasks beyond the ring limit into the last ring', () => {
    const tasks = Array.from({ length: 6 }, () => ({ startFrac: 0, endFrac: 1 }));
    const result = assignRings(tasks);
    expect(result.map(t => t.ring)).toEqual([0, 1, 2, 3, 3, 3]);
  });
});

describe('processTasks', () => {
  it('normalises month-based tasks and computes fractional positions', () => {
    const modules = {
      '../tasks/example.md': makeModule({
        title: 'Example task',
        category: 'Finance',
        start_month: 3,
        end_month: 5,
      }),
    };
    const [task] = processTasks(modules);
    expect(task.id).toBe('example');
    expect(task.title).toBe('Example task');
    expect(task.unit).toBe('month');
    expect(task.startFrac).toBeCloseTo((3 - 1) / 12);
    expect(task.endFrac).toBeCloseTo(5 / 12);
    expect(task.displayColor).toBe('#E74C3C');
  });

  it('switches to week precision when start_week is present', () => {
    const modules = {
      '../tasks/weekly-example.md': makeModule({
        title: 'Weekly example',
        start_week: 10,
        end_week: 12,
      }),
    };
    const [task] = processTasks(modules);
    expect(task.unit).toBe('week');
    expect(task.startFrac).toBeCloseTo((10 - 1) / 52);
    expect(task.endFrac).toBeCloseTo(12 / 52);
  });

  it('expands repeating tasks into additional instances', () => {
    const modules = {
      '../tasks/quarterly-example.md': makeModule({
        title: 'Quarterly example',
        start_month: 1,
        end_month: 1,
        repeat: 'quarterly',
      }),
    };
    const tasks = processTasks(modules);
    expect(tasks.map(t => t.id)).toEqual([
      'quarterly-example',
      'quarterly-example--r2',
      'quarterly-example--r3',
      'quarterly-example--r4',
    ]);
    expect(tasks[1].start_month).toBe(4);
    expect(tasks[2].start_month).toBe(7);
    expect(tasks[3].start_month).toBe(10);
  });

  it('defaults missing fields sensibly', () => {
    const modules = {
      '../tasks/bare.md': makeModule({}),
    };
    const [task] = processTasks(modules);
    expect(task.title).toBe('bare');
    expect(task.category).toBe('Other');
    expect(task.priority).toBe('medium');
    expect(task.tags).toEqual([]);
    expect(task.start_month).toBe(1);
    expect(task.end_month).toBe(1);
  });
});
