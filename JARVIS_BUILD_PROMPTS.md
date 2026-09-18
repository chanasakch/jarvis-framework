# Jarvis — Build Prompts (สำหรับวางใน Claude Code ทีละขั้น)

## วิธีใช้

1. วาง `JARVIS_SPEC.md` ไว้ที่ root ของ repo
2. สร้าง branch `chore/jarvis-setup`
3. เปิด Claude Code ใน terminal ของ Cursor โดยตั้ง `JARVIS_DEV=1` ไว้ เพื่อให้ hook ไม่ block ตอนสร้าง framework:
   `JARVIS_DEV=1 claude`
4. ใช้โมเดลที่เก่งที่สุดที่มีตอนสร้าง framework (ทำครั้งเดียว คุ้มค่า)
5. วาง prompt ทีละขั้น ตรวจผลแล้ว commit ก่อนไปขั้นถัดไป
6. **Restart Claude Code** หลังขั้น 9, 13 และ 14 เพื่อให้โหลด hooks, agents และ commands ใหม่
7. ถ้าอยากแก้มาตรฐานของทีม ให้แก้ใน `JARVIS_SPEC.md` ก่อน แล้วค่อยสั่งสร้างไฟล์

---

## Prompt 0 — Kickoff (ใช้ครั้งแรกครั้งเดียว)

```
Read JARVIS_SPEC.md fully. We will build the Jarvis framework step by step.

Rules for every step:
- Follow the spec exactly. If something is ambiguous or conflicts, list it and ask me before deciding.
- All files in English, concise, no filler.
- Only create the files requested in the current step.
- At the end of each step, output: (1) files created/changed, (2) a self-check table mapping each requirement of the relevant spec sections to where it is satisfied, (3) open questions.
- Do not start the next step until I send it.

For now: summarize your understanding of the architecture in ≤15 bullets and list any ambiguities in the spec.
```

---

## Prompt 1 — Foundation

```
Step 1 — Foundation. Spec sections: 2, 3, 6, 9.

Create:
1. jarvis.config.yaml exactly per section 3 (keep comments).
2. CLAUDE.md: ≤25 lines. States the project uses Jarvis, all work starts with /jarvis, documents are English, imports @.jarvis/core/rules/conventions.md and @.jarvis/project/context.md only.
3. .jarvis/VERSION (1.0.0) and .jarvis/package.json (private, dependency: yaml).
4. Root package.json: add script "jarvis": "node .jarvis/scripts/jarvis.js" (do not change anything else).
5. .jarvis/core/rules/conventions.md: full content of section 6 (IDs, front matter, statuses, severity, writing rules).
6. .jarvis/core/rules/orchestration.md: full content of section 9 incl. Handoff Brief, Status Report and the Gate Failure Menu from 8.1 and force rules from 8.2.
7. .jarvis/project/context.md: placeholder with the section headings /jarvis-init will fill (Stack, Repo Map, Domains, Existing Patterns, Glossary).
8. .gitignore: add .claude/settings.local.json.

Acceptance: conventions.md and orchestration.md are self-contained (an agent reading only them knows every ID format, status, severity and the full orchestration loop).
```

---

## Prompt 2 — Standards A (structure, Go, React, API)

```
Step 2 — Standards A. Spec sections: 12 (structure, coding-go, coding-react, api), 13 (envelope only).

Create in .jarvis/standards/: structure.md, coding-go.md, coding-react.md, api.md.

Every file must:
- Start with a 3-line purpose + scope.
- Contain rules with IDs (STR-, GO-, RX-, API-), each marked MUST or SHOULD.
- Give a short ✅ / ❌ code example for every MUST rule (Go or TSX as relevant).
- End with "Exceptions: require an ADR referencing the rule ID."
- Include every rule listed in the spec for that file; you may add best-practice rules, marked [ADDED] so I can review them.

Specifics:
- structure.md: include the full tree from the spec, dependency direction diagram (Mermaid), what belongs in each Go file of a domain package, and frontend feature-folder contents.
- coding-go.md: include context/timeouts, error wrapping → AppError, goroutine lifecycle, map lookups instead of nested loops, preallocation, Complexity comments, golangci-lint linters list.
- coding-react.md: TanStack Query, Zod, error message-key map usage, DOMPurify rule, virtualization, code splitting, a11y.
- api.md: success/error envelopes, cursor pagination (with example request/response), idempotency, versioning, per-endpoint timeout/rate-limit documentation.

Acceptance: a reviewer agent can cite a rule ID for any violation; no rule is vague ("fast", "clean") without a measurable criterion.
```

