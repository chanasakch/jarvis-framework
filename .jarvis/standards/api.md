# API Standards

Governs REST conventions for `apps/api`: URL structure, envelopes, pagination, idempotency, status
codes, and per-endpoint documentation contracts. Read by all Jarvis agents, reviewers (`STD`), and the
`lint` script. Does not cover authn/authz internals, cache policy, or the error registry itself — see
`security.md`, `caching.md`, `error-handling.md`.

## Envelopes

Every response body is one of exactly two shapes — never a bare array, a top-level scalar, or a mix.

| | success (2xx) | error (non-2xx) |
|---|---|---|
| shape | `{ "data": ..., "meta": ... }` | `{ "error": { "code", "request_id", "fields"? } }` |
| `data` / `error.code` | resource, list, or `null` | public key from `packages/errors/registry.yaml` |
| `meta` | `{}` or pagination info | absent |
| `error.fields` | — | present only for 422 validation failures |

```http
HTTP/1.1 200 OK
X-Request-Id: req_9f2

{ "data": { "id": "usr_1", "name": "Ada" }, "meta": {} }
```
```http
HTTP/1.1 422 Unprocessable Entity
X-Request-Id: req_1a2

{ "error": { "code": "bmsg_validation_error", "request_id": "req_1a2",
  "fields": [{ "field": "email", "message": "invalid format" }] } }
```

## Pagination

Every list endpoint uses cursor pagination. Offset/page-number pagination is forbidden.

First page:
```http
GET /v1/orders?limit=2 HTTP/1.1

HTTP/1.1 200 OK
{ "data": [{ "id": "ord_1" }, { "id": "ord_2" }],
  "meta": { "next_cursor": "eyJpZCI6Im9yZF8yIn0=" } }
```
Second page, using the cursor from `meta.next_cursor`:
```http
GET /v1/orders?limit=2&cursor=eyJpZCI6Im9yZF8yIn0= HTTP/1.1

HTTP/1.1 200 OK
{ "data": [{ "id": "ord_3" }],
  "meta": { "next_cursor": null } }
```
`next_cursor: null` means the last page. `cursor` is opaque — clients must not parse or construct it.

## Rules

### API-01 — REST over HTTP/JSON, OpenAPI is authoritative (MUST)
Every endpoint is REST over HTTP/JSON, and `apps/api/api/openapi.yaml` is the source of truth: a
handler route must have a matching operation in the spec, and generated clients regenerate from it —
the spec is never edited to match code after the fact.

✅
```yaml
paths:
  /v1/users/{id}:
    get:
      operationId: getUser
      responses: { "200": { description: OK } }
```
❌
```go
// route added to the router with no matching openapi.yaml operation
router.Get("/v1/users/{id}/legacy", h.GetUserLegacy)
```

### API-02 — `/v1` URL versioning (MUST)
Every path is prefixed with `/v1`; a breaking change (removed/renamed field, changed type, changed
status code) ships as a new version prefix (`/v2`), never as a silent change to `/v1`'s contract.

✅
```http
GET /v2/orders/ord_123 HTTP/1.1
# /v2 introduced because `total` changed from int to string
```
❌
```http
GET /v1/orders/ord_123 HTTP/1.1
# `total` silently changed from int to string in place — breaks existing clients
```

### API-03 — Success envelope (MUST)
Every 2xx JSON response body is `{ "data": ..., "meta": ... }`; no bare array and no top-level scalar.

✅
```http
HTTP/1.1 200 OK

{ "data": { "id": "usr_1" }, "meta": {} }
```
❌
```http
HTTP/1.1 200 OK

[{ "id": "usr_1" }]
```

### API-04 — Error envelope, no internal detail (MUST)
Every non-2xx JSON response body is `{ "error": { "code": "<public key>", "request_id": "<id>" } }`;
`code` is a public key from the error registry, never an internal code, SQL text, stack trace, or
table/column name.

✅
```http
HTTP/1.1 500 Internal Server Error

{ "error": { "code": "bmsg_error", "request_id": "req_9f2" } }
```
❌
```http
HTTP/1.1 500 Internal Server Error

{ "error": "sql: no rows in result set (table users, column id)" }
```

### API-05 — Validation fields use contract names (MUST)
`error.fields` appears only on a 422 validation failure; each entry's `field` is the name as it
appears in the request/response contract (JSON body), never a Go struct field or DB column name.

✅
```http
{ "error": { "code": "bmsg_validation_error", "request_id": "req_1a2",
  "fields": [{ "field": "email", "message": "invalid format" }] } }
```
❌
```http
{ "error": { "code": "bmsg_validation_error", "request_id": "req_1a2",
  "fields": [{ "field": "Email_Addr", "message": "invalid format" }] } }
```

### API-06 — Cursor pagination mandatory (MUST)
Every list endpoint accepts `limit` (default 20, max 100) and an opaque `cursor`; offset or page-number
pagination is forbidden; `meta.next_cursor` is `null` on the last page (full example above).

✅
```http
GET /v1/orders?limit=20&cursor=eyJpZCI6MX0= HTTP/1.1
```
❌
```http
GET /v1/orders?page=2&page_size=20 HTTP/1.1
```

### API-07 — Idempotency-Key on costly creates (MUST)
Any `POST` that creates a resource where a duplicate has business cost (payments, orders, OTP sends)
requires an `Idempotency-Key` header; the server stores the key with its response for ≥ 24 h and
replays the stored response on a repeat instead of re-executing the create.

