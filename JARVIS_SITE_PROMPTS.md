# Jarvis — Official Website Prompts (สำหรับวางใน Claude Code)

## ก่อนเริ่ม

- **ทำหลัง Prompt 17** (แยก repo `jarvis-framework` แล้ว) เพราะหน้า Install ต้องอ้างอิงคำสั่ง `init` จริงของ CLI เว็บจะอยู่ในโฟลเดอร์ `site/` ของ repo นั้น และ deploy พร้อม framework
- วางไฟล์ `SYSTEM_DESIGN.md` ไว้ที่ `site/design-reference/SYSTEM_DESIGN.md` เพื่อใช้เป็น **แหล่งอ้างอิงเรื่อง theme และ interaction เท่านั้น** ไม่ใช่โครงสร้างของเว็บ
- ถ้า repo นั้นติดตั้ง Jarvis hooks ไว้ ให้เปิดด้วย `JARVIS_DEV=1 claude`
- วาง prompt ทีละขั้น ตรวจผลแล้ว commit ก่อนไปขั้นถัดไป

---

## Prompt S0 — Site Brief (บันทึกเป็น spec ของเว็บ)

```
Create site/SITE_SPEC.md with exactly the content below, then summarize it in ≤10 bullets and list ambiguities. Do not write code yet.

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
```

---

## Prompt S1 — Plan

```
Read site/SITE_SPEC.md and site/design-reference/SYSTEM_DESIGN.md (sections 1, 2, 11, 13, 14, 17 are the relevant ones).

Produce a plan only, no code:
1. Exact Next.js / Tailwind / shadcn versions you will use and the Node version they require.
2. How you will implement English-at-root + /th with static export (route structure, switcher, fallback, hreflang). Compare two options briefly and recommend one.
3. Token file: list every token you will take from the reference, every token you will add (display type scale, mono font, callout colors, code block colors), and every reference token you will not use.
4. Component list (layout, docs, landing, content components) with one line each.
5. Content generation pipeline: inputs → scripts → JSON schema per content type.
6. Folder structure of site/.
7. Risks and anything in the spec you consider wrong.

Wait for my approval.
```

---

## Prompt S2 — Scaffold, Tokens, Theme

```
Implement per the approved plan:
1. Scaffold site/ (Next.js static export, TS strict, Tailwind v4, shadcn, lucide, next-themes, sonner, cmdk). Pin Node in .nvmrc + engines.
2. site/app/globals.css: token layer adapted from the reference (light + dark), plus the added tokens. Radius scale from --radius. Font stack Inter + Noto Sans Thai + mono.
3. Base primitives from shadcn restyled to the tokens: Button, Input, Badge-like StatusBadge (icon + label + color), Card (1px ring), Tabs/segmented control, Sheet, Dialog, Tooltip, DropdownMenu.
4. A /dev/tokens page (excluded from sitemap and production nav) showing colors, type scale, radii, badges, buttons, callouts, code block, in both themes — for my visual review.

Acceptance: no hard-coded hex/radius in components (grep and show result); both themes pass contrast for text tokens (list ratios).
```

---

## Prompt S3 — Layout, i18n, Search

```
Implement:
1. Header (all items in the spec), mobile menu sheet, footer.
2. Docs layout: left nav (from a nav config file, localized), right TOC with scroll-spy, breadcrumbs, prev/next, "Edit this page on GitHub".
3. i18n: English root + /th, dictionary files for UI strings typed so a missing Thai key is a compile error (same idea as the reference), language switcher that keeps the current page and persists the choice, fallback notice for untranslated MDX, hreflang + <html lang>.
4. ⌘K palette: search pages, headings and commands of the current language from a build-time index; keyboard only usable.
5. Theme toggle (light/dark/system) without flash.

Acceptance: switch language on 3 different pages → same page in the other language, no full reload; keyboard-only walkthrough of header, nav, palette works; screenshot descriptions at 360px, 768px, 1280px.
```

---

## Prompt S4 — Content Generation

