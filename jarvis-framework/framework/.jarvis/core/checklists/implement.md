# Implement Checklist

<!-- {{name}}-gatekeeper runs this against impl-log.md and the touched source tree, using plan.md as the upstream artifact. -->

## Blocking
- [ ] IMP-01 (auto) `jarvis.js check backend` exits 0 when any task touches backend — Evidence: check command output/exit code
- [ ] IMP-02 (auto) `jarvis.js check frontend` exits 0 when any task touches frontend — Evidence: check command output/exit code
- [ ] IMP-03 (auto) `jarvis.js lint --changed` reports no critical or major findings — Evidence: lint output
- [ ] IMP-04 (auto) every task in plan.md has status `done` in the state file — Evidence: `.jarvis/state/<ID>.json` `tasks` map vs plan.md Tasks table
- [ ] IMP-05 (auto) impl-log.md has exactly one entry per completed task — Evidence: impl-log.md `### T-xxx` headings vs plan.md Tasks table IDs
- [ ] IMP-06 (auto) every new error code used in code exists in the registry [ERR-02] — Evidence: `packages/errors/registry.yaml` vs code usage cited in impl-log.md
- [ ] IMP-07 (auto) `docs/architecture/query-index-matrix.md` updated for every new or changed query [DB-04] — Evidence: matrix rows vs impl-log.md `Files changed`
- [ ] IMP-08 [ADDED] every new query has a migration adding its index when one was missing — Evidence: matrix new row's index column vs new migration file in `migrations_mysql`/`migrations_mongo`
- [ ] IMP-09 [ADDED] no file outside task scope changed without a note in impl-log — Evidence: impl-log.md `Deviations` field vs plan.md `files/areas` column and `git diff --stat`
- [ ] IMP-10 [ADDED] every non-trivial loop carries a `// Complexity:` comment [GO-09] — Evidence: impl-log.md `Complexity notes` field and cited source line

## Advisory
- [ ] IMP-50 impl-log `Decisions` field documents the rationale for any deviation — Evidence: impl-log.md `Decisions` column
- [ ] IMP-51 [ADDED] commits follow Conventional Commits with work item and task ID [GIT-02] — Evidence: `git log` subject lines
