import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseWorkflows } from "../../scripts/generate/parse-workflows";

const FIXTURES = path.join(import.meta.dirname, "fixtures", "workflows");
// The real framework module, not a reimplementation — this test's whole point is that
// the site can never compute an approval value the CLI itself wouldn't.
const WORKFLOW_LIB = path.resolve(import.meta.dirname, "../../../.jarvis/scripts/lib/workflow.js");

const config = { gates: { human_approval: ["requirements"] } };

describe("parseWorkflows", () => {
  it("computes approval using the framework's own approvalRequired(), not a reimplementation", () => {
    const { workflows, skipped } = parseWorkflows(FIXTURES, WORKFLOW_LIB, config);
    expect(skipped).toEqual(["broken"]);
    expect(workflows.map((w) => w.id)).toContain("conditional");

    const demo = workflows.find((w) => w.id === "demo");
    expect(demo).toBeDefined();
    expect(demo?.idPrefix).toBe("DEM");

    const byId = Object.fromEntries((demo?.phases ?? []).map((p) => [p.id, p]));
    expect(byId.intake?.approval).toBe("none"); // not in gates.human_approval
    expect(byId.requirements?.approval).toBe("human"); // in gates.human_approval, no override
    expect(byId.release?.approval).toBe("none"); // explicit override beats the default
    expect(byId.implement?.agents).toEqual({ backend: "jarvis-dev-backend", frontend: "jarvis-dev-frontend" });
  });

  it("surfaces flag-conditional agents and outputs", () => {
    const { workflows } = parseWorkflows(FIXTURES, WORKFLOW_LIB, config);
    const review = workflows.find((w) => w.id === "conditional")?.phases[0];
    expect(review?.conditionalAgents).toEqual({ has_infra_change: ["jarvis-review-devops"] });
    expect(review?.conditionalOutputs).toEqual({ has_infra_change: ["review/devops.md"] });
  });
});
