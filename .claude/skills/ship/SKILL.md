---
name: ship
description: >
  Delivery playbook for the autonomous loop. Use once the verifier agent has
  returned VERDICT: APPROVE for a backlog item, to branch, commit, and open a
  pull request. Covers branch naming (loop/<slug>), commit message format, the
  required PR body sections, and the rule that no PR is opened before an APPROVE.
  Use whenever asked to "ship", "open a PR", or "deliver" a finished item.
---

# ship — turn an approved diff into a PR

**Precondition (hard rule): the `verifier` agent returned exactly
`VERDICT: APPROVE` for this item.** If the last verdict was `REJECT`, do not
ship — send it back to the implementer (max twice, then tag `needs-human` in
`LOOP_STATE.md`).

## 1. Branch
Name it `loop/<short-slug>` — kebab-case, derived from the item, e.g.
`loop/bump-vite`, `loop/rm-unused-import`. One branch per backlog item.
```bash
git checkout -b loop/<short-slug>
```
(The implementer works in an isolated worktree; ship from that branch.)

## 2. Commit
Small, focused commits. Message format:
```
<imperative summary, <=72 chars>

<why — the backlog item this closes and the verification evidence in one or
two lines>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```
Commit only files the item targets. Never commit `dist/`, `coverage/`, or
`.worktrees/`.

## 3. Open the PR
```bash
gh pr create --base main --head loop/<short-slug> \
  --title "<same imperative summary>" \
  --body "$(cat <<'EOF'
## What
<one-paragraph description of the change>

## Why
<the backlog item / issue this closes; link `Fixes #N` if it closes an issue>

## Verification evidence
- `npm test` — <result>
- `npm run lint` — <result>
- `npm run build` — <result, both index.html + iframe.html>
- Composite-action interfaces (`.github/actions/*/action.yml`): <unchanged | targeted-and-reviewed>
- Verifier verdict: APPROVE

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Required PR body sections: **What**, **Why**, **Verification evidence**. The
verification section must show the actual gate results the verifier ran — not
"should pass".

## 4. Record it
Append to `LOOP_STATE.md`: move the item from `In progress` to `Done` with the
PR link and outcome. This is required — the `Stop` hook enforces it.

## Guardrails
- No force-push (`git push --force`, `-f`, and `+refspec` are blocked by a
  PreToolUse hook), and pushing to any remote other than `origin` is blocked.
- **Never merge, and never enable auto-merge.** `VERDICT: APPROVE` authorizes
  *opening* a PR, not landing it. A human merge is the loop's real backstop
  against a verifier that was talked into approving — do not weaken it, and do
  not `gh pr merge` / `gh pr merge --auto` under any circumstances.
- One PR per item; keep them independently reviewable and revertable.
- If `gh pr create` fails (e.g. no remote), leave the branch pushed/local and
  record the blocker in `LOOP_STATE.md` under `In progress`.
