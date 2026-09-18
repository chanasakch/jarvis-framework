---
id: <PREFIX-NNN>
artifact: release-notes
version: 1
status: draft
refs: [qa-report.md]
---

# Release Notes — OTP Login

## Summary <!-- required -->
<!-- One or two lines: what shipped and why, in user-facing terms. -->
Adds OTP-based login as an alternative to password login [FEAT-012].

## Changes <!-- required -->
<!-- One row per user-visible or code change; type is feat/fix/perf/security/chore. -->
| type | description | refs |
|---|---|---|
| feat | add OTP request and verify endpoints | FR-003, US-004 |

## API Changes <!-- required -->
<!-- One row per endpoint added, changed or removed; breaking is yes/no. -->
| method | path | change | breaking |
|---|---|---|---|
| POST | /v1/otp/verify | new endpoint | no |

## Migrations <!-- required -->
<!-- One row per migration shipped with this release. -->
| migration | db | direction | reversible |
|---|---|---|---|
| 0007_add_otp_index | mysql | up | yes |

## Config Changes <!-- required -->
<!-- One row per config/env key added, changed or removed. -->
| key | old | new | applies to |
|---|---|---|---|
| OTP_TTL_SECONDS | none | 300 | apps/api |

## Known Issues <!-- required -->
<!-- List open defects or advisory findings shipping with this release. -->
| ID | severity | description | status |
|---|---|---|---|
| D-005 | major | OTP resend does not reset lockout counter | open |

## Forced Gates <!-- required -->
<!-- Read this table from `jarvis.js status <ID> --json`; an empty table must say "none". -->
| phase | forced by | reason | unresolved | follow-up |
|---|---|---|---|---|
| review | jdoe | perf budget miss acceptable for launch | F-PERF-002 | CHR-004 |
