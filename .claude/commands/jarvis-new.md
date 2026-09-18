---
description: Create a Jarvis work item with an explicit type, skipping classification. Then runs intake.
argument-hint: <type> <title>
allowed-tools: Read, Write, Glob, Grep, Bash(node .jarvis/scripts/jarvis.js:*)
model: inherit
---

Type: $1
Title: $ARGUMENTS

Create a work item of the given type without re-classifying it.

1. Validate `$1` against the ten types in `.jarvis/core/workflows/` (feature, enhancement, bugfix, hotfix,
   refactor, performance, security, migration, spike, chore). If it is not one of them, list the valid
   types and stop.
2. The title is `$ARGUMENTS` with the leading type removed. Keep it to ≤ 8 words — the intake gate checks this.
3. Ask the intake flag questions: **max 5, numbered, in one message**. Ask only the flags this type uses;
   infer the obvious ones from the title and state the inference instead of asking.
4. `node .jarvis/scripts/jarvis.js new $1 "<title>" --flags k=v,k=v --json`
5. Write `intake.md` from `.jarvis/core/templates/intake.md` into the new work folder, then gate it exactly
   as `.jarvis/core/rules/orchestration.md` §5 describes.
6. Hand over to the normal loop: tell the user to run `/jarvis <ID>`, or continue if they asked you to.

Never skip the flag questions — downstream phases are selected by those flags.
