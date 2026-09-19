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
| S5 | Landing page (hero, interactive SDLC pipeline, feature grid, terminal replay) | **next** |
| S6 | All docs pages (MDX, EN + TH) — replaces the S3 placeholder body in docs-page-content.tsx | not started |
| S7 | Quality pass (Lighthouse; a11y/i18n/link checks already exist from S3/S4, re-run + extend) | not started |
| S8 | Deployment (GitHub Actions → Pages) | not started |

### Site stack decisions of note (see DECISIONS.md D-017 to D-027)
- TypeScript 6.0.3, ESLint 9.39.5, Node 22, `yaml` (not `js-yaml`) — all found/fixed by
  actually running the tools, not assumed.
- i18n: two independent root layouts for EN and TH (D-018/D-022) — correct static
  `<html lang>` per locale, at the cost of a full-page reload on language switch, which
  is impossible to avoid under static export + GitHub Pages while keeping English
  unprefixed (D-025, verified three independent ways).
- StatusBadge uses a fixed neutral background, not a color-derived tint (D-026) — the
  derived version made contrast math circular and failed WCAG AA even after darkening.
- `/dev/tokens` is its own third root layout, outside both locale trees (D-027) — it
  has no Thai counterpart and must not inherit the localized Header/LanguageSwitch.
- All content in `site/content/generated/*.json` is parsed from real framework source
  at build time (never hand-written) — see `site/scripts/generate/`. Workflow approval
  is computed by importing the framework's own `approvalRequired()`, not reimplemented.
- `jarvis.js doctor --list --json` does not exist yet (needs `JARVIS_DEV=1`); the
  requirements generator gets equivalent real data by parsing `doctor()`'s existing
  source and will prefer the JSON flag automatically once it's added — not blocking.

### Verified so far (site) — re-run these after every step, they must stay green
```
cd site
npx tsc --noEmit
npx eslint .
npx vitest run                # parser unit tests with fixtures
npm run build                 # generate -> search-index -> i18n check -> route-parity -> next build
npx tsx scripts/check-links.ts
npx playwright test           # tests/e2e/a11y.spec.ts — full axe pass required
```
Current real state: all of the above pass. 123/123 generated-content strings translated
to Thai (content/i18n/generated.th.json). 0 hard-coded hex/radius in components (grepped).

### What S5 inherits / must know
- `site.config.ts` is the one place org/repo/install-command live — use it, don't
  hardcode a GitHub URL again.
- `content/generated/meta.json` has the real version + install command for the hero.
- `content/generated/workflows.json` has every work type's phases with real computed
  approval — this is the data source for the interactive SDLC pipeline, not something
  to hand-author.
- `lib/generated/translatable.ts`'s `translate()` helper is how any Thai landing-page
  copy that references generated content should look up strings (English fallback,
  `hasTranslation` flag available for a notice if ever needed).
- Reduced-motion requirement: the terminal replay and pipeline need a static, readable
  fallback in the initial server-rendered markup (see SITE_PLAN.md §7 risk 8).

### What S6 inherits / must know
- `components/layout/docs-page-content.tsx` currently renders a placeholder body per
  slug — replace only that body; DocsShell, routing, generateStaticParams, metadata,
  and the two thin route wrappers stay as built.
- MDX rendering pipeline (next-mdx-remote/rsc, remark-gfm, rehype-pretty-code or direct
  Shiki via lib/shiki.ts, Callout/CodeBlock/StatusBadge components) is designed in
  SITE_PLAN.md §5 but not yet wired — S6 is where MDX loading actually gets built.
- `scripts/check-i18n-parity.ts`'s MDX parity check will start actually checking real
  files once `content/en/docs/**` and `content/th/docs/**` exist — it currently passes
  trivially because both are empty.

## Manual steps for the operator (unchanged from before)
1. Restart Claude Code after any `.claude/**` or `.jarvis/core|scripts` change (hooks/agents/commands
   are read at session start).
2. Run the Prompt 16 dry run inside a real monorepo.
3. GitHub Pages settings + real org/repo values in `site/site.config.ts` (S8) once the site is ready to deploy.
4. Optional, not blocking: restart with `JARVIS_DEV=1 claude` at some point to add
   `jarvis.js doctor --list --json` to the framework CLI (see D-027 context above).
