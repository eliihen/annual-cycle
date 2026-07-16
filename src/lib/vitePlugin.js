import matter from 'gray-matter';
import { marked } from 'marked';

export function markdownPlugin() {
  return {
    name: 'markdown-tasks',
    transform(src, id) {
      if (!id.endsWith('.md')) return null;
      const { data, content } = matter(src);
      return `export default ${JSON.stringify({ frontmatter: data, html: marked(content) })}`;
    },
  };
}
