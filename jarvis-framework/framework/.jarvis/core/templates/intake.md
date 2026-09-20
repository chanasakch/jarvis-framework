---
id: <PREFIX-NNN>
artifact: intake
version: 1
status: draft
refs: []
---

# Intake — <short title>

## Request <!-- required -->
<!-- One line: quote or paraphrase the raw request verbatim. -->
- "Users should be able to log in with a one-time code sent by SMS instead of a password."

## Work Type <!-- required -->
<!-- State the work type and justify it in one sentence. -->
Type: FEAT — new capability (OTP login does not exist today, no bug to fix).

## Flags <!-- required -->
<!-- List all ten flags with their resolved value and the source of that value. -->
| flag | value | source |
|---|---|---|
| has_ui | true | new login screen required |
| has_api_change | true | new `/auth/otp/*` endpoints |
| has_db_change | true | new `otp_codes` table |
| has_mysql | true | otp_codes stored in MySQL |
| has_mongo | false | no document store involved |
| changes_flow | true | replaces password step in login flow |
| design_change | true | new UX screens for code entry |
| touches_auth | true | modifies login/session issuance |
| touches_pii | true | phone number used for delivery |
| has_infra_change | true | new SMS provider secret and rate-limit rule in the deploy config |

## Initial Scope <!-- required -->
<!-- One bullet per item explicitly in scope for this work item. -->
- Replace password login with SMS OTP for the web app login screen.

## Open Questions <!-- required -->
<!-- One row per unresolved question that blocks a later phase. -->
| ID | question | blocks |
|---|---|---|
| Q-001 | Which SMS provider is approved for production? | brief |
