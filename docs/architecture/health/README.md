# Codebase Health Reports

One dated report per run of `/jarvis-health`, written by `jarvis-staff` as
`<YYYY-MM-DD>.md` from `.jarvis/core/templates/architecture-health.md`.

Reports are cumulative evidence, not scratch files: a later report in `delta` mode reads the
previous one to report direction. Do not delete or rewrite an old report.

`node .jarvis/scripts/jarvis.js health` reports the newest report's age against
`staff_review.max_age_days` in `jarvis.config.yaml`; `/jarvis-status` warns when it is stale.
