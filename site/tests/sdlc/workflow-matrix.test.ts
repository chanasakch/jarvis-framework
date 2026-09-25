import { describe, expect, it } from "vitest";

import type { Workflow } from "@/lib/generated/schemas";
import { buildMatrix, PHASE_ORDER } from "@/lib/viz/workflow-matrix";

const wf = (id: string, phases: Workflow["phases"]): Workflow => ({ id, idPrefix: id.slice(0, 3).toUpperCase(), description: "", phases });

describe("buildMatrix", () => {
  const feature = wf("feature", [
    { id: "intake" },
    { id: "requirements", approval: "human" },
    { id: "ux", approval: "human", optionalIfFalse: "has_ui" },
    { id: "architecture", approval: "human", conditionalAgents: { has_infra_change: ["jarvis-devops"] } },
  ]);
  const spike = wf("spike", [{ id: "intake" }, { id: "investigation" }]);

  it("orders columns canonically, whatever order the workflows list their phases in", () => {
    const { phases } = buildMatrix([spike, feature]);
    expect(phases).toEqual(["intake", "investigation", "requirements", "ux", "architecture"]);
  });

  it("marks approvals, optional phases and conditional agents, and leaves other phases empty", () => {
    const { rows } = buildMatrix([feature, spike]);
    const row = rows[0]!;
    expect(row.cells.requirements).toEqual({ approval: true, optionalFlag: undefined, conditionalFlags: [] });
    expect(row.cells.ux).toMatchObject({ approval: true, optionalFlag: "has_ui" });
    expect(row.cells.architecture?.conditionalFlags).toEqual(["has_infra_change"]);
    expect(row.cells.investigation).toBeUndefined();
    expect(row.phaseCount).toBe(4);
    expect(row.approvalCount).toBe(3);
  });

  it("appends a phase it does not know rather than dropping it", () => {
    const { phases } = buildMatrix([wf("x", [{ id: "intake" }, { id: "compliance" }])]);
    expect(phases).toEqual(["intake", "compliance"]);
  });

  it("knows every phase the framework has today, so a new one is noticed", () => {
    // These are the phases in .jarvis/core/workflows/*.yaml. If this list changes, decide where
    // the new phase belongs in PHASE_ORDER instead of letting it fall to the end.
    expect([...PHASE_ORDER].sort()).toEqual(
      ["architecture", "brief", "business-flow", "implement", "intake", "investigation", "plan", "postmortem", "qa", "release", "requirements", "review", "test", "ux"].sort(),
    );
  });
});
