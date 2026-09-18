# Investigation Checklist

<!-- Run by: jarvis-investigator / gatekeeper, against investigation.md or spike-report.md, before architecture/plan starts. -->

## Blocking
- [ ] INV-01 (auto) investigation.md (or spike-report.md) exists with valid front matter and required headings — Evidence: `docs/work/<ID>-<slug>/investigation.md`
- [ ] INV-02 Every claim in Evidence cites file:line, a log line, or a measurement — Evidence: `## Evidence` table `evidence` column matches `path/file:line` or a quoted log/measurement, no prose-only claims
- [ ] INV-03 Root cause is a cause, not a symptom: removing it would prevent the failure — Evidence: `## Findings` / `## Root Cause` states a mechanism whose removal plausibly prevents the observed `## Impact`
- [ ] INV-04 Mode is stated and matches exactly one of bug, hotfix, refactor, performance, security, spike, postmortem — Evidence: `## Mode` single value
- [ ] INV-05 Options table has effort, risk and trade-off for every option, and Recommendation names the chosen option — Evidence: `## Options` table + `## Recommendation` paragraph
- [ ] INV-06 (auto) No `TBD`/`TODO`/`???` in the artifact — Evidence: full-text scan of investigation.md

### Mode-specific
- [ ] INV-07 [bug]/[hotfix] Reproduction steps, expected vs actual, and a five-whys chain are present — Evidence: `## Root Cause` five-whys list of ≥ 3 steps ending at a fixable cause
- [ ] INV-08 [refactor] Behavior inventory and parity criteria with a verification method are present — Evidence: `## Parity Criteria` table, `behavior` + `verification` columns filled
- [ ] INV-09 [baseline]/[performance] Measurement method, current numbers, and target are present, with the same method to be reused after the change — Evidence: `## Baseline Measurements` table `method`, `value`, `target` columns filled
- [ ] INV-10 [threat]/[security] Attack vector, severity, affected assets, and containment are present — Evidence: `## Threat Assessment` table, all columns filled
- [ ] INV-11 [spike] Time-box, options compared, recommendation, and an ADR draft are present — Evidence: `## Options` + `## Recommendation` plus a draft ADR referenced or attached
- [ ] INV-12 [postmortem] Timeline with UTC timestamps, blameless wording, and action items created as work items — Evidence: `## Timeline` bullets carry `YYYY-MM-DD HH:MM UTC`; no named-individual blame language

## Advisory
- [ ] INV-50 Impact is quantified (percentage, count, or rate), not just described — Evidence: `## Impact` bullet contains a number
- [ ] INV-51 Open Questions name the phase they block — Evidence: `## Open Questions` `blocks` column non-empty
