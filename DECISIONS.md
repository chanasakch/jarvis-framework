# Decisions Log

Decisions taken autonomously during the build (the operator asked not to be blocked).
Format: decision · options considered · reason.

## D-000 — Work directly on `main`
- **Decision:** Build on `main` instead of `chore/jarvis-setup`.
- **Options:** (a) branch `chore/jarvis-setup` per JARVIS_BUILD_PROMPTS "how to use"; (b) build on `main`.
- **Reason:** That instruction targets adding Jarvis to an existing product repo. This repo *is* the framework repo and had zero commits; a feature branch adds no isolation value and complicates the per-step commit flow requested by the operator.

## D-001 — `dangerouslySetInnerHTML` has a rule ID in two standards files
- **Decision:** Keep both `RX-07` (coding-react.md) and `SEC-10` (security.md); they cross-reference each other.
- **Options:** (a) one rule only; (b) both, cross-referenced.
- **Reason:** The spec lists the rule in both section-12 subsections, and `lint-rules.yaml` in the spec pins the machine-checkable rule to `SEC-10`. A standards reviewer cites `RX-07`, a security reviewer cites `SEC-10`; removing either would break a spec-mandated citation path.

## D-002 — `DB-09` invented to satisfy the DB numbering split
- **Decision:** Added `DB-09 — Bounded context on every query [ADDED]` so MySQL rules fill DB-01..DB-09 and MongoDB starts at the spec-pinned DB-10 (`$lookup`).
- **Options:** (a) leave a numbering gap; (b) add a real rule.
- **Reason:** Gaps in rule IDs look like deleted rules and invite re-use; a genuine MUST rule is more useful than a hole.

## D-003 — `check` reports a missing app directory as `skipped`, not `fail`
- **Decision:** `jarvis.js check` marks a configured command as `skipped` when its working directory (e.g. `apps/api`) does not exist, or when the tool is not installed.
- **Options:** (a) fail; (b) skip with a reason.
- **Reason:** The framework must be installable in a repo before `apps/api` exists, and `doctor` already reports missing tools with install hints. Failing here would make every gate red for reasons unrelated to the work item.

## D-004 — `gates.non_forceable` is matched per finding class, not per phase
- **Decision:** A 3-part key (`review.security.critical`) requires `--accept-risk` only when a recorded issue matches that reviewer *and* severity; a 2-part key (`qa.acceptance_failed`) applies to the whole phase. When a phase has no recorded issues, the entry is treated as hit (fail closed).
- **Options:** (a) any entry whose first segment matches the phase makes the whole phase non-forceable; (b) match the specific finding class.
- **Reason:** (a) would make every review gate non-forceable, which contradicts §8.2 where force is the normal escape hatch and `--accept-risk` is reserved for the listed items.

## D-005 — An unknown finding severity blocks the review gate
- **Decision:** `merge-review` treats a severity outside conventions.md §4 as blocking.
- **Options:** (a) ignore it (it is not in `review.block_on`); (b) fail closed.
- **Reason:** Principle 9, "strict by default". A typo such as `blocker` would otherwise silently let a critical finding through.

