import fs from "node:fs";

import type { ChangelogEntry } from "@/lib/generated/schemas";

const VERSION_RE = /^## \[(.+?)\] - (\d{4}-\d{2}-\d{2})\s*$/;
const SECTION_RE = /^### (.+?)\s*$/;
const ITEM_RE = /^- (.+)$/;

/** Parses root CHANGELOG.md's Keep a Changelog-style entries. Throws on a file with no
 *  recognizable version heading rather than silently shipping an empty changelog page. */
export function parseChangelog(filePath: string): ChangelogEntry[] {
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;
  let currentSection: { heading: string; items: string[] } | null = null;

  for (const line of lines) {
    const versionMatch = line.match(VERSION_RE);
    if (versionMatch) {
      current = { version: versionMatch[1]!, date: versionMatch[2]!, sections: [] };
      entries.push(current);
      currentSection = null;
      continue;
    }
    if (!current) continue;

    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      currentSection = { heading: sectionMatch[1]!, items: [] };
      current.sections.push(currentSection);
      continue;
    }

    const itemMatch = line.match(ITEM_RE);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1]!);
    }
  }

  if (entries.length === 0) {
    throw new Error(`${filePath}: no version entries found (expected "## [x.y.z] - YYYY-MM-DD")`);
  }
  return entries;
}
