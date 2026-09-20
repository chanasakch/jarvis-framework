# Jarvis Conventions

Single source of truth for IDs, artifact front matter, phase statuses, severity and writing rules.
Every agent, checklist and script references this file instead of redefining these terms.

## 1. IDs

| Scope | Format | Example |
|---|---|---|
| Work item | `<PREFIX>-<NNN>`, sequential per prefix, zero-padded to 3 | `FEAT-012` |
| Functional requirement | `FR-<NNN>` | `FR-003` |
| Non-functional requirement | `NFR-<NNN>` | `NFR-002` |
| User story | `US-<NNN>` | `US-004` |
| Acceptance criterion | `AC-<NNN>-<NN>` (story, criterion) | `AC-004-02` |
| Business rule | `BR-<NNN>` | `BR-007` |
| Screen / UX unit | `UX-<NNN>` | `UX-002` |
| Task | `T-<NNN>` | `T-011` |
| Fix task from review | `FIX-<finding-id>` | `FIX-F-SEC-001` |
| Test case | `TC-<NNN>` | `TC-021` |
| Review finding | `F-<REVIEWER>-<NNN>` | `F-SEC-001`, `F-PERF-002`, `F-STD-004`, `F-DB-003`, `F-OPS-001` |
| Codebase health finding | `F-ARCH-<NNN>` | `F-ARCH-002` |
| Tech debt entry (repo-wide) | `TD-<NNN>` | `TD-014` |
| Defect | `D-<NNN>` | `D-005` |
| Risk | `R-<NNN>` | `R-002` |
| Open question | `Q-<NNN>` | `Q-001` |
| ADR (repo-wide) | `ADR-<NNNN>` | `ADR-0007` |
| Standards rule | `<AREA>-<NN>` | `GO-03`, `DB-01`, `SEC-07` |
| Checklist item | `<PHASE>-<NN>` | `REQ-03`, `ARC-11` |

Reviewer codes: `STD` (standards), `PERF` (performance), `SEC` (security), `DB` (database),
`OPS` (devops, only when `has_infra_change` is true). `ARCH` is not a reviewer — it is the
cross-cutting codebase-health finding code used by `{{name}}-staff`, outside any work item's review.

Work item prefixes: `FEAT` feature · `ENH` enhancement · `BUG` bugfix · `HOT` hotfix · `REF` refactor ·
`PERF` performance · `SEC` security · `MIG` migration · `SPK` spike · `CHR` chore.

Standards areas: `STR` structure · `GO` coding-go · `RX` coding-react · `API` api · `DB` database ·
`CACHE` caching · `PERF` performance · `SEC` security · `ERR` error-handling · `LOG` logging ·
`TEST` testing · `DOC` documentation · `GIT` git · `OPS` devops.

**Cross-reference format in prose and tables:** square brackets — `[US-003]`, `[AC-003-01]`, `[ADR-0007]`, `[DB-01]`.
All IDs scoped to a work item are unique inside that work item only. `ADR-` IDs are unique repo-wide.

## 2. Artifact front matter

Every artifact in `docs/work/<ID>-<slug>/` and every ADR starts with exactly this block:

```yaml
---
id: FEAT-012
artifact: prd
version: 1
status: draft          # draft | final
refs: [brief.md]
---
```

- `id` — the owning work item ID (ADRs use their own `ADR-NNNN`).
- `artifact` — file name without extension (`prd`, `tech-spec`, `review-report`, …).
- `version` — integer, incremented on every rewrite after a gate failure.
- `status` — `draft` while the phase is in progress, `final` when the agent returns `DONE`.
- `refs` — file names of upstream artifacts actually read, relative to the work folder.

## 3. Phase statuses

| Status | Meaning | Set by |
|---|---|---|
| `pending` | Not started | CLI (default) |
| `in_progress` | Agent is working | Claude via `set` |
| `gate_failed` | Script or gatekeeper gate failed | Claude via `set` |
| `passed` | Both gates passed | Claude via `set` |
| `approved` | Human approved a `passed` phase | Human via `approve` |
| `forced` | Human forced past a failed gate | Human via `force` |
| `skipped` | Optional phase skipped | CLI (flag false) or human via `skip` |
| `blocked` | Waiting on an open question or external dependency | Claude via `set` |
| `parked` | Whole item paused | Human via `park` |

A phase unlocks the next when it is `approved` (when approval is required), `passed` (when it is not),
`forced`, or `skipped` (optional phases only).

## 4. Severity

Used by reviewers, the gatekeeper, lint rules and QA. Nothing else defines severity.

- **critical** — security vulnerability; data loss or corruption; an acceptance criterion is not met;
  internal error details returned to the client; external input used without validation or sanitization.
- **major** — violation of any MUST rule in the standards; SQL `JOIN` or Mongo `$lookup` without an ADR;
  a query not covered by an index; a query / HTTP / cache call inside a loop (N+1); O(n²) or worse on
  unbounded input where a better approach exists; a missing log at an error boundary; an error code not in
  the registry; an acceptance criterion with no test.
- **minor** — SHOULD violations, naming, readability, small duplication.
- **info** — suggestions, no action required.

`review.block_on` in `jarvis.config.yaml` decides which severities block a gate (default: critical, major).

## 5. Writing rules for artifacts

- English only. No filler, no restating the template, no "this document describes…".
- Tables over prose. Bullets over paragraphs. One line per fact.
- Mermaid for every diagram; no ASCII art, no images.
- No `TBD`, `TODO`, `???`, `N/A (to be decided)` in an artifact marked `final` — raise a `Q-<NNN>` open question instead.
- Every claim about the codebase cites `path/file.go:line`.
- Every requirement, rule and finding carries an ID so later phases can reference it.
- Quantify: "p95 < 200 ms at 50 rps", never "fast". Vague adjectives fail the gate.
- Never paste code into an artifact beyond the minimum needed to make a decision reviewable.
