# Security Standards

Purpose: prevent injection, unauthorized access, data leakage, and unsafe rendering across backend and frontend.
Scope: all code under `apps/api/**` and `apps/web/src/**` that handles external input, authn/authz, secrets, logging, or rendering.
Out of scope: infrastructure/network security, physical security — see `.jarvis/standards/database.md`, `.jarvis/standards/error-handling.md`, `coding-react.md` for adjacent rules.

### SEC-01 — Validate every external input at the backend boundary (MUST)
Every handler validates type, length, format, range, and enum for all external input using `go-playground/validator` struct tags; frontend validation is UX only and is never a security control.

✅
```go
type UpdateProfileRequest struct {
	Email       string `json:"email" validate:"required,email,max=254"`
	DisplayName string `json:"display_name" validate:"required,min=1,max=80"`
	Role        string `json:"role" validate:"required,oneof=member admin"`
}
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req UpdateProfileRequest
	decode(r, &req)
	if err := h.validate.Struct(req); err != nil {
		respondError(w, apperror.New(apperror.ErrValidation, err))
		return
	}
	respond(w, h.service.UpdateProfile(r.Context(), req))
}
```
❌
```go
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req UpdateProfileRequest
	decode(r, &req) // trusts client-side Zod check only, no backend validation
	respond(w, h.service.UpdateProfile(r.Context(), req))
}
```

### SEC-02 — Parameterized SQL only (MUST)
Every SQL statement uses placeholders bound by the driver; no query string is built by concatenating or formatting user input. Cross-reference `[DB-01]`, `[DB-02]` in `.jarvis/standards/database.md`.

✅
```go
row := r.db.QueryRowContext(ctx, "SELECT id, email FROM users WHERE id = ?", id)
```
❌
```go
q := fmt.Sprintf("SELECT id, email FROM users WHERE id = '%s'", id) // string concat — SQL injection
row := r.db.QueryRowContext(ctx, q)
```

### SEC-03 — Mongo operator injection guard (MUST)
Any user-supplied map is rejected if a key starts with `$` or contains `.`; a Mongo query object is built only from typed fields the server controls, never from a raw user-supplied map.

✅
```go
func rejectOperatorKeys(m map[string]any) error {
	for k := range m {
		if strings.HasPrefix(k, "$") || strings.Contains(k, ".") {
			return apperror.New(apperror.ErrValidation, fmt.Errorf("invalid key %q", k))
		}
	}
	return nil
}
filter := bson.M{"user_id": userID, "status": req.Status} // built from typed fields only
```
❌
```go
filter := bson.M{}
for k, v := range req.Query { // user-supplied map used directly as query object
	filter[k] = v // e.g. {"password": {"$ne": nil}} bypasses intended matching
}
coll.Find(ctx, filter)
```

### SEC-04 — Output encoding; no internal error detail to clients (MUST)
Every error response to a client carries only a registry public key and a request ID; no SQL, stack trace, file path, or internal error string ever reaches the response body. Cross-reference `.jarvis/standards/error-handling.md`.

✅
```go
func writeError(w http.ResponseWriter, requestID string, err error) {
	var appErr *apperror.Error
	if !errors.As(err, &appErr) {
		appErr = apperror.New(apperror.ErrInternal, err)
	}
	json.NewEncoder(w).Encode(ErrorEnvelope{Error: ErrorBody{
		Code:      appErr.PublicKey(), // registry key only, e.g. "bmsg_error"
		RequestID: requestID,
	}})
}
```
❌
```go
json.NewEncoder(w).Encode(map[string]string{"error": err.Error()}) // leaks internal detail (SQL, paths, stack)
```

### SEC-05 — `bluemonday` sanitizes backend rich text (MUST)
Any HTML accepted from a client and stored or re-rendered on the backend is sanitized with a `bluemonday` policy before it is persisted; raw HTML is never written to storage.

✅
```go
var richTextPolicy = bluemonday.UGCPolicy()

func SanitizeRichText(html string) string {
	return richTextPolicy.Sanitize(html)
}
```
❌
```go
func SaveComment(ctx context.Context, body string) error {
	return repo.Insert(ctx, body) // raw client HTML stored unsanitized
}
```

### SEC-06 — Explicit, reviewed public-endpoint list (MUST)
Every unauthenticated route is named in one reviewed allowlist; no route decides it is public by an ad-hoc path check inside middleware.

