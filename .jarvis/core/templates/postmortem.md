---
id: <PREFIX-NNN>
artifact: postmortem
version: 1
status: draft
refs: [runbook.md]
---

# Postmortem — OTP Login Incident

## Summary <!-- required -->
<!-- Blameless: describe systems and decisions, never individuals. One paragraph on what happened. -->
The OTP verify endpoint returned 500 errors for 12 minutes after deploy because a required index was missing.

## Impact <!-- required -->
<!-- One row per impact dimension, quantified. -->
| dimension | value |
|---|---|
| users affected | 340 login attempts |
| duration | 12 minutes |
| data affected | none |
| revenue/SLA | 1 SLA breach (99.9% uptime) |

## Timeline <!-- required -->
<!-- One row per event, in UTC, with its source. -->
| time (UTC) | event | source |
|---|---|---|
| 2026-09-18T10:02:00Z | deploy of FEAT-012 completed | CI pipeline log |

## Root Cause <!-- required -->
<!-- 5-whys ordered list ending in the systemic cause, not the symptom. -->
1. Why did verify fail? The query had no supporting index.
2. Why no index? The migration for it was not included in the deploy.
3. Why not included? The Query-Index Matrix update was missed in review.
4. Why missed in review? The database reviewer checklist item was not enforced by the gate.
5. Why not enforced? `jarvis.js validate` did not yet check matrix-vs-migration parity.

## What Went Well <!-- required -->
<!-- List things that worked during detection or response. -->
- The p95 latency alert fired within 2 minutes of deploy.

## What Went Badly <!-- required -->
<!-- List gaps in prevention, detection or response. -->
- The Query-Index Matrix was not validated against actual migrations before release.

## Action Items <!-- required -->
<!-- Every action item must become a real work item created with `jarvis.js new`. -->
| action | type | owner | work item | due |
|---|---|---|---|---|
| add matrix-vs-migration check to validate | chore | platform team | CHR-011 | 2026-09-25 |
