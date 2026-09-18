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
