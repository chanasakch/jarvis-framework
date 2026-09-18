# Logging Standards

Governs the structured logger, required fields, log levels, mandatory log points, and forbidden
values for Go `slog` and the frontend error-reporting endpoint. Read by all Jarvis agents, reviewers
(`LOG`), and the `lint` script.
Does not cover error-code registry content or HTTP mapping — see `error-handling.md`; does not cover
PII masking mechanics — see `security.md` `[SEC-12]`.

### LOG-01 — Use the logger, not `fmt.Print*` (MUST)
All backend output outside `cmd/` bootstrap and `*_test.go` goes through `slog`; `fmt.Print*` and
`log.Print*` are forbidden in `internal/`.

✅ `logger.InfoContext(ctx, "order created", slog.String("order_id", id))`
❌ `fmt.Println("order created:", id) // bypasses slog, no structure, no level`

### LOG-02 — Structured JSON output only (MUST)
Every log call passes the message as a static string and all variable data as `slog` attributes; no
value is interpolated into `msg` with `fmt.Sprintf`, string concatenation, or a template.

✅ `logger.ErrorContext(ctx, "payment capture failed", slog.String("order_id", orderID))`
❌ `logger.ErrorContext(ctx, fmt.Sprintf("payment capture failed for order %s", orderID)) // value in msg`

### LOG-03 — Required fields on every record (MUST)
Every log record carries `ts, level, msg, service, component, request_id, trace_id, user_id (ID only),
error_code`; `error_code` is empty for non-error records. `ts, level, msg, service` are set by logger
setup; `request_id, trace_id` are injected by request middleware; `component, user_id, error_code` are
set by the call site. See `## Field Reference`.

✅
```go
logger.WarnContext(ctx, "cache read failed", slog.String("component", "user.cache"))
// request_id, trace_id, service already bound by middleware/setup
```
❌ `logger.Warn("cache read failed") // no ctx, no component, no request_id/trace_id`

### LOG-04 — Log every error once, at the boundary (MUST)
An error is logged exactly once, at the layer where it is converted to an `AppError` (normally
`service.go`); a function that returns an error up the stack does not also log it.

❌ same failure logged three times
```go
// repository_mysql.go
func (r *UserRepo) FindByID(ctx context.Context, id string) (*User, error) {
    row, err := r.db.QueryRowContext(ctx, q, id)
    if err != nil {
        logger.ErrorContext(ctx, "query failed", slog.Any("err", err)) // 1st log
        return nil, err
    }
}
// service.go
func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    u, err := s.repo.FindByID(ctx, id)
    if err != nil {
        logger.ErrorContext(ctx, "get user failed", slog.Any("err", err)) // 2nd log, same error
        return nil, apperror.Wrap(err, "USER_LOOKUP_FAILED")
    }
    return u, nil
}
// handler.go
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    u, err := h.service.GetUser(r.Context(), id)
    if err != nil {
        logger.ErrorContext(r.Context(), "request failed", slog.Any("err", err)) // 3rd log, same error
    }
    respond(w, u, err)
}
```

✅ logged once, at the boundary
```go
// repository_mysql.go — wraps, does not log
func (r *UserRepo) FindByID(ctx context.Context, id string) (*User, error) {
    row, err := r.db.QueryRowContext(ctx, q, id)
    if err != nil {
        return nil, fmt.Errorf("query user %s: %w", id, err)
    }
}
// service.go — converts to AppError, logs once here
func (s *UserService) GetUser(ctx context.Context, id string) (*User, error) {
    u, err := s.repo.FindByID(ctx, id)
    if err != nil {
        appErr := apperror.New("USER_LOOKUP_FAILED", err)
        logger.ErrorContext(ctx, "user lookup failed",
            slog.String("error_code", appErr.Code), slog.Any("cause", err))
        return nil, appErr
    }
    return u, nil
}
// handler.go — returns, does not log again
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    u, err := h.service.GetUser(r.Context(), id)
    respond(w, u, err) // middleware logs request end with status, not the error again
}
```

### LOG-05 — Mandatory log points (MUST)
Always logged: request start/end in middleware (`method, route, status, latency_ms`); every error once
at the boundary (`internal code, cause, stack`); external call failures; cache failures at `warn`;
authentication/authorization failures; state-changing business events (audit — order created, refund
issued, role changed).

✅ `logger.InfoContext(ctx, "audit: role changed", slog.String("actor_id", actorID), slog.String("new_role", role))`
❌ silent state change: `user.Role = newRole; s.repo.Save(ctx, user) // role change never logged`

