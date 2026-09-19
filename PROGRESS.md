# Jarvis Build Progress

Source of truth: JARVIS_SPEC.md · Build order: JARVIS_BUILD_PROMPTS.md (0–15, 17; 16 skipped) then JARVIS_SITE_PROMPTS.md (S0–S8).

## NEXT — Agent coverage expansion (BLOCKED until session starts with `JARVIS_DEV=1`)

Operator request (2026-09-20): audit agents vs PO/PM/QA/SA/FE/Full-stack/DevOps/Lead-Staff,
fill the gaps. Audit + design done; implementation blocked by guard.js G1 (Write/Edit to
`.claude/**`, `.jarvis/core/**`, `.jarvis/scripts/**` needs `JARVIS_DEV=1` at session start).
Do NOT bypass G1 via Bash writes. Source of truth is the dogfood install; after editing run
`node .jarvis/scripts/pack.js` to regenerate `jarvis-framework/framework/` (add new roles to
`ROLES` and new commands to `COMMANDS` in pack.js first).

Design to implement:
1. **Flag** `has_infra_change` (CI/CD, IaC, Dockerfile, k8s/helm, deploy/monitoring config):
   add to `FLAGS` in `.jarvis/scripts/lib/state.js`, intake flag list in
   `.jarvis/core/rules/orchestration.md`, intake template/checklist.
2. **Engine**: phases gain `conditional_agents: { <flag>: [agent, ...] }`. Change
   `agentsFor(phase)` → `agentsFor(phase, flags)` in `lib/workflow.js` (only caller: exports;
   check orchestration.md + jarvis.js handoff for other uses). Add unit tests in
   `scripts/test/workflow.test.js`. validate/audit must accept the new key.
3. **Standard** `.jarvis/standards/devops.md`, area `OPS` (add to conventions.md §1 areas and
   reviewer codes `OPS`): OPS-01 verify-before-deploy · 02 pinned actions/images, no `latest` ·
   03 explicit minimal CI permissions · 04 secrets only from secret store, never echoed/in tfvars ·
   05 all infra in IaC, remote locked state · 06 plan in PR, apply only from CI on default branch ·
   07 reversible deploy, named strategy + rollback · 08 readiness/liveness, health-gated rollout ·
   09 RED metrics + structured logs + trace propagation · 10 alert per SLO signal, owner + runbook ·
   11 env config, one artifact promoted · 12 resource requests/limits · 13 deploy concurrency guard,
   idempotent re-runs · 14 lockfile-based reproducible builds.
4. **Agent `jarvis-devops`** (modes `design`, `deploy`): architecture phase via
   `conditional_agents: {has_infra_change: [jarvis-devops]}` → `infra-plan.md` (pipeline changes,
   IaC resources, deploy strategy, rollback, SLOs/metrics/alerts/dashboards); release phase same
   flag → `deploy-plan.md` (env promotion, pre/post-deploy checks, rollback drill, alert
   verification). New templates `infra-plan.md`, `deploy-plan.md`; checklist items ARC-xx / REL-xx.
   Workflows with architecture: enhancement, feature, migration, performance, refactor, security.
   Release: all except spike. (chore/bugfix/hotfix have no architecture phase → devops only at
   release + review.)
5. **Agent `jarvis-review-devops`**: review phase, `conditional_agents: {has_infra_change:
   [jarvis-review-devops]}`, `conditional_outputs: {has_infra_change: [review/devops.md]}`,
   `reviewer_standards.devops: [devops.md, security.md, logging.md]`, findings `F-OPS-NNN`.
   Structure mirrors jarvis-review-security (draft was written and blocked — regenerate).
   All 9 workflows with a review phase.
6. **PM → CLI command, not an agent**: `jarvis.js portfolio [--json]` — every active item's
   type/phase/status/age/blocked reason/forced gates, open Q- counts, R- risks extracted from
   brief/tech-spec/investigation, dependency graph, file-overlap warnings between items' plan.md.
   Plus `jarvis.js link <ID> --depends-on <ID2>` (state field `depends_on`; `status`/`explain`
   show "waiting on"). Slash command `/jarvis-portfolio` runs it and summarizes. Reason:
   aggregation is deterministic data already in `.jarvis/state` — a CLI is exact, free and
   testable; an agent would re-derive it with tokens and could hallucinate status.
7. **Agent `jarvis-staff`** (Lead/Staff): cross-cutting, not per-diff. Runs via
   `/jarvis-health` (on demand), and is due when the last report is older than
   `staff_review.max_age_days` (config, default 30) — `/jarvis-status` warns; release checklist
   item for minor/major version releases requires a fresh report or a recorded waiver.
   Outputs `docs/architecture/health/<YYYY-MM-DD>.md` (drift from ADRs/tech-specs, cross-feature
   inconsistency, standards erosion trends, hotspots by churn, findings `F-ARCH-NNN`) and
   maintains `docs/architecture/tech-debt.md` register (`TD-NNN`, impact, effort, proposed
   REF-/PERF- work item). Read-only on code; Bash limited to git log/show/diff + grep.
