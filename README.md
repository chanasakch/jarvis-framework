# Jarvis

[![Deploy site](https://github.com/your-org/jarvis-framework/actions/workflows/site.yml/badge.svg)](https://github.com/your-org/jarvis-framework/actions/workflows/site.yml)

An AI-driven SDLC framework for Claude Code: work is routed to specialist subagents,
every output is checked against your team's standards by a script, a reviewer agent and
a human, and nothing moves to the next phase until it passes.

**[Read the docs →](https://your-org.github.io/jarvis-framework/)**

> The badge and docs link above use a placeholder GitHub org (`your-org`) — this repo has
> no git remote configured yet. Update both, and `site/site.config.ts`, once it's pushed
> to a real org/repo (see `site/README.md`'s Deployment section and the note left in
> `site.config.ts`).

## Repo layout

| Path | What |
|---|---|
| `jarvis-framework/` | The publishable npm package (`npx jarvis-framework init`) — CLI, agents, commands, hooks, project templates. |
| `site/` | This repo's documentation site (Next.js, static export, deployed to GitHub Pages by `.github/workflows/site.yml`). |
| `.jarvis/`, `.claude/`, `jarvis.config.yaml`, `CLAUDE.md` | This repo's own dogfooded install of the framework, used to build itself. |
| `docs/`, `packages/` | Artifacts and error registry produced by running Jarvis on this repo's own work items. |
| `CHANGELOG.md` | Framework release notes — rendered on the site's `/changelog` page. |
| `DECISIONS.md`, `PROGRESS.md` | Build log: every autonomous decision made while building this repo, and step-by-step progress. |

## Install the framework in your own project

```bash
npx jarvis-framework init --name jarvis     # or --name ops, --name sdlc, …
cd .jarvis && npm install                   # one dependency: yaml
node .jarvis/scripts/jarvis.js doctor        # tools, paths, error registry
```

See `jarvis-framework/README.md` for the full framework documentation, or the deployed
docs site linked above for the browsable version (command/agent/workflow reference,
guides, English + Thai).

## Working on this repo

This repo is itself run under Jarvis (see `CLAUDE.md`) — all implementation work starts
with `/jarvis`. The one exception is site/framework construction work commissioned
directly by the repo's own build log (`DECISIONS.md` D-032), which predates any work
item and isn't governed by `/jarvis` phases.
