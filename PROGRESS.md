# Jarvis Build Progress

Source of truth: JARVIS_SPEC.md · Build order: JARVIS_BUILD_PROMPTS.md (0–15, 17; 16 skipped) then JARVIS_SITE_PROMPTS.md (S0–S8).

## Done
- Step 0 — Kickoff
- Step 1 — Foundation
- Step 2 — Standards A
- Step 3 — Standards B
- Step 4 — Standards C + lint-rules.yaml + error registry
- Step 5 — Templates (20 files)
- Step 6 — Checklists (14 files)
- Step 7 — Workflows (10 types + README)
- Step 8 — Scripts + 46 tests
- Step 9 — guard.js (G1–G5 + post mode) + 16 guard tests · hook contract verified against current Claude Code docs

## Current
- Step 10 — Agents batch 1 (gatekeeper, analyst, po, ba, ux)

## Next
- Step 11 — Agents batch 2 (investigator, architect, planner)

## Deferred to the very end (operator instruction)
- `.claude/settings.json` — hooks + permissions. Must be the LAST framework file written,
  because G1 blocks writes under `.claude/` and `.jarvis/core|scripts`.
  Content is specified in JARVIS_SPEC.md §17, with the matcher corrected to `Edit|Write|Bash|Read`
  (see DECISIONS.md D-006) and `${CLAUDE_PROJECT_DIR}` used for path resolution.
