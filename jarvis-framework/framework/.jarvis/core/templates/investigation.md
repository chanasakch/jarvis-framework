---
id: <PREFIX-NNN>
artifact: investigation
version: 1
status: draft
refs: [brief.md]
---

# Investigation — <short title>

## Mode <!-- required -->
<!-- State the single mode: bug, hotfix, refactor, performance, security, spike, or postmortem. -->
bug

## Summary <!-- required -->
<!-- Summarize the problem and current understanding in 2-3 sentences, no solution detail. -->
OTP verification intermittently rejects valid codes during peak login hours, since the rate-limit change shipped.

## Evidence <!-- required -->
<!-- One row per claim, with the exact evidence that supports it. -->
| claim | evidence (file:line / log / measurement) |
|---|---|
| OTP hash lookup misses a live cache entry | apps/auth-service/internal/otp/verify.go:88 |

## Findings <!-- required -->
<!-- One bullet per fact the evidence proves. -->
- Cache TTL (30s) expires before the OTP validity window (60s) ends, causing false negatives.

## Impact <!-- required -->
<!-- Quantify who/what is affected and how badly. -->
- ~4% of login attempts fail with `bmsg_otp_invalid` during peak hours (24h log sample).

## Options <!-- required -->
<!-- One row per fix option with effort, risk and trade-off. -->
| option | effort | risk | trade-off |
|---|---|---|---|
| Align cache TTL to OTP validity window | S | low | slightly higher cache memory use |

## Recommendation <!-- required -->
<!-- State the chosen option and why, one paragraph max. -->
Set cache TTL to 60s to match OTP validity; lowest effort, no schema or contract change.

## Open Questions <!-- required -->
<!-- One row per unresolved question that blocks a later phase. -->
| ID | question | blocks |
|---|---|---|
| Q-001 | Should OTP validity be configurable per tenant? | tech-spec |

## Root Cause
<!-- Include for bug/hotfix mode: trace the defect to its root cause with a five-whys list. -->
1. Why do valid OTPs get rejected? The cache entry expired before the validity window ended.
2. Why did it expire early? The TTL is hardcoded at 30s, independent of OTP validity.
3. Why are they independent? The cache TTL predates the configurable OTP validity setting.
4. Why wasn't this caught? No test asserts cache TTL >= OTP validity.
5. Why no test? The cache design had no coupling rule to validity in tech-spec.md.

## Parity Criteria
<!-- Include for refactor mode: behaviors that must remain observably identical, with verification method. -->
| behavior | verification |
|---|---|
| OTP verify returns the same public error keys | TC-021 parity suite |

## Baseline Measurements
<!-- Include for performance mode: current numbers before optimization. -->
| metric | method | value | target |
|---|---|---|---|
| OTP verify p95 latency | k6 load test, 50 rps | 340 ms | < 200 ms |

## Threat Assessment
<!-- Include for security mode: each attack vector with severity, affected asset, and containment. -->
| vector | severity | affected asset | containment |
|---|---|---|---|
| OTP brute force via missing rate limit | high | user session tokens | per-IP rate limit [SEC-07] |

## Timeline
<!-- Include for postmortem mode: chronological, blameless record with UTC timestamps. -->
- 2026-09-10 14:02 UTC — OTP failure-rate alert fired (error rate 4%, above 1% threshold).
