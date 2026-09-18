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
| `/jarvis [request \| ID]` | The orchestrator. Start new work, or continue an item. | `/jarvis Add OTP login for returning customers` |
| `/jarvis-init` | One-time setup: scan the repo, write project context, check tools. | `/jarvis-init` |
| `/jarvis-status [ID]` | Where everything stands, including forced gates. | `/jarvis-status FEAT-012` |
| `/jarvis-new <type> <title>` | Create an item with an explicit type, skipping classification. | `/jarvis-new bugfix Avatar upload returns 500` |
| `/jarvis-run <ID> <phase>` | Run exactly one phase, gates still enforced. | `/jarvis-run FEAT-012 architecture` |
| `/jarvis-review [ID \| --base <ref>]` | Four reviewers in parallel; also works ad hoc on any diff. | `/jarvis-review --base origin/main` |
| `/jarvis-gate <ID> <phase>` | Re-run the gates after a manual fix. | `/jarvis-gate FEAT-012 requirements` |
| `/jarvis-explain <ID>` | Why is this blocked, and what unblocks it. | `/jarvis-explain FEAT-012` |
| `/jarvis-help` | This table. | `/jarvis-help` |

## Human-only commands

Claude is blocked from running these by `.jarvis/scripts/guard.js`. Run them yourself with a leading `!`.

| Command | Use it for |
|---|---|
| `! npm run -s jarvis -- approve <ID> <phase>` | Approve a phase that passed both gates. |
| `! npm run -s jarvis -- force <ID> <phase> --reason "<why>"` | Pass a failed gate. Audited, warned about later, creates a CHR follow-up. |
| `! npm run -s jarvis -- force <ID> <phase> --reason "<why>" --accept-risk` | Same, for items in `gates.non_forceable`. |
| `! npm run -s jarvis -- skip <ID> <phase> --reason "<why>"` | Skip an optional phase. |
| `! npm run -s jarvis -- reopen <ID> <phase>` | Redo a phase and everything after it. |
| `! npm run -s jarvis -- park <ID> --reason "<why>"` / `unpark <ID>` | Pause and resume an item. |

## Read-only CLI anyone can run

`status`, `next`, `validate <ID> <phase>`, `lint [--changed]`, `check <backend\|frontend\|all>`, `doctor`,
`ci --base origin/main`.

Standards live in `.jarvis/standards/` and are project-owned: to change a rule, open a PR there, and add an
ADR in `docs/adr/` when the change relaxes a rule.
