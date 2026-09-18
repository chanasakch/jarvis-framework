---
description: Explain why a Jarvis work item is blocked and exactly what is needed to move it forward.
argument-hint: <work item ID>
allowed-tools: Read, Glob, Grep, Bash(node .jarvis/scripts/jarvis.js:*)
model: inherit
---

Work item: $1

!`node .jarvis/scripts/jarvis.js status $1 --json 2>/dev/null || echo "{}"`
!`node .jarvis/scripts/jarvis.js next $1 --json 2>/dev/null || echo "{}"`

Explain the item's situation. Diagnose only — change nothing.

1. **Where it is:** the phase, its status, attempts used out of `gates.max_retries`.
2. **Why it stopped.** Name the exact cause:
   - `awaiting_approval` → a human must approve, print the command.
   - `blocked` with `missing` → those `requires` are not unlocked yet; say what each one needs.
   - `gate_failed` → read the recorded issues and, for each, name the checklist item and the artifact
     section that fails. Re-run `jarvis.js validate $1 <phase> --json` for current detail.
   - an optional phase skipped → which flag caused it.
   - parked → who parked it and why.
3. **Forced gates:** list them with their unresolved IDs and follow-up item, and say what risk each carries.
4. **What unblocks it**, as an ordered list of concrete next actions, marking which are the user's to run
   (`approve`, `force`, `skip`, `reopen`, `park`) and which Claude can do.
5. If the item is at `max_retries`, print the Gate Failure Menu from
   `.jarvis/core/rules/orchestration.md` §5.1 with the real issues.
