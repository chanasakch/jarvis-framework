---
id: <PREFIX-NNN>
artifact: migration-plan
version: 1
status: draft
refs: [tech-spec.md]
---

# Migration Plan — <short title>

## Change Summary <!-- required -->
<!-- One line: what schema/data change this migration makes and why. -->
- Add a unique index on `otp_codes.phone` to support single-key OTP lookups (FR-001).

## Forward Steps <!-- required -->
<!-- Numbered list, one exact command per step. -->
1. `mongosh auth --eval 'db.otp_codes.createIndex({phone:1}, {unique:true, background:true})'`

## Rollback Steps <!-- required -->
<!-- Numbered list, one exact command per step, reversing Forward Steps in order. -->
1. `mongosh auth --eval 'db.otp_codes.dropIndex("phone_1")'`

## Backfill <!-- required -->
<!-- Describe the backfill needed, or state none and why. -->
None; `otp_codes` is a transient collection with no existing rows requiring backfill.

## Index Build Strategy <!-- required -->
<!-- One row per index built. -->
| index | table/collection | build method | estimated duration | lock impact |
|---|---|---|---|---|
| phone_1 | otp_codes | background build | < 1 min (empty collection) | none |

## Lock/Downtime Impact <!-- required -->
<!-- State expected lock duration and whether a maintenance window is needed. -->
- No downtime; background index build on a low-volume collection.

## Dry-Run Procedure <!-- required -->
<!-- Exact steps to validate the migration against a staging copy before production. -->
1. Restore latest staging snapshot, run Forward Steps, confirm index via `db.otp_codes.getIndexes()`.

## Verification Queries <!-- required -->
<!-- One fenced query with its expected result. -->
```js
db.otp_codes.getIndexes()
// expected: includes {key: {phone: 1}, unique: true, name: "phone_1"}
```
