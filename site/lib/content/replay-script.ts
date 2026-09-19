import type { Dictionary } from "@/lib/i18n";

/**
 * The landing page terminal replay. Command and output TEXT is always English — it's a
 * literal transcript of what the real CLI prints (Status Report and Gate Failure Menu
 * formats copied verbatim from .jarvis/core/rules/orchestration.md §4 and §5.1). Only
 * the caption per frame — what's happening, shown beside the terminal — is localized,
 * via `captionKey` into Dictionary["landing"]["replay"]["captions"].
 */

export type ReplayCaptionKey = keyof Dictionary["landing"]["replay"]["captions"];

export type ReplayFrame =
  | { kind: "command"; captionKey: ReplayCaptionKey; prompt: string; text: string }
  | { kind: "output"; captionKey: ReplayCaptionKey; lines: string[] };

export const replayScript: ReplayFrame[] = [
  {
    kind: "command",
    captionKey: "start",
    prompt: "$",
    text: "/jarvis Add OTP login for returning customers",
  },
  {
    kind: "output",
    captionKey: "intake",
    lines: [
      "Work type: feature — a new capability, not a fix to something that exists. Confirm? (y/n)",
      "",
      "1) Does this need a UI?                    (has_ui)",
      "2) Does the API contract change?           (has_api_change)",
      "3) Does the database schema change?        (has_db_change)",
      "4) MySQL, MongoDB, or both?                (has_mysql / has_mongo)",
      "5) Does this touch authentication?         (touches_auth)",
    ],
  },
  {
    kind: "command",
    captionKey: "answer",
    prompt: ">",
    text: "y, 1 yes, 2 yes, 3 yes, 4 mysql, 5 yes",
  },
  {
    kind: "output",
    captionKey: "status",
    lines: [
      "── JARVIS ─────────────────────────────",
      "Item:   FEAT-012 OTP login (feature)",
      "Phase:  architecture → passed (attempt 1) ✅",
      "Waiting: human approval",
      "Next:   ! npm run -s jarvis -- approve FEAT-012 architecture",
      "Warnings: none",
      "───────────────────────────────────────",
    ],
  },
  {
    kind: "output",
    captionKey: "gateFailed",
    lines: [
      "⚠️  GATE FAILED: FEAT-012 / review (attempt 3/3)",
      "Blocking issues:",
      "  - [F-SEC-001][critical] Raw DB error returned in POST /v1/otp response",
      "  - [F-PERF-002][major] Query inside loop in otp/service.go:88",
      "Options:",
      "  1) Retry — send issues back to the agent (resets attempts)",
      "  2) Fix manually, then run: /jarvis FEAT-012",
      "  3) Force pass (human only, audited):",
      '     ! npm run -s jarvis -- force FEAT-012 review --reason "<why>"',
      "  4) Park work item:",
      '     ! npm run -s jarvis -- park FEAT-012 --reason "<why>"',
    ],
  },
  {
    kind: "command",
    captionKey: "forced",
    prompt: "$",
    text: '! npm run -s jarvis -- force FEAT-012 review --reason "hotfix window closes in 10 min, tracked as CHR-004"',
  },
  {
    kind: "output",
    captionKey: "forced",
    lines: [
      "⚠️  forced FEAT-012 review (chanasak)",
      "reason: hotfix window closes in 10 min, tracked as CHR-004",
      "unresolved: F-SEC-001, F-PERF-002",
      "follow-up: CHR-004",
    ],
  },
];
