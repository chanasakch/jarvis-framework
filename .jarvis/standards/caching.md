# Caching Standards

Governs cache pattern, key format, TTL, invalidation, stampede protection, and cache failure handling
for `internal/<domain>/cache.go` over `internal/platform/cache`. Read by all Jarvis agents, reviewers
(`CACHE`), and the `lint` script.
Does not cover DB query shape, indexing, or Redis deployment topology — see `database.md`, ops docs.

### CACHE-01 — Cache-aside is the default pattern (MUST)
A domain's `cache.go` reads via cache-aside (check cache, on miss read DB then populate) unless an ADR
approves read-through or write-through for that key.

✅ `if u, ok := c.get(ctx, userKey(id)); ok { return u, nil }` then `c.repo.FindByID(ctx, id)` on miss
❌ `return c.redis.ReadThrough(ctx, userKey(id)) // read-through, no ADR`

### CACHE-02 — Key format `<service>:<domain>:<entity>:<id>:v<n>` (MUST)
Every cache key matches `<service>:<domain>:<entity>:<id>:v<n>`; `v<n>` is bumped to invalidate a whole
shape on deploy without touching individual keys.

| Example key | Meaning |
|---|---|
| `api:user:profile:42:v1` | user 42's profile, shape v1 |
| `api:order:detail:ord_9f2:v3` | order detail, shape v3 |
| `api:catalog:item:sku_881:v1` | catalog item by SKU |
| `api:auth:session:usr_42:v2` | session record for user 42 |
| `api:search:results:q_ab12cd:v1` | cached search result page |

✅ `fmt.Sprintf("api:user:profile:%s:v1", id)`
❌ `"user_" + id` — no service, no domain, no version suffix

### CACHE-03 — Mandatory TTL with jitter (MUST)
Every `Set` call passes a finite TTL; no key is written with infinite TTL. TTL is jittered:
`ttl = base ± rand(0..20%)`.

✅
```go
spread := time.Duration(rand.Int63n(int64(base) / 5)) // up to 20% of base
ttl := base + spread // or base - spread, chosen at random
```
❌ `c.redis.Set(ctx, key, data, 0) // 0 = no expiry`

### CACHE-04 — Invalidate on write, same request, after commit (MUST)
Every write path deletes or rewrites the keys it affects in the same request, after the DB commit
succeeds; invalidation never runs before commit and never as a fire-and-forget goroutine.

✅ `if err := s.repo.UpdateEmail(...); err != nil { return err }` then `s.cache.Delete(ctx, userKey(id))`
❌ `go s.cache.Delete(ctx, userKey(id))` — fire-and-forget, may race the write

### CACHE-05 — Stampede protection with singleflight (MUST)
Any key whose cache miss triggers an expensive DB read, join across services, or aggregation is
fetched through a `singleflight.Group` keyed by the cache key, so concurrent misses collapse into one
DB call.

✅
```go
v, err, _ := c.sf.Do(orderKey(id), func() (any, error) {
    return c.loadOrder(ctx, id)
})
```
❌ `return c.loadOrder(ctx, id) // every concurrent miss hits the DB directly`

### CACHE-06 — User-scoped keys for per-user data (MUST)
Any cached value that differs per user includes the user ID in the key; a handler must never read
another user's data from a key built without the requesting user's ID.

✅ `fmt.Sprintf("api:cart:items:%s:v1", userID)`
❌ `"api:cart:items:current:v1" // shared key serves the wrong user's cart`

### CACHE-07 — Never cache secrets, tokens, OTPs, or full PII (MUST)
Cache values never contain passwords, tokens, OTPs, session secrets, full card/ID numbers, or full PII
fields; cache only IDs, derived/display data, or masked fields.

✅ `type cachedProfile struct { ID string; MaskedID string }` — masked, e.g. `"xxx-xxx-1234"`
❌ `type cachedProfile struct { ID string; OTP string }` — never cache OTPs or full PII

### CACHE-08 — Degrade to DB on cache failure, log warn (MUST)
Any cache error (connection, timeout, marshal) is caught, logged at `warn`, and the caller falls back
to the DB; a cache outage must never fail a request.

✅ `if err != nil { c.log.WarnContext(ctx, "cache get failed", "key", key, "error", err); return nil, false }`
❌ `if err != nil { panic(err) } // cache outage takes down the request`

### CACHE-09 — Hit/miss metrics per key prefix (MUST)
Every `Get` records a hit or miss metric labeled by the key's `<domain>:<entity>` prefix, so hit rate
is observable per cache shape.

✅ `metrics.CacheResult(prefixOf(key), ok) // labeled hit/miss`
❌ `return c.tryGet(ctx, key) // no metric emitted`

### CACHE-10 — Cached endpoints declared in tech-spec.md (MUST)
Which endpoints/entities are cached, their key shape, and their TTL are declared in `tech-spec.md`'s
Cache Design section before implementation; `cache.go` must not cache an entity absent from that
section, and the section must not list an entity the code does not cache.

✅
```md
## Cache Design
| Entity | Key | TTL base | Pattern |
|---|---|---|---|
| user profile | `api:user:profile:<id>:v1` | 300s | cache-aside |
```
❌ caching an entity with no `tech-spec.md` Cache Design entry

### CACHE-11 — Negative caching for "not found" (SHOULD) [ADDED]
A DB miss that returns not-found is cached with a short TTL (e.g. 30-60s) to absorb repeated lookups
for missing entities, distinct from the entity's normal TTL.

✅ `c.set(ctx, key, notFoundMarker, 30*time.Second) // short negative-cache TTL`
❌ `return nil, ErrNotFound // every repeat lookup re-hits the DB`

