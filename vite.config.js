import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import matter from 'gray-matter';
import { marked } from 'marked';

function markdownPlugin() {
  return {
    name: 'markdown-tasks',
    transform(src, id) {
      if (!id.endsWith('.md')) return null;
      const { data, content } = matter(src);
      return `export default ${JSON.stringify({ frontmatter: data, html: marked(content) })}`;
    },
  };
}

export default defineConfig({
  plugins: [react(), markdownPlugin()],
  build: { outDir: 'dist' },
});
