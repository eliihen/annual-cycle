import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { markdownPlugin } from './src/lib/vitePlugin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// After the bundle is written, read dist/iframe.html, replace every external
// <link stylesheet> and <script src> with inline <style> / <script> tags, then
// delete the now-redundant asset files.  Because this is a single-entry build
// with no shared chunks the entry JS contains no external imports, so the
// resulting HTML file has zero external dependencies.
function inlineIframePlugin() {
  return {
    name: 'inline-iframe',
    apply: 'build',
    closeBundle() {
      const htmlPath = resolve(__dirname, 'dist', 'iframe.html');
      if (!existsSync(htmlPath)) return;

      let html = readFileSync(htmlPath, 'utf-8');
      const inlined = [];

      const assetFile = (href) =>
        resolve(__dirname, 'dist', href.replace(/^\.\//, ''));

      // Drop modulepreload hints — nothing to preload once everything is inline
      html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>\s*/g, '');

      // Inline CSS
      html = html.replace(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*\/?>/g,
        (match, href) => {
          const file = assetFile(href);
          if (!existsSync(file)) return match;
          inlined.push(file);
          return `<style>${readFileSync(file, 'utf-8')}</style>`;
        },
      );

      // Inline JS
      html = html.replace(
        /<script([^>]+)src="([^"]+)"([^>]*)><\/script>/g,
        (match, pre, src, post) => {
          const file = assetFile(src);
          if (!existsSync(file)) return match;
          inlined.push(file);
          // Keep type="module" if present; strip src/crossorigin attrs
          const hasModule = (pre + post).includes('module');
          const type = hasModule ? ' type="module"' : '';
          return `<script${type}>${readFileSync(file, 'utf-8')}</script>`;
        },
      );

      writeFileSync(htmlPath, html);

      // Remove asset files that are now embedded in the HTML
      for (const f of inlined) {
        try { unlinkSync(f); } catch { /* ignore */ }
      }
    },
  };
}

export default defineConfig({
  // base './' produces relative asset paths so the inlined file works at any URL
  base: './',
  plugins: [react(), markdownPlugin(), inlineIframePlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // preserve the main build output written by the first pass
    rollupOptions: {
      input: {
        iframe: resolve(__dirname, 'iframe.html'),
      },
    },
  },
  define: {
    __IFRAME_LINK_TARGET__: JSON.stringify(process.env.IFRAME_LINK_TARGET ?? ''),
  },
});
