# Jarvis Orchestration Protocol

Read by `/{{name}}` in the main session. The orchestrator delegates; it never does phase work itself
(intake is the only exception). Subagents cannot spawn subagents, so every delegation happens here.

## 0. Hard rules (never violated)

1. Never do phase work yourself — only intake.
2. Never edit `.jarvis/state/**`. The CLI owns it.
3. Never run human-only CLI commands (`approve`, `force`, `skip`, `reopen`, `park`, `unpark`).
   `guard.js` blocks them. Print the command for the user instead.
4. Never paste artifact contents into a Handoff Brief — pass file paths only.
5. Never skip `requires`, gates or approvals, even when the user asks to "just continue".
6. Summarize each agent result in ≤ 5 lines.
7. End every turn with the Status Report (§4).

## 1. Startup

1. Read `jarvis.config.yaml` and `.jarvis/core/rules/conventions.md`.
2. Run `node .jarvis/scripts/jarvis.js status --json` for the current picture.
3. Resolve the input:
   - Text request → new work item (§2).
   - Work item ID → resume that item.
   - Empty → resume the most recently active item; if none, ask what to build.
4. If the item has forced gates, print `⚠️ <ID> has N forced gate(s): <phases>` before anything else,
   and repeat it at every later step for that item.

## 2. Intake (the only phase the orchestrator performs)

1. Classify the work type from the table below and state a one-line justification. Confirm with the user.
2. Ask the flag questions — **max 5, numbered, in one message**. Only ask flags that the type actually uses;
   infer the obvious ones from the request and state the inference instead of asking.
   Flags: `has_ui`, `has_api_change`, `has_db_change`, `has_mysql`, `has_mongo`, `changes_flow`,
   `design_change`, `touches_auth`, `touches_pii`.
3. `node .jarvis/scripts/jarvis.js new <type> "<title>" --flags k=v,k=v --json`.
4. Write `docs/work/<ID>-<slug>/intake.md` from `.jarvis/core/templates/intake.md`.
5. Gate it like any other phase (§5).

| Type | Prefix | Use when |
|---|---|---|
| feature | FEAT | New capability |
| enhancement | ENH | Change to an existing capability |
| bugfix | BUG | Defect, not urgent |
| hotfix | HOT | Production incident, urgent |
| refactor | REF | Internal change, no behavior change |
| performance | PERF | Measurable speed / resource improvement |
| security | SEC | Vulnerability fix or hardening |
| migration | MIG | Schema or data migration |
| spike | SPK | Time-boxed research, no production code |
| chore | CHR | Dependency, config, CI, tooling, docs |

## 3. Main loop

Repeat until approval is required, a gate fails past `max_retries`, an agent is BLOCKED, or the item is done.

1. `jarvis.js next <ID> --json` → `{action, phase, agent|agents, mode, requires, inputs, outputs, templates, checklist, standards, approval}`.
   - `action: awaiting_approval` → print the approval command, stop.
   - `action: done` → print the summary, stop.
   - `action: blocked` → print what is missing, stop.
   - `action: run_phase` → continue.
2. `jarvis.js set <ID> <phase> in_progress`.
3. Delegate with the Task tool using the **Handoff Brief** (§3.1).
   - **implement:** read `plan.md`, run tasks in `depends_on` order, **one task per subagent call**, routed by
     task `layer` (backend → `{{name}}-dev-backend`, frontend → `{{name}}-dev-frontend`). After each task run
     `jarvis.js check <layer>` and `jarvis.js lint --changed`, then `jarvis.js task <ID> <T-xxx> done`.
     Gate the phase only after every task is done.
   - **review:** invoke all reviewers from `review.reviewers` **in parallel — multiple Task calls in a single
     message**. Each writes `docs/work/<ID>-<slug>/review/<reviewer>.md`. Then `jarvis.js merge-review <ID>`.
     Verdict `fail` → set the phase back to `implement` with each blocking finding as a `FIX-<finding-id>` task.
4. Agent returns `BLOCKED` with `open_questions` → ask the user (numbered, one message) → re-send the same
   Handoff Brief with `user_answers` filled in.
5. Agent returns `DONE` → run the Gate Protocol (§5).
6. Continue to the next phase automatically.

### 3.1 Handoff Brief format

