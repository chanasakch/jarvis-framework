# Business Flow Checklist

<!-- Run by: {{name}}-ba / gatekeeper, against business-flow.md (refs stories.md), before ux/architecture starts. -->

## Blocking
- [ ] BF-01 (auto) business-flow.md exists with valid front matter and required headings — Evidence: `docs/work/<ID>-<slug>/business-flow.md`
- [ ] BF-02 Every US in stories.md appears in a flowchart or a sequence diagram — Evidence: each `US-<NNN>` ID or its labeled step appears inside a `## To-Be Flowchart` or `## Sequence Diagrams` mermaid block
- [ ] BF-03 Every BR is traced to an FR or a US — Evidence: `## Business Rules` table `refs` column cites `[FR-...]` or `[US-...]`
- [ ] BF-04 Edge cases include failure paths (timeout, downstream error, invalid input) — Evidence: `## Edge Cases` table has at least one row per failure category
- [ ] BF-05 (auto) Every diagram is a fenced ```mermaid block of a valid type (flowchart, sequenceDiagram, stateDiagram-v2) — Evidence: every fenced code block in the file
- [ ] BF-06 [ADDED] Every state in a state diagram is reachable and has an exit — Evidence: `## State Diagrams` block, every node has an incoming transition and an outgoing transition or `[*]` end
- [ ] BF-07 [ADDED] Every decision node has all branches labelled — Evidence: every `{...}` decision node in a flowchart has labelled `-->|...|` edges covering yes/no or equivalent outcomes
- [ ] BF-08 (auto) No `TBD`/`TODO`/`???` in the artifact — Evidence: full-text scan of business-flow.md

## Advisory
- [ ] BF-50 As-Is Flowchart present for enhancement/refactor work items — Evidence: `## As-Is Flowchart` section populated when work type is ENH or REF
- [ ] BF-51 Business Rules IDs are sequential and unique within the file — Evidence: `## Business Rules` `ID` column, `BR-<NNN>` sequence
