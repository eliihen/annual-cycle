'use strict';
const path = require('path');
const core = require('@actions/core');
const { main } = require('../../../../src/notify.js');

process.env.SLACK_WEBHOOK_URL = core.getInput('slack_webhook_url');
const period = core.getInput('period');
if (period) process.env.NOTIFY_PERIOD = period;
const tasksPath = core.getInput('tasks_path') || 'tasks';
process.env.TASKS_DIR = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd(), tasksPath);

main().catch(err => core.setFailed(err.message));
