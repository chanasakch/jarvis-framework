# Performance Standards

Governs algorithmic complexity, iteration, batching, concurrency, and latency/throughput budgets
across backend and frontend code. Read by all Jarvis agents, the performance reviewer (`PERF`), and
the `lint` script. Does not cover caching policy, database indexing, or API contract shape — see
`caching.md`, `database.md`, `api.md`.

### PERF-01 — Complexity comment on non-constant loops (MUST)
Any function with a loop over a non-constant collection carries a `// Complexity: O(...)` comment above it (cross-reference `[GO-09]`).

✅
```go
// Complexity: O(n) where n = len(orders)
func TotalAmount(orders []Order) int {
	total := 0
	for _, o := range orders { total += o.Amount }
	return total
}
```
❌
```go
func TotalAmount(orders []Order) int { // no complexity comment
	total := 0
	for _, o := range orders { total += o.Amount }
	return total
}
```

### PERF-02 — No O(n²)+ on unbounded input when a better approach exists (MUST)
Matching two unbounded collections uses a map for O(n+m); a nested loop producing O(n·m) is rejected when a map rewrite is possible.

✅
```go
// Complexity: O(n+m)
byID := make(map[string]*User, len(users))
for _, u := range users { byID[u.ID] = u }
for i := range orders { orders[i].User = byID[orders[i].UserID] }
```
❌
```go
// Complexity: O(n*m)
for i := range orders {
	for _, u := range users {
		if u.ID == orders[i].UserID { orders[i].User = u }
	}
}
```

### PERF-03 — No redundant iterations (MUST)
Multiple passes over the same collection (filter, map, reduce) merge into one pass when they have no ordering dependency on each other's output.

✅
```go
// Complexity: O(n), single pass
var sum int
var actives []Order
for _, o := range orders {
	if o.Active {
		actives = append(actives, o)
		sum += o.Amount
	}
}
```
❌
```go
// Complexity: O(n) x 3 passes over the same slice
active := filter(orders, func(o Order) bool { return o.Active })
amounts := mapFn(active, func(o Order) int { return o.Amount })
sum := reduce(amounts, 0, func(a, b int) int { return a + b })
```

### PERF-04 — No query, HTTP, or cache call inside a loop (MUST)
A per-element database, HTTP, or cache call inside a loop (N+1) is replaced with one batched call (`WHERE id IN (...)`, Mongo `$in`, `MGET`, or a bulk endpoint).

✅
```go
// Complexity: O(1) round trip
rows, err := db.QueryContext(ctx, "SELECT id, name FROM users WHERE id IN (?)", ids)
```
❌
```go
for _, id := range ids {
	row := db.QueryRowContext(ctx, "SELECT id, name FROM users WHERE id=?", id) // query inside loop
	scanUser(row)
}
```

### PERF-05 — Pagination mandatory for every list (MUST)
Every endpoint or repository method returning a collection accepts a bounded page size and a cursor; no method returns an unbounded result set (cross-reference `[API-06]`).

✅
```go
func ListOrders(ctx context.Context, cursor string, limit int) ([]Order, string, error) {
	if limit > maxPageSize { limit = maxPageSize }
	return repo.FindPage(ctx, cursor, limit)
}
```
❌
```go
func ListOrders(ctx context.Context) ([]Order, error) {
	return repo.FindAll(ctx) // unbounded result set
}
```

### PERF-06 — Bounded concurrency (MUST)
Fan-out over an unbounded input uses `errgroup.SetLimit(n)` or a fixed-size worker pool; it never spawns one goroutine per element of unbounded input.

✅
```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10)
for _, id := range ids {
	id := id
	g.Go(func() error { return process(ctx, id) })
}
return g.Wait()
```
❌
```go
for _, id := range ids {
	go process(ctx, id) // one goroutine per element, unbounded input
}
```

