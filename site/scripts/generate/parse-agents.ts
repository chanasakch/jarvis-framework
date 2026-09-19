import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import type { Agent } from "@/lib/generated/schemas";

/** Splits a markdown body into top-level (`# Heading`) sections, keyed by heading text. */
function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = body.split("\n");
  let current: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (current) sections.set(current, buf.join("\n").trim());
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m?.[1]) {
      flush();
      current = m[1];
    } else if (current) {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

/** `- **mode** — description` bullet → the bold mode name. */
function extractModeNames(modesSection: string): string[] {
  return [...modesSection.matchAll(/^-\s+\*\*([^*]+)\*\*/gm)]
    .map((m) => m[1]?.trim())
    .filter((name): name is string => !!name);
}

/** Bullet lists (outputs are usually a list of file paths) read better joined with "; "
 *  than flattened whitespace-to-whitespace. */
function flatten(text: string): string {
  const isList = text.split("\n").every((l) => !l.trim() || l.trim().startsWith("-"));
  if (isList) {
    return text
      .split("\n")
      .map((l) => l.trim().replace(/^-\s*/, ""))
      .filter(Boolean)
      .join("; ");
  }
  return text.replace(/\s+/g, " ").trim();
}

function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  let cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.6) cut = cut.slice(0, lastSpace);
  // Never end mid-code-span: an odd number of backticks means one is unclosed.
  if ((cut.match(/`/g)?.length ?? 0) % 2 === 1) cut = cut.slice(0, cut.lastIndexOf("`"));
  return `${cut.trimEnd()}…`;
}

function firstSentence(text: string, maxLen = 220): string {
  const flat = flatten(text);
  const cut = flat.match(/^.+?[.!](?=\s|$)/);
  if (cut && cut[0].length <= maxLen) return cut[0];
  return truncateAtWord(flat, maxLen);
}

/** Reads .claude/agents/*.md: frontmatter (name, description, tools, model) + Role,
 *  Modes, Inputs, Outputs sections. Every agent must have all four required frontmatter
 *  fields and a Role section, or it's skipped and reported rather than guessed. */
export function parseAgents(agentsDir: string): { agents: Agent[]; skipped: string[] } {
  const agents: Agent[] = [];
  const skipped: string[] = [];
  if (!fs.existsSync(agentsDir)) return { agents, skipped };

  for (const file of fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md")).sort()) {
    const id = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(agentsDir, file), "utf8");
    const { data, content } = matter(raw);

    if (
      typeof data.name !== "string" ||
      typeof data.description !== "string" ||
      typeof data.tools !== "string" ||
      typeof data.model !== "string"
    ) {
      skipped.push(id);
      continue;
    }

    const sections = splitSections(content);
    const role = sections.get("Role");
    const inputs = sections.get("Inputs");
    const outputs = sections.get("Outputs");
    if (!role || !inputs || !outputs) {
      skipped.push(id);
      continue;
    }

    const modesSection = sections.get("Modes");

    agents.push({
      id,
      name: data.name,
      description: data.description.trim(),
      tools: data.tools.split(",").map((t: string) => t.trim()),
      model: data.model.trim(),
      role: firstSentence(role),
      modes: modesSection ? extractModeNames(modesSection) : undefined,
      inputs: firstSentence(inputs),
      outputs: firstSentence(outputs, 300),
    });
  }

  return { agents, skipped };
}
