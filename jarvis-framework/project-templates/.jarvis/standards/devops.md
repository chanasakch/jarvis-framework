# DevOps Standards

Governs CI/CD pipelines, infrastructure-as-code, deployment, and the observability a change must
ship with. Read by `{{name}}-devops`, `{{name}}-review-devops`, the architecture and release phases, and
the `lint` script.
Does not cover secret *values* or application authz — see `security.md`; does not cover log field
content — see `logging.md` `[LOG-03]`; does not cover query budgets — see `performance.md`.

Applies to any file matching the `has_infra_change` flag: CI/CD workflow definitions, Terraform /
Pulumi / CloudFormation, Dockerfiles, Kubernetes and Helm manifests, and deploy, monitoring or
alerting configuration.

### OPS-01 — Verify before deploy (MUST)
Every deploy pipeline runs the full verification set (build, lint, typecheck, unit tests, and the
project's `jarvis ci` gate) before any step that mutates an environment. A deploy job never starts
from a commit whose verification job did not pass.

✅ `needs: [test, lint]` on the deploy job, so a red test blocks the deploy
❌ `deploy` triggered directly on push with tests running in a parallel, non-blocking job

### OPS-02 — Pin every action, image and tool version (MUST)
Third-party CI actions are pinned to a full commit SHA; container base images are pinned to a digest
or an immutable version tag. `latest`, a bare major tag, and an unpinned `@main` are forbidden — they
make a build non-reproducible and silently adopt upstream changes.

✅ `uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0`
✅ `FROM golang:1.22.5-alpine@sha256:8c9183f715b0b4eca05b8b3dbf59766aaedb41ec07477b132ee2891ac0110a07`
❌ `uses: actions/checkout@v5` · `FROM golang:latest`

### OPS-03 — Explicit, minimal CI permissions (MUST)
Every CI workflow declares a top-level `permissions` block granting only the scopes its jobs use, and
widens them per job where genuinely needed. An absent block inherits the repository default, which is
frequently write-all.

✅ `permissions: { contents: read }` at the top, `permissions: { contents: read, pages: write, id-token: write }` on the deploy job only
❌ no `permissions:` key anywhere in the workflow

### OPS-04 — Secrets come from a secret store, never the repo (MUST)
Credentials reach a pipeline only through the CI secret store or a cloud identity federation
(OIDC). A secret is never committed — not in a `.tfvars`, a manifest, an env file, or a test fixture
— and never written to logs, `set -x` output, or a build argument.

✅ `password: ${{ secrets.REGISTRY_TOKEN }}`, with OIDC preferred over a long-lived key
❌ `echo "token=$REGISTRY_TOKEN"` · a real value in `terraform.tfvars` · `ARG NPM_TOKEN` baked into an image layer

### OPS-05 — All infrastructure in code, with locked remote state (MUST)
Every provisioned resource is declared in version-controlled IaC. State lives in remote storage with
locking and encryption enabled, never on a developer machine and never in the repository. Console
changes are drift and get reconciled back into code.

✅ an S3/GCS backend with a lock table and `encrypt = true`
❌ a resource created by hand in the cloud console · `terraform.tfstate` committed to git

### OPS-06 — Plan in the PR, apply only from CI on the default branch (MUST)
An infrastructure change publishes its plan/diff on the pull request for review. `apply` runs only
from CI, only from the default branch after merge, and never from a developer workstation.

✅ `terraform plan` posted as a PR comment; `apply` gated behind the merge and an environment approval
❌ an engineer running `terraform apply` locally against production

### OPS-07 — Reversible deploy with a named strategy and rollback (MUST)
Every deploy declares its strategy (rolling, blue-green, or canary) and the exact command or pipeline
step that reverses it. A deploy whose rollback is "redeploy the previous commit and hope" is not
reversible; the previous artifact must remain addressable.

✅ `kubectl rollout undo deployment/api --to-revision=<n>`, with the prior image digest recorded in the release notes
❌ a deploy that overwrites the only tag, leaving no addressable previous artifact

### OPS-08 — Readiness and liveness probes gate the rollout (MUST)
Every long-running service exposes distinct readiness and liveness endpoints, and the rollout waits
on readiness before shifting traffic. Readiness reflects real dependency health; liveness only
reports whether the process must be restarted.

✅ `readinessProbe` hitting `/readyz` (checks DB and cache), `livenessProbe` hitting `/healthz` (process only)
❌ one `/health` wired to both probes and returning 200 unconditionally

### OPS-09 — Ship the RED metrics, structured logs and trace propagation (MUST)
A changed service emits request Rate, Error rate and Duration (histogram, not average) labelled by
route and status; logs follow `logging.md`; and the incoming trace context is propagated to every
downstream call so one request is followable end to end.

✅ a `http_request_duration_seconds` histogram by `route`/`status`, with `trace_id` on every log line `[LOG-03]`
❌ a single request counter, average latency only, and a new HTTP client that drops the trace header

### OPS-10 — One alert per SLO signal, each with an owner and a runbook (MUST)
Every alert names the SLO or user-visible symptom it protects, an owning team, and a runbook URL
with the first diagnostic step. Alerts fire on symptoms (error rate, latency, saturation), not on
raw causes, and every alert is actionable — one that cannot be acted on is a dashboard panel.

✅ `page: api availability < 99.9% over 30m` → owner `platform`, runbook `docs/work/<ID>-<slug>/runbook.md`
❌ `alert: CPU > 80%` with no owner, no runbook, and no stated user impact

### OPS-11 — Config per environment, one artifact promoted (MUST)
The same build artifact is promoted from staging to production; only injected configuration differs.
An environment is never given its own rebuild, and environment-specific values are never compiled in.

✅ image `api@sha256:…` promoted staging → production, with config from env/ConfigMap/secret store
❌ `docker build --build-arg ENV=production`, producing a different artifact per environment

### OPS-12 — Resource requests and limits on every workload (MUST)
Every container declares CPU and memory requests and limits. Without them a workload is scheduled
blind and one leak can evict its neighbours.

✅ `requests: { cpu: 100m, memory: 128Mi }`, `limits: { cpu: 500m, memory: 512Mi }`
❌ a Deployment with no `resources:` block

### OPS-13 — Deploy concurrency guard; re-runs are idempotent (MUST)
A deploy pipeline holds a per-environment concurrency group so two deploys cannot interleave, and
re-running it on the same commit converges to the same state rather than failing or double-applying.

✅ `concurrency: { group: deploy-production, cancel-in-progress: false }`
❌ two merges deploying in parallel, the slower one overwriting the newer release

### OPS-14 — Reproducible, lockfile-based builds (MUST)
CI installs from the lockfile with the frozen-install command, never the resolving one, so a build is
reproducible and a transitive bump cannot land without a committed lockfile change. Dependency caches
key on the lockfile hash.

✅ `npm ci` · `go mod download` with a committed `go.sum` · cache key `${{ hashFiles('**/package-lock.json') }}`
❌ `npm install` in CI, which may silently resolve a newer transitive version
