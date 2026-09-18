# Jarvis

An AI-driven SDLC framework for Claude Code. Work is routed to specialist subagents, every output is
checked against your team's standards by a script, a reviewer agent and a human, and nothing moves to the
next phase until it passes.

Built for a monorepo with a React + TypeScript frontend, a Go backend, MySQL and MongoDB, and Redis.

## Why it exists

An agent left to itself will write plausible code that quietly breaks your conventions: a `JOIN` where the
team agreed never to use one, a query with no index, a raw database error returned to the browser, an
acceptance criterion with no test. Jarvis turns those conventions into rules with IDs, and into gates that
fail.

Three layers, in order:

1. **`guard.js` hooks** — block what must never happen, before the tool call runs.
2. **Deterministic gates** — `validate`, `lint`, `check` and `ci`. Machine-checkable, no judgement.
3. **Agent + human gates** — a gatekeeper agent verifies every checklist item with evidence, then a human
   approves the phases that matter.

## Install

```bash
npx jarvis-framework init --name jarvis     # or --name ops, --name sdlc, …
cd .jarvis && npm install                   # one dependency: yaml
node .jarvis/scripts/jarvis.js doctor        # tools, paths, error registry
```

Restart Claude Code so it loads the hooks, agents and commands, then:

```
/jarvis-init
```

That scans your repo and writes `.jarvis/project/context.md`, which every agent reads.

`--name` is the prefix for slash commands and agents: `--name ops` gives you `/ops`, `/ops-init` and an
`ops-architect` agent. Internal paths (`.jarvis/`, `jarvis.config.yaml`) keep their names.

**`init` never overwrites a file you own.** Run it again safely: framework files are refreshed, your
standards, config and `CLAUDE.md` are left alone.

## Daily use

```
/jarvis Add OTP login for returning customers
```

Jarvis classifies the work, asks up to five flag questions, then walks the workflow:

```
intake → brief → requirements(approve) → business-flow → ux(approve) → architecture(approve)
       → plan → implement → test → review → qa → release(approve)
```

Each phase goes to the agent that owns it, with a Handoff Brief naming exactly which files to read. You are
asked for a decision only where a human genuinely has to decide.

| Command | Use it for |
|---|---|
| `/jarvis [request \| ID]` | Start new work, or continue an item |
| `/jarvis-status [ID]` | Where everything stands, including forced gates |
| `/jarvis-explain <ID>` | Why is this blocked and what unblocks it |
| `/jarvis-run <ID> <phase>` | Run exactly one phase |
| `/jarvis-review [ID \| --base <ref>]` | Four reviewers in parallel, also ad hoc on any diff |
| `/jarvis-gate <ID> <phase>` | Re-run the gates after a manual fix |
| `/jarvis-new <type> <title>` | Create an item with an explicit type |
| `/jarvis-help` | The full list |

Ten work types, each with its own phase sequence: feature, enhancement, bugfix, hotfix, refactor,
performance, security, migration, spike, chore. A hotfix skips QA and defers its postmortem by three days;
a spike ends after investigation and produces no production code.

## Commands only you can run

Claude is blocked from these by `guard.js` — it will print them and ask. That is deliberate: approving your
own work removes the point of an approval.

| Command | Effect |
|---|---|
| `npm run -s jarvis -- approve <ID> <phase>` | Approve a phase that passed both gates |
| `npm run -s jarvis -- force <ID> <phase> --reason "<why>"` | Pass a failed gate. Audited, warned about at every later step, and a `CHR` follow-up item is created for the unresolved findings |
| `… force … --accept-risk` | Required additionally for anything in `gates.non_forceable` (a critical security finding, a failed acceptance criterion) |
| `npm run -s jarvis -- skip <ID> <phase> --reason "<why>"` | Skip an optional phase |
| `npm run -s jarvis -- reopen <ID> <phase>` | Redo a phase and everything after it |
| `npm run -s jarvis -- park <ID> --reason "<why>"` / `unpark <ID>` | Pause and resume |

Forcing is allowed. It is never silent: the reason, your git `user.name`, the unresolved finding IDs and
the follow-up item are recorded, and they appear in `qa-report.md`, `release-notes.md` and the PR template.

## What lives where

| Path | Owner | On upgrade |
|---|---|---|
| `.jarvis/standards/` | **your team** | never touched |
| `jarvis.config.yaml` | **your team** | never touched |
| `CLAUDE.md` | **your team** | never touched |
| `.jarvis/project/` | **your team** | never touched |
| `packages/errors/registry.yaml` | **your team** | never touched |
| `.jarvis/core/` | framework | replaced |
| `.jarvis/scripts/` | framework | replaced |
| `.claude/agents/`, `.claude/commands/`, `.claude/settings.json` | framework | replaced |

Commit `.claude/`, `.jarvis/`, `docs/work/` and `.jarvis/state/`. State is one small JSON file plus an
append-only audit log per work item, so two people working on different items never conflict.

## Changing a standard

The standards are the point. They are yours, they live in your repo, and every rule has an ID that
reviewers cite.

1. Open a PR against `.jarvis/standards/<file>.md`.
2. **Relaxing or removing a rule also needs an ADR** in `docs/adr/`, written from
   `.jarvis/core/templates/adr.md`, naming the rule ID, why, the scope and when it expires.
3. If the rule is machine-checkable, update `.jarvis/standards/lint-rules.yaml` in the same PR.
4. `CODEOWNERS` routes the PR to the group that owns the standards.

A one-off exception does not need a standards change — it needs an accepted ADR and an inline comment:

```go
// jarvis-ignore DB-01 ADR-0007
```

The linter verifies that `docs/adr/ADR-0007-*.md` exists **and** is `accepted`. A suppression pointing at a
missing or merely proposed ADR is reported as a violation of the rule it tried to suppress.

## CI

```bash
node .jarvis/scripts/jarvis.js ci --base origin/main
```

Fails the PR when the branch's work item has a phase that is not approved, passed, forced or skipped, when
a lint rule is violated, or when the error registry is invalid. Ready-made jobs:
`project-templates/.github/workflows/jarvis.yml` and `project-templates/ci/gitlab-ci.example.yml`.

## Upgrading

```bash
npx jarvis-framework upgrade
node .jarvis/scripts/audit.js                  # framework is internally consistent
node --test ".jarvis/scripts/test/*.test.js"   # scripts still behave
```

`upgrade` replaces framework-owned files only, prints what changed, and lists any agent or command it does
not ship without deleting it. Restart Claude Code afterwards.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `G1 BLOCKED` editing `.jarvis/core` or `.claude` | Those are framework-owned | Developing the framework itself? Start Claude Code with `JARVIS_DEV=1` |
| `G3 BLOCKED` editing `apps/**` | No work item is in the implement phase | `/jarvis <ID>` and let it reach implement, or set `gates.source_guard: false` |
| `G4 BLOCKED` editing a migration | No active item declares a DB change | `jarvis.js flags <ID> has_db_change=true` |
| Checks report `skipped` | The app directory or the tool is absent | Expected before `apps/api` exists; `doctor` lists install hints |
| A gate keeps failing | Three attempts used | `/jarvis-explain <ID>` prints the Gate Failure Menu with the real issues |
| Commands or agents missing | Claude Code reads them at session start | Restart Claude Code |

## Layout of this package

```
framework/            framework-owned files, {{name}} in paths and content — replaced on upgrade
project-templates/    project-owned defaults — written only when the file does not exist
bin/cli.js            init and upgrade
```

Rebuild `framework/` and `project-templates/` from a working repo with `node .jarvis/scripts/pack.js`.
