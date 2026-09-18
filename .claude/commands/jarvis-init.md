---
description: Scan this repository and set Jarvis up — writes .jarvis/project/context.md, validates config paths, scaffolds the error registry and lint rules if missing, and reports missing tools.
argument-hint: (no arguments)
allowed-tools: Read, Write, Glob, Grep, Bash(node .jarvis/scripts/jarvis.js:*), Bash(git log:*), Bash(ls:*), Bash(cat:*), Bash(go version), Bash(node -v), Bash(npm -v), Bash(docker info)
model: inherit
---

Doctor report:
!`node .jarvis/scripts/jarvis.js doctor 2>/dev/null || echo "jarvis: doctor unavailable — check that .jarvis/scripts exists and 'yaml' is installed (cd .jarvis && npm install)"`

Set up Jarvis for this repository.

## 1. Scan the repo

Do not guess. Read before you write, and cite `path:line` for every claim.

- Root manifests: `package.json`, `go.mod`, `go.work`, workspace globs, `Makefile`, `docker-compose*.yml`, CI config.
- Directory shape: what is under `apps/`, `packages/`, `internal/`, `cmd/`, `src/`. Compare it with
  `.jarvis/standards/structure.md` and note where this repo already differs.
- Per domain and per frontend feature: entry points, which databases it touches, which cache.
- Existing patterns, with a file reference each: error handling, logging, config loading, DB access,
  caching, auth, testing, API client generation.
- Vocabulary: business terms in code and docs that an agent could misread.

## 2. Write `.jarvis/project/context.md`

Fill the existing headings — Stack, Repo Map, Domains, Existing Patterns, Glossary — following
`.jarvis/standards/documentation.md`: tables over prose, `file:line` citations, no filler.
This file is loaded into every session through `CLAUDE.md`, so keep it under ~150 lines.
Set `status:` to `generated` and `generated_at:` to today.

## 3. Validate configuration

Compare every path in `jarvis.config.yaml` → `project.paths` with reality. For each mismatch, propose the
correct value and ask the user before editing (it is a project-owned file). Same for `commands.*`: if
`apps/web` has no `lint` script, say so rather than leaving a command that will always fail.

## 4. Scaffold what is missing

- `packages/errors/registry.yaml` — if absent, create it with the seven baseline codes from
  `.jarvis/standards/error-handling.md`.
- `.jarvis/standards/lint-rules.yaml` — if absent, copy the framework default.
- `docs/architecture/query-index-matrix.md` — if absent, create it with the header row from
  `.jarvis/standards/database.md`.
- `docs/adr/` and `docs/work/` — create if absent.

Never overwrite an existing project-owned file. Report what you would change and ask.

## 5. Report

A short table: check · result · action taken. Then list missing tools from the doctor report with their
install hints, and say which of them actually block work here (for example: no Docker → no testcontainers
integration tests → the test gate cannot pass in `standard` mode).
