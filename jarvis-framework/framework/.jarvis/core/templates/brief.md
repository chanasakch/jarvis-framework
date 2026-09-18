---
id: <PREFIX-NNN>
artifact: brief
version: 1
status: draft
refs: [intake.md]
---

# Brief — <short title>

## Problem <!-- required -->
<!-- One line: state the problem with no proposed solution. -->
- Users abandon login when they forget passwords, generating 30% of support tickets.

## Users & Stakeholders <!-- required -->
<!-- One bullet per user group or stakeholder affected by this work. -->
- End users logging into the web app; Support team handling password-reset tickets.

## Goals & Metrics <!-- required -->
<!-- One row per goal with a measurable target and current baseline. -->
| goal | metric | baseline | target |
|---|---|---|---|
| Reduce login support load | password-reset tickets/month | 1,200 | 200 |

## Constraints <!-- required -->
<!-- One bullet per hard constraint (technical, legal, timeline, budget). -->
- Must comply with existing PII data-retention policy for phone numbers.

## Assumptions <!-- required -->
<!-- One bullet per assumption made in scoping this work. -->
- All active users have a verified phone number on file.

## Impacted Systems <!-- required -->
<!-- One row per system/service touched, with the code path and nature of impact. -->
| system | path | impact |
|---|---|---|
| auth-service | apps/auth-service | new OTP issuance and verification endpoints |

## Open Questions <!-- required -->
<!-- One row per unresolved question carried forward from intake or newly raised. -->
| ID | question | blocks |
|---|---|---|
| Q-001 | Which SMS provider is approved for production? | prd |
