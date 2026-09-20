---
id: TECH-DEBT
artifact: tech-debt
version: 1
status: final
refs: []
---

# Tech Debt Register

Repo-wide and long-lived. Maintained by `{{name}}-staff`; every entry originates in a dated report
under `docs/architecture/health/`. `TD-` IDs are unique repo-wide and are never reused.
A resolved entry stays, with its resolution date and evidence — the history is the point.

## Open <!-- required -->
<!-- Impact and effort are the scheduling inputs; both are required. Effort: S < 1d, M 1-3d, L > 3d. -->
| ID | title | severity | impact | effort | first seen | source | proposed item |
|---|---|---|---|---|---|---|---|
| TD-014 | Report handlers bypass the service layer | major | blocks caching; two more domains copied the pattern | M | 2026-09-20 | F-ARCH-001 | REF |
| TD-011 | Order service has no owner and five callers | minor | every change risks a regression nobody reviews | L | 2026-07-14 | F-ARCH-004 | REF |

## Resolved <!-- required -->
<!-- Never deleted. Evidence is the file:line or work item that closed it. -->
| ID | title | opened | resolved | closed by | evidence |
|---|---|---|---|---|---|
| TD-009 | User handler queried the repository directly | 2026-06-02 | 2026-09-12 | FEAT-018 | `apps/api/internal/user/handler.go:22` |

## Trend <!-- required -->
<!-- One row per report date. Open count by severity, so the direction is visible at a glance. -->
| report | critical | major | minor | total open |
|---|---|---|---|---|
| 2026-08-19 | 0 | 3 | 6 | 9 |
| 2026-09-20 | 0 | 4 | 6 | 10 |