### PERF-07 — Timeouts on every external call (MUST)
Every DB, HTTP, cache, or queue call runs under a context with a deadline; no external call uses a bare, uncancellable context.

✅
```go
ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
defer cancel()
resp, err := httpClient.Do(req.WithContext(ctx))
```
❌
```go
resp, err := httpClient.Do(req) // no timeout, no deadline
```

### PERF-08 — Budgets come from config, not hardcoded (MUST)
Budgets (`quality.perf_budget.api_p95_ms`, `web_lcp_ms`) and coverage minimums (`quality.coverage_min`) are read from `jarvis.config.yaml` at review/gate time, never restated as literals. An endpoint exceeding its budget is a blocking finding (major+, per `review.block_on`).

✅
```go
if p95Ms > cfg.Quality.PerfBudget.APIP95Ms {
	return Finding{Severity: "major", Msg: "p95 exceeds budget from jarvis.config.yaml"}
}
```
❌
```go
if p95Ms > 200 { // hardcoded budget, drifts from jarvis.config.yaml
	return Finding{Severity: "major", Msg: "p95 too high"}
}
```

### PERF-09 — PERF work items require before/after evidence (MUST)
A performance work item (`PERF-<NNN>`) states the measurement method once and reports before/after numbers captured with that same method; a claim without both numbers fails the gate.

✅
```go
// before: go test -bench=BenchmarkListOrders -benchmem -> 450ms/op, 12 allocs/op
// after:  go test -bench=BenchmarkListOrders -benchmem -> 80ms/op,  2 allocs/op
```
❌
```go
// "optimized the query, should be faster now" — no method, no numbers, nothing comparable
```

### PERF-10 — No allocation inside hot loops [ADDED] (MUST)
A loop executed per-request or per-item reuses a preallocated buffer instead of allocating on every iteration.

✅
```go
buf := make([]byte, 0, 1024)
for _, item := range items {
	buf = buf[:0]
	buf = append(buf, item.Encode()...)
	write(buf)
}
```
❌
```go
for _, item := range items {
	buf := make([]byte, 0, 1024) // allocates every iteration
	buf = append(buf, item.Encode()...)
	write(buf)
}
```

### PERF-11 — Stream large responses instead of buffering [ADDED] (MUST)
A response whose size scales with an unbounded query result is streamed to the writer as rows arrive; it is not accumulated in memory first.

✅
```go
func ExportCSV(w http.ResponseWriter, rows *sql.Rows) {
	cw := csv.NewWriter(w)
	for rows.Next() { cw.Write(scanRow(rows)); cw.Flush() }
}
```
❌
```go
func ExportCSV(w http.ResponseWriter, rows *sql.Rows) {
	var buf bytes.Buffer // buffers entire result set in memory
	for rows.Next() { buf.WriteString(scanRow(rows)) }
	w.Write(buf.Bytes())
}
```

### PERF-12 — No `defer` inside a tight loop [ADDED] (MUST)
`defer` inside a loop body accumulates until the enclosing function returns; per-iteration cleanup moves into a helper function so `defer` fires each iteration.

✅
```go
for _, path := range paths {
	if err := processFile(path); err != nil { return err }
}
func processFile(path string) error {
	f, err := os.Open(path)
	if err != nil { return err }
	defer f.Close()
	return scan(f)
}
```
❌
```go
for _, path := range paths {
	f, _ := os.Open(path)
	defer f.Close() // accumulates; all close at outer function return
	scan(f)
}
```

### PERF-13 — Index-backed sort instead of in-memory sort of a large set [ADDED] (SHOULD)
When a result set can be large, ordering is pushed to the database via an indexed `ORDER BY` instead of loading all rows and sorting them in application memory.

✅
```go
rows, err := db.QueryContext(ctx,
	"SELECT id, name FROM users ORDER BY created_at DESC LIMIT ?", limit) // index on created_at
```
❌
```go
users, err := repo.FindAll(ctx) // loads entire table
sort.Slice(users, func(i, j int) bool { return users[i].CreatedAt.After(users[j].CreatedAt) })
```

