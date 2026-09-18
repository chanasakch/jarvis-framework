---
description: List every Jarvis slash command and human-only CLI command, with examples.
argument-hint: (no arguments)
allowed-tools: Read, Glob, Bash(node .jarvis/scripts/jarvis.js:*)
model: inherit
---

Print the reference below, then add one line naming the active work items from
!`node .jarvis/scripts/jarvis.js status --brief 2>/dev/null || echo "none"`

## Slash commands

| Command | Use it for | Example |
|---|---|---|
| `/{{name}} [request \| ID]` | The orchestrator. Start new work, or continue an item. | `/{{name}} Add OTP login for returning customers` |
| `/{{name}}-init` | One-time setup: scan the repo, write project context, check tools. | `/{{name}}-init` |
| `/{{name}}-status [ID]` | Where everything stands, including forced gates. | `/{{name}}-status FEAT-012` |
| `/{{name}}-new <type> <title>` | Create an item with an explicit type, skipping classification. | `/{{name}}-new bugfix Avatar upload returns 500` |
| `/{{name}}-run <ID> <phase>` | Run exactly one phase, gates still enforced. | `/{{name}}-run FEAT-012 architecture` |
| `/{{name}}-review [ID \| --base <ref>]` | Four reviewers in parallel; also works ad hoc on any diff. | `/{{name}}-review --base origin/main` |
| `/{{name}}-gate <ID> <phase>` | Re-run the gates after a manual fix. | `/{{name}}-gate FEAT-012 requirements` |
| `/{{name}}-explain <ID>` | Why is this blocked, and what unblocks it. | `/{{name}}-explain FEAT-012` |
| `/{{name}}-help` | This table. | `/{{name}}-help` |

## Human-only commands

Claude is blocked from running these by `.jarvis/scripts/guard.js`. Run them yourself with a leading `!`.

| Command | Use it for |
|---|---|
| `! npm run -s {{name}} -- approve <ID> <phase>` | Approve a phase that passed both gates. |
| `! npm run -s {{name}} -- force <ID> <phase> --reason "<why>"` | Pass a failed gate. Audited, warned about later, creates a CHR follow-up. |
| `! npm run -s {{name}} -- force <ID> <phase> --reason "<why>" --accept-risk` | Same, for items in `gates.non_forceable`. |
| `! npm run -s {{name}} -- skip <ID> <phase> --reason "<why>"` | Skip an optional phase. |
| `! npm run -s {{name}} -- reopen <ID> <phase>` | Redo a phase and everything after it. |
| `! npm run -s {{name}} -- park <ID> --reason "<why>"` / `unpark <ID>` | Pause and resume an item. |

## Read-only CLI anyone can run

`status`, `next`, `validate <ID> <phase>`, `lint [--changed]`, `check <backend\|frontend\|all>`, `doctor`,
`ci --base origin/main`.

Standards live in `.jarvis/standards/` and are project-owned: to change a rule, open a PR there, and add an
ADR in `docs/adr/` when the change relaxes a rule.
