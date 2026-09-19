/**
 * jarvis.config.yaml's own comments aren't structured data (the `yaml` package the CLI
 * uses doesn't expose them), so descriptions live here instead — one entry per key path
 * that `parse-config.ts` walks. `scripts/generate-content.ts` fails the build if a real
 * key has no entry here, or an entry here names a key that no longer exists (DECISIONS.md
 * D-019), so this can't silently drift from `jarvis-framework/project-templates/jarvis.config.yaml`.
 *
 * A handful of object-valued keys (commands.backend, commands.frontend,
 * quality.coverage_min, quality.perf_budget, models.overrides) are documented as one
 * group rather than walked leaf-by-leaf — see GROUP_PATHS in parse-config.ts.
 */
export const configDescriptions: Record<string, string> = {
  "jarvis.version": "The framework version this config was written against. Set by the installer; do not hand-edit.",
  "jarvis.name": "Prefix for slash commands and agent names — /jarvis, /jarvis-init and jarvis-po by default. Set once at install with `init --name`.",
  "jarvis.doc_language": "Language every generated artifact is written in. Always `en` per the framework's token-discipline principle.",

  "project.name": "Display name for this project, used in generated artifacts.",
  "project.monorepo": "Whether apps/web and apps/api live in one repository. Informational; no gate behavior depends on it today.",
  "project.paths.docs": "Where work-item artifacts are written: docs/work/<ID>-<slug>/.",
  "project.paths.adr": "Where architecture decision records live.",
  "project.paths.web": "The frontend app root, read by the frontend deterministic checks.",
  "project.paths.api": "The backend app root, read by the backend deterministic checks and by guard.js's source-guard rule.",
  "project.paths.packages": "Root for shared packages (errors, ui, api-client, config).",
  "project.paths.error_registry": "The error code registry file — internal code, public key, HTTP status, level per entry.",
  "project.paths.migrations_mysql": "MySQL migration folder. guard.js's G4 rule blocks edits here unless the active work item has has_db_change=true.",
  "project.paths.migrations_mongo": "MongoDB migration script folder, same G4 rule as migrations_mysql.",
  "project.paths.openapi": "The OpenAPI contract file the architect and dev-backend agents keep in sync with the API.",
  "project.stack.frontend": "One-line description of the frontend stack, shown to every agent that touches frontend code.",
  "project.stack.backend": "One-line description of the backend stack, shown to every agent that touches backend code.",
  "project.stack.databases": "Databases this project uses — informs which database standards and reviewer focus apply.",
  "project.stack.cache": "Cache technology, referenced by caching.md and the cache-design sections of tech-spec.md.",

  "gates.strictness": "`high` means every Blocking checklist item must pass with no exceptions; this is the only supported value today.",
  "gates.max_retries": "How many times a phase can fail the script + gatekeeper gates before the orchestrator prints the Gate Failure Menu.",
  "gates.human_approval": "Phases that stop for a human `approve` after passing both gates, by default — a workflow file can override this per phase.",
  "gates.allow_force": "Whether `jarvis.js force` is available at all. Setting this to false removes the escape hatch entirely.",
  "gates.force_requires_reason": "Whether `force` requires `--reason \"<why>\"`. Always true in the shipped default.",
  "gates.non_forceable": "Gate/severity combinations that need `--accept-risk` in addition to `--reason` — e.g. a critical security finding.",
  "gates.source_guard": "Whether guard.js's G3 rule blocks edits under apps/** and packages/** outside the implement/test phases.",

  "review.block_on": "Finding severities that make a reviewer's verdict `fail`. Defaults to critical and major; minor/info are always advisory.",
  "review.reviewers": "Which of the four reviewers run in the review phase, and which standards each is scoped to.",

  "quality.coverage_min": "Minimum test coverage percentage per layer — a work item's test phase fails below this.",
  "quality.perf_budget": "Performance budgets (api_p95_ms, web_lcp_ms) that PERF work items and the performance reviewer measure against.",
  "quality.max_task_loc": "Maximum changed lines per implementation task before the planner must split it further.",

  "commands.backend": "The real shell commands the backend deterministic checks run — format, lint, test, vuln.",
  "commands.frontend": "The real shell commands the frontend deterministic checks run — lint, typecheck, test, audit.",
  "commands.jarvis_lint": "The command the implement phase runs for the framework's own standards lint rules.",

  "models.default": "Model used by an agent's frontmatter when no override is listed below.",
  "models.overrides": "Per-agent model overrides — e.g. the gatekeeper and the security reviewer default to a stronger model.",

  "team.record_git_user": "Whether approvals and forces record the acting `git config user.name`.",
  "team.state_in_git": "Whether `.jarvis/state/**` is committed to the repository (the supported, default mode).",
};
