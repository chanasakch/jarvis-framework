import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseAgents } from "../../scripts/generate/parse-agents";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "agents");

describe("parseAgents", () => {
  it("extracts frontmatter, modes, inputs and outputs", () => {
    const { agents, skipped } = parseAgents(FIXTURES);
    expect(skipped).toEqual([]);
    const demo = agents.find((a) => a.id === "jarvis-demo");
    expect(demo).toBeDefined();
    expect(demo?.tools).toEqual(["Read", "Write", "Glob"]);
    expect(demo?.model).toBe("opus");
    expect(demo?.role).toBe("Owns the Demo phase.");
    expect(demo?.modes).toEqual(["full", "lite"]);
    expect(demo?.inputs).toBe("Only the files listed in the Handoff Brief.");
    expect(demo?.outputs).toBe("`docs/work/<ID>-<slug>/demo.md`");
  });
});
