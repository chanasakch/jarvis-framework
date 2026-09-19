import { describe, expect, it } from "vitest";

import { parseCliFromHelpJson } from "../../scripts/generate/parse-cli";

// A snapshot of the real `jarvis.js help --json` output (captured 2026-09) — see
// site/PROGRESS.md. If the CLI's usage text format ever changes, this fixture goes
// stale on purpose: the test should be updated deliberately, not silently pass.
const HELP_JSON = {
  commands: [
    "new", "flags", "next", "status", "set", "task", "validate", "merge-review",
    "lint", "check", "doctor", "approve", "force", "skip", "reopen", "park", "unpark", "ci", "help",
  ],
  human_only: ["approve", "force", "skip", "reopen", "park", "unpark"],
  usage:
    'jarvis <command> [args] [--json]\n\n' +
    'Claude + human:\n' +
    '  new <type> "<title>" [--flags k=v,...]   create a work item\n' +
    '  status [ID] [--brief]                    status, warnings, forced gates\n' +
    '  doctor                                   tools, paths, registry\n\n' +
    'Human only (Claude is blocked by guard.js — ask the user to run these):\n' +
    '  approve <ID> <phase>\n' +
    '  force <ID> <phase> --reason "<why>" [--accept-risk]\n' +
    '  park <ID> --reason "<why>" | unpark <ID>',
};

describe("parseCliFromHelpJson", () => {
  it("splits usage/description for regular commands", () => {
    const { commands } = parseCliFromHelpJson(HELP_JSON);
    const status = commands.find((c) => c.id === "status");
    expect(status?.usage).toBe('status [ID] [--brief]');
    expect(status?.description).toBe("status, warnings, forced gates");
    expect(status?.humanOnly).toBe(false);
  });

  it("looks up human-only descriptions and splits a packed 'a | b' line into two commands", () => {
    const { commands } = parseCliFromHelpJson(HELP_JSON);
    const park = commands.find((c) => c.id === "park");
    const unpark = commands.find((c) => c.id === "unpark");
    expect(park?.humanOnly).toBe(true);
    expect(park?.usage).toBe('park <ID> --reason "<why>"');
    expect(unpark?.usage).toBe("unpark <ID>");
    expect(park?.description).toContain("Pause");
    expect(unpark?.description).toContain("Resume");
  });

  it("excludes the self-referential 'help' entry", () => {
    const { commands } = parseCliFromHelpJson(HELP_JSON);
    expect(commands.find((c) => c.id === "help")).toBeUndefined();
  });
});
