---
id: <PREFIX-NNN>
artifact: prd
version: 1
status: draft
refs: [brief.md]
---

# PRD — <short title>

## Overview <!-- required -->
<!-- One line: summarize what this feature does and why, no implementation detail. -->
- Replace password login with SMS one-time-code (OTP) authentication for the web app.

## Goals & Success Metrics <!-- required -->
<!-- One row per goal with a measurable success metric. -->
| goal | metric | target |
|---|---|---|
| Cut password-reset tickets | tickets/month | ≤ 200 |

## Personas <!-- required -->
<!-- One bullet per persona this feature serves. -->
- Returning user: logs in from a trusted device weekly, wants minimal friction.

## Functional Requirements <!-- required -->
<!-- One row per requirement with a MoSCoW priority and references. -->
| ID | description | priority | refs |
|---|---|---|---|
| FR-001 | System sends a 6-digit OTP via SMS on login attempt | Must | [Q-001] |

## Non-Functional Requirements <!-- required -->
<!-- One row per category: performance, security, logging/audit, data retention, availability. -->
| ID | category | requirement | measurable target |
|---|---|---|---|
| NFR-001 | performance | OTP delivery latency | p95 < 5s at 50 rps |
| NFR-002 | security | OTP entropy and expiry | 6 digits, single-use, expires in 5 min |
| NFR-003 | logging/audit | OTP verification attempts logged | 100% of attempts with request_id |
| NFR-004 | data retention | OTP codes purged after use/expiry | purged within 24h |
| NFR-005 | availability | OTP issuance endpoint uptime | 99.9% monthly |

## Out of Scope <!-- required -->
<!-- One bullet per item explicitly excluded from this work item. -->
- Password login removal for legacy mobile app versions.

## Dependencies <!-- required -->
<!-- One bullet per external dependency this work relies on. -->
- Approved SMS provider contract and API credentials.

## Risks <!-- required -->
<!-- One row per risk with likelihood, impact, and mitigation. -->
| ID | risk | likelihood | impact | mitigation |
|---|---|---|---|---|
| R-001 | SMS provider outage blocks all logins | low | high | fallback to email OTP |

## Open Questions <!-- required -->
<!-- One row per unresolved question that blocks a later phase. -->
| ID | question | blocks |
|---|---|---|
| Q-001 | Which SMS provider is approved for production? | tech-spec |
