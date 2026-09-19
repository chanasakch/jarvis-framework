/**
 * `jarvis.js help --json`'s usage text has no description column for human-only
 * commands (spec §16.1 already documents *what* they do in its table; the CLI's own
 * help text doesn't repeat it). One line each here, cross-checked at generation time
 * against the real `human_only` list from `help --json` — an entry for a command that
 * no longer exists, or a human-only command with no entry here, fails the build
 * (same drift-guard pattern as config-descriptions.ts, DECISIONS.md D-019).
 */
export const humanOnlyDescriptions: Record<string, string> = {
  approve: "Approve a phase that has passed both gates.",
  force: "Pass a failed gate. Audited, warned about at every later step, creates a follow-up chore item for the unresolved findings.",
  skip: "Skip an optional phase.",
  reopen: "Reset a phase and every phase after it back to pending.",
  park: "Pause a work item.",
  unpark: "Resume a paused work item.",
};
