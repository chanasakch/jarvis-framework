# Testing Standards

Purpose: guarantee every acceptance criterion is verified, tests stay fast and deterministic, and
coverage never regresses below the team floor.
Scope: all test code under `apps/api/**/*_test.go`, `apps/web/src/**/__tests__/**`, and `e2e/**`.
Out of scope: what to build (`tech-spec.md`), lint rules (`lint-rules.yaml`), CI wiring (`git.md`).

## Test Types

| type | scope | tooling | runs in CI | speed budget |
|---|---|---|---|---|
| unit | single function/component, no I/O | Go `testing`, Vitest + Testing Library | every push | < 100 ms/test |
| integration | repository + real DB, service + repositories | Go `testing` + testcontainers | every push | < 5 s/test |
| contract | API request/response vs OpenAPI | Go `testing` / Schemathesis | every push | < 2 s/test |
| e2e | full stack, browser, critical path only | Playwright | pre-merge, nightly | < 30 s/test |
| benchmark | throughput/latency of a hot path | Go `testing.B`, k6 | perf work item, nightly | reports numbers |

### TEST-01 — Test pyramid shape (MUST)
A feature's suite is mostly unit tests, fewer integration tests, and few e2e tests; an e2e test is
never the only coverage for a rule — the same behavior also has a unit or integration test.

✅
```
20 unit tests + 4 integration tests (testcontainers) + 1 e2e test (checkout happy path)
```
❌
```
0 unit tests, 0 integration tests, 1 e2e test asserting the discount is applied correctly
```

### TEST-02 — Coverage minimums from config (MUST)
Coverage is read from `jarvis.config.yaml` → `quality.coverage_min` (`backend: 80`, `frontend: 70`); a
PR that drops either package below its minimum, or below its own higher pre-PR baseline, fails the gate.

✅
```
go test -race -cover ./...   # coverage: 83.4% of statements — above backend min 80, gate passes
```
❌
```
go test -race -cover ./...   # coverage: 76.1% of statements — below backend min 80, gate fails
```

### TEST-03 — Go tests are table-driven and named `Test<Func>_<Scenario>` (MUST)
Every Go test follows `Test<Func>_<Scenario>` and drives cases through a table with `t.Run(tt.name, ...)`
per case; no standalone `TestSomething` for one case when more than one input/outcome pair exists.

✅
```go
func TestParseAmount_ValidAndInvalid(t *testing.T) { /* table of cases, t.Run per case */ }
```
❌
```go
func TestParseAmount(t *testing.T) { /* single hardcoded assertion, no scenario in name */ }
```

### TEST-04 — Mocks only through consumer-defined interfaces (MUST)
A test doubles only an interface declared by the consumer package (`[STR-04]`); it never mocks a
concrete struct, and no mock is generated for a type that isn't an interface.

✅
```go
type userRepository interface { FindByID(ctx context.Context, id string) (*User, error) }
type stubUserRepo struct{ user *User; err error }
```
❌
```go
type mockMySQLRepo struct{ *MySQLRepo } // embeds and overrides a concrete struct
```

### TEST-05 — No network in unit tests (MUST)
A unit test makes no real network call — no DB connection, no HTTP call to a real host, no DNS lookup;
anything crossing a process boundary belongs in an integration or e2e test.

✅
```go
svc := NewService(&stubUserRepo{err: ErrNotFound})
```
❌
```go
db, _ := sql.Open("mysql", "user:pass@tcp(prod-host:3306)/app") // real network call in a unit test
```

### TEST-06 — Integration tests use testcontainers for MySQL and MongoDB (MUST)
A test exercising `repository_mysql.go` or `repository_mongo.go` runs against a real MySQL/MongoDB
instance started with testcontainers; never an in-memory fake, SQLite substitute, or shared dev DB.

✅
```go
mysqlC, _ := mysql.Run(ctx, "mysql:8")
db := connect(t, mysqlC)
runMigrations(t, db)
```
❌
```go
db, _ := sql.Open("sqlite3", ":memory:") // fake substitute for MySQL
```

### TEST-07 — Frontend tests assert behavior through the accessible DOM (MUST)
A component test queries with `getByRole`/`getByLabelText`/`findByText` and asserts what the user sees
or does; never component internal state, private props, class names, or a raw DOM snapshot as proof.

✅
```tsx
expect(await screen.findByRole('alert')).toHaveTextContent(/invalid password/i);
```
❌
```tsx
expect(wrapper.state('email')).toBe('a@b.com'); // internal state, not user-visible behavior
```

### TEST-08 — Playwright e2e only for critical user paths (MUST)
An e2e test exists only when the path is a primary conversion/retention flow (signup, checkout, OTP
login), a failure would be P1, it spans ≥ 2 services or a real third-party integration, or the
tech-spec explicitly marks it critical; every other path is covered at unit/integration level.