8. Update JARVIS_SPEC.md (agents list, workflows, flags, standards areas, CLI commands),
   site content regenerates automatically from source; add EN+TH docs mentions if needed.
9. DECISIONS.md entries; run `cd .jarvis && npm test`, `node .jarvis/scripts/audit.js`,
   `node .jarvis/scripts/jarvis.js validate` (if exists), site `npm run build` + e2e; commit.

## Framework — COMPLETE (steps 0–15, 17; 16 skipped — needs a real project)

See commits `jarvis: step 0` … `jarvis: step 17` and `jarvis: settings.json`.
63 script tests pass, audit 9/9, installer verified end-to-end (default + renamed install).

## Website (JARVIS_SITE_PROMPTS.md) — COMPLETE (S0–S8)

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
| S8 | Deployment (GitHub Actions → Pages) | done |

### Site stack decisions of note (see DECISIONS.md D-017 to D-042)
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

### S8 Deployment — results

| Item | Result |
|---|---|
| 1. `.github/workflows/site.yml` | Created: push-to-main (path-filtered) + `release: published` + manual dispatch; typecheck → lint → build → link-check → deploy |
| 2. basePath / custom domain configurable via env | `SITE_BASE_PATH` and `SITE_CNAME` repo variables (already supported by `next.config.ts`, no change needed there) |
| 3. Version + changelog | `v{meta.version}` already shown on landing page from `.jarvis/VERSION` (S4); `/changelog` and `/th/changelog` now render real content parsed from root `CHANGELOG.md` (D-040), replacing the S3 placeholder |
| 4. `site/README.md` | Created: local dev, content editing (EN+TH), generated-content pipeline, adding a page, deploying |
| 5. Root `README.md` + badge | Created (didn't exist before) — workflow-status badge + docs-site link, using the `your-org` placeholder already established in `site.config.ts` (D-041) |

Full test suite reverified after all S8 changes: `tsc --noEmit`, `eslint`, `next build`,
`check:links`, 10/10 vitest, 82/82 playwright — all pass (see D-040/D-041/D-042 for the
real issues found and fixed: workflow trigger design, `.nojekyll` requirement, changelog
architecture).

**Website — COMPLETE (S0–S8). Framework — COMPLETE (steps 0–15, 17; 16 deferred).**

## Manual steps for the operator

### Before the first deploy (required)
1. Push this repo to a real GitHub org/repo, then replace the `your-org` placeholder in:
   - `site/site.config.ts` (`githubOrg`, `githubRepo`)
   - Root `README.md` (badge URL + docs link)
   - `CHANGELOG.md` (docs link in the header)
2. GitHub repo Settings → **Pages** → Source: set to **"GitHub Actions"** (not "Deploy from a branch").
3. GitHub repo Settings → **Actions → General** → Workflow permissions: ensure
   "Read and write permissions" is not required (this workflow uses the `pages`/`id-token`
   permissions declared in the workflow file itself, which is the modern/recommended
   approach — no repo-wide permission change needed beyond Pages being enabled).
4. If deploying to a **project page** (`https://<org>.github.io/jarvis-framework/`):
   Settings → Secrets and variables → **Actions → Variables** → New repository variable
   `SITE_BASE_PATH` = `/jarvis-framework`.
   If deploying to a **user/org page or custom domain** (served from `/`): leave
   `SITE_BASE_PATH` unset.
5. Optional, custom domain only: add repository variable `SITE_CNAME` = your domain, and
   point its DNS at GitHub Pages per GitHub's custom-domain docs.

### First deploy
1. Push to `main` (workflow triggers automatically on `site/**`/`.claude/**`/`.jarvis/**`/`CHANGELOG.md` changes), **or** trigger manually: repo → Actions tab → "Deploy site" → Run workflow.
2. Watch the `build` then `deploy` job in the Actions tab. On success it prints the live Pages URL.
3. Verify the deployed site loads at that URL with working nav, assets and language switch (a first-deploy `.nojekyll`/basePath misconfiguration would show as broken `_next/` assets or 404s on non-root pages — both are already handled in the workflow, see D-042, but worth an eyeball check once real).

### Other outstanding items (unchanged from before)
4. Restart Claude Code after any `.claude/**` or `.jarvis/core|scripts` change (hooks/agents/commands
   are read at session start).
5. Run the Prompt 16 dry run inside a real monorepo.
6. Optional, not blocking: restart with `JARVIS_DEV=1 claude` at some point to add
   `jarvis.js doctor --list --json` to the framework CLI (see S4 notes).

## Deferred
- Prompt 16 (dry run inside a real monorepo) — explicitly skipped per the original build
  instructions; needs a real Go+React monorepo to test against, not this repo.
- `jarvis.js doctor --list --json` — blocked by this repo's own `guard.js` hooks
  protecting `.jarvis/scripts/**` outside `JARVIS_DEV=1`; non-blocking, worked around in
  the site by parsing `doctor()`'s source directly (`parse-requirements.ts`).
