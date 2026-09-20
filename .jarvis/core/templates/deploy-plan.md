---
id: <PREFIX-NNN>
artifact: deploy-plan
version: 1
status: draft
refs: [infra-plan.md, qa-report.md]
---

# Deploy Plan — <short title>

## Artifact <!-- required -->
<!-- The one artifact promoted across every environment. A per-environment rebuild fails the gate [OPS-11]. -->
| field | value |
|---|---|
| image | `ghcr.io/acme/api@sha256:8c9183f715b0…` |
| built by | `.github/workflows/api.yml` run #1482 |
| commit | `a1b2c3d` |
| previous artifact | `ghcr.io/acme/api@sha256:3f01aa7c9b22…` (rollback target) |

## Promotion Order <!-- required -->
<!-- Environments in order, each with its gate. Same artifact throughout. -->
| # | environment | gate to enter | approver |
|---|---|---|---|
| 1 | staging | test + lint green on `main` | automatic |
| 2 | production | staging soak 30m, no alert fired | human, release owner |

## Pre-deploy Checks <!-- required -->
<!-- Each with an explicit pass/fail criterion. -->
| # | check | command | pass criterion |
|---|---|---|---|
| 1 | migrations applied and reversible | `make migrate-status` | every migration `applied`, each has a `down` |
| 2 | secret present in target env | `aws secretsmanager describe-secret --secret-id prod/otp/sms` | exists, rotated < 90d |
| 3 | previous artifact addressable | `crane digest ghcr.io/acme/api:prev` | digest resolves |

## Deploy Steps <!-- required -->
<!-- Copy-pasteable commands, each with its expected result. -->
| # | step | command | expected result |
|---|---|---|---|
| 1 | apply infra | CI job `terraform-apply` on `main` | plan matches the PR plan, apply clean |
| 2 | roll out api | `kubectl set image deployment/api api=ghcr.io/acme/api@sha256:8c91…` | rollout completes, all pods ready |
| 3 | verify readiness | `kubectl rollout status deployment/api --timeout=300s` | `successfully rolled out` |

## Post-deploy Checks <!-- required -->
<!-- The error_code log query, the p95 check against the config budget, and the alerts that must stay silent. -->
| # | check | query / command | pass criterion |
|---|---|---|---|
| 1 | no new error codes | `{service="api"} \| json \| error_code!="" \| error_code=~"OTP_.*"` | rate flat vs the previous hour |
| 2 | p95 within budget | `histogram_quantile(0.95, http_request_duration_seconds)` | below `quality.perf_budget.api_p95_ms` |
| 3 | alerts silent | Alertmanager, 30m after rollout | `OTP send failure rate` did not fire |

## Rollback Drill <!-- required -->
<!-- What was actually run, where, and the result. An undrilled rollback is recorded as unverified — never as tested. -->
| field | value |
|---|---|
| drilled | yes / no — if no, write "unverified" and say why |
| where | staging, 2026-09-18 |
| command | `kubectl rollout undo deployment/api --to-revision=41` |
| result | traffic restored to the previous digest in 38s, no 5xx during the switch |
| data impact | none — the migration is additive and the previous build ignores the new column |

## Alert Verification <!-- required -->
<!-- Proof each new alert can fire and reaches its owner. -->
| alert | verified how | result | owner notified |
|---|---|---|---|
| OTP send failure rate | forced a provider 500 in staging | fired in 4m, routed to `#platform-oncall` | yes |

## Open Questions <!-- required -->
<!-- One row per unresolved question. Never leave a TBD in the body. -->
| ID | question | blocks |
|---|---|---|
| Q-001 | Who approves the production promotion outside business hours? | release |
