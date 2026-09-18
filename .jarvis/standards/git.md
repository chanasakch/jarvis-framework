# Git Standards

Purpose: keep history linear, traceable to a work item, and safe for a team to build on.
Scope: branch names, commit messages, and PRs for every change in this repository.
Out of scope: what a phase must produce before merge (`.jarvis/core/checklists/`), CI pipeline config.

### GIT-01 — Branch naming `<type>/<ID>-<slug>` (MUST)
A branch is named `<type>/<ID>-<slug>`, where `<type>` is one of the ten work-item types in lowercase
and `<slug>` is a short kebab-case description; no branch is created without a work item ID.

✅ `feature/FEAT-012-otp-login`
❌ `my-otp-branch` (no type, no work item ID)

### GIT-02 — Conventional Commits with work item and task ID (MUST)
Every commit subject follows Conventional Commits and ends with the work item ID and task ID in
square brackets: `<type>(<scope>): <description> [<WORK-ID>][<TASK-ID>]`.

✅ `feat(otp): add verify endpoint [FEAT-012][T-003]`
❌ `added the otp verify endpoint` (no type, no scope, no IDs)

### GIT-03 — Roughly one task per commit (SHOULD)
A commit corresponds to one task (`T-<NNN>`) from `plan.md`; a commit spanning several unrelated
tasks, or a task split across many unrelated commits, is avoided unless the task is genuinely atomic.

✅ One commit for `T-003` (verify endpoint), a separate commit for `T-004` (rate limiting).
❌ One commit mixing `T-003`, `T-007`, and an unrelated dependency bump.

### GIT-04 — Commit subject ≤ 72 chars, imperative mood (MUST)
The commit subject line (before any `[ID]` suffix is counted) is at most 72 characters and uses the
imperative mood ("add", "fix", "remove"), not past tense or a gerund.

✅ `fix(order): reject negative amounts [BUG-041][T-002]`
❌ `fixed a bug where the order service was incorrectly accepting negative amounts sometimes [BUG-041][T-002]`

### GIT-05 — No commits directly to `main` (MUST)
No commit is made directly on `main`; all work happens on a branch named per `[GIT-01]` and reaches
`main` only through a reviewed, merged pull request.

✅ `git switch -c feature/FEAT-012-otp-login && git commit ...`
❌ `git switch main && git commit -am "quick fix"`

### GIT-06 — Never commit secrets, `.env`, credentials, or generated `node_modules` (MUST)
No commit includes `.env` files, API keys, tokens, private keys, database credentials, or a generated
`node_modules` directory; these are covered by `.gitignore` and checked before every commit.

✅ `.env`, `node_modules/`, `*.pem` listed in `.gitignore`; config read from env vars at runtime.
❌ `git add .env && git commit -m "chore: add local config"`

### GIT-07 — `.jarvis/state/**` and `docs/work/**` are committed (MUST)
State files under `.jarvis/state/**` and every artifact under `docs/work/**` are tracked and committed;
they are never added to `.gitignore`, since they are the audit trail the team and gates depend on.

✅ `git add .jarvis/state/FEAT-012.json docs/work/FEAT-012-otp-login/prd.md`
❌ Adding `.jarvis/state/` or `docs/work/` to `.gitignore` "to reduce noise".

### GIT-08 — Rebase or squash-merge to keep history linear (MUST)
A feature branch is brought up to date with `main` by rebase, not merge-from-main, and is integrated
into `main` by squash-merge or fast-forward rebase merge; no merge commits from `main` into a feature
branch.

✅ `git rebase main` on the feature branch, then squash-merge the PR into `main`.
❌ `git merge main` into the feature branch, producing a merge commit mid-branch.

### GIT-09 — PR body uses the template and shows gate status (MUST)
A pull request body follows the PR template and states the work item ID, the status of every phase
(`approved`/`passed`/`forced`/`skipped`), and any forced gates with their reason.

✅ PR body: `Work item: FEAT-012` · phase table with statuses · `Forced Gates: review.security (reason: ...)`.
❌ PR body: `fixes the otp thing` with no work item ID or phase status.

### GIT-10 — Force-push only to your own feature branch (MUST)
`git push --force` (or `--force-with-lease`) is used only on a feature branch owned solely by the
pusher; it is never used on `main` or any branch other contributors are also pushing to.

✅ `git push --force-with-lease origin feature/FEAT-012-otp-login` (own branch, after a rebase).
❌ `git push --force origin main`

## Branch Names

| type | branch prefix | example |
|---|---|---|
| feature | `feature/` | `feature/FEAT-012-otp-login` |
| enhancement | `enhancement/` | `enhancement/ENH-004-cursor-pagination` |
| bugfix | `bugfix/` | `bugfix/BUG-041-negative-amount` |
| hotfix | `hotfix/` | `hotfix/HOT-009-payment-timeout` |
| refactor | `refactor/` | `refactor/REF-006-split-order-service` |
| performance | `performance/` | `performance/PERF-003-orders-list-p95` |
| security | `security/` | `security/SEC-014-idor-invoices` |
| migration | `migration/` | `migration/MIG-002-orders-add-tenant-id` |
| spike | `spike/` | `spike/SPK-005-evaluate-redis-cluster` |
| chore | `chore/` | `chore/CHR-018-bump-go-version` |

## Commit Types

| type | use for |
|---|---|
| feat | a new user-facing capability |
| fix | a bug fix |
| refactor | code restructuring with no behavior change |
| perf | a performance improvement with before/after evidence |
| test | adding or changing tests only |
| docs | documentation-only changes |
| chore | tooling, deps, config, no production code change |
| ci | CI pipeline configuration |
| build | build system or packaging changes |
| revert | reverting a previous commit |

## PR Requirements

Before a PR is ready for review, all of the following are true:

- [ ] CI is green on the PR's latest commit.
- [ ] `jarvis.js ci --base origin/main` passes locally.
- [ ] Every phase the workflow requires is `approved`, `passed`, `forced`, or `skipped` — none left `pending`, `in_progress`, or `gate_failed`.
- [ ] Any forced gate is listed in the PR body with its reason, per `[GIT-09]`.
- [ ] The branch name and every commit subject follow `[GIT-01]` and `[GIT-02]`.
- [ ] No secrets, `.env`, or `node_modules` are included, per `[GIT-06]`.

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[GIT-08]`) and is approved before the code merges.
