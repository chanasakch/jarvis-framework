---
id: <PREFIX-NNN>
artifact: spike-report
version: 1
status: draft
refs: [brief.md]
---

# Spike Report — <short title>

## Questions <!-- required -->
<!-- One row per question this spike must answer, with an ID. -->
| ID | question |
|---|---|
| Q-001 | Can a managed OTP provider replace our custom SMS delivery service? |

## Time-box <!-- required -->
<!-- State the agreed time-box and the start date. -->
3 days, started 2026-09-15.

## Options Compared <!-- required -->
<!-- One row per candidate option, compared on pros, cons, cost and fit. -->
| option | pros | cons | cost | fit |
|---|---|---|---|---|
| Twilio Verify | managed retries, fraud filters | vendor lock-in | $0.05/OTP | high |

## Findings <!-- required -->
<!-- One bullet per fact learned during the time-box. -->
- Twilio Verify supports our 60s OTP validity window natively, removing the need for a custom cache.

## Recommendation <!-- required -->
<!-- State the recommended option and the deciding factor. -->
Adopt Twilio Verify for OTP delivery; removes the cache-TTL bug class entirely (see investigation.md).

## ADR Draft <!-- required -->
<!-- Sketch the future ADR: context, decision, consequence, in one line each. -->
Context: custom OTP cache caused intermittent false negatives. Decision: delegate OTP lifecycle to Twilio Verify. Consequence: adds a third-party dependency on the critical login path.

## Follow-ups <!-- required -->
<!-- One row per concrete work item this spike produced, typed per conventions.md prefixes. -->
| proposed item | type | why |
|---|---|---|
| Integrate Twilio Verify SDK | FEAT | replaces custom OTP cache/verify logic |
