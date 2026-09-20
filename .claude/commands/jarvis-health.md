---
description: Run the cross-cutting codebase health review — architecture drift, tech debt, consistency across features over time. Not tied to a work item.
argument-hint: [full | delta | area <path>]
allowed-tools: Read, Glob, Grep, Bash(node .jarvis/scripts/jarvis.js:*), Task
model: inherit
---

!`node .jarvis/scripts/jarvis.js health --json 2>/dev/null || echo '{"reports":[],"stale":true}'`

Run the codebase health review by delegating to `jarvis-staff`. This is not a work item and has no
gate — do not run `jarvis new`, `set` or `validate` for it.

1. Read the JSON above: `reports` lists existing reports newest first, `stale` says whether the newest
   is older than `staff_review.max_age_days`.
2. Resolve the mode from `$ARGUMENTS`:
   - `full`, or no argument when there is no previous report → **full**.
   - no argument when a previous report exists → **delta** against `reports[0]`.
   - `area <path>` → **area**, scoped to that path.
3. Delegate to `jarvis-staff` with this brief, paths only:

```
HANDOFF
scope: repository (no work item)
phase: health | mode: full | delta | area
read:
  - .jarvis/project/context.md
  - docs/adr/
  - docs/architecture/tech-debt.md
  - <previous report path, delta mode only>
standards: [.jarvis/standards/]
template: .jarvis/core/templates/architecture-health.md
write:
  - docs/architecture/health/<YYYY-MM-DD>.md
  - docs/architecture/tech-debt.md
```

4. Summarize the result in ≤ 10 lines: the headline, the count of findings by severity, what the
   register gained and closed, and the proposed work items.
5. For each proposed work item, print the command that would open it — do not run it:
   `! npm run -s jarvis -- new <type> "<title>"`

If `jarvis-staff` returns BLOCKED, print its `open_questions` and stop.
