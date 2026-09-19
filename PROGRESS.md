# Jarvis Build Progress

Source of truth: JARVIS_SPEC.md · Build order: JARVIS_BUILD_PROMPTS.md (0–15, 17; 16 skipped) then JARVIS_SITE_PROMPTS.md (S0–S8).

## Framework — COMPLETE (steps 0–15, 17; 16 skipped — needs a real project)

See commits `jarvis: step 0` … `jarvis: step 17` and `jarvis: settings.json`.
63 script tests pass, audit 9/9, installer verified end-to-end (default + renamed install).

## Website (JARVIS_SITE_PROMPTS.md) — IN PROGRESS

| Step | What | Status |
|---|---|---|
| S0 | site/SITE_SPEC.md | done |
| S1 | site/SITE_PLAN.md | done |
| S2 | Scaffold, tokens, base primitives, /dev/tokens | done |
| S3 | Layout, i18n, ⌘K search | done |
| S4 | Content generation pipeline + Thai translations | done |
| S5 | Landing page | done |
| S6 | All 12 docs pages, EN + TH (MDX pipeline + reference pages) | done |
| S7 | Quality pass | **next** |
| S8 | Deployment (GitHub Actions → Pages) | not started |

### Site stack decisions of note (see DECISIONS.md D-017 to D-035)
- TypeScript 6.0.3, ESLint 9.39.5, Node 22, `yaml` (not `js-yaml`) — found/fixed by
  actually running the tools.
- i18n: two independent root layouts for EN/TH (D-018/D-022); language switch is a full
  page navigation (D-025, confirmed unavoidable under static export + GitHub Pages).
  MDX internal links are locale-relative in source (`/docs/gates` in both EN and TH
  files); a locale-aware Anchor component prefixes them at render time (D-031).
- StatusBadge uses a fixed neutral background, not a color-derived tint (D-026).
- `/dev/tokens` is its own third root layout, outside both locale trees (D-027).
- All `content/generated/*.json` is parsed from real framework source at build time —
  see `site/scripts/generate/`.
- **D-032**: delegating translation work to subagents surfaced two failure modes worth
  knowing about for S7/S8 delegation — (1) a subagent can misapply this repo's own
  `CLAUDE.md` ("all work starts with /jarvis") to meta-work it doesn't govern; give
  future subagents explicit context that site/framework construction is outside any
  Jarvis phase by the operator's own standing instruction. (2) subagents can leak a
  stray `</content>` artifact into file output — always rebuild for real after any
  subagent content delegation, never trust a self-report alone.
- **D-033/D-034/D-035**: a real, full-coverage a11y pass (every page, not a sample)
  found link-contrast and keyboard-scroll-region bugs that a 5-page sample missed
  entirely. The e2e suite now covers all 30 real pages.

### Verified so far (site) — re-run these after every step, they must stay green
```
cd site
npx tsc --noEmit
npx eslint .
npx vitest run                # parser unit tests with fixtures
npm run build                 # generate -> search-index -> i18n parity -> route parity -> next build
npx tsx scripts/check-links.ts
npx playwright test           # 37 tests: full axe WCAG 2A+2AA on all 30 real pages + interactions
```
Current real state: all of the above pass, 37/37 e2e tests. 12 docs pages fully written
in EN and TH (identical file trees, confirmed). 163 UI/landing dictionary strings +
123 generated-content strings translated. 0 hard-coded hex/radius in components.

### What S7 inherits / must know
- Lighthouse was already run once at S5 (landing page: 90-93/100/100/100) — S7 should
  re-run it across the docs pages too (getting-started was checked; the other 11 were
  not) and treat any regression as a real finding, not a formality.
- The a11y e2e suite (37 tests) already covers every page's static WCAG 2A/2AA state;
  S7's remaining scope per SITE_SPEC.md: a full keyboard walkthrough across pages (not
  just the isolated interaction tests that exist), dark-mode axe passes (everything so
  far has run in the default/light theme), a raw grep for any hard-coded value that
  slipped through, and confirming reduced-motion/no-JS behavior beyond the terminal
  replay (e.g. the SDLC pipeline's Tabs, the mobile nav sheet).
- `site/CONTENT_TODO.md` does not exist — nothing was left unverifiable in S6. If S7
  finds a real content gap, that's the file to create.

## Manual steps for the operator (unchanged from before)
1. Restart Claude Code after any `.claude/**` or `.jarvis/core|scripts` change (hooks/agents/commands
   are read at session start).
2. Run the Prompt 16 dry run inside a real monorepo.
3. GitHub Pages settings + real org/repo values in `site/site.config.ts` (S8) once the site is ready to deploy.
4. Optional, not blocking: restart with `JARVIS_DEV=1 claude` at some point to add
   `jarvis.js doctor --list --json` to the framework CLI (see S4 notes).
