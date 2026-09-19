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
| S7 | Quality pass | done |
| S8 | Deployment (GitHub Actions → Pages) | **next** |

### Site stack decisions of note (see DECISIONS.md D-017 to D-039)
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
- **D-036/D-037**: Playwright now runs every test in both `light`/`dark` color-scheme
  projects (82 tests total, 0 dark-mode-only regressions found); a new
  `tests/e2e/keyboard.spec.ts` covers the 3 keyboard-walkthrough interactions
  (switcher, replay controls, mobile nav sheet) that had no dedicated test before.
- **D-038**: Lighthouse's `heading-order` audit (not covered by the axe WCAG-tag suite)
  found two real heading-hierarchy bugs — `<Steps>` step titles skipped from `h2` to
  `h4`, and the shared footer's `h3` category headings skipped a level on pages with no
  in-page `h2` (e.g. `/docs/commands`). Both fixed (`h3` and `h2` respectively); all
  four SITE_SPEC.md-required pages now score accessibility 100.
- **D-039**: token-layer raw-value audit found one real bug (`docs-toc.tsx` inline
  `style={{ paddingLeft }}` → Tailwind `pl-6`/`pl-3`) and confirmed two other raw
  Tailwind values (`text-[10px]` kbd hint, `text-[0.85em]` inline code) and one vendored
  shadcn primitive (`min-w-[8rem]`) are defensible exceptions, not defects.

### Verified so far (site) — re-run these after every step, they must stay green
```
cd site
npx tsc --noEmit
npx eslint .
npx vitest run                # parser unit tests with fixtures
npm run build                 # generate -> search-index -> i18n parity -> route parity -> next build
npx tsx scripts/check-links.ts
npx playwright test           # 82 tests: full axe WCAG 2A+2AA on all 30 real pages, both themes, + interactions/keyboard
```
Current real state: all of the above pass, 82/82 e2e tests (light+dark themes), 10/10
vitest. 12 docs pages fully written in EN and TH (identical file trees, confirmed). 163
UI/landing dictionary strings + 123 generated-content strings translated. Lighthouse
mobile on `/`, `/docs/getting-started`, `/docs/commands`, `/th`: performance 92-94,
accessibility 100, best-practices 100, SEO 100 (thresholds: ≥90/≥95/≥95/≥95).

### S7 Quality Pass — results

| Check | Result | Fix applied |
|---|---|---|
| 1. Typecheck, lint, build (static export) | Clean | none needed |
| 2. i18n parity (EN/TH MDX + UI dict + generated translations) | OK, already verified in S6 | none needed |
| 3. Link check (internal links, anchors, basePath) | OK — 32 pages, 178 hrefs, 143 anchors checked | Extended `check-links.ts` to also validate `#fragment` targets (previously only checked file existence); fixed one real broken Thai anchor in `content/th/docs/getting-started.mdx` |
| 4. Accessibility: axe both themes + keyboard walkthrough | 82/82 pass, 0 dark-mode-only violations | Added `light`/`dark` Playwright projects (D-036); added `tests/e2e/keyboard.spec.ts` for switcher/replay/mobile-nav keyboard coverage (D-037) |
| 5. Lighthouse mobile on required pages, thresholds met | All 4 pages pass with margin after fix | Fixed 2 real `heading-order` bugs found by Lighthouse (D-038); a transient 89/100 perf reading on one page was confirmed as run-to-run variance (reran 92 consistently), not a regression |
| 6. Visual consistency audit (raw values vs token layer) | 1 real bug found and fixed; 3 defensible exceptions logged | `docs-toc.tsx` inline-style rem values → Tailwind classes (D-039) |
| 7. Reduced-motion + no-JS behavior | Pass | Verified (no code change needed): global CSS `prefers-reduced-motion` rule already collapses Sheet/Tabs transitions to ~0ms; no-JS content (headings, article text, nav links, default SDLC pipeline tab) renders and is readable via SSR — only palette/replay *controls* require JS, as scoped by SITE_SPEC.md |

### What S8 inherits / must know
- Deployment target: GitHub Actions → GitHub Pages, per JARVIS_SITE_PROMPTS.md S8. Needs
  a workflow file, `SITE_BASE_PATH`/`NEXT_PUBLIC_BASE_PATH` wiring for a project-page
  deploy (already supported by `next.config.ts`, verified working in S7's link-check
  basePath test), version display sourced from the framework's real `VERSION` file,
  `site/README.md`, and a root `README.md` badge.
- Operator must still: enable GitHub Pages (source = GitHub Actions) and check
  Actions/Pages permissions in repo settings before the first real deploy — this cannot
  be done from here.

## Manual steps for the operator (unchanged from before)
1. Restart Claude Code after any `.claude/**` or `.jarvis/core|scripts` change (hooks/agents/commands
   are read at session start).
2. Run the Prompt 16 dry run inside a real monorepo.
3. GitHub Pages settings + real org/repo values in `site/site.config.ts` (S8) once the site is ready to deploy.
4. Optional, not blocking: restart with `JARVIS_DEV=1 claude` at some point to add
   `jarvis.js doctor --list --json` to the framework CLI (see S4 notes).