## D-006 — Hook matcher drops `MultiEdit`; PostToolUse cannot block
- **Decision:** The PreToolUse matcher is `Edit|Write|Bash|Read` (not the spec's `Edit|Write|MultiEdit|Bash|Read`), and the post hook is documented as advisory.
- **Options:** (a) copy the spec verbatim; (b) match the current hooks contract.
- **Reason:** Verified against the current Claude Code hooks reference: `MultiEdit` is no longer a distinct tool, and PostToolUse exit 2 shows stderr to Claude but cannot revert the edit. `guard.js` still recognises a `MultiEdit` tool name defensively. Spec §16.3's intent ("report violations to Claude so it fixes them") is preserved.

## D-007 — `guard.js` fails open
- **Decision:** Any internal error in the guard exits 0 (allow) with a note on stderr.
- **Options:** (a) fail closed; (b) fail open.
- **Reason:** A crash in the guard would otherwise block every tool call in the session with no way to fix it from inside Claude Code. The deterministic gates (`validate`, `lint`, `ci`) remain fail-closed, so a guard outage cannot let bad work through a gate.

## D-008 — `.claude/settings.json` is written last
- **Decision:** Hooks are installed only after every other framework file exists (operator instruction).
- **Reason:** G1 blocks writes under `.claude/` and `.jarvis/core|scripts`, which would block the rest of the build. `JARVIS_DEV=1` is the documented bypass for framework development.

## D-009 — `MultiEdit` removed from the dev agents' tool lists
- **Decision:** `jarvis-dev-backend`, `jarvis-dev-frontend` and `jarvis-tester` declare `Read, Write, Edit, Glob, Grep, Bash` instead of the spec's list that includes `MultiEdit`.
- **Reason:** `MultiEdit` is no longer a distinct Claude Code tool (same source as D-006); `Edit` covers it. Declaring a non-existent tool grants nothing and risks a load error.

## D-010 — Commands keep `allowed-tools`/`model` but never depend on `@path` inlining
- **Decision:** Each command file carries `description`, `argument-hint`, `allowed-tools` and `model`. The orchestrator does **not** rely on `@.jarvis/core/rules/orchestration.md` being inlined; it instructs Claude to read the file, and repeats the seven hard rules and the Status Report format inline.
- **Options:** (a) follow the spec literally with `@path` includes; (b) drop `allowed-tools`/`model`; (c) keep them and make the body self-sufficient.
- **Reason:** A docs check returned that `allowed-tools`, `model` and `@path` includes are absent from the current command reference, while also flagging its own uncertainty and citing a narrower page. An unknown frontmatter key is ignored at worst, so keeping them costs nothing and preserves tool pre-approval where it is supported. Depending on `@path` inlining, by contrast, would silently gut the orchestrator — so the body stands alone either way.

## D-011 — Pre-execution bash in commands is failure-tolerant
- **Decision:** Every `` !`...` `` block ends in `2>/dev/null || echo "<fallback>"`.
- **Reason:** A failing pre-execution command aborts the whole slash command. `/jarvis` must still work in a repo where `yaml` is not installed yet — otherwise the user cannot even reach `/jarvis-init` to fix it.

## D-012 — The step-15 audit ships as `.jarvis/scripts/audit.js`
- **Decision:** The consistency audit is a committed script, not a one-off, and is wired into the team README and `upgrade`.
- **Options:** (a) run it once and discard; (b) keep it.
- **Reason:** Every check it runs (dangling paths, agent tools drifting from the spec, duplicate checklist IDs, rule IDs cited but never defined, context budget) breaks silently as the team edits standards. A one-off audit only proves the framework was consistent on the day it was built.

## D-013 — `docs/architecture/query-index-matrix.md` ships seeded
- **Decision:** Commit the matrix with its header, evidence format and Active/Proposed/Retired sections rather than leaving `/jarvis-init` to scaffold it.
- **Reason:** Four standards files, three agents and a checklist item reference this path. An absent file makes those references dead on day one, and the architect would invent its own column layout.

## D-014 — `{{name}}` templatizes the user-facing prefix only
- **Decision:** `init --name <x>` renames slash commands, agent names, the npm script and `jarvis.name` in the config. It does **not** rename `.jarvis/`, `jarvis.config.yaml`, `jarvis.js` or the `jarvis-ignore` lint pragma.
- **Options:** (a) blanket replace every occurrence of "jarvis"; (b) rename the user-facing prefix only.
- **Reason:** `jarvis.config.yaml` itself documents `name` as "prefix for commands/agents". A blanket replace rewrote `jarvis-ignore` inside a regex literal and `scripts/jarvis.js` inside paths, which silently broke lint suppressions in a renamed install — caught by running the full suite inside a test install.

## D-015 — `guard.js` reads the command prefix from the config
- **Decision:** G2 builds its human-only-command regex from `jarvis.name` instead of the literal string `jarvis`.
- **Reason:** A renamed install runs `npm run -s ops -- approve`, which a hardcoded regex did not match — Claude could have approved its own work in any renamed install. Covered by a regression test.

## D-016 — `upgrade` reports unknown framework files instead of deleting them
- **Decision:** Files under `.claude/agents`, `.claude/commands` and `.jarvis/core` that the new version does not ship are listed as `?` and left in place.
- **Options:** (a) delete for a clean tree; (b) report.
- **Reason:** A team may add its own agent or command next to the shipped ones. Deleting someone's work during an upgrade is not recoverable from inside the tool.

## D-017 — Site: pin TypeScript to 6.0.3, not the latest 7.0.2
- **Decision:** `site/` pins `typescript@6.0.3` instead of the current latest `7.0.2`.
- **Options:** (a) use latest TypeScript; (b) pin to the last release the lint toolchain supports.
- **Reason:** Verified live against the npm registry: `typescript-eslint@8.70.0`'s peer range is `>=4.8.4 <6.1.0`. TypeScript 7.0.2 is the new native/Go-based rewrite and is not yet supported by that plugin. 6.0.3 is the newest release still inside the supported range. Revisit once `typescript-eslint` ships a 7.x-compatible major.

## D-018 — Site i18n: two thin parallel route trees, not a `[locale]` + postbuild move
- **Decision:** English lives at the natural unprefixed App Router paths (`app/docs/...`); Thai lives under a real `app/th/docs/...` tree. Each route file is a thin wrapper around shared rendering logic. No postbuild step relocates files.
- **Options:** (a) single `app/[locale]/...` tree with a postbuild script promoting `out/en/**` to `out/**`; (b) two parallel thin trees.
- **Reason:** Next's built-in `i18n` config and middleware do not apply under `output: 'export'`, so locale switching is entirely build-time either way. Option (a) is more DRY but makes `sitemap.xml`, `robots.txt` and the root `404.html` depend on a file-move script getting every edge case right, invisibly, after the build. Option (b) costs ~10 tiny wrapper files (checked for parity by a script) but removes that entire failure class, and GitHub Pages' single global 404 naturally resolves to the true-root English `not-found.tsx` with no extra step.

## D-019 — `/docs/configuration` descriptions are a hand-maintained, drift-checked map
- **Decision:** Config key descriptions come from `config-descriptions.ts`, not from YAML comments.
- **Reason:** `yaml.parse` (the same library the CLI uses) does not expose comments as structured data. The generator fails the build if a config key has no description entry, or a description entry refers to a key that no longer exists — so the map can't silently drift from `jarvis.config.yaml`.

## D-020 — `.nvmrc` pins Node 22, not 20 and not the locally installed 24
- **Decision:** `site/.nvmrc` and `engines.node` are `22`.
- **Options considered, in order:** (a) Node 20 (the initial S1 pick — oldest line satisfying Next 16's `>=20.9.0`); (b) Node 22; (c) the locally installed 24.
- **Reason:** Two independent things ruled out (a). First, Node 20 reaches end-of-life April 2026, which is already in the past relative to today — pinning a new project to an EOL runtime is wrong regardless of dependencies. Second, and found empirically: `npm install` hard-failed with `vitest@5.0.1` requiring `@types/node` `>=22.0.0` as a peer, which Node 20's own types package can't satisfy. Node 22 (Active LTS since Oct 2024) satisfies Next 16, resolves the vitest peer requirement, and is a currently-maintained line — verified by a real `npm install` completing with 0 vulnerabilities. Not (c): pin to whatever a CI runner reliably caches as an LTS line, not to what happens to be on this machine.

## D-021 — `js-yaml` bumped to 4.3.2 (patch), not the 5.x line
- **Decision:** `site/package.json` pins `js-yaml@4.3.2`, not the registry's current latest (`5.4.2`).
- **Reason:** `npm audit` flagged `js-yaml@4.1.0` (prototype pollution + quadratic-complexity DoS, high severity) after the initial install; `4.3.2` is the patched release in the same major line already matched by `@types/js-yaml@4.0.9`. Verified with a real `npm audit`: 0 vulnerabilities after the bump. The 5.x major was not adopted here to avoid an unrelated breaking-change review while just fixing a vulnerability.

## D-022 — Two independent Next.js root layouts, not one shared `app/layout.tsx`
- **Decision:** There is no top-level `app/layout.tsx`. English lives under the route group `app/(en)/layout.tsx` (contributes no URL segment) and Thai under `app/th/layout.tsx` (a real `/th` segment); each renders its own `<html lang="...">`.
- **Options:** (a) one shared `app/layout.tsx` with a hardcoded or client-detected `lang`; (b) two independent root layouts, Next's documented "multiple root layouts" pattern.
- **Reason:** App Router renders exactly one `<html>` per root layout. A single shared layout can't know the locale at the point it renders `<html lang>` without a client-side effect (a hydration-order hack, and wrong for the initial static HTML search engines see). Next explicitly supports parallel root layouts when the top level has no shared layout of its own — each locale gets a correct, static `lang` attribute with no client JS. This refines D-018: the "thin parallel route trees" now start at the layout, not just the page.

## D-023 — Site: pin ESLint to 9.39.5, not the latest 10.11.0
- **Decision:** `site/package.json` pins `eslint@9.39.5`.
- **Options:** (a) latest ESLint 10; (b) latest ESLint 9.x.
- **Reason:** Found empirically: `eslint-config-next@16.3.5` bundles `eslint-plugin-react@7.37.5`, whose own `peerDependencies.eslint` caps at `^9.7` — confirmed against the npm registry, no newer `eslint-plugin-react` exists yet. Running ESLint 10 against it crashed mid-lint (`contextOrFilename.getFilename is not a function`, an ESLint-9-era API the plugin still calls). 9.39.5 is the newest release inside the supported range; `npx eslint .` runs clean on it. Revisit once `eslint-plugin-react` ships ESLint-10 support.

## D-024 — Severity/phase indicator colors darkened after a real contrast check
- **Decision:** `--severity-major`, `--phase-passed`, `--phase-forced`, `--phase-skipped` in light mode were darkened from their first pick.
- **Reason:** Computed actual WCAG contrast ratios (OKLCH→sRGB→relative luminance, no external tool) for every phase/severity/approval token against its card background in both themes. Four light-mode tokens measured below the 4.5:1 small-text AA threshold (as low as 3.51:1); each was darkened by the smallest amount that cleared 4.5:1, keeping the same hue. All 22 tokens (11 per theme) now pass; recorded in `site/SITE_PLAN.md`-adjacent code comments in `app/globals.css`.
