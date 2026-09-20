---
id: <PREFIX-NNN>
artifact: infra-plan
version: 1
status: draft
refs: [tech-spec.md]
---

# Infrastructure Plan — <short title>

## Current State <!-- required -->
<!-- What exists today. One row per pipeline/IaC/manifest file this change touches, each cited path:line. A repo with none of these says so plainly. -->
| area | file | what it does today |
|---|---|---|
| CI | `.github/workflows/api.yml:1` | build + test on push, no deploy job |
| IaC | `infra/terraform/api/main.tf:12` | ECS service, 2 tasks, no autoscaling |
| Manifest | `deploy/k8s/api-deployment.yaml:24` | rolling update, no resource limits |

## Pipeline Changes <!-- required -->
<!-- One row per stage added or modified. `blocked by` is the verification set that must pass first [OPS-01]. -->
| stage | trigger | blocked by | permissions | change |
|---|---|---|---|---|
| test | push, PR | — | `contents: read` | add the OTP integration suite |
| deploy-staging | merge to main | test, lint | `contents: read, id-token: write` | new job, OIDC to AWS |

## Infrastructure Resources <!-- required -->
<!-- One row per resource added, changed or removed. State backend must be remote, locked and encrypted [OPS-05]. -->
| resource | action | IaC file | notes |
|---|---|---|---|
| `aws_elasticache_replication_group.otp` | add | `infra/terraform/otp/redis.tf` | 2 nodes, encryption at rest |

State backend: `s3://acme-tfstate/otp/terraform.tfstate`, DynamoDB lock table `tf-locks`, `encrypt = true`.
Apply path: plan posted on the PR, apply runs from CI on `main` only `[OPS-06]`.

## Deploy Strategy <!-- required -->
<!-- Named strategy, readiness gate, concurrency group and the exact reversing command [OPS-07] [OPS-08] [OPS-13]. -->
- Strategy: rolling, `maxUnavailable: 0`, `maxSurge: 1`.
- Readiness gate: `/readyz` (checks MySQL + Redis), rollout waits for ready before shifting traffic.
- Liveness: `/healthz`, process only.
- Concurrency group: `deploy-production`, `cancel-in-progress: false`.
- Reverse with: `kubectl rollout undo deployment/api --to-revision=<n>`.
- Previous artifact: image digest recorded in release-notes.md, retained 90 days.

## Secrets and Config <!-- required -->
<!-- Name and source only. A value here fails the gate [OPS-04]. -->
| name | source | environments | consumed by |
|---|---|---|---|
| `SMS_PROVIDER_TOKEN` | AWS Secrets Manager `prod/otp/sms` | staging, production | api deployment env |

## Observability <!-- required -->
<!-- RED metrics by route and status, log fields, trace propagation [OPS-09]. -->
| signal | metric / field | labels | emitted by |
|---|---|---|---|
| Rate | `http_requests_total` | `route`, `status` | api middleware |
| Errors | `http_requests_total{status=~"5.."}` | `route` | api middleware |
| Duration | `http_request_duration_seconds` (histogram) | `route` | api middleware |
| Logs | `trace_id`, `request_id`, `error_code` | — | slog, per `[LOG-03]` |

Trace propagation: incoming `traceparent` forwarded to MySQL, Redis and the SMS provider client.

## SLOs and Alerts <!-- required -->
<!-- One row per alert. Symptom-based, each with owner and runbook [OPS-10]. -->
| alert | signal | threshold | window | severity | owner | runbook |
|---|---|---|---|---|---|---|
| OTP send failure rate | `sms_send_failed / sms_send_total` | > 2% | 15m | page | platform | `docs/work/<ID>-<slug>/runbook.md` |

## Resource Sizing <!-- required -->
<!-- Requests and limits per workload [OPS-12]. -->
| workload | cpu request | cpu limit | memory request | memory limit | replicas |
|---|---|---|---|---|---|
| api | 100m | 500m | 128Mi | 512Mi | 3 |

## Performance Budget <!-- required -->
<!-- Cite jarvis.config.yaml, never a hardcoded number. -->
| metric | budget | source |
|---|---|---|
| api p95 | `quality.perf_budget.api_p95_ms` | `jarvis.config.yaml` |

## Risks <!-- required -->
<!-- One row per infrastructure risk, with its mitigation. -->
| ID | risk | impact | mitigation |
|---|---|---|---|
| R-001 | Redis eviction drops in-flight OTP codes | users must re-request a code | `maxmemory-policy noeviction`, alert on memory > 80% |

## Open Questions <!-- required -->
<!-- One row per unresolved question that blocks a later phase. Never leave a TBD in the body. -->
| ID | question | blocks |
|---|---|---|
| Q-001 | Is there an existing Grafana folder for this service, or does this change create one? | release |
