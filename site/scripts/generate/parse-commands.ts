import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import type { SlashCommand } from "@/lib/generated/schemas";

/**
 * Reads .claude/commands/*.md frontmatter (description, argument-hint) + a short body
 * excerpt, per SITE_SPEC.md's "Content accuracy" list. Never invents a description —
 * if the frontmatter is missing one, the command is skipped and reported, not guessed.
 */
export function parseCommands(commandsDir: string): { commands: SlashCommand[]; skipped: string[] } {
  const commands: SlashCommand[] = [];
  const skipped: string[] = [];
  if (!fs.existsSync(commandsDir)) return { commands, skipped };

  for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md")).sort()) {
    const name = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(commandsDir, file), "utf8");
    const { data, content } = matter(raw);

    if (typeof data.description !== "string" || !data.description.trim()) {
      skipped.push(name);
      continue;
    }

    commands.push({
      id: `/${name}`,
      name,
      description: data.description.trim(),
      argumentHint: typeof data["argument-hint"] === "string" ? data["argument-hint"] : undefined,
      bodyExcerpt: firstProseParagraph(content),
    });
  }

  return { commands, skipped };
}

/** The first paragraph of body text that isn't a heading, a pre-exec bash block (and its
 *  one-line caption, e.g. "Current status:"), or a fenced code block — a short, honest
 *  excerpt of what the command actually does. */
function firstProseParagraph(body: string): string {
  const rawLines = body.split("\n");

  // Drop each `!`command`` line together with the caption line directly above it
  // (every Jarvis command file uses that "Caption:\n!`...`" pattern for pre-exec status).
  const lines: string[] = [];
  for (const rawLine of rawLines) {
    if (rawLine.trim().startsWith("!`")) {
      const prev = lines.at(-1);
      if (prev && prev.trim().endsWith(":")) lines.pop();
      continue;
    }
    lines.push(rawLine);
  }

  let inFence = false;
  const buffer: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const trimmed = line.trim();
    if (!trimmed) {
      if (buffer.length) break;
      continue;
    }
    if (trimmed.startsWith("#")) continue;
    // "Work item: $1", "Input: $ARGUMENTS", "Type: $1" — argument readouts every
    // command echoes near the top, not a description of what it does.
    if (/^[\w -]+:\s*\$[\w{}]+$/.test(trimmed)) continue;
    buffer.push(trimmed);
  }

  return buffer.join(" ").trim();
}
