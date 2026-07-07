---
name: triage
description: >
  Discovery playbook for the autonomous loop. Use at the start of a loop run to
  find new work: check CI runs since the last LOOP_STATE.md entry, list open
  issues and PRs, scan recent commits for TODO/FIXME, and check npm outdated for
  minor/patch drift. Appends deduplicated, tagged findings to the Backlog in
  LOOP_STATE.md. Use whenever asked to "triage", "find work", or "discover tasks".
---

# triage — discover work, write it to the backlog

Goal: turn the current state of the repo + GitHub into deduplicated backlog
entries in `LOOP_STATE.md`. **Read `LOOP_STATE.md` first** — never file a
duplicate of anything already in `Done`, `In progress`, or `Backlog`.

## Steps

1. **Read `LOOP_STATE.md`.** Note the date of the most recent entry; that's your
   "since" watermark. Build a set of things already tracked.

2. **CI health** — runs since the watermark:
   ```bash
   gh run list --limit 15
   ```
   A failed run on `main` → `[needs-human]` (unless obviously auto-fixable, e.g.
   a lint error the linter can fix).

3. **Open issues and PRs:**
   ```bash
   gh issue list --state open --limit 30
   gh pr list --state open --limit 30
   ```
   Existing issues/PRs are already "tracked" — reference them, don't duplicate.

4. **TODO/FIXME in recent commits / code:**
   ```bash
   git log --since="<watermark>" --oneline
   grep -rnE "TODO|FIXME|XXX|HACK" src/ tasks/ scripts/ --include=*.js --include=*.jsx --include=*.md
   ```

5. **Dependency drift (minor/patch only):**
   ```bash
   npm outdated || true
   ```
   Only minor/patch bumps are `auto-fixable`. Major bumps → `[needs-human]`.

6. **Tooling gates still green?** Quick sanity:
   ```bash
   npm test && npm run lint
   ```
   A newly-broken gate is a finding.

## Output — append to `## Backlog` in `LOOP_STATE.md`

One line per finding, in the file's format:
`- YYYY-MM-DD — <description> — [auto-fixable|needs-human] — <notes>`

Rules:
- **Dedupe.** If it's already in the file (by issue #, PR #, or description),
  skip it. When unsure, skip and note it under an existing entry.
- Tag `auto-fixable` only if a single small diff + passing gates can close it
  and it does **not** touch `.github/actions/*/action.yml`. Everything ambiguous,
  security-sensitive, or interface-touching → `needs-human`.
- Keep descriptions boring and specific ("bump vite 8.0.16→8.0.18", not
  "update deps").

Then stop. triage does not implement — the explorer/implementer/verifier chain
and the `ship` skill do that.
