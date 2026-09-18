---
description: Show Jarvis work item status — current phase, gate results, warnings, forced gates and what is needed next.
argument-hint: [work item ID]
allowed-tools: Read, Glob, Grep, Bash(node .jarvis/scripts/jarvis.js:*)
model: inherit
---

!`node .jarvis/scripts/jarvis.js status $ARGUMENTS 2>/dev/null || node .jarvis/scripts/jarvis.js status 2>/dev/null || echo "jarvis: no state found"`

Present the status above as a short report. Do not run any phase work.

- One block per active work item: ID, title, type, current phase and its status, attempts.
- Forced gates: phase, who forced it, the reason, the unresolved IDs and the follow-up item.
- Warnings, verbatim.
- For each item, one line on what unblocks it: the approval command, the next phase, or the open question.

If the user passed an ID, cover that item only. If a phase is `gate_failed` at `max_retries`, print the
Gate Failure Menu from `.jarvis/core/rules/orchestration.md` §5.1 with the recorded issues.
