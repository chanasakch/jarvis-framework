# Project Guide

This project runs the **Jarvis** SDLC framework on Claude Code.

## Rules
- All work starts with `/jarvis`. Do not implement, design or test outside a Jarvis phase.
- Never edit `.jarvis/state/**` by hand; the CLI owns it (`node .jarvis/scripts/jarvis.js`).
- `approve`, `force`, `skip`, `reopen`, `park`, `unpark` are human-only. Ask the user to run them.
- Every artifact and code comment is written in **English**.
- Every exception to a standard needs an ADR in `docs/adr/`.
- Run `/jarvis-help` for the command list, `/jarvis-status` for current work.

## Imports
@.jarvis/core/rules/conventions.md
@.jarvis/project/context.md
