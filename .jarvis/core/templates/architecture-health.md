---
id: HEALTH-<YYYY-MM-DD>
artifact: architecture-health
version: 1
status: draft
refs: [tech-debt.md]
---

# Codebase Health — <YYYY-MM-DD>

## Scope <!-- required -->
<!-- What was examined and what was not. A report that does not say what it skipped cannot be trusted later. -->
| field | value |
|---|---|
| mode | full / delta / area |
| paths examined | `apps/api/internal/**`, `apps/web/src/**`, `packages/**` |
| paths skipped | `apps/web/src/generated/**` (codegen), vendored deps |
| previous report | `docs/architecture/health/<YYYY-MM-DD>.md` (32 days ago) |
| churn window | 90 days, 412 commits |
| sampling | every handler and service file read; React components sampled 20 of 74, highest-churn first |

## Headline <!-- required -->
<!-- Three to five lines. What changed since the last report, and the one thing most worth fixing. -->
- Layering holds everywhere except the reporting domain, which grew a second direct-to-repository path.
- Standards findings up 14 → 23, driven entirely by `[LOG-04]` double-logging in new code.
- `apps/api/internal/order/service.go` is the top hotspot: 38 commits, 3 open findings, 640 lines.

## ADR Drift <!-- required -->
<!-- One row per accepted ADR. "held" or "drifted", each cited on both sides. -->
| ADR | decision | status | evidence |
|---|---|---|---|
| ADR-0007 | no SQL JOIN; batched two-step fetch | drifted | `docs/adr/ADR-0007-no-joins.md:18` vs `apps/api/internal/report/repo.go:112` |
| ADR-0012 | all cache keys carry a version prefix | held | `apps/api/internal/cache/key.go:9` |

## Cross-Feature Consistency <!-- required -->
<!-- One row per mandated pattern. Name the majority pattern and every divergence. -->
| pattern | majority | divergences | finding |
|---|---|---|---|
| error construction | `apperr.New(code, ...)` in service layer, 11 of 13 domains | `report`, `billing` build errors in the handler | F-ARCH-002 |
| validation placement | struct tags at the handler boundary, 12 of 13 | `billing` validates in the service | F-ARCH-003 |

## Standards Erosion <!-- required -->
<!-- Lint findings now vs the previous report. Both numbers, both dates. -->
| rule | 2026-08-19 | 2026-09-20 | direction | note |
|---|---|---|---|---|
| LOG-04 | 3 | 11 | worsening | new order/payment code logs at both service and handler |
| GO-03 | 6 | 4 | improving | two resolved by FEAT-018 |

## Churn Hotspots <!-- required -->
<!-- Measured with git log, never estimated. -->
| file | commits | lines | open findings | note |
|---|---|---|---|---|
| `apps/api/internal/order/service.go` | 38 | 640 | 3 | five features edited it this quarter; no clear owner |

## Coupling and Boundaries <!-- required -->
<!-- Imports crossing a forbidden boundary [STR-01], and modules most of the codebase depends on. -->
| from | to | rule | finding |
|---|---|---|---|
| `internal/report/handler.go:41` | `internal/order/repo.go` | STR-01 handler must not reach a repository | F-ARCH-001 |

## Test and Coverage Trend <!-- required -->
<!-- Direction, not just level. Compare against quality.coverage_min and the previous report. -->
| layer | previous | current | minimum | direction |
|---|---|---|---|---|
| backend | 83% | 81% | 80% | falling, still above minimum |
| frontend | 71% | 74% | 70% | rising |

## Findings <!-- required -->
<!-- Every finding: ID, severity per conventions.md §4, the rule or ADR it violates, and file:line. -->
| ID | severity | rule / ADR | file:line | issue | proposed fix |
|---|---|---|---|---|---|
| F-ARCH-001 | major | STR-01 | `apps/api/internal/report/handler.go:41` | handler calls a repository directly, bypassing the service layer | add `report.Service`, move the query behind it |
| F-ARCH-002 | major | ERR-02 | `apps/api/internal/report/handler.go:58` | error built in the handler, so no registry code is attached | construct via `apperr.New` in the service |

## Tech Debt Register Changes <!-- required -->
<!-- What this report added, closed or re-estimated in docs/architecture/tech-debt.md. -->
| TD | change | note |
|---|---|---|
| TD-014 | opened | from F-ARCH-001 |
| TD-009 | resolved | layering fixed in FEAT-018, verified `apps/api/internal/user/handler.go:22` |

## Proposed Work Items <!-- required -->
<!-- Proposals only. This agent never runs `jarvis new`. -->
| TD | type | title | rationale |
|---|---|---|---|
| TD-014 | refactor | Route report reads through a service layer | unblocks caching and removes the last STR-01 violation |

## Open Questions <!-- required -->
<!-- One row per unresolved question. Never leave a TBD in the body. -->
| ID | question | owner |
|---|---|---|
| Q-001 | Is the reporting domain intended to stay read-only, or will it gain writes? | architecture |
