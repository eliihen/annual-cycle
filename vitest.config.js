import { defineConfig } from 'vitest/config';

// Tests run in a Node environment: the tested modules (src/utils/tasks.js,
// src/notify.js) are pure logic with no DOM dependency. Wheel.jsx is covered
// only by a server-rendering smoke test (react-dom/server needs no DOM) that
// guards the SSR contract the npm library promises its consumers; its
// interactive behaviour is still exercised by the build rather than unit tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.{js,jsx}'],
  },
});