```
Implement site/scripts/generate-content.ts (run before dev and build):
- Read framework sources exactly as listed in "Content accuracy" of SITE_SPEC.md.
- If the CLI lacks `help --json` or `doctor --list --json`, add them to jarvis.js in a separate commit with tests (do not change other CLI behavior).
- Write site/content/generated/{commands,cli,agents,workflows,config,requirements,meta}.json with typed schemas (zod) and fail the build on schema errors.
- Thai translations for generated items: site/content/i18n/generated.th.json keyed by stable IDs; script prints a missing-key report.
- Unit tests for the parser using fixtures.

Show the generated JSON for 2 commands, 1 agent and 1 workflow.
```

---

## Prompt S5 — Landing Page

```
Build the landing page (/ and /th) per SITE_SPEC.md.

Requirements:
- Hero: install command from generated meta with copy button + sonner toast; version badge.
- Interactive SDLC pipeline from generated workflows: work-type tabs; phase chips in pipeline order; selected phase panel shows agent, outputs, checklist prefix, approval badge (StatusBadge with icon + label); fully keyboard operable (arrow keys between phases); on mobile the pipeline becomes a vertical list.
- Feature grid (6 cards, lucide icons, 1px ring cards).
- Terminal replay component: script defined in a data file (English commands; captions localized), play/pause/step/restart, respects prefers-reduced-motion (renders final state statically), accessible (live region off by default, transcript available).
- Copy that explains the "why" in plain language; no marketing fluff; English and natural Thai.

Acceptance: Lighthouse mobile scores for / and /th; no layout shift from the replay component.
```

---

## Prompt S6 — Docs Pages

```
Write all docs pages in site/content/en and site/content/th per the IA.

Rules:
- Reference pages (commands, agents, workflows, configuration, requirements) render from generated JSON via components — no hand-copied tables.
- Hand-written pages explain concepts with examples taken from the real framework files (paths, command names, status reports, the gate failure menu).
- Use MDX components: Callout, Steps, Tabs, CodeBlock (filename + copy), PhasePipeline, StatusBadge, FileTree.
- getting-started must include: requirements table, install command, what files are added to the repo (FileTree from the actual init output), `doctor` verification, first `/jarvis` run, how to approve a phase.
- gates page must show the real Gate Failure Menu and explain force rules, reason, --accept-risk, follow-up items.
- Every page ends with prev/next and "Edit this page".
- Mark anything you could not verify in the framework source as a TODO list in site/CONTENT_TODO.md instead of publishing it.

Then show me: page list with word counts EN/TH and the CONTENT_TODO.md.
```

---

## Prompt S7 — Quality Pass

```
Run a full quality pass and fix issues:
1. Typecheck, lint, build (static export) clean.
2. i18n parity: every EN MDX has a TH counterpart; UI dictionary complete; generated translations report.
3. Link check (internal links, anchors, basePath correctness).
4. Accessibility: axe on every page in both themes; keyboard walkthrough of palette, switcher, pipeline, replay, mobile menu.
5. Lighthouse mobile on /, /docs/getting-started, /docs/commands, /th — meet the spec thresholds.
6. Visual consistency audit against the token layer: list any component using raw values.
7. Reduced-motion and no-JS behavior: content readable without JS (except palette/replay controls).

Report a table: check, result, fix applied.
```

---

## Prompt S8 — Deploy

```
Set up deployment:
1. .github/workflows/site.yml: on push to main (paths: site/**, .claude/**, .jarvis/**, CHANGELOG.md) and on release tags; steps: setup Node from .nvmrc → install → generate content → typecheck → lint → i18n check → link check → build → deploy to GitHub Pages.
2. basePath configurable via env (repo pages path) and optional custom domain (CNAME from env).
3. Site version shown = framework VERSION at build time; changelog page updates on release.
4. site/README.md: local dev, content editing (EN + TH), how generated content works, how to add a page, how to deploy.
5. Add a root README badge + link to the site.

Tell me exactly which GitHub repository settings I must change (Pages source, permissions) and the first deploy steps.
```