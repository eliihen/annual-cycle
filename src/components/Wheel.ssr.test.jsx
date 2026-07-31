import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Wheel from './Wheel.jsx';
import { processTasks } from '../utils/tasks.js';

// Wheel is shipped as part of the npm library and is rendered by server-side
// consumers (Docusaurus, Next.js, …), so it has to survive renderToStaticMarkup
// and produce markup that matches what the client renders on hydration.
const modules = {
  './content/tasks/board.md': {
    default: {
      frontmatter: { title: 'Board meeting', category: 'management', start_month: 3, end_month: 4 },
      html: '<p>agenda</p>',
    },
  },
};

describe('Wheel server rendering', () => {
  const markup = renderToStaticMarkup(
    <Wheel tasks={processTasks(modules)} activeId={null} onTaskClick={() => {}} year={2026} />,
  );

  it('renders the wheel without throwing', () => {
    expect(markup).toContain('<svg');
    expect(markup).toContain('Board meeting');
  });

  it('renders arc tooltip <title> content on the server', () => {
    // React 19 drops <title> children given as adjacent JSX nodes rather than a
    // single string, emitting an empty <title></title> on the server while the
    // client renders it populated — a hydration mismatch (React error #418).
    expect(markup).not.toContain('<title></title>');
    expect(markup).toMatch(/<title>Board meeting \([^<]+\)<\/title>/);
  });
});
