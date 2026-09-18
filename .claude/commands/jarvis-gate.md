---
description: Re-run the Jarvis gates for one phase without redoing the work — script validation plus the gatekeeper agent.
argument-hint: <work item ID> <phase>
allowed-tools: Read, Glob, Grep, Task, Bash(node .jarvis/scripts/jarvis.js:*)
model: inherit
---

Work item: $1
Phase: $2

Re-run both gates against the artifacts that already exist. Do not rewrite an artifact yourself and do not
re-run the phase.

1. **Script gate:** `node .jarvis/scripts/jarvis.js validate $1 $2 --json`.
2. **Agent gate:** invoke `jarvis-gatekeeper` with the phase artifacts, the phase checklist and the
   upstream artifacts. It returns a JSON verdict.
3. Both pass → `node .jarvis/scripts/jarvis.js set $1 $2 passed`. If the phase needs human approval, print
   `! npm run -s jarvis -- approve $1 $2` and stop.
4. Either fails → report every issue with its checklist item ID and the evidence, then stop. Say plainly
   which agent must fix what; the user decides whether to re-run the phase with `/jarvis-run $1 $2`.
5. Never call `set ... passed` when an issue is open, and never use `force` — that is the user's command.

Use this after a manual fix, or to confirm a phase still passes after an upstream artifact changed.
