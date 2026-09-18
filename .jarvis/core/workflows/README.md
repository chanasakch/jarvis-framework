# Workflows

Generated view of `.jarvis/core/workflows/*.yaml`. The YAML files are authoritative — regenerate this table after editing one.

`(A)` = human approval required · `opt: <flag>` = skipped when the intake flag is false · `mode` = the agent mode for that phase.

| Type | Prefix | Phases |
|---|---|---|
| bugfix | BUG | intake → investigation (mode: bug) → plan → implement → test (mode: regression) → review → qa → release (A) |
| chore | CHR | intake → plan (mode: lite) → implement → test (mode: standard) → review → release |
| enhancement | ENH | intake → requirements (mode: delta, A) → business-flow (opt: changes_flow) → ux (opt: has_ui, A) → architecture (mode: lite, A) → plan → implement → test (mode: standard) → review → qa → release (A) |
| feature | FEAT | intake → brief → requirements (mode: full, A) → business-flow → ux (opt: has_ui, A) → architecture (mode: full, A) → plan → implement → test (mode: standard) → review → qa → release (A) |
| hotfix | HOT | intake → investigation (mode: hotfix) → implement → test (mode: regression) → review → release (A) → postmortem (mode: postmortem, deferrable: 3d) |
| migration | MIG | intake → requirements (mode: lite, A) → architecture (mode: migration, A) → plan → implement → test (mode: migration) → review → qa → release (A) |
| performance | PERF | intake → investigation (mode: baseline) → architecture (mode: lite, A) → plan → implement → test (mode: benchmark) → review → qa → release |
| refactor | REF | intake → investigation (mode: refactor) → architecture (mode: lite, A) → plan → implement → test (mode: parity) → review → qa (mode: parity) → release |
| security | SEC | intake → investigation (mode: threat) → architecture (mode: full, opt: design_change, A) → plan → implement → test (mode: exploit) → review → qa → release (A) |
| spike | SPK | intake → investigation (mode: spike) |

## Schema

Each file has `name`, `id_prefix`, `description` and an ordered `phases` list. Phase keys:

| Key | Meaning |
|---|---|
| `id` | Phase name; matches a checklist file and a state key |
| `owner` | `orchestrator` when no subagent runs the phase (intake only) |
| `agent` | Single subagent that performs the phase |
| `agents` | Map (implement: by layer) or list (review: run in parallel) |
| `mode` | Agent mode for this phase |
| `requires` | Phases that must be unlocked first |
| `inputs` | Artifacts the agent may read, relative to the work folder |
| `outputs` | Artifacts the agent must write |
| `conditional_outputs` | Map `flag -> [artifacts]` required only when that intake flag is true |
| `template` | Templates in `.jarvis/core/templates/` |
| `checklist` | Checklist in `.jarvis/core/checklists/` |
| `standards` | Only the standards files this agent needs |
| `reviewer_standards` | review only: standards per reviewer |
| `approval` | `human` or `none`; unset falls back to `gates.human_approval` in jarvis.config.yaml |
| `optional_if_false` | Intake flag; phase is skipped when the flag is false |
| `deferrable` | Phase may stay open for this long after release (hotfix postmortem) |
| `loop` | `per_task` — one subagent call per plan task |
| `parallel` | Reviewers are invoked in a single message |
| `blocking_reviewers` | `all` or a list; others are advisory |
| `on_fail` | Phase to return to when the gate fails |
| `deterministic_checks` | Config command keys that must exit 0 |
