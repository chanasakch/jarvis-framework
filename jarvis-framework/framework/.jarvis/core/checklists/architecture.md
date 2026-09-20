# Architecture Checklist

<!-- Run by: {{name}}-architect / gatekeeper, against tech-spec.md, api-contract.yaml, migration-plan.md, ADRs, before plan starts. -->

## Blocking
- [ ] ARC-01 (auto) tech-spec.md exists with valid front matter and every required heading — Evidence: `docs/work/<ID>-<slug>/tech-spec.md`
- [ ] ARC-02 (auto) Every FR from prd.md appears in the FR → Component Mapping table — Evidence: `## FR → Component Mapping` `FR` column covers all `prd.md` FR IDs
- [ ] ARC-03 No SQL `JOIN` and no Mongo `$lookup` in the design unless an ADR exists [DB-01] [DB-10] — Evidence: `## Data Design` / `## Alternatives` — any JOIN/`$lookup` mention has a matching row in `## ADRs`
- [ ] ARC-04 (auto) Every Query-Index Matrix row names a supporting index and its evidence [DB-04] [DB-13] — Evidence: `## Query-Index Matrix` `index` and `evidence` columns non-empty per row, evidence shows `IXSCAN`
- [ ] ARC-05 Cache design present for every read path declared cacheable, with TTL, jitter, invalidation and stampede protection [CACHE-03] [CACHE-05] — Evidence: `## Cache Design` table `ttl`, `jitter`, `invalidated by`, `stampede protection` columns filled per key
- [ ] ARC-06 Validation rules present for every input field [SEC-01] — Evidence: `## Validation Rules` table has one row per field referenced in `## API Changes`
- [ ] ARC-07 (auto) Every new error code is listed with internal code, public key and HTTP status [ERR-02] — Evidence: `## Error Codes` table columns `internal code`, `public key`, `http` filled per row
- [ ] ARC-08 Logging plan covers every error boundary [LOG-04] — Evidence: `## Logging Plan` has one row per handler/service boundary named in `## FR → Component Mapping`
- [ ] ARC-09 Big-O stated for every non-trivial algorithm [PERF-01] — Evidence: `## Complexity Notes` `complexity` column filled for each listed function
- [ ] ARC-10 Authentication and authorization stated per endpoint [SEC-07] [SEC-08] — Evidence: `## Security` table `authn` and `authz rule` columns filled per endpoint row
- [ ] ARC-11 (auto) OpenAPI delta is valid YAML — Evidence: `api-contract.yaml` parses as YAML without error
- [ ] ARC-12 Migration plan with rollback exists when the item has a DB change — Evidence: `migration-plan.md` present with an "up" and "down"/rollback section, only required when intake.md `has_db_change` is true
- [ ] ARC-13 (auto) No `TBD`/`TODO`/`???` in tech-spec.md — Evidence: full-text scan of tech-spec.md
- [ ] ARC-14 [ADDED] Every pipeline stage and infrastructure resource in infra-plan.md cites the file it lives in [OPS-05] — Evidence: `## Current State`, `## Pipeline Changes` and `## Infrastructure Resources` file columns, only required when intake.md `has_infra_change` is true
- [ ] ARC-15 [ADDED] Deploy strategy, readiness gate and the exact reversing command are stated [OPS-07] [OPS-08] — Evidence: infra-plan.md `## Deploy Strategy`, only required when `has_infra_change` is true
- [ ] ARC-16 [ADDED] Every alert row carries a threshold, an owner and a runbook link [OPS-10] — Evidence: infra-plan.md `## SLOs and Alerts` owner and runbook columns, only required when `has_infra_change` is true
- [ ] ARC-17 [ADDED] No secret value appears in infra-plan.md; secrets are named with their store only [OPS-04] — Evidence: infra-plan.md `## Secrets and Config` source column

## Advisory
- [ ] ARC-50 [ADDED] Every ADR referenced in tech-spec.md actually exists in `docs/adr/` — Evidence: `## ADRs` table `ADR` column IDs match filenames under `docs/adr/`
- [ ] ARC-51 [ADDED] Performance budget cites `jarvis.config.yaml` values, not hardcoded numbers — Evidence: `## Performance Budget` `source` column reads `jarvis.config.yaml`
- [ ] ARC-52 Alternatives table lists at least one rejected option per major decision — Evidence: `## Alternatives` table non-empty
