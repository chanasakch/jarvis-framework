# QA Checklist

<!-- jarvis-gatekeeper runs this against qa-report.md, using test-report.md and review-report.md as upstream artifacts. -->

## Blocking
- [ ] QA-01 (auto) the Traceability Matrix has a row for every FR → US → AC → TC with a result — Evidence: qa-report.md Traceability Matrix vs prd.md/stories.md/test-plan.md
- [ ] QA-02 every Must-priority FR is covered by ≥ 1 passing row — Evidence: Traceability Matrix `result` column filtered to Must FRs
- [ ] QA-03 (auto) every AC has a passing TC — Evidence: Traceability Matrix `AC`/`result` columns
- [ ] QA-04 no open critical or major finding or defect except ones listed under Forced Gates — Evidence: Open Issues table vs Forced Gates table
- [ ] QA-05 NFR Evidence has a measured number for every NFR carrying a target — Evidence: NFR Evidence table `measured` column
- [ ] QA-06 Go/No-Go states the decision, conditions and the decider — Evidence: Go/No-Go section
- [ ] QA-07 [ADDED] (auto) Forced Gates table matches `jarvis.js status <ID> --json` — Evidence: Forced Gates table vs status --json output
- [ ] QA-08 [ADDED] parity evidence is attached when the work item type is `REF` — Evidence: test-report.md Parity Evidence table
- [ ] QA-09 [ADDED] (auto) every defect `D-xxx` is closed or accepted with a follow-up work item — Evidence: Open Issues table `status` column vs follow-up ID

## Advisory
- [ ] QA-50 Open Issues table states severity and type for every unresolved item — Evidence: qa-report.md Open Issues table
- [ ] QA-51 [ADDED] NFR Evidence `method` column names a reproducible tool or command — Evidence: NFR Evidence table `method` column
