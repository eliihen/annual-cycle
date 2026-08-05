import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TaskCard from './TaskCard.jsx';
import { processTasks } from '../utils/tasks.js';

function task({ html = '<p>Agenda inside</p>', ...frontmatterOverrides } = {}) {
  const [t] = processTasks({
    './content/tasks/board.md': {
      default: {
        frontmatter: {
          title: 'Board meeting',
          category: 'management',
          responsible: 'Ops',
          tags: ['governance'],
          start_month: 3,
          end_month: 4,
          ...frontmatterOverrides,
        },
        html,
      },
    },
  });
  return t;
}

const render = (props) => renderToStaticMarkup(<TaskCard {...props} />);

describe('TaskCard', () => {
  it('renders the title, category chip, and responsible chip when closed', () => {
    const markup = render({ task: task(), active: false, open: false, onActivate: () => {} });
    expect(markup).toContain('Board meeting');
    expect(markup).toContain('management');
    expect(markup).toContain('Ops');
    expect(markup).toContain('governance');
  });

  it('does not render body content while closed, even if a description exists', () => {
    const markup = render({ task: task(), active: false, open: false, onActivate: () => {} });
    expect(markup).not.toContain('Agenda inside');
  });

  it('renders the html description when open', () => {
    const markup = render({ task: task(), active: false, open: true, onActivate: () => {} });
    expect(markup).toContain('Agenda inside');
  });

  it('falls back to a placeholder when open with no description at all', () => {
    const t = task({ html: '' });
    const markup = render({ task: t, active: false, open: true, onActivate: () => {} });
    expect(markup).toContain('No description');
  });

  it('prefers a Body component over html when both are present', () => {
    // processTasks attaches Body when the source module has no HTML string to
    // give (e.g. MDX/Docusaurus compiles bodies to components) — see
    // src/utils/tasks.js readModule(). TaskCard must render that component
    // rather than falling back to dangerouslySetInnerHTML.
    function Description() {
      return <p>Rendered from a component, not a string</p>;
    }
    const [t] = processTasks({
      board: {
        frontMatter: { title: 'Board meeting', category: 'management', start_month: 3, end_month: 4 },
        default: Description,
      },
    });
    expect(t.Body).toBe(Description);

    const markup = render({ task: t, active: false, open: true, onActivate: () => {} });
    expect(markup).toContain('Rendered from a component, not a string');
    expect(markup).not.toContain('No description');
  });
});
