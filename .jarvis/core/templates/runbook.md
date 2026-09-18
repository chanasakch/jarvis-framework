---
id: <PREFIX-NNN>
artifact: runbook
version: 1
status: draft
refs: [release-notes.md, migration-plan.md]
---

# Runbook — OTP Login

## Pre-deploy Checks <!-- required -->
<!-- List checks to run before deploying, each with a pass/fail criterion. -->
- [ ] `jarvis.js status FEAT-012 --json` shows phase `release` as `approved`.

## Deploy Steps <!-- required -->
<!-- Numbered list; every step is a copy-pasteable command plus its expected result. -->
1. `kubectl apply -f deploy/otp-service.yaml` — expected: `deployment.apps/otp-service configured`.
2. `kubectl rollout status deployment/otp-service` — expected: `successfully rolled out`.

## Migration Order <!-- required -->
<!-- One row per migration in the order it must run, relative to deploy. -->
| order | migration | db | run by | reversible |
|---|---|---|---|---|
| 1 | 0007_add_otp_index | mysql | CI migrate job | yes |

## Verification <!-- required -->
<!-- List concrete checks confirming the deploy succeeded, with expected values. -->
- `curl -s https://api/v1/health` returns `{"data":{"status":"ok"}}`.

## Monitoring <!-- required -->
<!-- Include the log query filtered by error_code and the p95 latency check against the config budget. -->
| signal | where | query | alert threshold |
|---|---|---|---|
| error rate | Datadog logs | `service:otp-service error_code:OTP_INVALID` | > 50/min for 5m |
| latency | Datadog metrics | p95(otp.verify.latency) vs `api_p95_ms` budget | > 200ms for 5m |

## Rollback Steps <!-- required -->
<!-- Numbered list, one command plus expected result per step; rollback must be verified, not assumed. -->
1. `kubectl rollout undo deployment/otp-service` — expected: `deployment.apps/otp-service rolled back`.
2. `curl -s https://api/v1/health` — expected: `{"data":{"status":"ok"}}`, confirming rollback took effect.
