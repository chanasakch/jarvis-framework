import fs from "node:fs";

import type { ChangelogEntry } from "@/lib/generated/schemas";

const VERSION_RE = /^## \[(.+?)\] - (\d{4}-\d{2}-\d{2})\s*$/;
const SECTION_RE = /^### (.+?)\s*$/;
const ITEM_RE = /^- (.+)$/;
const CONTINUATION_RE = /^\s{2,}(\S.*)$/;

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
      continue;
    }

    // A bullet wrapped onto the next lines: Keep a Changelog files break long bullets at about
    // 90 columns and indent the rest. Without this only the first line of each bullet survived,
    // so a release note ended mid-sentence.
    const continuation = line.match(CONTINUATION_RE);
    if (continuation && currentSection && currentSection.items.length > 0) {
      const last = currentSection.items.length - 1;
      currentSection.items[last] = `${currentSection.items[last]} ${continuation[1]!.trim()}`;
    }
  }

  if (entries.length === 0) {
    throw new Error(`${filePath}: no version entries found (expected "## [x.y.z] - YYYY-MM-DD")`);
  }
  return entries;
}