✅
```go
// internal/platform/middleware/auth.go
var publicEndpoints = map[string]bool{
	"POST /v1/auth/login":    true,
	"POST /v1/auth/register": true,
	"GET  /v1/health":        true,
} // reviewed in PR; every other route requires RequireAuth
```
❌
```go
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/v1/reports") { // undocumented ad-hoc bypass
			next.ServeHTTP(w, r)
			return
		}
		// ...
	})
}
```

### SEC-07 — Authentication required on every non-public endpoint (MUST)
Every route not in the `[SEC-06]` allowlist is wrapped by the authentication middleware; a route is never registered without it by omission.

✅
```go
router.Handle("/v1/invoices", middleware.RequireAuth(handler.ListInvoices))
```
❌
```go
router.Handle("/v1/invoices", handler.ListInvoices) // auth middleware forgotten
```

### SEC-08 — Authorization per resource with an IDOR check (MUST)
Every resource lookup filters by the owner taken from the authenticated context, never from the request body or a path parameter; the repository query enforces ownership, it is not checked only in the handler.

✅
```go
// handler.go
func (h *Handler) GetInvoice(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context()) // never from body or path param
	invoiceID := r.PathValue("id")
	inv, err := h.service.GetInvoice(r.Context(), userID, invoiceID)
	respond(w, inv, err)
}
// repository_mysql.go
func (r *InvoiceRepo) FindByIDForOwner(ctx context.Context, ownerID, id string) (*Invoice, error) {
	row := r.db.QueryRowContext(ctx,
		"SELECT id, total FROM invoices WHERE id = ? AND owner_id = ?", id, ownerID) // filtered by owner
	return scanInvoice(row)
}
```
❌
```go
// handler.go
func (h *Handler) GetInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceID := r.PathValue("id")
	inv, err := h.service.GetInvoice(r.Context(), invoiceID) // no owner check
	respond(w, inv, err)
}
// repository_mysql.go
func (r *InvoiceRepo) FindByID(ctx context.Context, id string) (*Invoice, error) {
	row := r.db.QueryRowContext(ctx, "SELECT id, total FROM invoices WHERE id = ?", id) // any invoice ID works — IDOR
	return scanInvoice(row)
}
```

### SEC-09 — Strict decoding: reject unknown fields, enforce enums at deserialization [ADDED] (MUST)
Every JSON request body is decoded with unknown fields rejected before validation runs, so a client cannot smuggle an unexpected field (e.g. a privilege flag) past a struct that silently ignores it.

✅
```go
dec := json.NewDecoder(r.Body)
dec.DisallowUnknownFields() // reject unexpected fields before validation runs
if err := dec.Decode(&req); err != nil {
	respondError(w, apperror.New(apperror.ErrValidation, err))
	return
}
```
❌
```go
json.NewDecoder(r.Body).Decode(&req) // silently accepts unknown/extra fields (e.g. "is_admin": true)
```

### SEC-10 — `dangerouslySetInnerHTML` requires DOMPurify (MUST)
Any `dangerouslySetInnerHTML` usage sanitizes its input with `DOMPurify.sanitize` immediately before assignment; no unsanitized HTML string reaches it. Pinned ID — must match `lint-rules.yaml` (`SEC-10`); cross-references `[RX-07]` in `coding-react.md`.

✅
```tsx
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```
❌
```tsx
<div dangerouslySetInnerHTML={{ __html: html }} /> // unsanitized — stored/reflected XSS
```

### SEC-11 — Secrets only from env or a secret manager (MUST)
Every secret (DSN, API key, signing key, token) is read from an environment variable or a secret manager at runtime, never written into code, a config file committed to git, a URL, a log line, or an error message, and an agent never reads a `.env` file.

✅
```go
dsn := os.Getenv("DB_DSN") // or fetched from a secret manager client at startup
r.Header.Set("Authorization", "Bearer "+token) // token in header, never a query parameter
```
❌
```go
const dsn = "mysql://root:P@ssw0rd@prod-db:3306/app" // secret committed to source
url := fmt.Sprintf("/v1/reset-password?token=%s", token) // token in URL — logged, cached, leaked via Referer
```

### SEC-12 — PII masking in logs (MUST)
Every log line containing an email or phone number masks it before writing; a national ID is never logged, masked or not.

✅
```go
func MaskEmail(email string) string { // a***@d***.com
	at := strings.IndexByte(email, '@')
	domain := email[at+1:]
	dot := strings.IndexByte(domain, '.')
	return email[:1] + "***@" + domain[:1] + "***" + domain[dot:]
}
func MaskPhone(phone string) string { // last 4 digits only
	return "****" + phone[len(phone)-4:]
}

slog.Info("otp sent", "email", MaskEmail(req.Email)) // national_id never logged
```
❌
```go
slog.Info("otp sent", "email", req.Email, "national_id", req.NationalID) // full PII in logs
```

