import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseCommands } from "../../scripts/generate/parse-commands";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "commands");

describe("parseCommands", () => {
  it("extracts frontmatter and a clean body excerpt, skipping pre-exec and headings", () => {
    const { commands, skipped } = parseCommands(FIXTURES);
    const demo = commands.find((c) => c.name === "jarvis-demo");
    expect(demo).toBeDefined();
    expect(demo?.id).toBe("/jarvis-demo");
    expect(demo?.description).toBe("Demo command for parser tests.");
    expect(demo?.argumentHint).toBe("<id>");
    expect(demo?.bodyExcerpt).toBe(
      "This command demonstrates the parser. It reads a work item and prints its status.",
    );
    expect(skipped).toContain("jarvis-no-description");
  });

  it("returns an empty result for a missing directory rather than throwing", () => {
    const { commands, skipped } = parseCommands(path.join(FIXTURES, "does-not-exist"));
    expect(commands).toEqual([]);
    expect(skipped).toEqual([]);
  });
});
