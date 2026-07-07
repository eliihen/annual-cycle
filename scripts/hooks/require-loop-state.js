'use strict';

// Stop hook: refuse to let a run end if it changed files but did not update
// LOOP_STATE.md. The loop's memory must never silently drift from what the run
// actually did. Exit 2 blocks the stop and feeds the reason back to the agent.

const { execSync } = require('child_process');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', c => { raw += c; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch { process.exit(0); }

  // Avoid an infinite loop: if we already blocked once this stop, let it end.
  if (input.stop_hook_active) process.exit(0);

  let porcelain = '';
  try {
    // NUL-delimited (`-z`) so paths with spaces and renames (`R old\0new`) parse
    // correctly instead of being mangled by a naive line/space split.
    porcelain = execSync('git status --porcelain=v1 -z', { encoding: 'utf8' });
  } catch {
    process.exit(0); // not a git repo / git unavailable — don't block
  }

  // With -z, records are NUL-separated. Each record is "XY <path>"; a rename adds
  // a second NUL-separated field (the origin path) which we can ignore here —
  // what matters is which paths changed, and both halves are captured as fields.
  const fields = porcelain.split('\0').filter(Boolean);
  const changed = [];
  for (let i = 0; i < fields.length; i++) {
    const rec = fields[i];
    const status = rec.slice(0, 2);
    changed.push(rec.slice(3)); // path (no trim — paths may legitimately have spaces)
    if (/R|C/.test(status)) i++; // rename/copy: the next field is the origin path; skip it
  }

  if (changed.length === 0) process.exit(0); // nothing changed — fine to stop

  const stateTouched = changed.some(f => f === 'LOOP_STATE.md' || f.endsWith('/LOOP_STATE.md'));
  if (stateTouched) process.exit(0);

  process.stderr.write(
    'This run changed files but LOOP_STATE.md was not updated. ' +
    'Append a Done / In progress / Backlog entry describing what happened, then stop. ' +
    `Changed: ${changed.slice(0, 10).join(', ')}${changed.length > 10 ? ' …' : ''}\n`
  );
  process.exit(2);
});