### CACHE-12 — No cache calls in a loop (SHOULD) [ADDED]
A loop over N ids never issues N individual `Get`/`Set` calls; batch with `MGET`/pipelined `Set`.

✅ `values, _ := c.redis.MGet(ctx, keys...) // one round trip for all ids`
❌ `for _, id := range ids { c.redis.Get(ctx, userKey(id)) } // N round trips`

### CACHE-13 — Serialize with a versioned struct, not `any` (SHOULD) [ADDED]
Cached values are marshalled from a named struct carrying the key's `v<n>`, never from `map[string]any`
or `interface{}`, so a shape change is caught at compile time and paired with a version bump.

✅ `type userV1 struct { ID string; Email string }`
❌ `c.redis.Set(ctx, key, map[string]any{"id": id, "email": email}, ttl)`

### CACHE-14 — Set TTL and value in one round trip (SHOULD) [ADDED]
Writing a cache value sets the TTL atomically with the value (e.g. `SET key val EX ttl`), never as two
separate calls that leave a window with no expiry.

✅ `c.redis.Set(ctx, key, data, ttl) // value + TTL in one call`
❌ `c.redis.Set(ctx, key, data, 0); c.redis.Expire(ctx, key, ttl) // window with no TTL`

### CACHE-15 — Cache only after the DB read succeeds (MUST) [ADDED]
A `Set` is only issued once the DB call it follows returned `nil` error; an error result is never
written to the cache.

✅
```go
u, err := c.repo.FindByID(ctx, id)
if err != nil {
    return nil, err // no Set on error
}
c.set(ctx, userKey(id), u, jitteredTTL(userBaseTTL))
```
❌
```go
u, err := c.repo.FindByID(ctx, id)
c.set(ctx, userKey(id), u, ttl) // caches even when err != nil
return u, err
```

## Reference Implementation

```go
package cache

import (
    "context"
    "encoding/json"
    "errors"
    "fmt"
    "math/rand"
    "time"

    "golang.org/x/sync/singleflight"
)

const userBaseTTL = 5 * time.Minute

type userV1 struct {
    ID    string `json:"id"`
    Email string `json:"email"`
}

type Cache struct {
    redis Redis // platform/cache client interface
    repo  userRepository
    log   Logger
    sf    singleflight.Group
}

func userKey(id string) string { return fmt.Sprintf("api:user:profile:%s:v1", id) }

func jitteredTTL(base time.Duration) time.Duration {
    spread := time.Duration(rand.Int63n(int64(base) / 5)) // +/-20% of base
    if rand.Intn(2) == 0 {
        return base + spread
    }
    return base - spread
}

// Complexity: O(1) — single key lookup, DB fallback bounded by singleflight per key.
func (c *Cache) GetUser(ctx context.Context, id string) (*userV1, error) {
    key := userKey(id)

    if raw, err := c.redis.Get(ctx, key); err != nil {
        c.log.WarnContext(ctx, "cache get failed, degrading to db", "key", key, "error", err)
        metrics.CacheResult("user:profile", false)
    } else if raw != nil {
        var u userV1
        if err := json.Unmarshal(raw, &u); err == nil {
            metrics.CacheResult("user:profile", true)
            return &u, nil
        }
        c.log.WarnContext(ctx, "cache decode failed, degrading to db", "key", key)
    } else {
        metrics.CacheResult("user:profile", false)
    }

    // Stampede protection: concurrent misses for the same id collapse into one DB call.
    v, err, _ := c.sf.Do(key, func() (any, error) {
        row, err := c.repo.FindByID(ctx, id)
        if err != nil {
            if errors.Is(err, ErrNotFound) {
                c.setRaw(ctx, key, []byte("null"), 30*time.Second) // negative cache
            }
            return nil, fmt.Errorf("cache: load user %s: %w", id, err)
        }
        u := userV1{ID: row.ID, Email: row.Email}
        c.set(ctx, key, u, jitteredTTL(userBaseTTL)) // cache only after DB read succeeds
        return &u, nil
    })
    if err != nil {
        return nil, err
    }
    return v.(*userV1), nil
}

func (c *Cache) set(ctx context.Context, key string, v any, ttl time.Duration) {
    data, err := json.Marshal(v)
    if err != nil {
        c.log.WarnContext(ctx, "cache encode failed", "key", key, "error", err)
        return
    }
    c.setRaw(ctx, key, data, ttl)
}

func (c *Cache) setRaw(ctx context.Context, key string, data []byte, ttl time.Duration) {
    if err := c.redis.Set(ctx, key, data, ttl); err != nil { // value + TTL, one round trip
        c.log.WarnContext(ctx, "cache set failed", "key", key, "error", err)
    }
}
```

## Invalidation

Write path: update DB in a transaction, commit, then delete the keys the write affects — in the same
request, after commit.

```go
// Complexity: O(1) — one write, one cache delete.
func (s *UserService) UpdateEmail(ctx context.Context, id, email string) error {
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("service: begin tx: %w", err)
    }
    defer tx.Rollback()

    if err := s.repo.UpdateEmailTx(ctx, tx, id, email); err != nil {
        return fmt.Errorf("service: update email: %w", err)
    }
    if err := tx.Commit(); err != nil {
        return fmt.Errorf("service: commit: %w", err)
    }

    // Invalidate after commit succeeds. Keys affected:
    //   api:user:profile:<id>:v1 — this user's cached profile
    if err := s.cache.Delete(ctx, userKey(id)); err != nil {
        s.log.WarnContext(ctx, "cache invalidate failed", "key", userKey(id), "error", err)
        // DB write already committed; a stale read until TTL expiry is acceptable, not fatal.
    }
    return nil
}
```

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[CACHE-03]`) and is approved before the code merges.
