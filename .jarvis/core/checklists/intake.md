# Intake Checklist

<!-- Run by: orchestrator, against intake.md, before the request advances to brief. -->

## Blocking
- [ ] INT-01 (auto) intake.md exists with valid front matter (id, artifact, version, status, refs) — Evidence: `docs/work/<ID>-<slug>/intake.md` front matter block
- [ ] INT-02 [ADDED] Request restated in one sentence, not copy-pasted verbatim only — Evidence: `## Request` has a paraphrase line in addition to any quote
- [ ] INT-03 Work Type states a type and a one-sentence justification — Evidence: `## Work Type` "Type: <PREFIX> — <justification>" line
- [ ] INT-04 All nine flags are set to true/false with a source — Evidence: `## Flags` table has 9 rows (has_ui, has_api_change, has_db_change, has_mysql, has_mongo, changes_flow, design_change, touches_auth, touches_pii), each with a non-empty `source` cell
- [ ] INT-05 Title is 8 words or fewer — Evidence: `# Intake — <short title>` heading, count words after the dash
- [ ] INT-06 [ADDED] Initial Scope has an explicit out-of-scope line — Evidence: `## Initial Scope` contains a bullet starting "Out of scope:" or a dedicated exclusion bullet
- [ ] INT-07 [ADDED] A work item ID exists in `.jarvis/state/` — Evidence: `.jarvis/state/<ID>.yaml` (or equivalent state file) exists matching the front matter `id`
- [ ] INT-08 (auto) No `TBD`/`TODO`/`???` in the artifact — Evidence: full-text scan of intake.md

## Advisory
- [ ] INT-50 Open Questions table rows each name a blocking phase — Evidence: `## Open Questions` `blocks` column non-empty per row
- [ ] INT-51 [ADDED] Flag sources reference a concrete fact, not "assumed" — Evidence: `source` column text in Flags table
