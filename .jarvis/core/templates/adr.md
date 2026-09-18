---
id: <ADR-NNNN>
artifact: adr
version: 1
status: draft
refs: [tech-spec.md]
---

# ADR — <short title>

## Status <!-- required -->
<!-- State exactly one of: proposed | accepted | superseded by ADR-NNNN. -->
proposed

## Context <!-- required -->
<!-- One paragraph: the forces and constraints that make a decision necessary. -->
OTP codes must be checked against a fast, short-lived store; a durable table adds write load with no retention benefit.

## Options <!-- required -->
<!-- One row per option considered. -->
| option | trade-off |
|---|---|
| Cache-backed OTP store (Redis) | fast, TTL-native, no durability needed |

## Decision <!-- required -->
<!-- One or two sentences stating the chosen option. -->
Use a cache-backed store keyed by phone number with TTL equal to OTP validity.

## Consequences <!-- required -->
<!-- One bullet per consequence, positive or negative. -->
- OTP state is lost on cache eviction, forcing the user to request a new code (acceptable per NFR-004).

## Standard Exceptions <!-- required -->
<!-- One row per standards rule this decision deviates from; every deviation needs an expiry. -->
| rule ID | why the exception is needed | scope | expires |
|---|---|---|---|
| DB-02 | OTP store has no durability requirement, unlike other data | apps/auth-service/internal/otp | 2026-12-31 |