### SEC-13 — Rate limiting on auth, OTP, password-reset, and enumeration-prone endpoints (MUST)
Every such endpoint enforces a per-IP limit and a per-identifier limit (email/phone), both sliding-window, and the limit is documented in the endpoint's OpenAPI operation.

✅
```go
// openapi.yaml: x-rate-limit: { per_ip: "10/min", per_identifier: "5/min", window: "sliding" }
limiter := ratelimit.New(ratelimit.Sliding(10, time.Minute), ratelimit.Sliding(5, time.Minute)) // IP, identifier
router.Handle("/v1/auth/otp", limiter.Wrap(handler.RequestOTP))
```
❌
```go
router.Handle("/v1/auth/otp", handler.RequestOTP) // unbounded — brute force / account enumeration
```

### SEC-14 — Security headers and a CORS allowlist (MUST)
Every response sets `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options` (or `frame-ancestors` in CSP), `Content-Security-Policy`, and `Referrer-Policy`; CORS is an explicit origin allowlist and is never `*` combined with credentials.

✅
```go
w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
w.Header().Set("X-Content-Type-Options", "nosniff")
w.Header().Set("X-Frame-Options", "DENY")
w.Header().Set("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'")
w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

var allowedOrigins = map[string]bool{"https://app.example.com": true} // explicit allowlist
if allowedOrigins[origin] {
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
}
```
❌
```go
w.Header().Set("Access-Control-Allow-Origin", "*")
w.Header().Set("Access-Control-Allow-Credentials", "true") // wildcard origin + credentials
```

### SEC-15 — Password hashing with argon2id or bcrypt (MUST)
Passwords are hashed with argon2id (memory ≥ 64 MiB, iterations ≥ 3, parallelism ≥ 2) or bcrypt with cost ≥ 12; SHA-family and MD5 are never used for password storage.

✅
```go
hash, err := argon2id.CreateHash(password, &argon2id.Params{
	Memory: 64 * 1024, Iterations: 3, Parallelism: 2, SaltLength: 16, KeyLength: 32,
}) // or: bcrypt.GenerateFromPassword([]byte(password), 12)
```
❌
```go
sum := sha256.Sum256([]byte(password)) // fast hash, no salt, no work factor — crackable
```

### SEC-16 — File upload allowlist, size cap, generated name, storage outside web root (MUST)
Every uploaded file is checked against a content-type allowlist by sniffing the magic bytes (not the client-supplied `Content-Type`), rejected past a max size, stored under a server-generated filename, and written outside the web root.

✅
```go
kind, _ := filetype.Match(buf[:512]) // sniff magic bytes, ignore client Content-Type header
if !allowedKinds[kind.MIME.Value] || size > maxUploadBytes {
	return apperror.New(apperror.ErrValidation, errUnsupportedFile)
}
stored := uuid.NewString() + kind.Extension // generated name, never the client filename
os.WriteFile(filepath.Join(uploadDir, stored), data, 0o644) // uploadDir outside web root
```
❌
```go
os.WriteFile(filepath.Join("./public/uploads", header.Filename), data, 0o644) // client filename, web root, no sniff
```

### SEC-17 — Dependency scanning in CI, blocking (MUST)
CI runs `govulncheck ./...` and `npm audit --omit=dev --audit-level=high`; either step failing blocks the merge.

✅
```yaml
- run: govulncheck ./...
- run: npm audit --omit=dev --audit-level=high
```
❌
```yaml
- run: govulncheck ./... || true   # failure ignored — findings never block merge
```

### SEC-18 — CSRF protection for cookie-based sessions [ADDED] (MUST)
Every state-changing request made under a cookie-based session validates a CSRF token that is not itself a cookie the browser would send automatically.

✅
```go
if r.Header.Get("X-CSRF-Token") != session.CSRFToken { // double-submit check
	respondError(w, apperror.New(apperror.ErrForbidden, errCSRF))
	return
}
```
❌
```go
router.Handle("/v1/account/delete", handler.DeleteAccount) // cookie session, state-changing, no CSRF check
```

### SEC-19 — Constant-time comparison for tokens and OTPs [ADDED] (MUST)
Any comparison of a secret, token, or OTP against a user-supplied value uses `subtle.ConstantTimeCompare`; `==` is never used for that comparison.

✅
```go
if subtle.ConstantTimeCompare([]byte(providedOTP), []byte(expectedOTP)) != 1 {
	return apperror.New(apperror.ErrOTPInvalid, nil)
}
```
❌
```go
if providedOTP == expectedOTP { // timing side-channel leaks correct digits
	// ...
}
```

