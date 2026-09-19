# Jarvis Build Progress

Source of truth: JARVIS_SPEC.md · Build order: JARVIS_BUILD_PROMPTS.md (0–15, 17; 16 skipped) then JARVIS_SITE_PROMPTS.md (S0–S8).

## Framework — COMPLETE (steps 0–15, 17; 16 skipped — needs a real project)

See earlier commits `jarvis: step 0` … `jarvis: step 17` and `jarvis: settings.json`.
63 script tests pass, audit 9/9, installer verified end-to-end (default + renamed install).

## Website (JARVIS_SITE_PROMPTS.md) — IN PROGRESS

| Step | What | Status |
|---|---|---|
| S0 | site/SITE_SPEC.md | done |
| S1 | site/SITE_PLAN.md — versions (verified live vs npm), i18n approach, tokens, components, content pipeline, folder structure, risks | done |
| S2 | Scaffold: Next.js 16 static export, two independent root layouts (D-018/D-022), Tailwind v4 token layer, base primitives, StatusBadge, Callout, Shiki CodeBlock, /dev/tokens QA page | done |
| S3 | Layout (header/footer/mobile nav), docs layout (sidebar/TOC/breadcrumbs/prev-next), i18n (dictionaries, language switch, hreflang), ⌘K palette, theme toggle wiring | **next** |
| S4 | Content generation (commands/cli/agents/workflows/config/requirements/meta JSON + Thai translations); adds `jarvis.js doctor --list --json` | not started |
| S5 | Landing page (hero, interactive SDLC pipeline, feature grid, terminal replay) | not started |
| S6 | All docs pages (MDX, EN + TH) | not started |
| S7 | Quality pass (a11y, Lighthouse, i18n parity, link check) | not started |
| S8 | Deployment (GitHub Actions → Pages) | not started |

### Site stack decisions of note (see DECISIONS.md D-017 to D-024)
- TypeScript pinned to 6.0.3 (not 7.0.2 — typescript-eslint doesn't support it yet)
- ESLint pinned to 9.39.5 (not 10.x — eslint-plugin-react inside eslint-config-next doesn't support it yet)
- Node pinned to 22 (not 20 — 20 is EOL; also required by vitest's peer range)
- i18n: two independent root layouts (`app/(en)/layout.tsx`, `app/th/layout.tsx`), not a `[locale]` + postbuild move
- All versions in `site/package.json` were checked live against the npm registry, not assumed

### Verified so far (site)
`npm install` clean (0 vulnerabilities) · `tsc --noEmit` clean · `eslint .` clean ·
`vitest run` passes · `next build` (static export) produces `/`, `/th`, `/dev/tokens`, `_not-found`
with correct per-locale `<html lang>` · zero hard-coded hex/radius in components (grep) ·
WCAG AA contrast computed for every status/severity/phase token pair in both themes.

## Manual steps for the operator (unchanged from before)
1. Restart Claude Code after any `.claude/**` or `.jarvis/core|scripts` change (hooks/agents/commands
   are read at session start).
2. Run the Prompt 16 dry run inside a real monorepo.
3. GitHub Pages settings + org/repo values in `site/site.config.ts` (S8) once the site is ready to deploy.
