import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseStandards } from "../../scripts/generate/parse-standards";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "standards");

describe("parseStandards", () => {
  it("picks up any standards file with its area, summary and rules", () => {
    const { standards, skipped, unparsedRules } = parseStandards(FIXTURES);
    const devops = standards.find((s) => s.id === "devops");
    expect(devops?.area).toBe("OPS");
    expect(devops?.title).toBe("DevOps Standards");
    expect(devops?.summary).toBe("Keep pipelines safe and deploys reversible.");
    expect(devops?.rules.map((r) => [r.id, r.level])).toEqual([["OPS-01", "MUST"], ["OPS-02", "SHOULD"]]);
    expect(skipped).toEqual(["notes"]);
    expect(unparsedRules).toEqual(["devops.md: ### OPS-03 Missing the separator (MUST)"]);
  });
});
