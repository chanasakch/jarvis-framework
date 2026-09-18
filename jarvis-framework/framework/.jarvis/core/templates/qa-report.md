---
id: <PREFIX-NNN>
artifact: qa-report
version: 1
status: draft
refs: [test-report.md, review-report.md]
---

# QA Report — OTP Login

## Traceability Matrix <!-- required -->
<!-- One row per AC: trace FR to story, AC, TC and result, with a code reference. -->
| FR | US | AC | TC | result | code refs |
|---|---|---|---|---|---|
| FR-003 | US-004 | AC-004-02 | TC-021 | pass | apps/api/internal/otp/service.go:88 |

## NFR Evidence <!-- required -->
<!-- One row per NFR with a measured value and the method used to measure it. -->
| NFR | target | measured | method | pass |
|---|---|---|---|---|
| NFR-002 | p95 < 200ms at 50rps | 140ms | k6 load test | yes |

## Open Issues <!-- required -->
<!-- List every unresolved defect or finding that is not fixed and not forced. -->
| ID | severity | type | status |
|---|---|---|---|
| D-005 | major | defect | open |

## Forced Gates <!-- required -->
<!-- Read this table from `jarvis.js status <ID> --json`; an empty table must say "none". -->
| phase | forced by | reason | unresolved | follow-up |
|---|---|---|---|---|
| review | jdoe | perf budget miss acceptable for launch | F-PERF-002 | CHR-004 |

## Go/No-Go <!-- required -->
<!-- State the decision, the conditions attached to it, and who makes the final call. -->
No-Go until D-005 is resolved or forced. Decision owner: the release approver in `gates.human_approval`.
