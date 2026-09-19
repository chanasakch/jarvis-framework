import { execFileSync } from "node:child_process";

import type { CliCommand } from "@/lib/generated/schemas";

import { humanOnlyDescriptions } from "./human-only-descriptions";

interface HelpJson {
  commands: string[];
  human_only: string[];
  usage: string;
}

/** Runs the real CLI's `help --json` (already supports --json — verified in SITE_PLAN.md
 *  §5, no framework change needed) and parses its usage text into one entry per command.
 *  Never invents a command or description: an id in `commands` with no parseable usage
 *  line, or a human-only id with no entry in human-only-descriptions.ts, is reported and
 *  excluded rather than guessed. */
export function parseCli(jarvisJsPath: string, cwd: string): { commands: CliCommand[]; skipped: string[] } {
  const raw = execFileSync("node", [jarvisJsPath, "help", "--json"], { cwd, encoding: "utf8" });
  const data: HelpJson = JSON.parse(raw);
  return parseCliFromHelpJson(data);
}

export function parseCliFromHelpJson(data: HelpJson): { commands: CliCommand[]; skipped: string[] } {
  const humanOnly = new Set(data.human_only);
  const byId = new Map<string, CliCommand>();
  const skipped: string[] = [];

  const sections = data.usage.split(/\n\n(?=[A-Z])/);
  for (const section of sections) {
    const lines = section.split("\n").slice(1); // drop the section heading line
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Non-human-only lines have a usage/description split on 2+ spaces; human-only
      // lines are usage only, and "park ... | unpark ..." packs two commands in one line.
      const withDesc = line.match(/^(\S.*?)\s{2,}(\S.*)$/);
      const parts = withDesc ? [line] : line.split(/\s+\|\s+/);

      for (const part of parts) {
        const m = part.match(/^(\S.*?)\s{2,}(\S.*)$/);
        const usage = (m?.[1] ?? part).trim();
        const id = usage.split(/\s+/)[0];
        if (!id) continue;

        const description = m?.[2]?.trim() ?? humanOnlyDescriptions[id];
        if (!description) {
          skipped.push(id);
          continue;
        }
        byId.set(id, { id, humanOnly: humanOnly.has(id), usage, description });
      }
    }
  }

  for (const id of data.commands) {
    if (id === "help") continue; // self-referential, not worth a reference row
    if (!byId.has(id)) skipped.push(id);
  }

  return { commands: [...byId.values()], skipped };
}
