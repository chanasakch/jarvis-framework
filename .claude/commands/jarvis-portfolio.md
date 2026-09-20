---
description: Cross-work-item portfolio view — roadmap status, dependencies, risks and file conflicts across every active Jarvis work item.
argument-hint: (no arguments)
allowed-tools: Read, Glob, Grep, Bash(node .jarvis/scripts/jarvis.js:*)
model: inherit
---

!`node .jarvis/scripts/jarvis.js portfolio --json 2>/dev/null || echo '{"items":[],"attention":[],"counts":{"total":0}}'`

Present the portfolio above as a short PM report. Every number comes from the JSON — never estimate,
never infer a status the CLI did not report, and never run phase work from this command.

- **Now:** one line per active item — ID, title, type, current phase and status, age in days.
  Order by what is closest to release, not by ID.
- **Waiting:** every item with a non-empty `blocked_by`, naming what it waits on and that item's phase.
- **Needs attention:** the `attention` list verbatim, grouped as dependency, forced gate, blocked,
  stale (`idle_days` ≥ 14), and file conflict. For a file conflict name both items and the file, and
  say which one is further along — that one should land first.
- **Risk and questions:** items whose `risks` or `open_questions` are non-empty, with the counts.
  Point at the artifact that holds them rather than restating them.
- **Parked:** ID and the recorded reason.

Close with the single most useful next action across the whole portfolio, and the command that does
it. If `counts.active` is 0, say so in one line and stop.

To record a dependency the user describes: `node .jarvis/scripts/jarvis.js link <ID> --depends-on <ID>`
(add `--remove` to drop one). The CLI rejects a link that would create a cycle.
