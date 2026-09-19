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
| S4 | Content generation (commands/cli/agents/workflows/config/requirements/meta JSON + Thai translations); adds `jarvis.js doctor --list --json` | **next** |
| S5 | Landing page (hero, interactive SDLC pipeline, feature grid, terminal replay) | not started |
| S6 | All docs pages (MDX, EN + TH) — replaces the S3 placeholder body in docs-page-content.tsx | not started |
| S7 | Quality pass (a11y, Lighthouse, i18n parity, link check) | not started |
| S8 | Deployment (GitHub Actions → Pages) | not started |

### Site stack decisions of note (see DECISIONS.md D-017 to D-026)
- TypeScript pinned to 6.0.3, ESLint pinned to 9.39.5, Node pinned to 22 — all found by
  actually running `npm install`/`tsc`/`eslint`, not assumed (D-017, D-020, D-021, D-023)
- i18n: two independent root layouts (`app/(en)/layout.tsx`, `app/th/layout.tsx`) for a
  correct static `<html lang>` per locale (D-018/D-022)
- **D-025 (important for S4+):** switching language is a full page navigation, not a
  soft transition — confirmed impossible to avoid under static export + GitHub Pages
  while keeping English unprefixed. Disclosed deviation from SITE_SPEC.md.
- **D-026:** StatusBadge (phase/severity/approval icon+label+color) uses a fixed
  `bg-muted` background, not a color-derived tint — the derived version made contrast
  math circular and several tokens failed WCAG AA even after darkening.
- All npm package versions were checked live against the registry, not assumed.

### Verified so far (site) — re-run these after every step, they must stay green
```
cd site
npx tsc --noEmit
npx eslint .
npx vitest run
rm -rf .next out && npx next build
npx playwright test          # tests/e2e/a11y.spec.ts — full axe pass required
```
Current real state: all of the above pass. 0 hard-coded hex/radius in components (grepped).
No horizontal overflow at 360/768/1280px.

### What S4 inherits / must know
- `docs-page-content.tsx` currently renders a placeholder body per slug — S4/S6 replace
  only that body; DocsShell, routing, generateStaticParams, metadata stay as built.
- `lib/search/static-index.ts` is the ⌘K fallback; S4 adds
  `content/generated/search-index.<locale>.json`, fetched client-side and merged
  (see `components/search/command-palette.tsx`) — if that fetch 404s, the palette
  still works from the static index, by design.
- `jarvis.js help --json` already exists and works — confirmed, no CLI change needed.
- `jarvis.js doctor --list --json` does **not** exist — must be added to the framework
  CLI (`.jarvis/scripts/jarvis.js`, under `JARVIS_DEV=1`) with tests, split into
  "Always required" / "Required for the Go + React profile", per SITE_SPEC.md.
- Config key descriptions for `/docs/configuration` come from a hand-written
  `config-descriptions.ts` map, drift-checked against real keys (D-019) — not from YAML
  comments (the `yaml` package doesn't expose those as data).

## Manual steps for the operator (unchanged from before)
1. Restart Claude Code after any `.claude/**` or `.jarvis/core|scripts` change (hooks/agents/commands
   are read at session start).
2. Run the Prompt 16 dry run inside a real monorepo.
3. GitHub Pages settings + org/repo values in `site/site.config.ts` (S8) once the site is ready to deploy.
