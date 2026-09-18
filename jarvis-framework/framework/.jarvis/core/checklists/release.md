# Release Checklist

<!-- {{name}}-gatekeeper runs this against release-notes.md and runbook.md, using qa-report.md as the upstream artifact. -->

## Blocking
- [ ] REL-01 rollback steps are present and each was verified, not assumed — Evidence: runbook.md Rollback Steps and Verification sections
- [ ] REL-02 migration order is stated with direction and reversibility for every migration — Evidence: runbook.md Migration Order table
- [ ] REL-03 config and env changes are listed with old and new values — Evidence: release-notes.md Config Changes table
- [ ] REL-04 monitoring names the log query filtered by `error_code` and the p95 latency check against the config budget — Evidence: runbook.md Monitoring table
- [ ] REL-05 (auto) forced gates are listed in release-notes.md — Evidence: release-notes.md Forced Gates table vs `jarvis.js status <ID> --json`
- [ ] REL-06 (auto) a CHANGELOG entry was written in Keep a Changelog format — Evidence: CHANGELOG.md new entry
- [ ] REL-07 [ADDED] every deploy step is a copy-pasteable command with its expected result — Evidence: runbook.md Deploy Steps list
- [ ] REL-08 [ADDED] a runbook exists when the item has a DB change or is a migration-type item — Evidence: state file `flags.has_db_change` vs runbook.md file existence
- [ ] REL-09 [ADDED] suggested updates to `.jarvis/project/context.md` are listed — Evidence: release-notes.md Notes/Summary section

## Advisory
- [ ] REL-50 Known Issues table lists open defects or advisory findings shipping with this release — Evidence: release-notes.md Known Issues table
- [ ] REL-51 [ADDED] each Pre-deploy Check carries a pass/fail criterion — Evidence: runbook.md Pre-deploy Checks list
