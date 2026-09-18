---
description: Run the Jarvis review phase — four reviewers in parallel over a diff, merged into review-report.md with a verdict.
argument-hint: <work item ID> | --base <git ref>
allowed-tools: Read, Write, Glob, Grep, Task, Bash(node .jarvis/scripts/jarvis.js:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git merge-base:*)
model: inherit
---

Target: $ARGUMENTS

Run the review phase.

**With a work item ID:** this is the item's review phase. Follow
`.jarvis/core/rules/orchestration.md` §3 — `jarvis.js next <ID>` must return `review`; if it does not,
say what is pending and stop.

**With `--base <ref>`:** an ad-hoc review of any diff, outside a work item. Write the reports to
`docs/work/adhoc/<YYYY-MM-DD>/review/<reviewer>.md`. An ad-hoc review changes no state and gates nothing.

## How to run it

1. Determine the diff base: the item's branch merge-base with `origin/main`, or the `--base` ref.
   Record the exact base in every report — the review checklist verifies it.
2. Invoke every reviewer in `review.reviewers` **in parallel: one message containing multiple Task calls.**
   Never sequentially. Each reviewer gets a Handoff Brief naming its own standards
   (`reviewer_standards` in the workflow file) and the diff command to run.
3. Each reviewer writes `review/<reviewer>.md` with a findings table and the mandatory JSON block —
   including when it has no findings (`"findings": []`).
4. `node .jarvis/scripts/jarvis.js merge-review <ID>` produces `review-report.md` and the verdict.
5. Verdict `fail` → the CLI has already reset the phase to `implement` and created `FIX-<finding-id>`
   tasks. Report the blocking findings and stop; the fixes run in the implement phase.

Reviewers never edit code. A finding without a rule ID and `file:line` is not a finding.
