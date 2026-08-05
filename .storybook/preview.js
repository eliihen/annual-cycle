// The wheel is inline SVG with no CSS of its own; the app stylesheet carries
// the .wheel-container / .task-arc / .zoom-* rules it expects.
import '../src/index.css';

/** @type {import('@storybook/react-vite').Preview} */
export default {
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i } },
  },
};
