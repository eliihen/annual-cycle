import { describe, it, expect } from 'vitest';
import { markdownPlugin } from './vitePlugin.js';

describe('markdownPlugin', () => {
  const plugin = markdownPlugin();

  it('ignores non-markdown files', () => {
    expect(plugin.transform('export const x = 1;', '/tasks/foo.js')).toBeNull();
  });

  it('transforms frontmatter + markdown into a default export module', () => {
    const src = '---\ntitle: Test task\nstart_month: 3\n---\n# Hello\n';
    const result = plugin.transform(src, '/tasks/foo.md');

    expect(result).toMatch(/^export default /);
    const parsed = JSON.parse(result.replace(/^export default /, ''));
    expect(parsed.frontmatter).toEqual({ title: 'Test task', start_month: 3 });
    expect(parsed.html).toContain('<h1>Hello</h1>');
  });
});
