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
