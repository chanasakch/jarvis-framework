# Go Coding Standards
Purpose: enforce a consistent, safe, reviewable Go backend across all services.
Scope: `apps/api/**/*.go` (handlers, services, repositories, workers, cmd). Excludes frontend (`coding-react.md`) and API contract shape (`api.md`).

### GO-01 — gofmt and golangci-lint clean (MUST)
Every commit has zero `gofmt -l` output and zero `golangci-lint run ./...` findings.

✅
```go
func Add(a, b int) int {
	return a + b
}
```
❌
```go
func Add(a,b int)int{
  return a+b // fails gofmt -l
}
```

### GO-02 — context.Context first param with boundary timeout (MUST)
Every I/O function takes `context.Context` first; the boundary timeout comes from config, never a literal.

✅
```go
func (r *UserRepo) FindByID(ctx context.Context, id string) (*User, error) {
	ctx, cancel := context.WithTimeout(ctx, r.cfg.DBTimeout) // from config
	defer cancel()
	return r.queryUser(ctx, id)
}
```
❌
```go
func (r *UserRepo) FindByID(id string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second) // magic number
	defer cancel()
	return r.queryUser(ctx, id)
}
```

### GO-03 — error wrapping and boundary conversion (MUST)
Repositories wrap with `%w`; the service layer converts to `apperror.New(apperror.CODE, cause)` at the boundary. Full model: `.jarvis/standards/error-handling.md`.

✅
```go
row, err := r.db.QueryRowContext(ctx, findByIDSQL, id) // repo
if err != nil {
	return nil, fmt.Errorf("query user %s: %w", id, err)
}
user, err := r.repo.FindByID(ctx, id) // service boundary
if err != nil {
	return nil, apperror.New(apperror.ErrUserNotFound, err)
}
```
❌
```go
row, err := r.db.QueryRowContext(ctx, findByIDSQL, id)
if err != nil {
	return nil, err // raw driver error leaks to caller
}
```

### GO-04 — no panic in the request path (MUST)
`panic` is never request-path control flow; the only catch point is the top-level `recover` middleware.

✅
```go
func Divide(a, b int) (int, error) {
	if b == 0 { return 0, apperror.New(apperror.ErrInvalidArgument, errZeroDiv) }
	return a / b, nil
}
```
❌
```go
func Divide(a, b int) int {
	if b == 0 { panic("division by zero") } // crashes unless caught upstream
	return a / b
}
```

### GO-05 — no global mutable state (MUST)
No package-level `var` holds mutable state; dependencies are constructed once and injected.

✅
```go
type Server struct {
	db    *sql.DB
	cache *redis.Client
}
func NewServer(db *sql.DB, c *redis.Client) *Server { return &Server{db, c} }
```
❌
```go
var db *sql.DB // package-level mutable state, race-prone, untestable
func Connect() { db, _ = sql.Open("mysql", dsn) }
```

### GO-06 — goroutine lifecycle: owner, stop path, bounded concurrency (MUST)
Every goroutine has an owner and a stop path; concurrent work uses `errgroup` with `SetLimit`; no naked `go func()` in a request handler.

✅
```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10)
for _, id := range ids {
	id := id
	g.Go(func() error { return fetchOne(ctx, id) })
}
return g.Wait()
```
❌
```go
func Handler(w http.ResponseWriter, req *http.Request) {
	for _, id := range req.URL.Query()["id"] { go fetchOne(context.Background(), id) } // no owner, no limit
}
```

### GO-07 — map lookups instead of nested loops (MUST)
Matching two collections uses a map for O(n+m), never a nested loop for O(n*m).

✅
```go
// Complexity: O(n+m)
byID := make(map[string]User, len(users))
for _, u := range users { byID[u.ID] = u }
for i := range orders { orders[i].User = byID[orders[i].UserID] }
```
❌
```go
// Complexity: O(n*m)
for i := range orders {
	for _, u := range users { if u.ID == orders[i].UserID { orders[i].User = u } }
}
```

### GO-08 — preallocate slices with known length (MUST)
When the target length is known, allocate with `make([]T, 0, len(src))` instead of growing via repeated `append`.

✅
```go
dtos := make([]UserDTO, 0, len(users))
for _, u := range users { dtos = append(dtos, UserDTO{ID: u.ID, Name: u.Name}) }
```
❌
```go
var dtos []UserDTO // grows via repeated reallocation
for _, u := range users { dtos = append(dtos, UserDTO{ID: u.ID, Name: u.Name}) }
```

### GO-09 — Complexity comment on non-constant loops (MUST)
Any function with a loop over a collection whose size is not a compile-time constant carries a `// Complexity: O(...)` comment above it.

✅
```go
// Complexity: O(n) where n = len(items)
func Sum(items []int) int {
	total := 0
	for _, v := range items { total += v }
	return total
}
```
❌
```go
func Sum(items []int) int { // no complexity comment
	total := 0
	for _, v := range items { total += v }
	return total
}
```

