import js from '@eslint/js';
import globals from 'globals';

// Flat config. Two file groups: browser/React source (src/**, *.jsx) and
// Node tooling (config files, notify.js). Kept intentionally light — this is
// a small project; the rules that matter are "no undefined vars" and
// "no unused vars" so the loop's automated lint gate catches real mistakes.
export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'annual-cycle-src/**',
      '**/*.html',
      '.github/actions/**/dist/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, __IFRAME_LINK_TARGET__: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Node-context files: CommonJS notify script, build/config scripts, tests.
    files: [
      'src/notify.js',
      'src/notify.test.js',
      'src/build.js',
      '*.config.js',
      'scripts/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // notify.js is CommonJS (require/module.exports).
    files: ['src/notify.js', 'src/notify.test.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    // Hand-written sources for the bundled (ncc) JS GitHub Actions. CommonJS,
    // run standalone by Node under actions/runner — not part of the Vite app.
    files: ['.github/actions/**/action-src/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
];
