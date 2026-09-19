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
| S5 | Landing page (hero, interactive pipeline, feature grid, terminal replay) | done |
| S6 | All docs pages (MDX, EN + TH) — replaces the S3 placeholder body in docs-page-content.tsx | **next** |
| S7 | Quality pass (re-run + extend the a11y/Lighthouse/i18n/link checks already built) | not started |
| S8 | Deployment (GitHub Actions → Pages) | not started |

### Site stack decisions of note (see DECISIONS.md D-017 to D-030)
- TypeScript 6.0.3, ESLint 9.39.5, Node 22, `yaml` (not `js-yaml`) — found/fixed by
  actually running the tools.
- i18n: two independent root layouts for EN/TH (D-018/D-022); language switch is a full
  page navigation, confirmed unavoidable under static export + GitHub Pages while
  keeping English unprefixed (D-025).
- StatusBadge uses a fixed neutral background, not a color-derived tint (D-026).
- `/dev/tokens` is its own third root layout, outside both locale trees (D-027).
- All `content/generated/*.json` is parsed from real framework source at build time,
  including per-phase outputs and a real checklist-prefix read from each checklist
  file's own first item (not a guessed mapping) — see `site/scripts/generate/`.
- Real Lighthouse mobile runs (not estimated) caught two accessibility/best-practices
  bugs on the landing page — a missing accessible name on the header logo link below
  the `sm` breakpoint, and a missing `favicon.ico` (D-028, D-029). Both fixed and
  reverified: Accessibility 100, Best Practices 100, SEO 100, Performance 90-93 on
  `/`, `/th`, `/docs/getting-started`.

### Verified so far (site) — re-run these after every step, they must stay green
```
cd site
npx tsc --noEmit
npx eslint .
npx vitest run                # parser unit tests with fixtures
npm run build                 # generate -> search-index -> i18n check -> route-parity -> next build
npx tsx scripts/check-links.ts
npx playwright test           # tests/e2e/*.spec.ts — 13 tests, full axe pass required
```
For a real Lighthouse check (not part of the above, but done at S5 and worth repeating
after major content changes): `npx serve out -l 3000` in one terminal, then
`npx lighthouse http://127.0.0.1:3000/<path> --preset=perf --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --chrome-flags="--headless=new --no-sandbox"`.

Current real state: all of the above pass. 163 dictionary strings (UI chrome + landing
copy) fully parallel EN/TH — a missing Thai key is a `tsc` compile error, not a runtime
gap. 123/123 generated-content strings separately translated
(`content/i18n/generated.th.json`). 0 hard-coded hex/radius in components (grepped).

### What S6 inherits / must know
- `components/layout/docs-page-content.tsx` currently renders a placeholder body per
  slug (a Callout saying "content coming in step S6") — replace only that body;
  DocsShell, routing, generateStaticParams, metadata, and the two thin route wrappers
  stay as built.
- MDX rendering pipeline (next-mdx-remote/rsc, remark-gfm, rehype-pretty-code or direct
  Shiki via lib/shiki.ts, Callout/CodeBlock/StatusBadge/PhasePipeline components) is
  designed in SITE_PLAN.md §5 but not yet wired — S6 is where MDX loading gets built.
  `components/landing/sdlc-pipeline.tsx`'s WorkflowPipeline is a ready-made
  PhasePipeline-equivalent for the /docs/workflows reference page — reuse its shape.
- `scripts/check-i18n-parity.ts`'s MDX parity check will start actually checking real
  files once `content/en/docs/**` and `content/th/docs/**` exist — currently passes
  trivially because both are empty.
- Reference pages (commands, agents, workflows, configuration, requirements) render
  from `lib/generated/loaders.ts` + generated JSON via components — S6 must not
  hand-copy any table from the generated data.
- `site/CONTENT_TODO.md` should be created in S6 to list anything that couldn't be
  verified from framework source, per JARVIS_SITE_PROMPTS.md's S6 instructions.

## Manual steps for the operator (unchanged from before)
1. Restart Claude Code after any `.claude/**` or `.jarvis/core|scripts` change (hooks/agents/commands
   are read at session start).
2. Run the Prompt 16 dry run inside a real monorepo.
3. GitHub Pages settings + real org/repo values in `site/site.config.ts` (S8) once the site is ready to deploy.
4. Optional, not blocking: restart with `JARVIS_DEV=1 claude` at some point to add
   `jarvis.js doctor --list --json` to the framework CLI (see S4 notes/D-027 context).