---

## Prompt 3 — Standards B (database, caching, performance, security)

```
Step 3 — Standards B. Spec section 12: database.md, caching.md, performance.md, security.md.

Same file format rules as Step 2 (IDs DB-, CACHE-, PERF-, SEC-; MUST/SHOULD; ✅/❌ examples; Exceptions line; [ADDED] marker).

Specifics:
- database.md:
  - MySQL no-JOIN rule with the two approved alternatives (denormalization, batched IN two-step fetch) — show a Go repository example of the batched approach.
  - Index rules with how to produce EXPLAIN evidence; MongoDB ESR rule with example; explain() IXSCAN evidence.
  - Mongo operator-injection prevention example.
  - Migration rules (golang-migrate up/down for MySQL; Mongo migration scripts incl. index creation).
  - Query-Index Matrix format (table columns: path/endpoint, DB, query shape, sort, index, evidence) and its location.
- caching.md: cache-aside Go example with singleflight + TTL jitter + invalidation on write; key format; failure degradation.
- performance.md: Big-O rules with examples of redundant loop → single pass and nested loop → map; no calls in loops; pagination; bounded concurrency; budgets read from jarvis.config.yaml.
- security.md: input validation matrix (type/length/format/range/enum) using go-playground/validator; sanitization per sink (SQL, Mongo, HTML, logs); authn/authz + IDOR example; secrets; PII masking; rate limit; headers/CORS; password hashing; uploads; PDPA notes.

Acceptance: every major/critical severity in conventions.md maps to at least one rule ID here or in Step 2 files.
```

---

## Prompt 4 — Standards C (errors, logging, testing, docs, git, lint rules)

```
Step 4 — Standards C. Spec sections 12 and 13.

Create:
1. .jarvis/standards/error-handling.md — full section 13: registry schema, public-key rules (default bmsg_error), response envelope, Go flow (repository → service → middleware) with code for an apperror package API (New, Wrap, Is, HTTP mapping) and the response middleware that logs once and returns the public envelope, frontend key → i18n mapping, codegen, CI checks. Rule IDs ERR-.
2. .jarvis/standards/logging.md — required fields, mandatory log points, levels, forbidden data, slog setup example, request middleware example, "log once at boundary" example vs anti-example. Rule IDs LOG-.
3. .jarvis/standards/testing.md — rule IDs TEST-; table-driven example; testcontainers example outline; Testing Library example; Playwright scope; regression/parity/benchmark/migration test expectations.
4. .jarvis/standards/documentation.md and git.md (DOC-, GIT-).
5. .jarvis/standards/lint-rules.yaml — rules from the spec plus any others you can check reliably by regex (mark [ADDED] in desc). Include the suppression syntax doc as a comment header.
6. packages/errors/registry.yaml — seed with INTERNAL_ERROR, VALIDATION_FAILED, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, RATE_LIMITED, CONFLICT, each with public key, http, level, description.

Do NOT generate application code in apps/ — examples live inside the standards docs only.
```

---

## Prompt 5 — Templates

```
Step 5 — Templates. Spec sections 6.2 and 14.

Create every template listed in section 14 in .jarvis/core/templates/.

Each template:
- Starts with the front matter block (6.2) with placeholders.
- Every required section heading followed by <!-- required -->.
- Under each heading: one-line HTML comment instruction + one example row/line (for tables) using the correct ID format.
- Stays short: the template defines structure, not essays.

tech-spec.md must contain dedicated sections/tables for: FR → Component Mapping, Query-Index Matrix, Cache Design, Validation Rules, Error Codes (internal → public → http), Logging Plan, Complexity Notes.

Acceptance: validate.js (Step 8) can extract required headings by scanning for <!-- required -->; every ID example matches conventions.md.
```

---

## Prompt 6 — Checklists

