import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { markdownPlugin } from './src/lib/vitePlugin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Consumers set BASE_PATH=/<repo-name>/ via the reusable workflow; falls back to
// the default path for this repo's own deployment.
const base = process.env.BASE_PATH || '/annual-cycle/';

export default defineConfig({
  base,
  plugins: [react(), markdownPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  define: {
    // Baked in at build time. Override with: IFRAME_LINK_TARGET=https://… npm run build
    __IFRAME_LINK_TARGET__: JSON.stringify(process.env.IFRAME_LINK_TARGET ?? ''),
  },
});