### LOG-06 — Levels match the decision table (MUST)
`debug` is developer detail and disabled in production; `info` is business events and request end;
`warn` is a degraded-but-recovered path; `error` is a failed request or operation.

| situation | level |
|---|---|
| function entry/exit, variable dump during development | `debug` |
| request completed successfully | `info` |
| business event (order created, payment captured) | `info` |
| cache miss, cache read/write failure with DB fallback used | `warn` |
| retried external call that succeeded on retry | `warn` |
| external call failed after retries exhausted | `error` |
| validation rejected input | `info` (client fault, not a system failure) |
| authentication/authorization failure | `warn` |
| panic recovered in middleware | `error` |
| unhandled internal error reaching the boundary | `error` |

✅ `logger.WarnContext(ctx, "cache miss, served from db", slog.String("cache_key", key))`
❌ `logger.ErrorContext(ctx, "cache miss") // not a failure, wrong level`

### LOG-07 — Forbidden values (MUST)
Never log: passwords, tokens, session IDs, OTPs, full card or national-ID numbers, full PII (mask per
`[SEC-12]`), or the request/response body of an authentication endpoint.

✅ `logger.InfoContext(ctx, "login attempt", slog.String("user_id", userID), slog.Bool("success", ok))`
❌ `logger.InfoContext(ctx, "login attempt", slog.String("password", req.Password)) // credential logged`

### LOG-08 — Frontend error reporting excludes user input (MUST)
When the frontend reports a handled error to the logging endpoint, the payload is `request_id` (from
the failed response), `route`, and the public error key; it never includes the user's input values.

✅ `reportError({ requestId: res.headers.get("x-request-id"), route: "/checkout", errorKey: "bmsg_error" })`
❌ `reportError({ requestId, route, formValues }) // leaks whatever the user typed, including secrets`

### LOG-09 — Sample high-volume debug logs (SHOULD) [ADDED]
A `debug` log point on a hot path (>100 req/s) is sampled, not emitted unconditionally, so it does not
become the dominant cost of the request.

✅ `if sampler.Allow() { logger.DebugContext(ctx, "cache lookup", slog.String("key", key)) }`
❌ unconditional debug log inside a per-request hot path called thousands of times/sec

### LOG-10 — No logging inside a tight loop (MUST) [ADDED]
A log call never sits inside a loop iterating over request-scoped or unbounded data; log once before
or after the loop with an aggregate (count, duration), not once per item.

✅ `logger.InfoContext(ctx, "batch processed", slog.Int("count", len(items)))`
❌ `for _, item := range items { logger.InfoContext(ctx, "processing item", slog.String("id", item.ID)) }`

### LOG-11 — Attribute keys are snake_case and stable (MUST) [ADDED]
Log attribute keys are `snake_case` and, once shipped, never renamed or repurposed; they are a query
contract for dashboards and alerts.

✅ `slog.String("user_id", id)` used identically across every call site
❌ `slog.String("userId", id)` in one file, `slog.String("uid", id)` elsewhere for the same field

### LOG-12 — `slog.Default()` never used in a request path (MUST) [ADDED]
Request-scoped code retrieves its logger from the context (middleware already bound
`request_id`/`trace_id`); it never calls `slog.Default()` or a package-level logger inside a handler,
service, or repository.

✅ `logger := logctx.From(ctx); logger.InfoContext(ctx, "order created")`
❌ `slog.Default().Info("order created") // loses request_id, trace_id binding`

### LOG-13 — A log line is never a substitute for returning an error (MUST) [ADDED]
Detecting a failure and only logging it, while returning `nil`/a zero value as if it succeeded, is
forbidden; the error is still returned (or turned into an `AppError`) in addition to any log.

✅
```go
if err != nil {
    logger.ErrorContext(ctx, "save failed", slog.Any("cause", err))
    return apperror.New("SAVE_FAILED", err)
}
```
❌ `if err != nil { logger.ErrorContext(ctx, "save failed", slog.Any("cause", err)); return nil }`

## Field Reference

