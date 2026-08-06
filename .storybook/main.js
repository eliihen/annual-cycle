import { markdownPlugin } from '../src/lib/vitePlugin.js';

const MARKDOWN_PLUGIN = 'markdown-tasks';

/** @type {import('@storybook/react-vite').StorybookConfig} */
export default {
  stories: ['../src/**/*.stories.@(js|jsx)'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal(config) {
    // Storybook's Vite builder merges the project's vite.config.js, which
    // already registers markdownPlugin. Adding a second copy would run the
    // transform twice — the second pass parses the first pass's JS output as
    // Markdown and yields empty frontmatter — so only add it if it's missing.
    const plugins = (config.plugins ?? []).flat(Infinity);
    if (!plugins.some((p) => p && p.name === MARKDOWN_PLUGIN)) {
      config.plugins = [...(config.plugins ?? []), markdownPlugin()];
    }
    // Storybook serves from .storybook/, but tasks/ lives at the repo root.
    config.server = { ...config.server, fs: { ...config.server?.fs, allow: ['..'] } };
    return config;
  },
};
