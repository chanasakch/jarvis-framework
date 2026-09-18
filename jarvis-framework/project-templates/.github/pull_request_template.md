## Work item

- **ID:** <!-- FEAT-012 — must match the branch name -->
- **Type:** <!-- feature | enhancement | bugfix | hotfix | refactor | performance | security | migration | spike | chore -->
- **Title:**

## Phase status

Paste the output of `npm run -s {{name}} -- status <ID>`.

| phase | status | approved by |
|---|---|---|
| requirements | | |
| architecture | | |
| implement | | |
| test | | |
| review | | |
| qa | | |
| release | | |

Every phase must be `approved`, `passed`, `forced` or `skipped`. `npm run -s {{name}} -- ci --base origin/main`
checks this and fails the PR otherwise.

## Forced gates

<!-- Copy the Forced Gates table from qa-report.md. Write "none" when there are none. -->

| phase | forced by | reason | unresolved | follow-up item |
|---|---|---|---|---|
| none | | | | |

## Checks

- [ ] `npm run -s {{name}} -- ci --base origin/main` passes
- [ ] `npm run -s {{name}} -- lint --changed` has no critical or major findings
- [ ] Backend and frontend checks pass (`{{name}} -- check all`)
- [ ] Artifacts committed under `docs/work/<ID>-<slug>/`
- [ ] `docs/architecture/query-index-matrix.md` updated if any query changed
- [ ] `packages/errors/registry.yaml` updated if any new error code is returned
- [ ] Every standards exception has an accepted ADR in `docs/adr/`

## Notes for the reviewer

<!-- What to look at first. Anything the gates could not judge. -->
