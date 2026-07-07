import { defineConfig } from 'vitest/config';

// Tests run in a Node environment: the tested modules (src/utils/tasks.js,
// src/notify.js) are pure logic with no DOM dependency. The React/SVG
// components are not unit-tested here — they are exercised by the build.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.{js,jsx}'],
  },
});
