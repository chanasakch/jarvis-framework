# Database Standards

Governs MySQL and MongoDB access patterns, index coverage, transaction scope, and query safety for
every Go domain package. Read by all Jarvis agents, reviewers (`DB`), and the `lint` script.
Does not cover caching strategy, connection pooling, or ORM selection — see `caching.md`.

## MySQL

### DB-01 — No SQL JOIN (MUST)
A MySQL query MUST NOT use `JOIN`; combine data with (a) a denormalized column on the parent table,
or (b) a two-step batched fetch — query the parents, collect their foreign-key IDs, run one batched
`WHERE id IN (...)` query per 1000 IDs for the children, and assemble the result with a map.

✅
```go
// repository_mysql.go
package order

import (
    "context"
    "database/sql"
    "fmt"
    "strings"
)

const maxBatchIDs = 1000

// ListOrdersWithCustomers avoids a JOIN with a two-step batched fetch.
// Complexity: O(n+m) — n orders, m distinct customers, ceil(m/1000) batches.
func (r *OrderRepo) ListOrdersWithCustomers(ctx context.Context, limit, offset int) ([]OrderWithCustomer, error) {
    rows, err := r.db.QueryContext(ctx,
        `SELECT id, customer_id, total_cents, status, created_at FROM orders
         ORDER BY created_at DESC LIMIT ? OFFSET ?`, limit, offset)
    if err != nil {
        return nil, fmt.Errorf("query orders: %w", err)
    }
    defer rows.Close()

    var orders []Order
    seen := make(map[string]struct{})
    for rows.Next() {
        var o Order
        if err := rows.Scan(&o.ID, &o.CustomerID, &o.TotalCents, &o.Status, &o.CreatedAt); err != nil {
            return nil, fmt.Errorf("scan order: %w", err)
        }
        orders = append(orders, o)
        seen[o.CustomerID] = struct{}{}
    }
    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("iterate orders: %w", err)
    }

    ids := make([]string, 0, len(seen))
    for id := range seen {
        ids = append(ids, id)
    }
    customers := make(map[string]Customer, len(ids))
    for start := 0; start < len(ids); start += maxBatchIDs {
        end := start + maxBatchIDs
        if end > len(ids) {
            end = len(ids)
        }
        batch, err := r.fetchCustomersByIDs(ctx, ids[start:end])
        if err != nil {
            return nil, err
        }
        for id, c := range batch {
            customers[id] = c
        }
    }

    result := make([]OrderWithCustomer, 0, len(orders))
    for _, o := range orders {
        result = append(result, OrderWithCustomer{Order: o, Customer: customers[o.CustomerID]})
    }
    return result, nil
}

// fetchCustomersByIDs runs one batched IN query (≤ maxBatchIDs per call).
func (r *OrderRepo) fetchCustomersByIDs(ctx context.Context, ids []string) (map[string]Customer, error) {
    placeholders := make([]string, len(ids))
    args := make([]any, len(ids))
    for i, id := range ids {
        placeholders[i] = "?"
        args[i] = id
    }
    query := fmt.Sprintf(`SELECT id, name, email FROM customers WHERE id IN (%s)`, strings.Join(placeholders, ","))
    rows, err := r.db.QueryContext(ctx, query, args...)
    if err != nil {
        return nil, fmt.Errorf("query customers: %w", err)
    }
    defer rows.Close()

    out := make(map[string]Customer, len(ids))
    for rows.Next() {
        var c Customer
        if err := rows.Scan(&c.ID, &c.Name, &c.Email); err != nil {
            return nil, fmt.Errorf("scan customer: %w", err)
        }
        out[c.ID] = c
    }
    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("iterate customers: %w", err)
    }
    return out, nil
}
```
❌
```go
func (r *OrderRepo) ListOrdersWithCustomers(ctx context.Context) ([]OrderWithCustomer, error) {
    rows, err := r.db.QueryContext(ctx, `
        SELECT o.id, o.total_cents, c.name, c.email
        FROM orders o
        JOIN customers c ON c.id = o.customer_id`) // JOIN — forbidden, see DB-01
    if err != nil {
        return nil, fmt.Errorf("query orders: %w", err)
    }
    defer rows.Close()
    return nil, nil
}
```

