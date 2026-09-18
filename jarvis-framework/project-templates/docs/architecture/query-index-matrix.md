# Query-Index Matrix

Every read and write path in this repository, with the index that supports it and the evidence that the
index is actually used. Rules: `.jarvis/standards/database.md` [DB-04] (MySQL) and [DB-13] (MongoDB).

- The **architect** adds rows to `## Proposed` during the architecture phase.
- The **developer** moves a row to `## Active` once the query and its migration are merged, and pastes the
  real `EXPLAIN` / `explain("executionStats")` evidence.
- The **database reviewer** compares this file against the code and the migrations. A query that is not
  listed here, or a row whose evidence shows a full scan, is a `major` finding.

Evidence format — MySQL: `type`, `key`, `rows`, `Extra` from `EXPLAIN FORMAT=JSON`.
MongoDB: `stage`, `indexName`, `totalKeysExamined`, `nReturned` from `explain("executionStats")`.

## Active

| path/endpoint | db | query shape | sort | index | evidence |
|---|---|---|---|---|---|
| _none yet_ | | | | | |

## Proposed

| path/endpoint | db | query shape | sort | index | evidence |
|---|---|---|---|---|---|
| _none yet_ | | | | | |

## Retired

Queries removed from the code. Keep the row until a migration drops the index.

| path/endpoint | db | index | removed in | index dropped |
|---|---|---|---|---|
| _none yet_ | | | | |
