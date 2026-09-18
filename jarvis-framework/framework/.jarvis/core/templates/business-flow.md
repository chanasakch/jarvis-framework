---
id: <PREFIX-NNN>
artifact: business-flow
version: 1
status: draft
refs: [stories.md]
---

# Business Flow — <short title>

## Flow Overview <!-- required -->
<!-- One line: describe the end-to-end flow this document covers. -->
- User requests an OTP, receives it by SMS, and submits it to complete login.

## To-Be Flowchart <!-- required -->
<!-- One Mermaid flowchart showing the target-state flow. -->
```mermaid
flowchart TD
  A[Submit phone] --> B[Send OTP]
  B --> C{Code valid?}
  C -->|Yes| D[Session issued]
  C -->|No| E[Show bmsg_otp_invalid]
```

## As-Is Flowchart
<!-- Include only for enhancement and refactor work; show the current-state flow being changed. -->
```mermaid
flowchart TD
  A[Submit password] --> B{Valid?}
  B -->|Yes| C[Session issued]
  B -->|No| D[Show bmsg_login_invalid]
```

## Sequence Diagrams <!-- required -->
<!-- One Mermaid sequence diagram per key interaction between actors/systems. -->
```mermaid
sequenceDiagram
  participant U as User
  participant A as AuthService
  participant S as SMSProvider
  U->>A: POST /auth/otp/request
  A->>S: Send OTP
  U->>A: POST /auth/otp/verify
  A-->>U: Session token
```

## State Diagrams <!-- required -->
<!-- One Mermaid state diagram per entity with meaningful lifecycle states. -->
```mermaid
stateDiagram-v2
  [*] --> Requested
  Requested --> Verified: correct code
  Requested --> Expired: timeout
```

## Business Rules <!-- required -->
<!-- One row per rule with the requirement/story it implements and where it is enforced. -->
| ID | rule | refs | enforced in |
|---|---|---|---|
| BR-001 | OTP expires 5 minutes after issuance | [FR-001] | auth-service |

## Edge Cases <!-- required -->
<!-- One row per edge case with its trigger and expected behavior. -->
| case | trigger | expected behavior | refs |
|---|---|---|---|
| OTP resent before expiry | user requests new code while one is active | previous code is invalidated | [BR-001] |
