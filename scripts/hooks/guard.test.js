import { describe, it, expect } from 'vitest';
import { evaluate, isForcePush, rmTargetsOutsideSafe } from './guard.js';

const bash = command => ({ tool_name: 'Bash', tool_input: { command } });
const edit = file_path => ({ tool_name: 'Edit', tool_input: { file_path } });
const noEnv = {};

describe('force-push detection', () => {
  it('blocks git push --force', () => {
    expect(isForcePush('git push --force origin main')).toBe(true);
    expect(evaluate(bash('git push --force origin main'), noEnv).block).toBe(true);
  });
  it('blocks git push -f', () => {
    expect(isForcePush('git push -f')).toBe(true);
  });
  it('allows --force-with-lease', () => {
    expect(isForcePush('git push --force-with-lease')).toBe(false);
    expect(evaluate(bash('git push --force-with-lease'), noEnv).block).toBe(false);
  });
  it('allows a normal push', () => {
    expect(evaluate(bash('git push origin loop/foo'), noEnv).block).toBe(false);
  });
});

describe('rm -rf containment', () => {
  it('blocks rm -rf on an absolute path outside safe dirs', () => {
    expect(rmTargetsOutsideSafe('rm -rf /Users/eline/workspace/eline/annual-cycle/src')).toBeTruthy();
    expect(evaluate(bash('rm -rf /etc/passwd'), noEnv).block).toBe(true);
  });
  it('blocks rm -rf on repo-root-ish targets', () => {
    expect(evaluate(bash('rm -rf .'), noEnv).block).toBe(true);
    expect(evaluate(bash('rm -rf ..'), noEnv).block).toBe(true);
    expect(evaluate(bash('rm -rf ~'), noEnv).block).toBe(true);
  });
  it('allows rm -rf inside a worktree / build dir', () => {
    expect(evaluate(bash('rm -rf .worktrees/loop-foo'), noEnv).block).toBe(false);
    expect(evaluate(bash('rm -rf dist'), noEnv).block).toBe(false);
    expect(evaluate(bash('rm -rf node_modules/.cache'), noEnv).block).toBe(false);
  });
  it('ignores rm without -rf', () => {
    expect(evaluate(bash('rm src/tmp.js'), noEnv).block).toBe(false);
  });
});

describe('composite-action API protection', () => {
  it('blocks Edit of an action.yml by default', () => {
    const r = evaluate(edit('.github/actions/build/action.yml'), noEnv);
    expect(r.block).toBe(true);
  });
  it('allows the edit when explicitly authorized via env', () => {
    const r = evaluate(edit('.github/actions/build/action.yml'), { LOOP_ALLOW_ACTION_EDITS: '1' });
    expect(r.block).toBe(false);
  });
  it('allows editing normal source files', () => {
    expect(evaluate(edit('src/App.jsx'), noEnv).block).toBe(false);
  });
  it('blocks a shell redirect that rewrites an action.yml', () => {
    expect(evaluate(bash('echo x >> .github/actions/build/action.yml'), noEnv).block).toBe(true);
  });
  it('blocks sed -i on an action.yml', () => {
    expect(evaluate(bash("sed -i 's/a/b/' .github/actions/deploy/action.yml"), noEnv).block).toBe(true);
  });
  it('allows reading an action.yml (cat/grep)', () => {
    expect(evaluate(bash('cat .github/actions/build/action.yml'), noEnv).block).toBe(false);
    expect(evaluate(bash('grep name .github/actions/build/action.yml'), noEnv).block).toBe(false);
  });
});
