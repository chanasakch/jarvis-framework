# Requirements Checklist

<!-- Run by: jarvis-po / gatekeeper, against prd.md and stories.md, before business-flow starts. -->

## Blocking
- [ ] REQ-01 (auto) prd.md and stories.md exist with valid front matter and required headings — Evidence: `docs/work/<ID>-<slug>/prd.md`, `stories.md`
- [ ] REQ-02 (auto) Every FR has a MoSCoW priority — Evidence: `prd.md` `## Functional Requirements` `priority` column in {Must, Should, Could, Won't}
- [ ] REQ-03 (auto) Every Must-priority FR is referenced by ≥ 1 US — Evidence: `stories.md` `## Coverage` table row per Must FR with a non-empty `stories` cell
- [ ] REQ-04 (auto) Every US has ≥ 1 AC in Given/When/Then form — Evidence: each `### US-<NNN>` block's `#### Acceptance Criteria` table has Given/When/Then columns filled
- [ ] REQ-05 Every input-taking story has negative, validation AND error ACs — Evidence: that story's AC table has rows with `type` = negative, validation, and error
- [ ] REQ-06 ACs contain no vague words (fast, easy, proper, appropriate, good, robust, user-friendly) — Evidence: text scan of every AC row's Given/When/Then cells
- [ ] REQ-07 NFRs cover performance, security, logging/audit, data retention, availability — Evidence: `prd.md` `## Non-Functional Requirements` has one row per category with a measurable target
- [ ] REQ-08 (auto) Out of Scope section present and non-empty — Evidence: `prd.md` `## Out of Scope` has ≥ 1 bullet
- [ ] REQ-09 (auto) No `TBD`/`TODO`/`???` in prd.md or stories.md — Evidence: full-text scan of both files
- [ ] REQ-10 [ADDED] Every error AC names a public message key, never an internal detail — Evidence: error-type AC `Then` cell contains a `bmsg_*`/registry key, not a stack trace or internal code

## Advisory
- [ ] REQ-50 [ADDED] Every US is independently testable (INVEST) — Evidence: story block has no "depends on US-xxx being live" language in its AC
- [ ] REQ-51 Risks table entries have likelihood, impact, and mitigation filled — Evidence: `prd.md` `## Risks` table
- [ ] REQ-52 Dependencies section lists external dependencies, not internal tasks — Evidence: `prd.md` `## Dependencies`