✅
```ts
test('user completes checkout with saved card', async ({ page }) => { /* primary revenue path */ });
```
❌
```ts
test('tooltip shows correct copy on hover', async ({ page }) => { /* belongs in a component test */ });
```

### TEST-09 — Every AC has a traceable TC (MUST)
Every acceptance criterion (`AC-<NNN>-<NN>`) has ≥ 1 test case (`TC-<NNN>`) in `test-plan.md`, and the
TC ID appears in the test's name or a `// TC-021` comment above it so `validate.js` can trace AC → TC → code.

✅
```go
// TC-021 — AC-004-02: rejects amount <= 0
func TestValidateAmount_Rejects_TC021(t *testing.T) { ... }
```
❌
```go
func TestValidateAmount(t *testing.T) { ... } // no TC id, not traceable to AC-004-02
```

### TEST-10 — Negative tests are mandatory for validation, sanitization, authz, and error mapping (MUST)
Every validation rule, sanitization step, authorization check (including IDOR), and error-code mapping
has ≥ 1 negative test proving the rejected/denied/mapped-error path.

✅
```go
func TestGetInvoice_Authz_DeniesOtherTenant(t *testing.T) {
    _, err := svc.GetInvoice(ctxAsTenant("A"), invoiceOwnedBy("B"))
    if !errors.Is(err, ErrForbidden) { t.Fatalf("want ErrForbidden, got %v", err) }
}
```
❌
```go
func TestGetInvoice(t *testing.T) {
    inv, _ := svc.GetInvoice(ctxAsTenant("A"), invoiceOwnedBy("A")) // only the happy path
    _ = inv
}
```

### TEST-11 — Benchmarks required when an NFR carries a performance budget (MUST)
Any NFR with a latency/throughput budget in `jarvis.config.yaml` → `quality.perf_budget` has a matching
Go `testing.B` benchmark or k6 script reporting a number comparable to that budget.

✅
```go
func BenchmarkGetUser(b *testing.B) {
    for i := 0; i < b.N; i++ { _, _ = svc.GetUser(context.Background(), "1") }
}
```
❌
```
NFR-002: GET /v1/users/{id} p95 < 200ms   // no benchmark, no k6 script anywhere in the repo
```

### TEST-12 — Tests are deterministic (MUST)
A test never uses `time.Sleep` to wait for an async condition (poll or use a channel instead), never
depends on the current wall-clock date (inject a clock), never shares mutable fixture state across
tests, and never depends on execution order; `-shuffle=on` must not change the result.

✅
```go
clock := clockwork.NewFakeClock()
svc := NewService(WithClock(clock))
clock.Advance(24 * time.Hour)
```
❌
```go
svc.ScheduleExpiry()
time.Sleep(2 * time.Second) // flaky wait for async work
if !svc.IsExpired() { t.Fatal("expected expired") }
```

### TEST-13 — One assertion subject per test (SHOULD) [ADDED]
A test verifies one behavior; a function with several independent outcomes gets one table case or one
test per outcome, not a single test asserting on unrelated subjects.

✅
```go
{"rejects empty name", "", false},
{"accepts trimmed name", " ok ", true},
```
❌
```go
func TestUser(t *testing.T) {
    // asserts name validation, email validation, and role assignment all in one test
}
```

### TEST-14 — Fixtures built by helper constructors with overrides (SHOULD) [ADDED]
Test data comes from a `newTestX(t, opts ...func(*X))`-style helper with sane defaults, not struct
literals copy-pasted across test files.

✅
```go
func newTestOrder(t *testing.T, opts ...func(*Order)) *Order {
    o := &Order{ID: "1", Status: "pending"}
    for _, opt := range opts { opt(o) }
    return o
}
```
❌
```go
o1 := &Order{ID: "1", Status: "pending", Total: 100, Currency: "USD"}
o2 := &Order{ID: "2", Status: "pending", Total: 100, Currency: "USD"} // copy-pasted literal
```

### TEST-15 — `t.Parallel()` where safe (SHOULD) [ADDED]
A unit test with no shared mutable state calls `t.Parallel()`, including its subtests; a test that
mutates shared package state or a shared container does not.

✅
```go
t.Run(tt.name, func(t *testing.T) {
    t.Parallel()
    // ...
})
```
❌
```go
func TestParseAmount(t *testing.T) {
    t.Parallel()
    globalConfig.Locale = "th" // mutates shared state despite running in parallel
}
```

### TEST-16 — `t.Cleanup` over `defer` in helpers (SHOULD) [ADDED]
A helper that acquires a resource (container, temp file, server) registers teardown with `t.Cleanup`,
not `defer`, so cleanup still runs when the helper itself calls `t.Fatal`.

