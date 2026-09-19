# Jarvis Site — Plan (S1)

Per JARVIS_SITE_PROMPTS.md Prompt S1. Versions below were queried live against the npm registry
(`npm view <pkg> version`), not assumed. Decisions with real trade-offs are also logged in
`../DECISIONS.md`.

## 1. Versions

| Package | Version | Note |
|---|---|---|
| next | 16.3.5 | App Router, static export (`output: 'export'`) |
| react / react-dom | 19.3.0 | required by Next 16 |
| typescript | **6.0.3**, not the latest 7.0.2 | see below |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | CSS-first config, no `tailwind.config.js` |
| shadcn | 4.21.0 | CLI used to fetch primitive source, not a runtime dependency |
| lucide-react | 1.47.0 | icons |
| next-themes | 0.4.6 | theme provider |
| cmdk | 1.1.1 | ⌘K palette |
| sonner | 2.0.8 | toasts |
| next-mdx-remote | 6.0.0 | `next-mdx-remote/rsc` — see §5 for why not `@next/mdx` |
| gray-matter | 4.0.3 | MDX front matter |
| remark-gfm | 4.0.1 | tables/task-lists in MDX |
| shiki / rehype-pretty-code | 4.4.3 / 0.14.5 | build-time code highlighting |
| zod | 4.6.5 | schemas for generated content |
| tsx | 4.23.13 | run TS scripts (content generation) without a build step |
| vitest | 5.0.1 | unit tests (parsers, schemas) |
| playwright / @axe-core/playwright | 1.63.0 / 4.13.0 | e2e + accessibility |
| eslint / eslint-config-next | 10.11.0 / 16.3.5 | lint |

**TypeScript pin.** `typescript@7.0.2` is the new native (Go-based) rewrite. `typescript-eslint@8.70.0`
(current) declares `peerDependencies.typescript: ">=4.8.4 <6.1.0"` — it does not yet support the 7.x
line. Building on 7.0.2 today would mean either no type-aware linting or a peer-dependency conflict.
**Decision: pin `typescript` to `6.0.3`**, the newest release still inside that supported range. Revisit
when `typescript-eslint` publishes a 7.x-compatible major.

**Node.** Next 16 requires `node >=20.9.0`. `.nvmrc` and `package.json engines` are pinned to `20`
(latest 20.x) — the oldest line that satisfies Next's requirement and the most broadly available on CI
runners, rather than the locally-installed 24.x, which is newer than needed and not what CI will use.

## 2. i18n under static export

Next's built-in `i18n` config in `next.config` is Pages-Router-only and is not honored under
`output: 'export'` with the App Router. Middleware also does not run against a static export (there is
no server to run it on — GitHub Pages serves files). So locale switching has no runtime logic at all:
it is baked in at build time as two sets of static pages.

**Option A — one dynamic `[locale]` route tree, promoted at build time.**
`app/[locale]/...` with `generateStaticParams` returning `en`/`th`; a postbuild script moves
`out/en/**` up to `out/**` (English lives at root) and deletes `out/en`. One route file per page pattern.
Risk: the move script must also get `sitemap.xml`, `robots.txt` and the root `404.html` right, and any
mistake there is silent until deploy.

**Option B — two thin parallel route trees, shared rendering logic (recommended).**
`app/page.tsx`, `app/docs/[...slug]/page.tsx`, … for English (the natural unprefixed App Router
structure) and `app/th/page.tsx`, `app/th/docs/[...slug]/page.tsx`, … for Thai. Each route file is a
5-line wrapper that calls a shared builder with a hardcoded `locale` prop
(`export default () => <DocsPage locale="th" />`). No postbuild file surgery, no asset-path edge cases,
and `app/not-found.tsx` at the true root is naturally what GitHub Pages' single global `404.html` serves.