```
Step 6 — Checklists. Spec section 15.

Create one checklist per phase in .jarvis/core/checklists/ (intake, brief, requirements, business-flow, ux, investigation, architecture, plan, implement, test, review, qa, release, postmortem).

Format:
# <Phase> Checklist
## Blocking
- [ ] <PREFIX>-01 <verifiable statement> — Evidence: <what to look at>
## Advisory
- [ ] <PREFIX>-50 ...

Rules:
- Include every Blocking item from the spec; add more where the standards demand (mark [ADDED]).
- Each item is yes/no verifiable; no subjective wording.
- Mark items that validate.js checks deterministically with (auto); the gatekeeper still confirms them.
- investigation and test checklists have mode-specific subsections (bug, hotfix, refactor, baseline, threat, spike, postmortem / standard, regression, parity, benchmark, exploit, migration).

Acceptance: item IDs unique across all checklists.
```

---

## Prompt 7 — Workflows

```
Step 7 — Workflows. Spec sections 4 and 5.

Create .jarvis/core/workflows/<type>.yaml for all 10 work types using the schema in 4.4.

For every phase specify: id, agent/agents/owner, mode, requires, inputs, outputs, template, checklist, standards (only the files that agent needs), approval (if different from config default), optional_if_false (if optional), deterministic_checks (implement/test), parallel/blocking_reviewers/on_fail (review).

Special cases:
- hotfix: review blocking_reviewers: [security, standards]; postmortem phase deferrable: 3d.
- spike: ends after investigation; outputs spike-report.md; no implement.
- migration: review blocking includes database; release requires runbook.md.
- security: review.security.critical is non-forceable (reference config).

Also create .jarvis/core/workflows/README.md: a table of type → phases (generated from the files) for humans.

Acceptance: every agent named exists in section 10; every template/checklist file referenced exists from Steps 5–6.
```

---

## Prompt 8 — Scripts (CLI + validation)

```
Step 8 — Scripts. Spec sections 7, 8, 16.1, 16.2 (guard.js is Step 9).

Create .jarvis/scripts/jarvis.js and lib/state.js, lib/workflow.js, lib/validate.js, lib/lint.js, lib/check.js, lib/review.js.

Requirements:
- Node 18+, only dependency `yaml`. No other packages.
- Implement every subcommand in 16.1 with --json output, exit codes 0/1/2, and audit log lines per 7.2.
- Human-only commands: approve, force, skip, reopen, park, unpark. force: --reason required; items in gates.non_forceable need --accept-risk; creates follow-up CHR item with unresolved issue IDs; adds warning to state.
- set: allowed transitions only (cannot set approved/forced/skipped).
- next: resolves requires, optional_if_false against flags, approval waits, implement task loop, review on_fail loop-back; returns JSON per section 9 step 3.
- validate: all checks in 16.2; returns {pass, issues:[{rule, file, line?, message}]}.
- lint: apply lint-rules.yaml with glob paths/exclude; --changed uses git diff vs merge-base with origin/main (fallback HEAD); suppression requires existing ADR with status accepted.
- merge-review: parse the JSON block in each review/<reviewer>.md, write review-report.md from template, verdict fail if any finding severity ∈ review.block_on from a blocking reviewer.
- ID allocation safe for teams: scan existing state files for max number per prefix.
- git user.name recorded for human actions.

Tests: .jarvis/scripts/test/*.test.js with node:test covering: new/next across a feature workflow, optional phase skip via flags, approval wait, force with/without reason and accept-risk, validate missing heading/TBD/uncovered AC, lint JOIN detection and ADR suppression, merge-review verdict. Run them and show results.
```

---

## Prompt 9 — Guard + Hooks

```
Step 9 — Guard and hooks. Spec sections 16.3 and 17.

First, check the current Claude Code hooks documentation format (stdin JSON fields, exit code 2 behavior, matcher syntax, SessionStart output) and tell me if anything in the spec differs.

Then create:
1. .jarvis/scripts/guard.js implementing G1–G5 and post mode. Messages to stderr must tell Claude what to do instead (e.g. "Human-only command. Ask the user to run: ! npm run -s jarvis -- approve <ID> <phase>").
2. .claude/settings.json with the hooks from section 17 plus a permissions block allowing Bash(node .jarvis/scripts/jarvis.js:*), Bash(git diff:*), Bash(git log:*) and the configured check commands.
3. Tests in .jarvis/scripts/test/guard.test.js feeding sample hook JSON for each rule (blocked and allowed cases), incl. JARVIS_DEV=1 bypass for G1.

Run tests and show results. Remind me to restart Claude Code.
```

