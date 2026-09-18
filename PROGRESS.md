# Jarvis Build Progress

Source of truth: JARVIS_SPEC.md · Build order: JARVIS_BUILD_PROMPTS.md (0–15, 17; 16 skipped) then JARVIS_SITE_PROMPTS.md (S0–S8).

## Framework — COMPLETE

| Step | What | Status |
|---|---|---|
| 0 | Kickoff, spec read | done |
| 1 | Foundation: jarvis.config.yaml, CLAUDE.md, conventions.md, orchestration.md, context placeholder | done |
| 2 | Standards A: structure, coding-go, coding-react, api | done |
| 3 | Standards B: database, caching, performance, security | done |
| 4 | Standards C: error-handling, logging, testing, documentation, git, lint-rules.yaml, error registry | done |
| 5 | 20 templates | done |
| 6 | 14 checklists, 162 unique items | done |
| 7 | 10 workflows + generated README | done |
| 8 | CLI + 6 lib modules | done |
| 9 | guard.js G1–G5 + post mode | done |
| 10–13 | 17 agents | done |
| 14 | 9 slash commands | done |
| 15 | Consistency audit (now `.jarvis/scripts/audit.js`) | done, 9/9 pass |
| 16 | Dry run in a real project | **skipped — needs a real project (operator)** |
| 17 | Team packaging: `jarvis-framework/`, installer, CI, CODEOWNERS, PR template, README | done |
| — | `.claude/settings.json` (deferred to last) | done |

Verification at completion: 63 script tests pass · audit 9/9 · installer verified end-to-end into both a
default and a renamed (`--name ops`) test repo, both green.

## Next — website (JARVIS_SITE_PROMPTS.md)

Stopped here so the operator can switch models. On "continue from PROGRESS.md", start at **S0**.

- S0 … S8 — not started.
- Site source lives in `site/`; `site/design-reference/SYSTEM_DESIGN.md` is the design reference.

## Manual steps for the operator

1. **Restart Claude Code** — hooks, agents and commands are read at session start.
2. Run the step-16 dry run inside a real monorepo (see JARVIS_BUILD_PROMPTS.md Prompt 16).
3. GitHub Pages settings, once the site exists.
