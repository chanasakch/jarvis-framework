# Jarvis site

The docs/marketing site for the Jarvis framework. Next.js 16 App Router, static export
(`output: "export"`), Tailwind CSS v4, deployed to GitHub Pages.

## Local development

```bash
nvm use            # or match .nvmrc — Node 22
npm install
npm run dev        # generates content, builds the search index, starts next dev on :3000
```

`npm run dev` regenerates `content/generated/*.json` and the search index every time you
run it, so editing framework source (`.claude/commands/`, `.claude/agents/`,
`.jarvis/core/workflows/`, `jarvis.config.yaml`) and restarting `dev` picks up the change.
It does not watch those files, so re-run it after each edit.

## Content editing

### Hand-written docs (MDX)

The 12 docs pages live in `content/en/docs/*.mdx` and `content/th/docs/*.mdx` — one file
per locale per slug, same filename in both trees (`scripts/check-route-parity.ts` fails
the build if a slug exists in only one locale). Frontmatter is `title` + optional
`description`; the body is MDX using the components in `components/mdx/` (`Callout`,
`Steps`, `FileTree`, `StatusBadge`, tables, code blocks — see any existing page for
usage). Headings (`##`/`###`) get an id via `rehype-slug`; link to them with
`[text](#the-id)`.

Internal links are always written locale-relative, e.g. `[Gates](/docs/gates)` — never
`/th/docs/gates` even from a Thai file. The `Anchor` component (`components/mdx/mdx-components.tsx`)
prefixes the current locale onto internal links at render time, so translators never
handle locale prefixing by hand.

### UI strings

Every UI string (nav labels, buttons, empty states, landing page copy) is typed once in
`lib/i18n/types.ts` (the `Dictionary` interface) and implemented in `lib/i18n/en.ts` and
`lib/i18n/th.ts`. TypeScript enforces exact key parity between the two — a missing or
misspelled Thai key fails `tsc --noEmit`, not a runtime fallback.

### Verifying a translation

```bash
npm run check:i18n     # MDX doc parity: heading counts/levels, code blocks, link paths
npx tsc --noEmit        # UI dictionary key parity (via the Dictionary type)
npm run build           # actually compiles every MDX file — the only real proof it renders
```

Never trust a translation (human or agent-authored) without running all three; MDX
content parity (heading structure, unchanged code blocks and component props) has no
other enforcement.

## How generated content works

`content/generated/*.json` (gitignored, never hand-edited) is produced by
`npm run generate` (`scripts/generate-content.ts`), which parses the **real** framework
source and validates the result against a zod schema in `lib/generated/schemas.ts`:

| File | Parsed from |
|---|---|
| `commands.json` | `.claude/commands/*.md` |
| `cli.json` | `.jarvis/scripts/jarvis.js` |
| `agents.json` | `.claude/agents/*.md` |
| `workflows.json` | `.jarvis/core/workflows/*.yaml` + `jarvis.config.yaml` |
| `config.json` | `jarvis-framework/project-templates/jarvis.config.yaml` |
| `requirements.json` | `.jarvis/scripts/jarvis.js`'s `doctor()` |
| `meta.json` | `.jarvis/VERSION`, `site.config.ts` |
| `changelog.json` | root `CHANGELOG.md` |

A parser throws on a shape it doesn't recognize instead of silently dropping content —
a build with wrong reference docs is worse than a failed build. If you change the shape
of any framework source file above, update its parser in `scripts/generate/`.

## Adding a docs page

1. Add the slug to `DOCS_NAV` in `lib/content/nav.ts` (which group it belongs in).
2. Add the slug's title to `docsNav` in both `lib/i18n/en.ts` and `lib/i18n/th.ts` (the
   `Dictionary` type will fail to compile until both are set).
3. Write `content/en/docs/<slug>.mdx` and `content/th/docs/<slug>.mdx`.
4. `npm run build` — `check:routes` fails if either locale is missing the file, `check:i18n`
   fails if the two files' structure diverges.

## Adding the changelog

Add a new `## [x.y.z] - YYYY-MM-DD` entry to the top of the root `CHANGELOG.md`
(repo root, not `site/`), with `### Added` / `### Changed` / `### Fixed` subsections and
`- ` bullet items (see `scripts/generate/parse-changelog.ts` for the exact format it
expects). Entries are English-only — the changelog page's chrome (title, subhead) is
localized, but release notes are not translated per release.

## Deployment

`.github/workflows/site.yml` builds and deploys to GitHub Pages on every push to `main`
that touches `site/**`, `.claude/**`, `.jarvis/**` or `CHANGELOG.md`, on every published
GitHub Release, and on manual dispatch from the Actions tab.

- **Project page** (`https://<org>.github.io/<repo>/`): set the repo variable
  `SITE_BASE_PATH` to `/<repo>` (Settings → Secrets and variables → Actions → Variables).
- **User/org page or custom domain** (served from `/`): leave `SITE_BASE_PATH` unset.
- **Custom domain**: also set the repo variable `SITE_CNAME` to the domain — the
  workflow writes it into a `CNAME` file in the deployed output.

To deploy locally without the workflow:

```bash
SITE_BASE_PATH=/jarvis-framework npm run build   # omit SITE_BASE_PATH for a root deploy
npx tsx scripts/check-links.ts                   # validates the basePath-aware output too
npx serve out                                    # smoke-test the static export
```

See the root `README.md` for the GitHub repository settings (Pages source, Actions
permissions) that must be set once, by hand, before the first deploy.