✅
```go
func startTestServer(t *testing.T) *httptest.Server {
    s := httptest.NewServer(handler)
    t.Cleanup(s.Close)
    return s
}
```
❌
```go
func startTestServer(t *testing.T) *httptest.Server {
    s := httptest.NewServer(handler)
    defer s.Close() // closes when the helper returns, not at test end
    return s
}
```

### TEST-17 — No assertions on log output (SHOULD) [ADDED]
A test asserts on return values, state, or emitted errors — never on the text of a log line; log
format is not a contract and changes without warning.

✅
```go
if !errors.Is(err, ErrNotFound) { t.Fatalf("want ErrNotFound, got %v", err) }
```
❌
```go
if !strings.Contains(logBuf.String(), "user not found") { t.Fatal("expected log message") }
```

## Go Table-Driven Example

```go
package amount

import "testing"

func TestParseAmount_ValidAndInvalid(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name    string
		in      string
		want    int64
		wantErr bool
	}{
		{name: "accepts whole yen", in: "1000", want: 1000},
		{name: "accepts zero", in: "0", want: 0},
		{name: "rejects negative", in: "-1", wantErr: true}, // negative case
	}
	for _, tt := range cases {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got, err := ParseAmount(tt.in)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("ParseAmount(%q) = %d, want error", tt.in, got)
				}
				return
			}
			if err != nil {
				t.Fatalf("ParseAmount(%q) returned unexpected error: %v", tt.in, err)
			}
			if got != tt.want {
				t.Fatalf("ParseAmount(%q) = %d, want %d", tt.in, got, tt.want)
			}
		})
	}
}
```

## Integration Example (testcontainers)

Docker must be running for this suite; `jarvis.js doctor` checks Docker availability before any phase
that needs it and fails fast with a clear message if it is not.

```go
package order_test

import (
	"context"
	"database/sql"
	"testing"

	"github.com/testcontainers/testcontainers-go/modules/mysql"
	_ "github.com/go-sql-driver/mysql"

	"myapp/internal/order"
	"myapp/internal/platform/migrate"
)

func TestOrderRepository_FindByID_TC034(t *testing.T) {
	ctx := context.Background()
	// start a real MySQL container
	container, err := mysql.Run(ctx, "mysql:8", mysql.WithDatabase("app_test"),
		mysql.WithUsername("app"), mysql.WithPassword("app"))
	if err != nil {
		t.Fatalf("start mysql container: %v", err)
	}
	t.Cleanup(func() { _ = container.Terminate(ctx) })
	dsn, _ := container.ConnectionString(ctx)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	// run real migrations, then exercise the repository under test
	if err := migrate.Up(dsn, "file://../../migrations/mysql"); err != nil {
		t.Fatalf("run migrations: %v", err)
	}
	repo := order.NewMySQLRepository(db)
	seedOrder(t, db, "ord-1", "pending")
	got, err := repo.FindByID(ctx, "ord-1")
	if err != nil || got.Status != "pending" {
		t.Fatalf("FindByID = (%+v, %v), want status pending", got, err)
	}
	// negative case: not found
	if _, err := repo.FindByID(ctx, "missing"); err == nil {
		t.Fatal("FindByID(missing) = nil error, want ErrNotFound")
	}
	// teardown runs via t.Cleanup above.
}
```

## Frontend Example (Testing Library)

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { InvoiceForm } from './InvoiceForm';

// TC-058 — AC-012-01: valid invoice shows a success state
// TC-059 — AC-012-02: a rejected submission shows the server error message
describe('InvoiceForm', () => {
  it('submits a valid invoice and shows success (TC-058)', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);
    await user.type(screen.getByRole('textbox', { name: /customer/i }), 'Acme Co');
    await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '1000');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/invoice created/i);
  });

  it('shows the server error message on rejection (TC-059)', async () => {
    const user = userEvent.setup();
    const client = { createInvoice: vi.fn().mockRejectedValue(new Error('LIMIT_EXCEEDED')) };
    render(<InvoiceForm client={client} />);
    await user.type(screen.getByRole('textbox', { name: /customer/i }), 'Acme Co');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/limit exceeded/i);
  });
});
```

## Modes

| mode | required evidence in test-report.md |
|---|---|
| standard | pass/fail per TC, coverage vs `quality.coverage_min` |
| regression | the same test run against the pre-fix commit, shown failing, plus passing on the fix |
| parity | before/after behavior captured for the same inputs, shown identical (refactor work items) |
| benchmark | Go `testing.B` or k6 numbers next to the NFR budget from `quality.perf_budget` |
| exploit | the security PoC request/script, shown succeeding pre-fix and failing post-fix |
| migration | up succeeds, down succeeds, up is idempotent (re-run on already-migrated data is a no-op) |

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[TEST-02]`) and is approved before the code merges.
