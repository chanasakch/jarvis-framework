---
description: Jarvis orchestrator. Start or continue any work item — routes each phase to the right specialist agent, runs the gates, and stops for human approval.
argument-hint: <request text | work item ID | empty to resume>
allowed-tools: Read, Write, Glob, Grep, Task, Bash(node .jarvis/scripts/jarvis.js:*), Bash(git diff:*), Bash(git log:*), Bash(git status:*)
model: inherit
---

Current status:
!`node .jarvis/scripts/jarvis.js status --brief 2>/dev/null || echo "jarvis: status unavailable (run /{{name}}-init)"`

Input: $ARGUMENTS

## What to do

Follow `.jarvis/core/rules/orchestration.md` exactly. **Read that file in full now** — it is the protocol,
and this command is only a launcher. Also read `jarvis.config.yaml` and `.jarvis/core/rules/conventions.md`.

Resolve the input: request text → new work item (intake); a work item ID → resume it; empty → resume the
most recently active item, or ask what to build if there is none.

## Hard rules (never violated, repeated here so they are never missed)

1. Never do phase work yourself. Intake is the only exception.
2. Never edit `.jarvis/state/**`. The CLI owns it.
3. Never run `approve`, `force`, `skip`, `reopen`, `park` or `unpark`. `guard.js` blocks them.
   Print the command and ask the user to run it: `! npm run -s {{name}} -- approve <ID> <phase>`.
4. Never paste artifact contents into a Handoff Brief — file paths only.
5. Never skip `requires`, a gate or an approval, even when asked to "just continue".
6. Summarize each agent result in ≤ 5 lines.
7. Every delegation uses the Handoff Brief format from orchestration.md §3.1, built from
   `jarvis.js next <ID> --json` — do not invent inputs, standards or templates.

## Two things that are easy to get wrong

- **review:** invoke every reviewer in `review.reviewers` **in parallel — multiple Task calls in a single
  message**, never one after another. Then run `jarvis.js merge-review <ID>`.
- **implement:** **one task per subagent call**, in `depends_on` order, routed by the task's `layer`.
  After each task: `jarvis.js check <layer>`, `jarvis.js lint --changed`, `jarvis.js task <ID> <T-xxx> done`.
  Gate the phase only once every task is done.

## End of turn

End every turn with the Status Report from orchestration.md §4:

```
── JARVIS ─────────────────────────────
Item:   <ID> <title> (<type>)
Phase:  <phase> → <status> (attempt N) <✅|❌|⏳>
Waiting: <nothing | human approval | answer to Q-00x>
Next:   <the exact command or the next phase>
Warnings: <none | forced gates, parked items>
───────────────────────────────────────
```
