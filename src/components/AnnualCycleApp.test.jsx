import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AnnualCycleApp from './AnnualCycleApp.jsx';
import { processTasks } from '../utils/tasks.js';

// AnnualCycleApp is exported from the npm library, so — like Wheel — it has to
// survive renderToStaticMarkup for server-rendered consumers.
const modules = {
  './content/tasks/board.md': {
    default: {
      frontmatter: { title: 'Board meeting', category: 'management', responsible: 'Ops', start_month: 3, end_month: 4 },
      html: '<p>agenda</p>',
    },
  },
  './content/tasks/audit.md': {
    default: {
      frontmatter: { title: 'Security audit', category: 'compliance', start_week: 12, end_week: 16 },
      html: '<p>pentest</p>',
    },
  },
};

describe('AnnualCycleApp server rendering', () => {
  const tasks = processTasks(modules);
  const markup = renderToStaticMarkup(<AnnualCycleApp tasks={tasks} initialYear={2026} />);

  it('renders without throwing', () => {
    expect(() => renderToStaticMarkup(<AnnualCycleApp tasks={tasks} initialYear={2026} />)).not.toThrow();
  });

  it('renders the wheel', () => {
    expect(markup).toContain('<svg');
  });

  it('lists every task in the sidebar', () => {
    expect(markup).toContain('Board meeting');
    expect(markup).toContain('Security audit');
  });

  it('renders the category legend', () => {
    expect(markup).toContain('management');
    expect(markup).toContain('compliance');
  });

  it('shows the task count', () => {
    expect(markup).toContain('2 tasks');
  });

  it('defaults initialYear to the current year when omitted', () => {
    const withoutYear = renderToStaticMarkup(<AnnualCycleApp tasks={tasks} />);
    expect(withoutYear).toContain(String(new Date().getFullYear()));
  });
});

describe('AnnualCycleApp with no tasks', () => {
  it('renders the empty state instead of crashing', () => {
    const markup = renderToStaticMarkup(<AnnualCycleApp tasks={[]} initialYear={2026} />);
    expect(markup).toContain('No tasks yet');
  });
});
