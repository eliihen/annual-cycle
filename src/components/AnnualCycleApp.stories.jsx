import AnnualCycleApp from './AnnualCycleApp.jsx';
import { processTasks } from '../utils/tasks.js';

// This repo's own tasks/*.md, transformed by the same Markdown plugin the app
// and the published library use (wired up in .storybook/main.js).
const realTasks = processTasks(import.meta.glob('../../tasks/*.md', { eager: true }));

export default {
  title: 'AnnualCycleApp',
  component: AnnualCycleApp,
  // AnnualCycleApp only reads `initialYear` once, into a useState lazy
  // initializer — plain re-rendering with a new prop value (what Storybook
  // does when a control changes) would silently do nothing. Keying on it
  // forces a remount, so the Controls panel behaves the way it looks like it
  // should.
  render: (args) => <AnnualCycleApp key={args.initialYear} {...args} />,
  args: { initialYear: new Date().getFullYear() },
  argTypes: {
    initialYear: { control: { type: 'number', min: 2000, max: 2100, step: 1 } },
    tasks: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The full annual-cycle app — `Wheel` plus the searchable/filterable ' +
          'sidebar, category legend, and year selector. Unlike `Wheel`, it owns ' +
          'all of its own UI state; `tasks` still needs to be pre-processed with ' +
          '`processTasks`.',
      },
    },
  },
};

/** The repo's real `tasks/*.md` — the exact widget deployed to GitHub Pages. */
export const Default = {
  args: { tasks: realTasks },
};

/** No tasks — the empty state renders instead of an empty wheel and sidebar. */
export const Empty = {
  args: { tasks: [] },
};

/**
 * A task whose description arrives as a component rather than an HTML string
 * — the shape `processTasks` produces for MDX/Docusaurus sources (see
 * `readModule()` in `src/utils/tasks.js`). Click the task's arc or card to
 * open it and confirm the component renders instead of the HTML fallback.
 */
export const MdxDescription = {
  args: {
    tasks: processTasks({
      boardMeeting: {
        frontMatter: { title: 'Board meeting prep', category: 'management', start_month: 3, end_month: 4 },
        default: function Description() {
          return (
            <>
              <p>Collect reports and circulate the agenda.</p>
              <ul>
                <li>Financials from Finance</li>
                <li>Roadmap update from Product</li>
              </ul>
            </>
          );
        },
      },
    }),
  },
};