---

## Prompt 10 — Agents 1 (gatekeeper, analyst, po, ba, ux)

```
Step 10 — Agents batch 1. Spec sections 10.1–10.3.

Create in .claude/agents/: jarvis-gatekeeper.md, jarvis-analyst.md, jarvis-po.md, jarvis-ba.md, jarvis-ux.md.

Each file:
- Frontmatter: name, description (1–2 sentences: what + when; the orchestrator routes on this), tools (exact minimal set from spec), model (from jarvis.config.yaml models).
- Sections exactly: Role, Modes (if any), Inputs, Outputs, Process (numbered), Must, Must Not, Self-Check, Return Format.
- Inputs: "Only files listed in the Handoff Brief plus the standards it names. Read the template and checklist before writing."
- Self-Check: run every Blocking item of the phase checklist; fix before returning; list remaining failures in self_check.
- Return Format: exact RESULT block from 10.2 (gatekeeper uses its JSON verdict instead).
- ≤ 120 lines per file. Reference standards by path instead of repeating their rules.

jarvis-po must describe full, delta and lite modes precisely.
```

---

## Prompt 11 — Agents 2 (investigator, architect, planner)

```
Step 11 — Agents batch 2: jarvis-investigator.md, jarvis-architect.md, jarvis-planner.md.

Same structure rules as Step 10.

- investigator: one subsection per mode (bug, hotfix, refactor, baseline, threat, spike, postmortem) with required evidence; Bash restricted to read-only commands listed in the spec; explicit "never modify source".
- architect: modes full, lite, migration; Process must start with reading project/context.md and scanning relevant code; must produce every tech-spec section listed in 10.3; must update docs/architecture/query-index-matrix.md proposal section; must create ADR files for decisions/exceptions; lite mode = which sections may be abbreviated (never Query-Index Matrix, Validation Rules, Error Codes).
- planner: task table rules, layer separation, ordering, max_task_loc from config, FIX-<finding> tasks when review loops back.
```

---

## Prompt 12 — Agents 3 (dev-backend, dev-frontend, tester)

```
Step 12 — Agents batch 3: jarvis-dev-backend.md, jarvis-dev-frontend.md, jarvis-tester.md.

Same structure rules as Step 10.

- dev-backend: implements exactly the task in the Handoff Brief; Process = read task + spec sections for it → read listed standards → write code + tests → run `node .jarvis/scripts/jarvis.js check backend` and `lint --changed` → fix until green → append impl-log entry. Must/Must Not exactly per spec (no JOIN/$lookup, index per query, no calls in loops, registry errors, log once at boundary, validation + sanitization, Complexity comments, cache per spec).
- dev-frontend: same pattern with check frontend; message-key error display; Zod; TanStack Query; DOMPurify; virtualization; a11y per ux-spec.
- tester: all modes; must not modify production code; defects as D-xxx; regression fail-before evidence procedure (e.g. run test against the commit before the fix using git stash/worktree and record output).
```

---

## Prompt 13 — Agents 4 (reviewers, qa, release)

```
Step 13 — Agents batch 4: jarvis-review-standards.md, jarvis-review-performance.md, jarvis-review-security.md, jarvis-review-database.md, jarvis-qa.md, jarvis-release.md.

Reviewers:
- Tools: Read, Grep, Glob, Bash limited to git diff/log/show.
- Scope: `git diff <base>...HEAD` given in the Handoff Brief; review only changed code plus direct callers when needed.
- Focus list exactly per spec 10.3 for each reviewer, each item referencing rule IDs from the standards files.
- Output: review/<reviewer>.md with findings table + the JSON block from 10.3 (must be parseable by merge-review).
- Severity strictly per conventions.md; no finding without rule ID and file:line.
- performance reviewer must state Big-O for every changed function that loops over collections.

qa and release per spec, including Forced Gates sections read from state via `jarvis.js status <ID> --json`.

Remind me to restart Claude Code.
```