### GO-10 — no fmt.Print* outside cmd/ and tests (MUST)
Application code logs via `slog` (`.jarvis/standards/logging.md`); `fmt.Print*` is allowed only in `cmd/` and `_test.go` files.

✅
```go
if err := s.repo.Save(ctx, u); err != nil {
	slog.ErrorContext(ctx, "create user failed", "error", err, "user_id", u.ID)
	return apperror.New(apperror.ErrInternal, err)
}
```
❌
```go
if err := s.repo.Save(ctx, u); err != nil {
	fmt.Println("create user failed:", err) // unstructured, no request_id/trace_id
	return err
}
```

### GO-11 — table-driven tests (MUST)
Tests for functions with multiple input/outcome cases use the table-driven pattern with `t.Run` per case.

✅
```go
tests := []struct{ name string; a, b, want int; wantErr bool }{
	{"positive", 6, 3, 2, false},
	{"by_zero", 6, 0, 0, true},
}
for _, tt := range tests {
	t.Run(tt.name, func(t *testing.T) { /* assert got, err against tt */ })
}
```
❌
```go
func TestDivide(t *testing.T) {
	if v, _ := Divide(6, 3); v != 2 {
		t.Fail() // duplicated setup, no case names, hard to extend
	}
}
```

### GO-12 — defer rows.Close() / bodyclose [ADDED] (MUST)
Every `*sql.Rows` and `http.Response.Body` is closed with `defer ... Close()` right after the error check.

✅
```go
rows, err := db.QueryContext(ctx, query, id)
if err != nil { return nil, fmt.Errorf("query: %w", err) }
defer rows.Close()
```
❌
```go
rows, err := db.QueryContext(ctx, query, id)
if err != nil { return nil, fmt.Errorf("query: %w", err) }
// rows.Close() never called — connection leak
```

### GO-13 — no naked returns in long functions [ADDED] (SHOULD)
Functions longer than ~15 lines use explicit `return` values; naked returns are reserved for trivial (< 5 line) named-result functions.

✅
```go
func Parse(raw string) (n int, err error) {
	n, err = strconv.Atoi(raw)
	if err != nil { return 0, fmt.Errorf("parse %q: %w", raw, err) }
	return n, nil
}
```

### GO-14 — exported API needs doc comments [ADDED] (SHOULD)
Every exported type, func, const and package has a doc comment starting with its name; struct field alignment is not required.

✅
```go
// UserService creates and retrieves users.
type UserService struct{ repo UserRepository }
// Create persists a new user and returns its ID.
func (s *UserService) Create(ctx context.Context, u User) (string, error) {
	return s.repo.Save(ctx, u)
}
```

### GO-15 — errors.Is / errors.As instead of == or type assertions [ADDED] (MUST)
Error comparison uses `errors.Is`/`errors.As`, never `==` against a sentinel or a raw type assertion on a wrapped error.

✅
```go
var appErr *apperror.Error
if errors.As(err, &appErr) && errors.Is(appErr.Cause, sql.ErrNoRows) {
	return apperror.New(apperror.ErrUserNotFound, err)
}
```
❌
```go
if err == sql.ErrNoRows { // breaks once the error is wrapped with %w
	return apperror.New(apperror.ErrUserNotFound, err)
}
```

### GO-16 — no interface{}/any in domain signatures [ADDED] (MUST)
Domain and service signatures use concrete or generic types; `interface{}`/`any` is limited to generic infra code (e.g. JSON decoding).

✅
```go
func CalculateTotal(items []LineItem) Money {
	return sumLines(items) // concrete types throughout
}
```
❌
```go
func CalculateTotal(items []interface{}) interface{} { // loses type safety
	return nil
}
```

### GO-17 — time.Time in UTC [ADDED] (MUST)
All stored and compared `time.Time` values are normalized to UTC; local zones only appear at presentation edges.

✅
```go
func (o *Order) MarkPlaced() { o.PlacedAt = time.Now().UTC() }
```
❌
```go
func (o *Order) MarkPlaced() { o.PlacedAt = time.Now() } // server-local zone
```

## Linters

| Linter | Why it is enabled | Severity when it fires |
|---|---|---|
| gosec | Security bugs: hardcoded creds, weak crypto, unsafe perms, SQL concat | critical |
| errcheck | Flags ignored error returns, top cause of silent failures | major |
| gocyclo | Caps cyclomatic complexity at 15 for reviewable, testable functions | major |
| bodyclose | Flags unclosed `http.Response.Body` — connection/fd leak | major |
| sqlclosecheck | Flags unclosed `*sql.Rows`/`*sql.Stmt` — pool exhaustion | major |
| prealloc | Flags slices preallocatable with a known length (GO-08) | minor |

```yaml
# .golangci.yml
linters:
  disable-all: true
  enable:
    - gosec
    - errcheck
    - gocyclo
    - bodyclose
    - sqlclosecheck
    - prealloc
linters-settings:
  gocyclo:
    min-complexity: 15
issues:
  exclude-use-default: false
```

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[GO-04]`) and is approved before the code merges.
