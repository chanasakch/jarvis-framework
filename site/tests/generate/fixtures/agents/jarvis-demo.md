---
name: jarvis-demo
description: Demo phase — writes demo.md. Use for parser tests only.
tools: Read, Write, Glob
model: opus
---

# Role
Owns the Demo phase. Writes demo.md from a brief.

# Modes
- **full** — complete demo output.
- **lite** — abbreviated demo output.

# Inputs
Only the files listed in the Handoff Brief.

# Outputs
- `docs/work/<ID>-<slug>/demo.md`

# Process
1. Read the brief.
2. Write demo.md.

# Must
- Cite evidence.

# Must Not
- Invent requirements.

# Self-Check
Run every Blocking item.

# Return Format
RESULT
