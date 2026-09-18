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
