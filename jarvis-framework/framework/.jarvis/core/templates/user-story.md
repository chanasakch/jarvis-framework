---
id: <PREFIX-NNN>
artifact: stories
version: 1
status: draft
refs: [prd.md]
---

# Stories — <short title>

## Stories <!-- required -->
<!-- Repeat this block once per story; keep IDs sequential. -->

### US-001 — Log in with SMS OTP
As a registered user
I want to receive a one-time code by SMS
So that I can log in without remembering a password

FR refs: [FR-001]
Priority: Must
Size: M

#### Acceptance Criteria
<!-- One row per criterion; cover happy, negative, validation, and error types. -->
| ID | type | Given | When | Then |
|---|---|---|---|---|
| AC-001-01 | happy | a registered user with a verified phone | they request an OTP and enter the correct code | they are logged in and a session is issued |
| AC-001-02 | validation | a user on the OTP entry screen | they submit a code with fewer than 6 digits | the field shows a validation error and no request is sent |
| AC-001-03 | negative | a user with an expired OTP | they submit the expired code | login is rejected and a new code can be requested |
| AC-001-04 | error | the SMS provider is unreachable | the user requests an OTP | the user sees `bmsg_otp_invalid` and can retry |

Notes:
- None.

## Coverage <!-- required -->
<!-- One row per Must-priority FR, listing every story that covers it. -->
| FR | stories |
|---|---|
| FR-001 | US-001 |
