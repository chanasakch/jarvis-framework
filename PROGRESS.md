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
- Step 9 — guard.js + 16 guard tests
- Steps 10–13 — 17 agents in .claude/agents/
- Step 14 — 9 slash commands in .claude/commands/

## Current
- Step 15 — Consistency audit

## Next
- Step 17 — Team packaging (step 16 skipped: needs a real project)
- Then: .claude/settings.json (deferred, must be last), then STOP for model switch before S0

## Deferred to the very end (operator instruction)
- `.claude/settings.json` — hooks + permissions per JARVIS_SPEC.md §17, matcher corrected to
  `Edit|Write|Bash|Read` (DECISIONS D-006). Written last because G1 blocks writes under `.claude/`.