### DB-02 — No SELECT * (MUST)
A MySQL query MUST name every selected column explicitly; `SELECT *` is not allowed in application
code or migrations.

✅
```go
const q = `SELECT id, customer_id, status, total_cents, created_at FROM orders WHERE id = ?`
row := r.db.QueryRowContext(ctx, q, id)
```
❌
```go
const q = `SELECT * FROM orders WHERE id = ?` // implicit column set, breaks on schema change
row := r.db.QueryRowContext(ctx, q, id)
```

### DB-03 — Parameterized queries only (MUST)
Query values MUST be passed as driver parameters (`?` placeholders); building a query with string
concatenation or `fmt.Sprintf` of a value into SQL text is forbidden, including `LIKE` patterns and
`IN` lists (placeholders built per DB-01's batching, never inlined).

✅
```go
const q = `SELECT id FROM orders WHERE customer_id = ? AND status = ?`
rows, err := r.db.QueryContext(ctx, q, customerID, status)
```
❌
```go
q := fmt.Sprintf(`SELECT id FROM orders WHERE customer_id = '%s' AND status = '%s'`, customerID, status)
rows, err := r.db.QueryContext(ctx, q) // string-built SQL — injection risk
```

### DB-04 — Every WHERE + ORDER BY covered by an index (MUST)
Every column combination used in a `WHERE` clause together with its `ORDER BY` MUST be covered by a
compound index; no query against a table with more than 1000 rows may produce a full table scan.

✅
```go
// Index: idx_orders_status_created_at (status, created_at) — created by a migration (DB-07).
const q = `SELECT id, status, created_at FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ?`
rows, err := r.db.QueryContext(ctx, q, status, limit)
```
❌
```go
// No index on (payment_method, created_at) — forces a full scan sorted in memory.
const q = `SELECT id, status, created_at FROM orders WHERE payment_method = ? ORDER BY created_at DESC`
rows, err := r.db.QueryContext(ctx, q, method)
```

## EXPLAIN Evidence
Run `EXPLAIN FORMAT=JSON SELECT ...` for every new or changed query and paste `type`, `key`, `rows`,
and `Extra` into the tech-spec's Query-Index Matrix row before merge.

```sql
EXPLAIN FORMAT=JSON
SELECT id, status, created_at FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20;
```

Pass: `type: ref, key: idx_orders_status_created_at, rows: 42, Extra: Using index` — index used.
Fail: `type: ALL, key: NULL, rows: 480213, Extra: Using filesort` — full scan, blocks the gate; add
the missing index via a migration.

### DB-05 — No functions on indexed columns in WHERE (MUST)
A `WHERE` clause MUST NOT wrap an indexed column in a function (`DATE()`, `LOWER()`, `CAST()`, …);
rewrite date-truncation filters as an explicit range so the index remains usable.

✅
```go
// Range rewrite keeps the index on created_at usable.
const q = `SELECT id, status FROM orders WHERE created_at >= ? AND created_at < ?`
rows, err := r.db.QueryContext(ctx, q, dayStart, dayStart.AddDate(0, 0, 1))
```
❌
```go
// DATE(created_at) wraps the indexed column — the index cannot be used.
const q = `SELECT id, status FROM orders WHERE DATE(created_at) = ?`
rows, err := r.db.QueryContext(ctx, q, day)
```

### DB-06 — Short transactions, no external calls inside (MUST)
A transaction MUST contain only statements against the same database; it must not call an HTTP
endpoint, cache, or queue while open, so it holds locks for the shortest possible time.

✅
```go
func (r *OrderRepo) CreateOrder(ctx context.Context, o Order) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }
    defer tx.Rollback()
    if _, err := tx.ExecContext(ctx,
        `INSERT INTO orders (id, customer_id, total_cents, status) VALUES (?, ?, ?, ?)`,
        o.ID, o.CustomerID, o.TotalCents, o.Status); err != nil {
        return fmt.Errorf("insert order: %w", err)
    }
    return tx.Commit() // payment charge happens after commit, outside the tx
}
```
❌
```go
func (r *OrderRepo) CreateOrder(ctx context.Context, o Order) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("begin tx: %w", err)
    }
    defer tx.Rollback()
    tx.ExecContext(ctx, `INSERT INTO orders (id, status) VALUES (?, ?)`, o.ID, o.Status)
    if err := r.paymentClient.Charge(ctx, o.CustomerID, o.TotalCents); err != nil { // HTTP call inside tx
        return fmt.Errorf("charge: %w", err)
    }
    return tx.Commit()
}
```

### DB-07 — golang-migrate with matching up + down (MUST)
Every schema change MUST ship as a `golang-migrate` pair named
`NNNNNN_description.up.sql` / `NNNNNN_description.down.sql` (6-digit sequence, shared description);
the `down` migration MUST fully reverse the `up` migration.

✅
```sql
-- migrations/mysql/000123_add_orders_status_index.up.sql
CREATE INDEX idx_orders_status_created_at ON orders (status, created_at);
-- migrations/mysql/000123_add_orders_status_index.down.sql
DROP INDEX idx_orders_status_created_at ON orders;
```
❌
```sql
-- migrations/mysql/000123_add_orders_status_index.up.sql
CREATE INDEX idx_orders_status_created_at ON orders (status, created_at);
-- no matching .down.sql file — migration is not reversible
```

### DB-08 — utf8mb4 charset (MUST)
Every table and every text column MUST use `utf8mb4` / `utf8mb4_0900_ai_ci`; no table or column may
default to `latin1`, `utf8` (3-byte), or a different collation without an ADR.

✅
```sql
CREATE TABLE orders (
  id     BINARY(16)   NOT NULL,
  status VARCHAR(20)  NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```
❌
```sql
CREATE TABLE orders (
  id BINARY(16) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1; -- truncates multi-byte input (emoji, Thai, CJK)
```

### DB-09 — Bounded context on every query (MUST) [ADDED]
Every `database/sql` call MUST use the `*Context` variant (`QueryContext`, `ExecContext`,
`QueryRowContext`) with a context carrying a deadline; non-context variants (`Query`, `Exec`) are
forbidden because they cannot be cancelled or time-bounded.

✅
```go
ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
defer cancel()
rows, err := r.db.QueryContext(ctx, q, args...)
```
❌
```go
rows, err := r.db.Query(q, args...) // no context — cannot be cancelled or timed out
```

## MongoDB

### DB-10 — No $lookup (MUST)
A MongoDB query MUST NOT use `$lookup`; combine collections with the same two-step app-side fetch as
DB-01 — query the primary collection, collect referenced IDs, run one `$in` query per 1000 IDs on the
referenced collection, and assemble with a map.

✅
```go
cur, err := ordersColl.Find(ctx, bson.M{"status": "paid"},
    options.Find().SetProjection(bson.M{"_id": 1, "customerId": 1, "total": 1}))
if err != nil {
    return nil, fmt.Errorf("find orders: %w", err)
}
defer cur.Close(ctx)

var orders []Order
ids := make(map[string]struct{})
for cur.Next(ctx) {
    var o Order
    if err := cur.Decode(&o); err != nil {
        return nil, fmt.Errorf("decode order: %w", err)
    }
    orders = append(orders, o)
    ids[o.CustomerID] = struct{}{}
}
customerIDs := make([]string, 0, len(ids))
for id := range ids {
    customerIDs = append(customerIDs, id)
}

// One batched $in query on the referenced collection (≤ 1000 IDs per call).
custCur, err := customersColl.Find(ctx, bson.M{"_id": bson.M{"$in": customerIDs}})
if err != nil {
    return nil, fmt.Errorf("find customers: %w", err)
}
defer custCur.Close(ctx)
```
❌
```go
cur, err := ordersColl.Aggregate(ctx, mongo.Pipeline{
    {{Key: "$lookup", Value: bson.M{ // $lookup — forbidden, see DB-10
        "from": "customers", "localField": "customerId", "foreignField": "_id", "as": "customer",
    }}},
})
```

### DB-11 — Embed vs reference decision documented (MUST)
The embed-vs-reference choice for every relationship MUST be recorded in the tech-spec against three
criteria: bounded size (embed only with a known upper bound), read-together (embed only if read with
the parent on the hot path), and updated-together (embed only if written by the same operation).

✅
```go
// Embed: order items are bounded (≤ 50), always read with the order, written together.
type Order struct {
    ID    string      `bson:"_id"`
    Items []OrderItem `bson:"items"`
}
```
❌
```go
// Embedded but unbounded and written by a different service — should be a reference.
type Order struct {
    ID          string       `bson:"_id"`
    AuditEvents []AuditEvent `bson:"auditEvents"` // grows forever, appended by the audit service
}
```

### DB-12 — ESR rule for compound indexes (MUST)
A compound index for a query with equality, sort, and range clauses MUST order its keys Equality,
then Sort, then Range (ESR); a range field placed before the sort field forces an in-memory sort.

Query: `db.orders.find({status:"paid", createdAt:{$gte:start,$lt:end}}).sort({total:-1})` — equality
on `status`, sort on `total`, range on `createdAt`.

✅
```go
// ESR order: Equality(status), Sort(total), Range(createdAt).
_, err := coll.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys: bson.D{{Key: "status", Value: 1}, {Key: "total", Value: -1}, {Key: "createdAt", Value: 1}},
})
```
❌
```go
// Range (createdAt) placed before Sort (total) — filters via index but sorts in memory.
_, err := coll.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys: bson.D{{Key: "status", Value: 1}, {Key: "createdAt", Value: 1}, {Key: "total", Value: -1}},
})
```

### DB-13 — explain(executionStats) must show IXSCAN (MUST)
Every new or changed Mongo query MUST be run with `.explain("executionStats")`; the top stage MUST be
`IXSCAN` (not `COLLSCAN`), and `totalKeysExamined` MUST be close to `nReturned`.

Pass: `stage: IXSCAN, indexName: status_1_createdAt_-1, totalKeysExamined: 42, nReturned: 40`.
Fail: `stage: COLLSCAN, totalDocsExamined: 500000, nReturned: 40` — blocks the gate; add an index.

### DB-14 — $jsonSchema validator per collection (MUST)
Every collection MUST be created with a `$jsonSchema` validator listing required fields and BSON
types; a collection with no validator or `validationAction: "warn"` in production is not allowed.

✅
```javascript
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "customerId", "status", "totalCents", "createdAt"],
      properties: {
        _id: { bsonType: "string" },
        customerId: { bsonType: "string" },
        status: { enum: ["pending", "paid", "cancelled"] },
        totalCents: { bsonType: "int", minimum: 0 },
        createdAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});
```
❌
```javascript
db.createCollection("orders"); // no validator — bad documents are accepted silently
```

### DB-15 — Projections always (MUST)
A Mongo read MUST set an explicit projection for the fields the caller uses; fetching the whole
document when only a subset is needed is forbidden.

✅
```go
cur, err := coll.Find(ctx, filter,
    options.Find().SetProjection(bson.M{"_id": 1, "status": 1, "totalCents": 1}))
```
❌
```go
cur, err := coll.Find(ctx, filter) // fetches every field, including large unused arrays
```

### DB-16 — No unbounded arrays (MUST)
A document array MUST have an enforced upper bound (`$jsonSchema` `maxItems` or a `$slice` push); an
array with unbounded growth MUST be moved to its own collection referenced by ID.

✅
```go
// Cap at 100 recent events; older events live in a separate collection.
_, err := coll.UpdateOne(ctx, bson.M{"_id": orderID},
    bson.M{"$push": bson.M{"events": bson.M{"$each": bson.A{event}, "$slice": -100}}})
```
❌
```go
// Unbounded — grows for the lifetime of the order with no cap.
_, err := coll.UpdateOne(ctx, bson.M{"_id": orderID}, bson.M{"$push": bson.M{"events": event}})
```

### DB-17 — TTL indexes for expiring data (MUST)
Data with a fixed lifetime (sessions, OTP codes, temporary tokens) MUST expire via a TTL index, not
an application-level cron scan.

✅
```go
_, err := coll.Indexes().CreateOne(ctx, mongo.IndexModel{
    Keys:    bson.D{{Key: "expiresAt", Value: 1}},
    Options: options.Index().SetExpireAfterSeconds(0),
})
```
❌
```go
// Cron job scans the whole collection every minute to find and delete expired rows.
func (j *CleanupJob) Run(ctx context.Context) error {
    _, err := coll.DeleteMany(ctx, bson.M{"expiresAt": bson.M{"$lt": time.Now()}})
    return err
}
```

### DB-18 — Indexes created only by migration scripts (MUST)
A Mongo index MUST be created by a tracked migration script, never ad hoc from application startup
code or a manual shell command; a new index on a populated collection SHOULD build `background` or
start `hidden` for validation before being made visible.

✅
```javascript
// migrations/mongo/000045_add_orders_status_index.js
module.exports = {
  async up(db) {
    await db.collection("orders").createIndex(
      { status: 1, createdAt: -1 },
      { name: "idx_status_createdAt", background: true, hidden: true } // validate before unhiding
    );
  },
  async down(db) {
    await db.collection("orders").dropIndex("idx_status_createdAt");
  },
};
```
❌
```go
// cmd/api/main.go — index created ad hoc at process startup, not tracked or reviewable.
coll.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "status", Value: 1}}})
```

### DB-19 — Operator injection prevention (MUST)
User input MUST NOT be assigned directly into a query object; a request field used in a filter MUST
be a concrete type (never `any`/`map[string]any`), and any free-text value MUST be rejected if it
starts with `$` or contains `.` before use.

✅
```go
type SearchRequest struct {
    Name string `json:"name"`
}

func validateNoOperators(s string) error {
    if strings.HasPrefix(s, "$") || strings.Contains(s, ".") {
        return fmt.Errorf("invalid input: %q", s)
    }
    return nil
}

func (r *UserRepo) Search(ctx context.Context, req SearchRequest) ([]User, error) {
    if err := validateNoOperators(req.Name); err != nil {
        return nil, fmt.Errorf("search: %w", err)
    }
    filter := bson.M{"name": req.Name} // string type — cannot become an operator object
    cur, err := r.coll.Find(ctx, filter)
    if err != nil {
        return nil, fmt.Errorf("find users: %w", err)
    }
    defer cur.Close(ctx)
    return nil, nil
}
```
❌
```go
type SearchRequest struct {
    Name any `json:"name"` // attacker-controlled JSON, e.g. {"$ne": null}
}

func (r *UserRepo) Search(ctx context.Context, req SearchRequest) ([]User, error) {
    filter := bson.M{"name": req.Name} // becomes {"name": {"$ne": null}} — matches every document
    cur, err := r.coll.Find(ctx, filter)
    return nil, err
}
```

## Query-Index Matrix
The matrix lives at `docs/architecture/query-index-matrix.md`. The architect writes the initial rows
during design; developers update the row whenever a query shape, sort, or index changes.

| path/endpoint | db | query shape | sort | index | evidence |
|---|---|---|---|---|---|
| `GET /v1/orders` | mysql | `status = ?` | `created_at DESC` | `idx_orders_status_created_at (status, created_at)` | `EXPLAIN: type=ref key=idx_orders_status_created_at rows=42` |

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[DB-01]`) and is approved before the code merges.
