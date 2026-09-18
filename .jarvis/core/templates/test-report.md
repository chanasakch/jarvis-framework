---
id: <PREFIX-NNN>
artifact: test-report
version: 1
status: draft
refs: [test-plan.md]
---

# Test Report — OTP Login

## Summary <!-- required -->
<!-- One line: overall pass/fail, TC counts, and the mode this report covers. -->
42/42 TCs passed, mode: standard.

## Results <!-- required -->
<!-- One row per TC from test-plan.md; evidence is a path to a log or CI run. -->
| TC | result | evidence |
|---|---|---|
| TC-021 | pass | ci-run-4821/otp_test.log:118 |

## Coverage <!-- required -->
<!-- Report measured coverage per layer against the configured minimum; pass means measured >= minimum. -->
| layer | coverage | minimum | pass |
|---|---|---|---|
| backend | 84% | 80% | yes |

## Defects <!-- required -->
<!-- List every failure as a defect, linked to the TC that caught it. -->
| ID | severity | description | TC | status |
|---|---|---|---|---|
| D-005 | major | OTP resend does not reset lockout counter | TC-021 | open |

## Regression Evidence
<!-- mode: regression — prove the test fails on the pre-fix commit; give the exact procedure and the failing output. -->
```
git worktree add ../pre-fix HEAD~1
cd ../pre-fix && go test ./internal/otp/... -run TestVerifyOTP_Expired -v
--- FAIL: TestVerifyOTP_Expired (0.02s) expected 400, got 500
```

## Parity Evidence
<!-- mode: refactor — show old vs new behavior producing identical output for the same inputs. -->
| TC | old behavior | new behavior | match |
|---|---|---|---|
| TC-021 | 400 bmsg_otp_invalid | 400 bmsg_otp_invalid | yes |

## Benchmarks
<!-- mode: performance — before/after numbers against the configured budget. -->
| benchmark | before | after | budget | pass |
|---|---|---|---|---|
| POST /v1/otp/verify p95 | 260ms | 140ms | 200ms | yes |

## Exploit Evidence
<!-- mode: security — show the exploit failing after the fix, with request and response. -->
```
curl -d "otp=' OR '1'='1" /v1/otp/verify -> 400 bmsg_validation_error
```

## Migration Evidence
<!-- mode: migration — show up, down, idempotency, and a re-run on already-migrated data. -->
```
migrate up:   0007_add_otp_index.up.sql applied, 0 errors
migrate down: reverts cleanly
re-run up:    no-op on already-migrated data, 0 errors
```