✅
```http
POST /v1/payments HTTP/1.1
Idempotency-Key: 7b3f6e2a-4c1d-4e9a-9b2f-1a2b3c4d5e6f

HTTP/1.1 201 Created
{ "data": { "id": "pay_1" }, "meta": {} }
```
❌
```http
POST /v1/payments HTTP/1.1
Content-Type: application/json

{ "amount": 500 }
```

### API-08 — Timeout and rate limit documented per operation (MUST)
Every OpenAPI operation declares `x-timeout-ms` and `x-rate-limit`; the values match the server
timeout and middleware config in code — CI fails on drift.

✅
```yaml
/v1/orders:
  post:
    x-timeout-ms: 3000
    x-rate-limit: "20/min per user"
```
❌
```yaml
/v1/orders:
  post: {}   # no x-timeout-ms / x-rate-limit declared
```

### API-09 — Resource naming (MUST)
Paths use plural nouns in kebab-case for resources; no verbs in paths — actions are HTTP methods or
sub-resources.

✅
```http
POST /v1/order-items HTTP/1.1
```
❌
```http
POST /v1/createOrderItem HTTP/1.1
```

### API-10 — Correct status codes (MUST)
A handler returns the status code matching its outcome per the table below; it must not return 200 for
an error or 500 for a client-caused failure.

| code | when |
|---|---|
| 200 OK | successful GET / PUT / PATCH |
| 201 Created | successful POST creating a resource |
| 204 No Content | successful DELETE, or an action with no response body |
| 400 Bad Request | malformed request (unparsable JSON, bad query param) |
| 401 Unauthorized | missing or invalid credentials |
| 403 Forbidden | authenticated but not authorized for the resource |
| 404 Not Found | resource does not exist or is not visible to the caller |
| 409 Conflict | state/version conflict (duplicate, optimistic-lock mismatch) |
| 422 Unprocessable Entity | well-formed request fails validation |
| 429 Too Many Requests | rate limit exceeded |
| 500 Internal Server Error | unexpected server failure |

✅
```http
DELETE /v1/orders/ord_1 HTTP/1.1

HTTP/1.1 204 No Content
```
❌
```http
DELETE /v1/orders/ord_1 HTTP/1.1

HTTP/1.1 200 OK
{ "data": null, "meta": {} }
```

### API-11 — `request_id` echoed in the response header (MUST) [ADDED]
Every response, success or error, sets `X-Request-Id` equal to `error.request_id` on error, or the
generated request id on success, so clients can correlate logs without parsing the body.

✅
```http
HTTP/1.1 200 OK
X-Request-Id: req_9f2

{ "data": {}, "meta": {} }
```
❌
```http
HTTP/1.1 200 OK

{ "data": {}, "meta": {} }
```

### API-12 — No PII in URLs or query strings (MUST) [ADDED]
Path segments and query parameters never carry email, phone, national ID, or full name; resources are
addressed by opaque ID, and sensitive filters go in the request body or a POST search endpoint.

✅
```http
GET /v1/users/usr_9f2 HTTP/1.1
```
❌
```http
GET /v1/users?email=ada@example.com HTTP/1.1
```

### API-13 — PATCH semantics documented (SHOULD) [ADDED]
Every `PATCH` operation's OpenAPI description states whether it is JSON Merge Patch (RFC 7396: omitted
field = unchanged, `null` = clear) or full replace, and the choice is consistent across the API.

✅
```yaml
patch:
  description: "JSON Merge Patch (RFC 7396). Omitted fields are unchanged; null clears a field."
```
❌
```yaml
patch:
  description: "Updates a user."
```

### API-14 — ETag / If-Match for optimistic concurrency (SHOULD) [ADDED]
`GET` on a mutable resource returns an `ETag`; `PUT`, `PATCH`, and `DELETE` on that resource require
`If-Match` and return 409 on a mismatch instead of overwriting silently.

✅
```http
PUT /v1/orders/ord_1 HTTP/1.1
If-Match: "a1b2c3"

HTTP/1.1 409 Conflict
```
❌
```http
PUT /v1/orders/ord_1 HTTP/1.1
Content-Type: application/json

{ "status": "shipped" }
```

### API-15 — `snake_case` fields, RFC 3339 UTC timestamps (MUST) [ADDED]
Every JSON field name, at every nesting level, is `snake_case`; every timestamp is an RFC 3339 string
with a `Z` UTC offset — no `camelCase`/`PascalCase` fields and no epoch integers or local offsets.

✅
```http
{ "data": { "order_id": "ord_1", "created_at": "2026-09-18T10:00:00Z" } }
```
❌
```http
{ "data": { "orderId": "ord_1", "createdAt": 1758189600 } }
```

## Per-Endpoint Documentation

Architecture fills one row of this table per endpoint in `tech-spec.md` before implementation starts;
`lint` cross-checks `x-timeout-ms` / `x-rate-limit` in `openapi.yaml` against it.

| endpoint | auth | timeout | rate limit | idempotent | cached |
|---|---|---|---|---|---|
| `POST /v1/payments` | bearer JWT | 3000 ms | 20/min per user | yes (`Idempotency-Key`) | no |

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[API-04]`) and is approved before the code merges.