### PERF-14 — Memoize expensive derived data only when profiled [ADDED] (SHOULD)
`useMemo`/`useCallback` wraps a derived value only after profiling shows a measurable cost; wrapping trivial computations adds overhead without benefit (cross-reference `[RX-09]`).

✅
```tsx
// profiled: recomputing sortedRows cost ~40ms/render on 5k rows
const sortedRows = useMemo(() => sortRows(rows), [rows]);
```
❌
```tsx
const doubled = useMemo(() => value * 2, [value]); // trivial, never profiled
```

### PERF-15 — Avoid rendering more than 100 rows without virtualization [ADDED] (MUST)
A list or table that can exceed 100 rows renders through a virtualized list component, not a direct `.map()` over the full array (cross-reference `[RX-10]`).

✅
```tsx
<VirtualizedList itemCount={orders.length} itemSize={48} renderItem={renderOrder} />
```
❌
```tsx
{orders.map(o => <OrderRow key={o.id} order={o} />)} // 5000 DOM rows, no virtualization
```

### PERF-16 — Initial JS bundle under a stated budget [ADDED] (MUST)
Route-level features are code-split so the initial bundle stays under the budget stated in the tech-spec; a feature is not imported eagerly into the app shell.

✅
```tsx
const OrderDetails = lazy(() => import("./OrderDetails")); // code-split, keeps main bundle under budget
```
❌
```tsx
import OrderDetails from "./OrderDetails"; // pulls entire feature into the main bundle, no split
```

## Budgets

| metric | budget | source | measured by |
|---|---|---|---|
| `api_p95_ms` | 200 ms | `jarvis.config.yaml` → `quality.perf_budget.api_p95_ms` | k6 load test, p95 latency |
| `web_lcp_ms` | 2500 ms | `jarvis.config.yaml` → `quality.perf_budget.web_lcp_ms` | Lighthouse LCP |
| backend coverage | 80% | `jarvis.config.yaml` → `quality.coverage_min.backend` | `go test -race -cover ./...` |
| frontend coverage | 70% | `jarvis.config.yaml` → `quality.coverage_min.frontend` | `npm run -w apps/web test -- --run --coverage` |

All four numbers are read from `jarvis.config.yaml` at review and gate time; a mismatch between this table's source column and the config file is a documentation bug, not a new budget.

## Measurement

| layer | tool | command |
|---|---|---|
| Go CPU/alloc profiling | `go test -bench`, `pprof` | `go test -bench=. -benchmem ./... && go tool pprof cpu.prof` |
| MySQL query plan | `EXPLAIN` | `EXPLAIN FORMAT=JSON SELECT ... FROM orders WHERE user_id = ?` |
| MongoDB query plan | `explain()` | `db.orders.find({ user_id: id }).explain("executionStats")` |
| Frontend render cost | React Profiler | Record a session in React DevTools Profiler around the interaction |
| Frontend page load | Lighthouse LCP | `npx lighthouse <url> --only-categories=performance --output=json` |
| API load | k6 | `k6 run --vus 50 --duration 30s script.js` |

Every PERF work item (`[PERF-09]`) names one row from this table as its measurement method and reuses the same command for the before and after numbers.

## Big-O Reference

Used by the performance reviewer to check a stated complexity claim.

| operation | complexity |
|---|---|
| Map/hash-map lookup, insert, or delete | O(1) |
| Slice/array linear scan | O(n) |
| Nested loop over two collections (no map) | O(n·m) |
| Sort (`sort.Slice`, Array.prototype.sort) | O(n log n) |
| Indexed DB lookup (MySQL index seek, Mongo IXSCAN) | O(log n) |
| Full table/collection scan (no index) | O(n) |

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[PERF-02]`) and is approved before the code merges.
