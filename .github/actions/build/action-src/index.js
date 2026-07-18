'use strict';
const path = require('path');
const fs = require('fs');
const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
  const actionPath = process.env.GITHUB_ACTION_PATH;            // .../.github/actions/build
  const srcRoot = path.resolve(actionPath, '..', '..', '..');   // annual-cycle repo root (auto-checked-out for `uses:`)
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();

  const tasksPath = core.getInput('tasks_path') || 'tasks';
  const repoName = (process.env.GITHUB_REPOSITORY || '/').split('/')[1] || '';
  const owner = process.env.GITHUB_REPOSITORY_OWNER || (process.env.GITHUB_REPOSITORY || '/').split('/')[0] || '';
  const basePath = core.getInput('base_path') || `/${repoName}/`;
  const siteUrl = core.getInput('site_url') || `https://${owner}.github.io/${repoName}/`;

  // Replace annual-cycle's demo tasks with the caller's tasks.
  const tasksDest = path.join(srcRoot, 'tasks');
  fs.rmSync(tasksDest, { recursive: true, force: true });
  fs.cpSync(path.resolve(workspace, tasksPath), tasksDest, { recursive: true });

  await exec.exec('npm', ['ci'], { cwd: srcRoot });
  await exec.exec('npm', ['run', 'build'], {
    cwd: srcRoot,
    env: { ...process.env, BASE_PATH: basePath, IFRAME_LINK_TARGET: siteUrl },
  });

  // Preserve the prior output contract: workspace-relative path to the built site.
  const outDir = path.join(workspace, 'annual-cycle-src', 'dist');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.cpSync(path.join(srcRoot, 'dist'), outDir, { recursive: true });
  core.setOutput('dist_path', 'annual-cycle-src/dist');
}

run().catch(err => core.setFailed(err.message));
