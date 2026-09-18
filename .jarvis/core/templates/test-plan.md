---
id: <PREFIX-NNN>
artifact: test-plan
version: 1
status: draft
refs: [stories.md, tech-spec.md]
---

# Test Plan — OTP Login

## Scope <!-- required -->
<!-- State what is in and out of scope for this cycle, and the mode (standard/regression/parity/benchmark/exploit/migration). -->
In scope: OTP request and verify endpoints [US-004]. Out of scope: password login (unchanged).

## Strategy <!-- required -->
<!-- List the test layers used and why, referencing the coverage minimums from config. -->
- Unit (Go table-driven): service and validation logic, target 80% backend coverage.
- Integration (testcontainers MySQL): OTP repository read/write paths.
- Component (Testing Library): OTP form states.
- E2E (Playwright): full login-with-OTP happy and error path.

## Test Cases <!-- required -->
<!-- Every AC needs at least one TC; the TC ID must appear in the test name or a comment in the test code so the gate can trace it. -->
| TC | AC refs | type | steps | expected | automated |
|---|---|---|---|---|---|
| TC-021 | AC-004-02 | integration | POST /v1/otp/verify with expired code | 400 bmsg_otp_invalid | yes |

## Test Data <!-- required -->
<!-- Describe fixtures/seed data needed, and how sensitive data (OTP, PII) is faked, not real. -->
Seeded user `user_test_004` with a pre-expired OTP row loaded from fixture `otp_expired.sql`.

## Environment <!-- required -->
<!-- List every dependency the test suite needs and how it is started for this run. -->
| dependency | how it runs |
|---|---|
| MySQL | testcontainers, ephemeral per run |
| MongoDB | testcontainers, ephemeral per run |
| Redis | testcontainers, ephemeral per run |
| browser | Playwright, headless Chromium |
