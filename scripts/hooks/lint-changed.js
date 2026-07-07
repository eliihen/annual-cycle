'use strict';

// PostToolUse hook for Edit/Write: lint the file that was just changed.
// Reads the hook JSON from stdin, runs `eslint` on the changed file if it is a
// lintable source file. Non-blocking by design: it reports lint problems back to
// the agent (exit 2 surfaces stderr as feedback) but only for real ESLint
// *errors*, so pre-existing style warnings don't stop the loop.

const { execFileSync } = require('child_process');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { raw += c; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch { process.exit(0); }

  const fp = (input.tool_input && (input.tool_input.file_path || input.tool_input.notebook_path)) || '';
  if (!/\.(js|jsx)$/.test(fp)) process.exit(0);      // only JS/JSX
  if (/\/(dist|coverage|node_modules|annual-cycle-src)\//.test(fp)) process.exit(0);

  try {
    // --quiet → report errors only (warnings are allowed by project policy).
    execFileSync('npx', ['eslint', '--quiet', fp], { stdio: 'pipe' });
    process.exit(0);
  } catch (err) {
    const out = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
    process.stderr.write(`ESLint found errors in ${fp}:\n${out}\n`);
    process.exit(2); // surface to the agent so it fixes before continuing
  }
});