| field | type | set by | example | required |
|---|---|---|---|---|
| `ts` | string (RFC3339) | logger setup (`ReplaceAttr`) | `2026-09-18T10:22:31Z` | yes |
| `level` | string | logger setup | `error` | yes |
| `msg` | string | call site | `payment capture failed` | yes |
| `service` | string | logger setup (`logger.With`) | `checkout-api` | yes |
| `component` | string | call site | `order.service` | yes |
| `request_id` | string | middleware | `req_01hz…` | yes (request-scoped) |
| `trace_id` | string | middleware | `trace_01hz…` | yes (request-scoped) |
| `user_id` | string (ID only) | call site | `usr_9f2a` | when authenticated |
| `error_code` | string | call site (on error) | `PAYMENT_FAILED` | on error records |
| `latency_ms` | int | middleware | `184` | on request end |
| `status` | int | middleware | `500` | on request end |
| `cause` | string | call site (on error) | `context deadline exceeded` | on error records |

## Setup

```go
package logging

import (
	"context"
	"log/slog"
	"os"
)

var sensitiveKeys = map[string]bool{
	"password": true, "token": true, "session_id": true, "otp": true,
	"card_number": true, "national_id": true,
}

func redact(groups []string, a slog.Attr) slog.Attr {
	if a.Key == slog.TimeKey && len(groups) == 0 {
		a.Key = "ts"
		return a
	}
	if sensitiveKeys[a.Key] {
		a.Value = slog.StringValue("[REDACTED]")
	}
	return a
}

func New(service string, level slog.Level) *slog.Logger {
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level, ReplaceAttr: redact})
	return slog.New(h).With(slog.String("service", service)) // service set once, inherited by every child
}

type ctxKey struct{}

func FromContext(ctx context.Context, base *slog.Logger) *slog.Logger {
	if l, ok := ctx.Value(ctxKey{}).(*slog.Logger); ok {
		return l
	}
	return base
}

func WithContext(ctx context.Context, l *slog.Logger) context.Context {
	return context.WithValue(ctx, ctxKey{}, l)
}
```

## Request Middleware

```go
package middleware

func RequestLogger(base *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			requestID := r.Header.Get("X-Request-Id")
			if requestID == "" {
				requestID = reqid.New()
			}
			reqLogger := base.With(
				slog.String("request_id", requestID),
				slog.String("trace_id", reqid.TraceFromContext(r.Context())),
			)
			ctx := logging.WithContext(r.Context(), reqLogger)
			r = r.WithContext(ctx)
			w.Header().Set("X-Request-Id", requestID)
			sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}

			defer func() {
				if rec := recover(); rec != nil {
					reqLogger.ErrorContext(ctx, "panic recovered", slog.Any("panic", rec))
					sw.WriteHeader(http.StatusInternalServerError)
				}
				reqLogger.InfoContext(ctx, "request end",
					slog.String("method", r.Method), slog.String("route", routePattern(r)),
					slog.Int("status", sw.status),
					slog.Int64("latency_ms", time.Since(start).Milliseconds()))
			}()

			reqLogger.InfoContext(ctx, "request start",
				slog.String("method", r.Method), slog.String("route", routePattern(r)))
			next.ServeHTTP(sw, r)
		})
	}
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (s *statusWriter) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}
```

## Log Once at the Boundary

✅ correct layering (full example under `LOG-04`): `repository_*.go` wraps the error with
`fmt.Errorf("...: %w", err)` and returns; `service.go` converts it to an `AppError` and logs exactly
once with `error_code` and `cause`; `handler.go` and the request-end middleware log the outcome
(`status`) but never re-log the error itself.

❌ anti-pattern: the same failure is logged in `repository_*.go`, again in `service.go`, and again in
`handler.go` — three log lines, one failure, and the reader cannot tell if it is one incident or three.

**Reviewer check:** `grep -n "logger\.\(Error\|Warn\)" apps/api/internal/*/repository_*.go
apps/api/internal/*/handler.go` — a match is a finding (`F-LOG`) unless it is a mandatory log point
from `LOG-05` (e.g. middleware request-end) that does not duplicate an error already logged in
`service.go`.

## Query Cookbook

Generic JSON-log query syntax below; exact syntax depends on the log backend (CloudWatch Logs
Insights, Loki/LogQL, Elasticsearch/Kibana, BigQuery).

| question | query |
|---|---|
| everything for one `request_id` | `filter request_id = "req_01hz…" \| sort ts asc` |
| error rate by `error_code`, last hour | `filter level = "error" and ts > now()-1h \| stats count() by error_code` |
| requests slower than the p95 budget (200ms) | `filter msg = "request end" and latency_ms > 200 \| sort latency_ms desc` |
| auth failures per user, last 24h | `filter msg = "auth failure" and ts > now()-24h \| stats count() by user_id` |
| cache degradation warnings | `filter level = "warn" and component like "%.cache" \| stats count() by component, cache_key` |

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[LOG-04]`) and is approved before the code merges.
