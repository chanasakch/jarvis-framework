---
description: Run exactly one Jarvis phase for a work item, with all requires and gates still enforced.
argument-hint: <work item ID> <phase>
allowed-tools: Read, Write, Glob, Grep, Task, Bash(node .jarvis/scripts/jarvis.js:*), Bash(git diff:*), Bash(git log:*)
model: inherit
---

Work item: $1
Phase: $2

Run one phase and then stop. This is the normal orchestration loop limited to a single phase — it does
not bypass anything.

1. `node .jarvis/scripts/jarvis.js next $1 --json`.
2. If the returned phase is not `$2`, the requested phase is not next. Print why (which `requires` are
   unmet, or which approval is pending) and stop. Do not reorder the workflow.
   To redo an earlier phase the user runs: `! npm run -s {{name}} -- reopen $1 $2`.
3. Otherwise follow `.jarvis/core/rules/orchestration.md` §3 for this phase only: `set in_progress`,
   delegate with a Handoff Brief built from the `next` output, then run the Gate Protocol (§5).
4. Do **not** continue to the following phase. End with the Status Report (§4).

The review phase still invokes every reviewer in parallel; the implement phase still runs one task per
subagent call.