**Recommendation: Option B.** The duplication is ~10 tiny wrapper files, not logic — everything else
(content loading, components, nav) is shared. It removes an entire class of "worked in dev, silently
wrong after the build-time file move" bugs, at the cost of files a linter can trivially keep in sync
(a `check-route-parity.ts` script asserts every English route file has a `th/` counterpart).

Language switcher: computes the mirrored path (`/th` prefix add/remove, rest of the path unchanged) and
navigates with `next/link` — a client-side transition inside the same exported SPA shell, not a full
reload, because both locale trees are part of one built app. Choice persists to `localStorage`
(read/write wrapped in `try/catch` per the reference's own pattern) and is otherwise stateless — there is
no server-side redirect by `Accept-Language`, since none is possible on static hosting.

`hreflang` alternates + correct `<html lang>` are set per page from the same locale prop used to pick
the route tree, in each page's `generateMetadata`.

## 3. Token file plan

All in `app/globals.css`, `:root` (light) + `.dark`, re-exposed via `@theme inline` — same mechanism as
the reference.

**Taken from the reference, unchanged in kind (values re-derived for the Jarvis brand, not copied
verbatim since it's a different product):** the neutral OKLCH ramp (`--background` … `--ring`), one
`--brand`/`--brand-foreground` pair, `--destructive`, `--border`/`--input`, the `--radius` base with its
derived `--radius-sm/md/lg/xl` scale, the Inter + Noto Sans Thai font-stack pattern, the icon-size
convention (16px/14px), the 1px-ring-not-shadow elevation rule, the `focus-visible` 3px/50%-opacity ring,
and the motion durations (100ms overlays, 200ms sheets, 1px press nudge).

**Taken and reused directly for a new purpose:** the reference's status-badge *pattern* (icon + label +
color, one token per status) is reused for three new badge families Jarvis actually needs — phase status
(`pending/in_progress/gate_failed/passed/approved/forced/skipped/blocked/parked`, 9 tokens), approval
(`human`/`none`, 2 tokens) and severity (`critical/major/minor/info`, 4 tokens, reusing the reference's
`--critical`/`--warning` semantic pair for two of the four rather than inventing new hex values).

**Added (docs-site needs the reference has none of):**
- `--font-mono` — actually wired this time (the reference declares the token but never loads a font for
  it); Geist Mono, self-hosted via `next/font`.
- A display scale for the landing hero only: `--text-display-sm/md/lg` (the reference explicitly has no
  large-hero scale — it is an internal dashboard).
- Callout tokens: `--callout-note/tip/warning/danger` (bg tint + border + icon color per kind), built the
  same way as the reference builds its status colors (fixed pair per mode, not derived).
- Code block tokens: `--code-bg`, `--code-border`, plus the two Shiki theme names
  (`github-light`/`github-dark`) wired through `rehype-pretty-code`'s dual-theme CSS-variable output
  (`--shiki-light`/`--shiki-dark`), switched by the same `.dark` class next-themes already toggles.

**Reference tokens deliberately not used:** the intent palette (`--intent-high/medium/low`) and the
8-slot categorical chart palette (`--chart-1…8`) — both are for the dashboard's sales-intent domain and
charts; this site has no charts. The `data-density="compact"` table mode is dashboard-specific and unused.

## 4. Component list

See the folder structure in §6 for the full one-line-each list (kept there so it is not duplicated).
Summary by group: **layout** (header, mobile nav sheet, footer, docs shell, sidebar, TOC, breadcrumbs,
prev/next, edit-on-GitHub), **landing** (hero, copy-install, problem/approach, interactive SDLC pipeline,
feature grid, terminal replay, final CTA), **MDX content components** (Callout, Steps, CodeBlock,
PhasePipeline, StatusBadge, FileTree), **reference renderers** (one per generated-JSON page: commands,
agents, workflows, gates, configuration, requirements), **search** (⌘K palette), **theme** (toggle +
provider), **i18n** (language switch), **ui primitives** (Button, Input, Badge, Card, Tabs, Sheet,
Dialog, Tooltip, DropdownMenu, Command, Popover, Separator, Skeleton — ported from the shadcn registry
onto our tokens, not shadcn's defaults).

## 5. Content generation pipeline

| # | Input | Output | Notes |
|---|---|---|---|
| 1 | `.claude/commands/*.md` frontmatter + body excerpt | `content/generated/commands.json` | `description`, `argument-hint` already exist in every command file (verified in the framework build) |
| 2 | `node .jarvis/scripts/jarvis.js help --json` | `content/generated/cli.json` | **already works** — `help`/`__help` already respects the global `--json` flag; no CLI change needed here |
| 3 | `.claude/agents/*.md` frontmatter + `# Role/Modes/Inputs/Outputs` sections | `content/generated/agents.json` | parsed with a small markdown-section splitter, not a full MDX parser |
| 4 | `.jarvis/core/workflows/*.yaml` | `content/generated/workflows.json` | same `yaml` parser the CLI itself uses |
| 5 | `jarvis-framework/project-templates/jarvis.config.yaml` keys + a hand-maintained `config-descriptions.ts` map | `content/generated/config.json` | YAML comments are not structured data; the generator fails the build if a key exists with no description **or** a description exists for a key that no longer does, so the two can't silently drift |
| 6 | `.jarvis/package.json` engines + `node .jarvis/scripts/jarvis.js doctor --list --json` (new) | `content/generated/requirements.json` | `doctor --list` does not exist yet — added to `jarvis.js` in a dedicated, tested commit (framework code, so under `JARVIS_DEV=1`), split into "Always required" / "Required for the Go + React profile" |
| 7 | `.jarvis/VERSION` + `site/site.config.ts` (org/repo, placeholders documented in the site README since this repo has no git remote configured yet) | `content/generated/meta.json` | install command is built from the real `init --name` invocation, not hand-typed |

Every output is `zod`-validated before being written; a schema failure fails the build, not a warning.
Thai text for generated items lives in `content/i18n/generated.th.json`, keyed by a stable ID per item
(`command:/jarvis`, `agent:jarvis-po`, `workflow:feature`, `config:gates.max_retries`, …). The generator
cross-references every ID that exists in the English JSON against this file and writes a missing-key
report (`content/generated/i18n-report.json`) rather than failing the build — a missing translation
degrades to an English fallback with a small on-page notice, per SITE_SPEC.md, but is never silent (CI
reads the report and fails the *i18n-parity* check even though the *build* itself succeeds).

Unit tests for each parser live under `site/tests/generate/*.test.ts`, run against small fixture files
checked into `site/tests/fixtures/`.

## 6. Folder structure

```
site/
  package.json  tsconfig.json  next.config.ts  postcss.config.mjs  .nvmrc  eslint.config.mjs
  components.json                    # shadcn registry config (source-of-truth for primitive imports)
  site.config.ts                     # org/repo, base install command, framework display name
  app/
    layout.tsx  globals.css          # root shell: fonts, ThemeProvider, skip link
    page.tsx  not-found.tsx          # EN landing / EN 404 (== the site's global 404.html)
    sitemap.ts  robots.ts
    docs/[...slug]/page.tsx          # EN docs — one file drives every hand-written + generated doc page
    changelog/page.tsx
    dev/tokens/page.tsx              # excluded from sitemap + prod nav; visual QA only
    th/
      page.tsx  not-found.tsx  changelog/page.tsx  docs/[...slug]/page.tsx   # thin wrappers, see §2
  components/
    layout/    header.tsx mobile-nav.tsx footer.tsx docs-shell.tsx docs-sidebar.tsx docs-toc.tsx
               breadcrumbs.tsx prev-next.tsx edit-on-github.tsx
    landing/   hero.tsx copy-install.tsx problem-approach.tsx sdlc-pipeline.tsx feature-grid.tsx
               terminal-replay.tsx final-cta.tsx
    mdx/       callout.tsx steps.tsx code-block.tsx phase-pipeline.tsx status-badge.tsx file-tree.tsx
               mdx-components.tsx    # the tag -> component map passed to next-mdx-remote/rsc
    reference/ commands-explorer.tsx command-card.tsx agents-catalog.tsx agent-card.tsx
               workflows-browser.tsx gates-reference.tsx config-reference.tsx requirements-table.tsx
    search/    command-palette.tsx
    theme/     theme-provider.tsx theme-toggle.tsx
    i18n/      language-switch.tsx
    ui/        button.tsx input.tsx badge.tsx card.tsx tabs.tsx sheet.tsx dialog.tsx tooltip.tsx
               dropdown-menu.tsx command.tsx popover.tsx separator.tsx skeleton.tsx
  content/
    en/docs/**/*.mdx  th/docs/**/*.mdx           # identical file trees, parity-checked
    generated/*.json                              # build output — gitignored, rebuilt every build
    i18n/ui.en.json  i18n/ui.th.json  i18n/generated.th.json
  lib/
    content/  (mdx loader, frontmatter schema, slug discovery, nav config, mirrored-path helper)
    i18n/     (dictionary type + useT, locale utils)
    generated/(typed loaders + zod schemas, one module per JSON in content/generated)
    search/   (search item types shared by the index generator and the palette)
    seo/      (metadata + hreflang helpers)
  scripts/
    generate-content.ts  generate-search-index.ts  check-i18n-parity.ts  check-links.ts
    check-route-parity.ts
  public/       favicon.svg  og-default.png  logo.svg
  tests/
    generate/*.test.ts        # vitest, parser + schema unit tests
    e2e/*.spec.ts             # playwright + axe
  design-reference/SYSTEM_DESIGN.md   # existing, reference-only
  SITE_SPEC.md  SITE_PLAN.md  CONTENT_TODO.md
```

## 7. Risks and spec issues

1. **TypeScript 7 vs. the lint toolchain** — resolved above by pinning to 6.0.3; revisit on the next
   `typescript-eslint` major.
2. **No built-in i18n routing under static export** — resolved by Option B (§2); enforced by a route-parity
   check script, not just discipline.
3. **GitHub Pages serves one global `404.html`** — the English `not-found.tsx` at the true app root *is*
   that file; a Thai 404 exists at `/th/404/` for client-side navigation but a cold hit on an unmatched
   `/th/...` URL will show the English 404 (a real, documented limitation of static hosting, not a bug).
4. **`next/image` needs a server for optimization** — set `images.unoptimized: true`; nothing in the spec
   requires optimized raster images (logo is SVG, no photography).
5. **Config reference needs prose descriptions the YAML file doesn't structurally carry** — a
   hand-maintained description map, drift-checked against the real keys every build (§5).
6. **`doctor --list --json` doesn't exist yet** — a real framework change, done as its own tested commit
   under `JARVIS_DEV=1` before the requirements page can be generated (S4).
7. **No git remote is configured on this repo** — org/repo, the install command's source URL, and the
   Pages URL are read from `site.config.ts` / build-time env, defaulting to a documented placeholder
   (`your-org/jarvis-framework`) rather than being invented as if real.
8. **Interactive landing sections vs. "readable without JS"** — the spec's no-JS bar is about *content*
   being readable, not the pipeline/replay staying interactive; both render a static, non-interactive
   fallback in their initial server-rendered markup (first tab's phase list; the replay's final frame as
   preformatted text) so nothing is blank without JavaScript.
9. **Scope** — this is the largest remaining piece of work in the whole project. Mechanical, parallelizable
   work (bulk MDX content per §S6, Thai translation passes, per-component boilerplate) will go to
   subagents; verification that things actually build, lint, and pass tests stays with me.

Nothing here blocks starting S2. Proceeding.