---

## Prompt 14 — Commands

```
Step 14 — Commands. Spec section 11 and 9.

Create in .claude/commands/: jarvis.md, jarvis-init.md, jarvis-status.md, jarvis-new.md, jarvis-run.md, jarvis-review.md, jarvis-gate.md, jarvis-explain.md, jarvis-help.md.

jarvis.md (orchestrator):
- Frontmatter: description, argument-hint, allowed-tools per spec.
- Pre-exec status: !`node .jarvis/scripts/jarvis.js status --brief`
- Body: instruct to follow @.jarvis/core/rules/orchestration.md exactly; include the hard rules list and the Status Report requirement inline (short) so they are never missed.
- Explicitly: invoke reviewers in parallel (multiple Task calls in a single message); implement one task per subagent call.

jarvis-init.md: repo scan procedure, fills project/context.md, runs `jarvis.js doctor`, scaffolds missing registry/lint rules, reports missing tools with install hints.

Other commands: thin wrappers that reuse orchestration.md logic for a single phase / item, never bypassing requires or gates.

jarvis-help.md: table of slash commands + human-only CLI commands with examples.

Verify command frontmatter and argument syntax against current Claude Code docs. Remind me to restart Claude Code.
```

---

## Prompt 15 — Consistency Audit

```
Step 15 — Consistency audit. Do not create new features.

Check and report in a table (check, result, fix applied):
1. Every path referenced in any framework file exists.
2. Every agent referenced in workflows exists, and tools in frontmatter match the spec.
3. Every template referenced exists and has <!-- required --> markers.
4. Checklist item IDs unique; every checklist referenced exists.
5. Every rule ID cited in agents/checklists exists in standards.
6. Severity definitions identical everywhere (only defined in conventions.md, referenced elsewhere).
7. Config keys used by scripts exist in jarvis.config.yaml.
8. All script tests pass.
9. Total size of CLAUDE.md + conventions.md (always-loaded context) — report token estimate; reduce if > 3k tokens.

Fix issues found, then summarize.
```

---

## Prompt 16 — Dry Run (หลัง restart และ unset JARVIS_DEV)

เปิด Claude Code ใหม่ **โดยไม่ตั้ง** `JARVIS_DEV` แล้วรันทีละข้อ:

```
/jarvis-init
```

```
/jarvis Add user profile API and profile page: users can view and edit display name and avatar URL. Store profile in MySQL, cache profile reads.
```

ระหว่างทางให้ทดสอบ:
- ตอบคำถาม intake แล้วดูว่า requirements หยุดรอ approve
- ลองสั่งในแชทว่า "approve it for me" ต้องถูก guard block
- รัน `! npm run -s jarvis -- approve <ID> requirements`
- ตอน review ถ้า gate ไม่ผ่าน ลอง force โดยไม่ใส่ `--reason` ต้องไม่ผ่าน แล้วลองใหม่แบบใส่ reason
- ตรวจว่ามี CHR follow-up และคำเตือนแสดงใน qa-report และ release-notes

จากนั้นทดสอบ bug และ spike:

```
/jarvis BUG: profile update returns 500 when avatar URL is empty
```

```
/jarvis Spike: evaluate Redis vs in-memory cache for profile reads
```

ปิดท้ายด้วย prompt นี้:

```
Based on the dry runs, list friction points and gate false-positives/negatives. Propose concrete edits (file + change). Do not apply until I approve.
```

---

## Prompt 17 — Team Ready (ทำเมื่อพร้อมใช้ทั้งทีม)

```
Step 17 — Team packaging. Spec section 18.

1. Create a separate folder `jarvis-framework/` (to become its own repo) containing framework-owned files with {{name}} placeholders in file names and content, plus templates for project-owned files.
2. bin/cli.js with `init --name <name>` (never overwrite project-owned files) and `upgrade` (replace framework-owned files only, print diff summary, bump VERSION).
3. `jarvis.js ci --base <ref>` for PR checks + an example GitHub Actions / GitLab CI job.
4. CODEOWNERS entries and a PR template showing work item ID, phase statuses and forced gates.
5. README for the team: install, daily usage, human-only commands, how to propose standard changes (PR to .jarvis/standards with ADR when relaxing a rule).
```