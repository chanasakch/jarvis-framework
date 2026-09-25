import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseChangelog } from "../../scripts/generate/parse-changelog";

const FIXTURE = path.join(import.meta.dirname, "fixtures", "changelog", "CHANGELOG.md");

describe("parseChangelog", () => {
  const entries = parseChangelog(FIXTURE);

  it("reads every version, newest first, with its date", () => {
    expect(entries.map((e) => [e.version, e.date])).toEqual([
      ["1.1.0", "2026-10-01"],
      ["1.0.0", "2026-09-19"],
    ]);
  });

  it("joins a bullet that the file wraps onto later lines, instead of ending it mid-sentence", () => {
    const added = entries[0]!.sections.find((s) => s.heading === "Added")!;
    expect(added.items[1]).toBe("A long item that the file wraps onto a second line and then a third line, all belonging to the same bullet.");
  });

  it("does not run one bullet into the next", () => {
    const added = entries[0]!.sections.find((s) => s.heading === "Added")!;
    expect(added.items).toHaveLength(3);
    expect(added.items[0]).toBe("A short item.");
    expect(added.items[2]).toBe("Another short item with `inline code`.");
  });

  it("wraps within a section and stays in that section", () => {
    const fixed = entries[0]!.sections.find((s) => s.heading === "Fixed")!;
    expect(fixed.items).toEqual(["One more that wraps across two lines."]);
  });

  it("still throws on a file with no version heading", () => {
    expect(() => parseChangelog(path.join(import.meta.dirname, "fixtures", "changelog", "missing.md"))).toThrow();
  });
});