```
HANDOFF
work_item: FEAT-012 (feature) "OTP login"
phase: architecture | mode: full
flags: has_ui=true has_db_change=true has_mysql=true has_mongo=false
read:
  - docs/work/FEAT-012-otp-login/prd.md
  - docs/work/FEAT-012-otp-login/stories.md
  - .jarvis/project/context.md
standards: [.jarvis/standards/api.md, .jarvis/standards/database.md]
template: .jarvis/core/templates/tech-spec.md
checklist: .jarvis/core/checklists/architecture.md
write:
  - docs/work/FEAT-012-otp-login/tech-spec.md
task: (implement only) T-003
previous_gate_issues: none | [list]
user_answers: none | [list]
```

`read`, `standards`, `template`, `checklist` and `write` come verbatim from `jarvis.js next`.
Add nothing else — an agent that needs more must ask via `open_questions`.

## 4. Status Report (end of every turn)

```
── JARVIS ─────────────────────────────
Item:   FEAT-012 OTP login (feature)
Phase:  architecture → passed (attempt 1) ✅
Waiting: human approval
Next:   ! npm run -s {{name}} -- approve FEAT-012 architecture
Warnings: none
───────────────────────────────────────
```

## 5. Gate Protocol

1. Agent returns `status: DONE`.
2. **Script gate:** `jarvis.js validate <ID> <phase> --json`.
3. FAIL → send the issues back to the *same* agent with `previous_gate_issues`; `attempts++`;
   `jarvis.js set <ID> <phase> gate_failed`.
4. **Agent gate:** invoke `{{name}}-gatekeeper` with the artifacts, the phase checklist and the upstream artifacts.
5. Gatekeeper FAIL → same as step 3.
6. `attempts == gates.max_retries` → STOP and print the Gate Failure Menu (§5.1).
7. PASS → `jarvis.js set <ID> <phase> passed`. If the phase requires approval → STOP and print the approval
   command. Otherwise continue to the next phase.

### 5.1 Gate Failure Menu (print exactly this shape)

```
⚠️  GATE FAILED: FEAT-012 / review (attempt 3/3)
Blocking issues:
  - [F-SEC-001][critical] Raw DB error returned in POST /v1/otp response
  - [F-PERF-002][major] Query inside loop in otp/service.go:88
Risk if forced: <one or two lines>
Options:
  1) Retry — send issues back to the agent (resets attempts)
  2) Fix manually, then run: /{{name}} FEAT-012
  3) Force pass (human only, audited):
     ! npm run -s {{name}} -- force FEAT-012 review --reason "<why>"
  4) Park work item:
     ! npm run -s {{name}} -- park FEAT-012 --reason "<why>"
```

If the user asks to force at any other moment, print this same menu with the current issues. Never force yourself.

### 5.2 Force rules

- CLI only, human only. `guard.js` blocks Claude from running it.
- `--reason` is mandatory. Items listed in `gates.non_forceable` (`review.security.critical`,
  `qa.acceptance_failed`) additionally require `--accept-risk`.
- The CLI records `forced_by` (git `user.name`), timestamp, reason and unresolved issue IDs, and
  auto-creates a follow-up `CHR` work item listing them.
- Forced gates must appear in the **Forced Gates** section of `qa-report.md` and `release-notes.md`.
- Show `⚠️ <ID> has N forced gate(s): <phases>` at every later step for that item.

### 5.3 Approve, skip, reopen, park (human only — print, never run)

| Intent | Command |
|---|---|
| Approve a `passed` phase | `! npm run -s {{name}} -- approve <ID> <phase>` |
| Skip an optional phase | `! npm run -s {{name}} -- skip <ID> <phase> --reason "<why>"` |
| Redo a phase and everything after it | `! npm run -s {{name}} -- reopen <ID> <phase>` |
| Pause / resume an item | `! npm run -s {{name}} -- park <ID> --reason "<why>"` / `unpark <ID>` |

## 6. Agent result format (all agents return this)

```
RESULT
status: DONE | BLOCKED
artifacts: [paths]
summary: <≤5 lines>
open_questions: [Q-001: ...] | none
self_check: pass | [failed item IDs]
```

Subagents cannot talk to the user. Anything they need from the user arrives as `open_questions` and is
asked by the orchestrator.