### SEC-20 — JWT algorithm pinning and expiry validation [ADDED] (MUST)
Every JWT is parsed with an explicit allowed-algorithm list and a required expiry check; `alg: none` and unverified parsing are never accepted.

✅
```go
token, err := jwt.Parse(raw, keyFunc,
	jwt.WithValidMethods([]string{"RS256"}), jwt.WithExpirationRequired())
```
❌
```go
token, _, _ := new(jwt.Parser).ParseUnverified(raw, claims) // no alg check, no expiry check — accepts "none"
```

### SEC-21 — Session/token rotation on privilege change [ADDED] (MUST)
A password change, role change, or MFA enrollment revokes existing sessions/tokens for that user and issues new ones; old credentials never remain valid after such a change.

✅
```go
func (s *AuthService) ChangePassword(ctx context.Context, userID, newPw string) error {
	if err := s.repo.UpdatePassword(ctx, userID, hash(newPw)); err != nil {
		return err
	}
	return s.sessions.RevokeAllForUser(ctx, userID) // force re-login everywhere
}
```
❌
```go
func (s *AuthService) ChangePassword(ctx context.Context, userID, newPw string) error {
	return s.repo.UpdatePassword(ctx, userID, hash(newPw)) // old sessions/tokens still valid
}
```

### SEC-22 — HttpOnly, Secure, SameSite cookies [ADDED] (MUST)
Every session cookie sets `HttpOnly`, `Secure`, and an explicit `SameSite` mode; a session token is never stored in a cookie readable by JavaScript.

✅
```go
http.SetCookie(w, &http.Cookie{
	Name: "session", Value: token, HttpOnly: true, Secure: true, SameSite: http.SameSiteStrictMode, Path: "/",
})
```
❌
```go
http.SetCookie(w, &http.Cookie{Name: "session", Value: token}) // readable by JS, sent over HTTP, cross-site
```

## Validation Matrix

The architect fills this table per input field in `tech-spec.md`; a field with no row has no approved contract.

| field | type | length | format | range | enum | sanitization |
|---|---|---|---|---|---|---|
| email | string | max 254 | RFC 5322 email | — | — | lowercase + trim before compare/store |
| display_name | string | 1–80 | printable UTF-8, no control chars | — | — | strip control chars; HTML-escape on output |
| avatar_url | string | max 2048 | valid URL, scheme `https` only | — | — | reject `javascript:`/`data:` schemes; host allowlist if internally hosted |

`go-playground/validator` struct tags implementing this table:

```go
type UpdateProfileRequest struct {
	Email       string `json:"email" validate:"required,email,max=254"`
	DisplayName string `json:"display_name" validate:"required,min=1,max=80,excludesall=\x00\x1f"`
	AvatarURL   string `json:"avatar_url" validate:"omitempty,url,max=2048,startswith=https://"`
}
```

## Sanitization by Sink

| sink | threat | required treatment |
|---|---|---|
| SQL | injection via string concatenation | parameterized queries / prepared statements only `[SEC-02]` |
| MongoDB query | operator injection (`$ne`, `$gt`, …) via user-controlled map | reject `$`-prefixed and dotted keys; build filters from typed fields only `[SEC-03]` |
| HTML output | stored / reflected XSS | `bluemonday` on backend, `DOMPurify.sanitize` on frontend before render `[SEC-05]` `[SEC-10]` |
| Log output | log injection, PII leakage | structured fields only, never a raw user string as a format string; mask PII `[SEC-12]` |
| Shell | command injection | never build a shell command from user input; use `exec.Command` with an argv, no shell interpolation |
| File path | path traversal | `filepath.Clean` + reject `..`; server-generated filename, never client-supplied `[SEC-16]` |
| URL / redirect | open redirect, SSRF | allowlist of destination hosts/schemes; never redirect to a raw user-supplied URL |

## PDPA Notes

Thailand Personal Data Protection Act (PDPA) — applies to every field holding personal data.

- Lawful basis (consent, contract, legal obligation, legitimate interest) is recorded per personal-data field in `tech-spec.md`.
- Purpose limitation: data collected for one stated purpose is not repurposed without a new recorded lawful basis.
- Data-retention period is declared as an NFR in the PRD for every personal-data field (e.g. `NFR-014: national_id retained 5y then purged`).
- A subject access and deletion path (endpoint or documented manual process) exists and is tested for every store of personal data.
- Any new personal-data field requires a corresponding entry in the PRD's retention NFR before it ships.

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[SEC-04]`) and is approved before the code merges.
