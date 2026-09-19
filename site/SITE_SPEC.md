# Jarvis Website — Spec

## Goal
An official website for the Jarvis framework, in the style of mature open-source framework sites: explains what Jarvis is and why it exists, how it works, how to install it, every command, agent, workflow and configuration option. Deployed together with the framework (same repo, same release).

## Audience
Developers and tech leads evaluating or adopting Jarvis; team members looking up commands.

## Languages
- English (default) and Thai.
- English at the root with no prefix (e.g. /docs/commands); Thai under /th (e.g. /th/docs/commands).
- Every page exists in both languages. The language switcher keeps the current page, remembers the choice (localStorage, try/catch) and never causes a full reload.
- Command names, flags, file paths, IDs and code stay in English in both languages. Thai prose must read as natural developer Thai, not word-for-word translation.
- Missing Thai content falls back to English with a small notice; CI reports missing keys.
- `hreflang` alternates and correct `<html lang>` per page.

## Design direction
Reference: site/design-reference/SYSTEM_DESIGN.md.
It describes a different product (a social-listening dashboard). Use it ONLY for the visual language and interaction feel. Do NOT copy its information architecture, dashboard layout, KPI rows, charts, tables of leads, detail sheet, mock data or stores.

Adopt:
- Neutral OKLCH base + exactly one brand accent (brand blue tokens), light/dark/system theme via next-themes.
- Flat elevation: 1px ring on resting surfaces; shadow only on floating surfaces (menus, popovers, sheets, command palette).
- Radius scale from a single --radius token.
- Inter + Noto Sans Thai in one font stack.
- lucide-react icons, mostly 16px / 14px.
- Color is never the only signal: badges = icon + label + color (reuse the status palette for phase/approval/severity badges).
- Focus ring: 3px brand at 50% opacity.
- Subtle, functional motion only: fade/zoom 100ms for dialogs and popovers, 200ms slides for sheets, 1px press nudge on buttons; respect prefers-reduced-motion.
- ⌘K command palette (cmdk) for search.
- Toasts (sonner) for copy feedback.
- Mobile as a first-class layout, not a shrink.

Adapt / add (things a docs site needs that the dashboard does not have):
- A larger display type scale for the landing page (derived from the same font and tracking rules).
- A monospace font for code (e.g. Geist Mono or JetBrains Mono) added to the token layer.
- Code blocks with filename tab, language label, copy button, light/dark syntax themes (build-time highlighting, e.g. Shiki).
- Callouts (note / tip / warning / danger) styled as icon + label + color with a 1px ring.
- Docs layout: top header, left docs navigation, right "On this page" table of contents with scroll-spy, breadcrumbs, previous/next links, "Edit this page on GitHub".
Everything must use the shared design tokens; no hard-coded colors or radii in components.

Branding:
- The framework name comes from framework config (default "Jarvis") so a rename is one change.
- Original, simple logo mark (geometric). No references to any film, comic or existing AI character, and no copyrighted imagery.

## Information architecture
Header: logo + name, Docs, Commands, Workflows, Changelog, version badge, ⌘K search button, EN/TH segmented switch, theme toggle, GitHub link. Mobile: menu in a sheet.

Pages:
1. / — Landing
   - Hero: headline, one-line value proposition, copyable install command, "Get started" and "View on GitHub".
   - The problem → the Jarvis approach (standards enforced by gates, not by hope).
   - How it works: interactive SDLC pipeline. Work-type tabs (feature, bugfix, hotfix, ...) switch the pipeline; selecting a phase shows its agent, outputs, checklist and whether human approval is required.
   - Feature grid: orchestrator + specialist agents, three-layer gates, forced gates with audit trail, traceability IDs, standards as code, hooks that block unsafe actions, team-ready upgrades.
   - Terminal replay: a scripted session (/jarvis request → intake questions → status report → gate failure menu) with play/pause/step; static when reduced motion is on.
   - Final call to action.
2. /docs/introduction — what Jarvis is, why it exists, when not to use it.
3. /docs/getting-started — requirements table, install, verify with doctor, first work item, what gets created in the repo.
4. /docs/concepts — orchestrator, agents, commands, rules and standards, gates, state, hooks, file-based handoff (with themed diagrams built as components, not screenshots).
5. /docs/commands — slash commands and human-only CLI commands: purpose, arguments, example, notes. Filter box + tabs; copy button per example.
6. /docs/agents — catalog: role, phase(s), tools, inputs, outputs.
7. /docs/workflows — the 10 work types with their phase pipelines and approval points.
8. /docs/gates — gate protocol, statuses, severity levels, approve / force / skip / reopen / park, non-forceable items.
9. /docs/standards — each standards area, rule-ID prefixes, how to customize, exceptions via ADR.
10. /docs/configuration — full reference of the config file keys with defaults and descriptions.
11. /docs/team — team setup, CI check, CODEOWNERS, upgrading.
12. /docs/troubleshooting and /docs/faq.
13. /changelog — rendered from CHANGELOG.md.
14. 404 page.

## Content accuracy (hard rule)
Never invent commands, flags, requirements or behavior. Reference content is generated from the framework source at build time:
- Slash commands: .claude/commands/*.md frontmatter (description, argument-hint) + a short body excerpt.
- Human-only CLI: jarvis.js help output (add `help --json` to the CLI if missing).
- Agents: .claude/agents/*.md frontmatter + sections.
- Workflows: .jarvis/core/workflows/*.yaml.
- Configuration: the config template with its comments.
- Requirements: `.jarvis/package.json` engines + the checks listed by `jarvis.js doctor` (add `doctor --list --json` if missing), split into "Always required" and "Required for the default Go + React profile".
- Version: .jarvis/VERSION. Install command: the real `init` command of the CLI, with org/repo from site config.
Generated data lives in site/content/generated/*.json and is rebuilt on every build. Thai text for generated items comes from a translation file keyed by item ID; missing keys fall back to English and are reported.
Hand-written docs are MDX in site/content/en and site/content/th with identical file trees.

## Tech
- Next.js (App Router) with static export, TypeScript strict, Tailwind CSS v4 (CSS-first tokens), shadcn/ui primitives, lucide-react, next-themes, cmdk, sonner, MDX.
- No backend, no analytics or tracking scripts by default.
- Static search index built at build time for ⌘K, per language.
- Node version pinned in .nvmrc and package.json engines per the chosen Next.js version's requirement.

## Quality bar
- Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- WCAG 2.1 AA: keyboard navigation, skip link, visible focus, labelled controls, contrast in both themes.
- No layout shift from fonts or theme switching; no horizontal scroll at 360px width.
- Per-page metadata, Open Graph image, sitemap, robots.txt.

## Deployment
GitHub Pages via GitHub Actions, built on push to main and on release tags, with configurable basePath (custom domain optional). The same workflow runs typecheck, lint, content generation, i18n parity check, link check and build.
