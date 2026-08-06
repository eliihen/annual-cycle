import { useState } from 'react';
import Wheel from './Wheel.jsx';
import { processTasks } from '../utils/tasks.js';

// This repo's own tasks/*.md, transformed by the same Markdown plugin the app
// and the published library use (wired up in .storybook/main.js).
const realTasks = processTasks(import.meta.glob('../../tasks/*.md', { eager: true }));

// Build a module map the way a bundler would, so stories can describe tasks
// inline without needing Markdown files on disk.
const fromFrontmatter = (entries) =>
  processTasks(
    Object.fromEntries(
      entries.map((fm) => [
        `./tasks/${fm.title.toLowerCase().replace(/\W+/g, '-')}.md`,
        { default: { frontmatter: fm, html: `<p>${fm.title}</p>` } },
      ]),
    ),
  );

// Wheel is controlled: it renders `activeId` and calls `onTaskClick`, so the
// story owns that state to make arcs actually selectable in the canvas.
function WheelHarness({ tasks, year, onTaskClick }) {
  const [activeId, setActiveId] = useState(null);
  return (
    <Wheel
      tasks={tasks}
      year={year}
      activeId={activeId}
      onTaskClick={(id) => {
        setActiveId((cur) => (cur === id ? null : id));
        onTaskClick?.(id);
      }}
    />
  );
}

export default {
  title: 'Wheel',
  component: Wheel,
  render: (args) => <WheelHarness {...args} />,
  args: { year: new Date().getFullYear() },
  argTypes: {
    year: { control: { type: 'number', min: 2000, max: 2100, step: 1 } },
    tasks: { control: false },
    activeId: { control: false, table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The annual-cycle wheel. Takes an array of tasks already run through ' +
          '`processTasks`, which computes fractional positions, expands repeats, ' +
          'assigns rings and resolves colors.',
      },
    },
  },
};

/** The repo's real `tasks/*.md`, i.e. what the deployed demo renders. */
export const Default = {
  args: { tasks: realTasks },
};

/** Month precision — the default when a task omits `start_week`. */
export const MonthPrecision = {
  args: {
    tasks: fromFrontmatter([
      { title: 'Annual Budget', category: 'finance', start_month: 10, end_month: 12 },
      { title: 'Strategy Kickoff', category: 'strategy', start_month: 1, end_month: 2 },
      { title: 'Performance Reviews', category: 'hr', start_month: 5, end_month: 6 },
    ]),
  },
};

/** Week precision — `start_week`/`end_week` place arcs on the 52-week scale. */
export const WeekPrecision = {
  args: {
    tasks: fromFrontmatter([
      { title: 'Security Review', category: 'it', start_week: 12, end_week: 16 },
      { title: 'Summer Leave Planning', category: 'hr', start_week: 18, end_week: 22 },
      { title: 'External Audit', category: 'compliance', start_week: 40, end_week: 43 },
    ]),
  },
};

/** `repeat` expands one task into several instances (ids suffixed `--r2`, `--r3`, …). */
export const RepeatingTasks = {
  args: {
    tasks: fromFrontmatter([
      { title: 'Monthly Demo', category: 'communication', start_week: 3, end_week: 3, repeat: 'monthly' },
      { title: 'Quarterly Board Meeting', category: 'management', start_month: 1, end_month: 1, repeat: 'quarterly' },
    ]),
  },
};

/** Overlapping ranges are pushed onto separate concentric rings automatically. */
export const OverlappingRings = {
  args: {
    tasks: fromFrontmatter(
      Array.from({ length: 6 }, (_, i) => ({
        title: `Overlapping Task ${i + 1}`,
        category: ['finance', 'hr', 'strategy', 'it', 'sales', 'legal'][i],
        start_month: 2,
        end_month: 8,
      })),
    ),
  },
};

/** Colors come from the category table, or a `color` hex override per task. */
export const ColorOverrides = {
  args: {
    tasks: fromFrontmatter([
      { title: 'Known Category', category: 'marketing', start_month: 1, end_month: 3 },
      { title: 'Unknown Category', category: 'ThisIsNotInTheTable', start_month: 4, end_month: 6 },
      { title: 'Explicit Override', category: 'finance', color: '#00B3A4', start_month: 7, end_month: 9 },
    ]),
  },
};

/** No tasks — the wheel still renders its month/week scaffolding. */
export const Empty = {
  args: { tasks: [] },
};

/**
 * No `onTaskClick`. The prop is optional: the wheel becomes a read-only chart,
 * arcs are inert and carry no pointer cursor. Rendered without the stateful
 * harness so the component really does receive no handler.
 */
export const NonInteractive = {
  render: (args) => <Wheel {...args} />,
  args: { tasks: realTasks },
};
