import fs from "node:fs";
import path from "node:path";

import type { Standard } from "@/lib/generated/schemas";

// `### SEC-01 — Title (MUST)`, optionally followed by bracket tags such as `[ADDED]`.
const RULE_RE = /^###\s+([A-Z]+-\d+)\s+—\s+(.+?)\s+\((MUST|SHOULD|MAY)\)(?:\s+\[[^\]]+\])*\s*$/;
const RULE_HEADING_RE = /^###\s+[A-Z]+-\d+\b/;

/** First sentence of the first paragraph after the `# Title` line, minus a `Purpose:` label. */
function summaryOf(lines: string[]): string {
  const para: string[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) {
      if (para.length) break;
      continue;
    }
    if (line.startsWith("#")) break;
    para.push(line.trim());
  }
  const text = para.join(" ").replace(/^Purpose:\s*/, "");
  const sentence = text.match(/^.+?\.(?=\s|$)/)?.[0] ?? text;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** Reads every `.jarvis/standards/*.md`. A file with no `# Title` or no rule heading is
 *  skipped, and a `### ID` heading in an unrecognized shape is listed in `unparsedRules` —
 *  both reported by generate-content.ts, never guessed. */
export function parseStandards(standardsDir: string): { standards: Standard[]; skipped: string[]; unparsedRules: string[] } {
  const standards: Standard[] = [];
  const skipped: string[] = [];
  const unparsedRules: string[] = [];
  if (!fs.existsSync(standardsDir)) return { standards, skipped, unparsedRules };

  for (const file of fs.readdirSync(standardsDir).filter((f) => f.endsWith(".md")).sort()) {
    const id = file.replace(/\.md$/, "");
    const lines = fs.readFileSync(path.join(standardsDir, file), "utf8").split("\n");
    const title = lines[0]?.match(/^#\s+(.+?)\s*$/)?.[1];
    const rules = lines
      .map((l) => l.match(RULE_RE))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => ({ id: m[1]!, title: m[2]!, level: m[3] as "MUST" | "SHOULD" | "MAY" }));

    for (const line of lines) {
      if (RULE_HEADING_RE.test(line) && !RULE_RE.test(line)) unparsedRules.push(`${file}: ${line.trim()}`);
    }

    if (!title || rules.length === 0) {
      skipped.push(id);
      continue;
    }
    standards.push({
      id,
      file,
      title,
      area: rules[0]!.id.split("-")[0]!,
      summary: summaryOf(lines),
      rules,
    });
  }
  return { standards, skipped, unparsedRules };
}
