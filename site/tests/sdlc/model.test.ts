import { describe, expect, it } from "vitest";

import type { Agent, SlashCommand, Workflow } from "@/lib/generated/schemas";
import {
  arcPath,
  connectorPath,
  polar,
  rotationDelta,
  stageAngle,
} from "@/lib/sdlc/geometry";
import {
  ROLES,
  STAGES,
  compactPaths,
  validateLifecycle,
  validateRoles,
} from "@/lib/sdlc/model";

const phase = (
  id: string,
  extra: Partial<Workflow["phases"][number]> = {},
) => ({ id, ...extra });

const featureWorkflow = (): Workflow => ({
  id: "feature",
  idPrefix: "FEAT",
  description: "",
  phases: STAGES.flatMap((s) => s.phases).map((id) =>
    phase(id, { agent: `jarvis-${id}`, outputs: [`${id}.md`] }),
  ),
});

describe("validateLifecycle", () => {
  it("resolves every stage against the workflow", () => {
    const views = validateLifecycle(featureWorkflow());
    expect(views.map((v) => v.id)).toEqual([
      "discover",
      "define",
      "design",
      "build",
      "verify",
      "ship",
    ]);
    expect(views[1]?.phases.map((p) => p.id)).toEqual([
      "requirements",
      "business-flow",
      "ux",
    ]);
  });

  it("collects agents, outputs, approvals and conditional agents from the phases", () => {
    const wf = featureWorkflow();
    const arch = wf.phases.find((p) => p.id === "architecture")!;
    arch.approval = "human";
    arch.conditionalAgents = { has_infra_change: ["jarvis-devops"] };
    arch.conditionalOutputs = { has_infra_change: ["infra-plan.md"] };
    const design = validateLifecycle(wf).find((v) => v.id === "design")!;
    expect(design.agents).toEqual(["jarvis-architecture", "jarvis-plan"]);
    expect(design.approvals).toEqual(["architecture"]);
    expect(design.conditionalAgents).toEqual([
      { flag: "has_infra_change", agent: "jarvis-devops" },
    ]);
    expect(design.conditionalOutputs).toEqual([
      { flag: "has_infra_change", file: "infra-plan.md" },
    ]);
  });

  it("throws when a stage names a phase the workflow no longer has", () => {
    const wf = featureWorkflow();
    wf.phases = wf.phases.filter((p) => p.id !== "brief");
    expect(() => validateLifecycle(wf)).toThrow(/"brief".*does not have/);
  });

  it("throws when the workflow gains a phase no stage claims", () => {
    const wf = featureWorkflow();
    wf.phases.push(phase("compliance"));
    expect(() => validateLifecycle(wf)).toThrow(
      /no lifecycle stage claims: compliance/,
    );
  });
});

describe("validateRoles", () => {
  const every = (ids: string[]): Agent[] =>
    ids.map((id) => ({
      id,
      name: id,
      description: "",
      tools: [],
      model: "inherit",
      role: "",
      inputs: "",
      outputs: "",
    }));
  const cmd = (name: string): SlashCommand => ({
    id: `/${name}`,
    name,
    description: "",
    bodyExcerpt: "",
  });

  const allAgents = () => every([...new Set(ROLES.flatMap((r) => r.agents))]);
  const allCommands = () =>
    [...new Set(ROLES.flatMap((r) => r.commands ?? []))].map(cmd);

  it("accepts a framework that has every agent and command a role names", () => {
    expect(() => validateRoles(allAgents(), allCommands())).not.toThrow();
  });

  it("throws when an agent a role names is gone", () => {
    expect(() =>
      validateRoles(
        allAgents().filter((a) => a.id !== "jarvis-staff"),
        allCommands(),
      ),
    ).toThrow(/jarvis-staff/);
  });

  it("throws when a command a role names is gone", () => {
    expect(() =>
      validateRoles(
        allAgents(),
        allCommands().filter((c) => c.name !== "jarvis-portfolio"),
      ),
    ).toThrow(/jarvis-portfolio/);
  });
});

describe("geometry", () => {
  it("places six stages clockwise from 12 o'clock", () => {
    expect(stageAngle(0, 6)).toBe(-90);
    expect(stageAngle(3, 6)).toBe(90);
    const top = polar(stageAngle(0, 6));
    expect(top.x).toBeCloseTo(50);
    expect(top.y).toBeCloseTo(50 - 33);
  });

  it("draws a connector that stops short of both nodes", () => {
    const d = connectorPath(0, 6);
    expect(d).toMatch(/^M [\d.-]+ [\d.-]+ A 33 33 0 0 1 [\d.-]+ [\d.-]+$/);
    expect(arcPath(-90, -30, 33, true)).toContain("0 0 1");
  });

  it("rotates forward through the wrap from the last stage to the first", () => {
    expect(rotationDelta(5, 0, 6)).toBe(60);
    expect(rotationDelta(0, 1, 6)).toBe(60);
  });

  it("takes the short way back for a backward jump, forward at exactly half a turn", () => {
    expect(rotationDelta(3, 2, 6)).toBe(-60);
    expect(rotationDelta(0, 5, 6)).toBe(-60);
    expect(rotationDelta(0, 3, 6)).toBe(180);
    expect(rotationDelta(3, 0, 6)).toBe(180);
  });
});

describe("compactPaths", () => {
  it("collapses three or more files sharing a directory and extension into brace form", () => {
    expect(
      compactPaths([
        "test-plan.md",
        "review/standards.md",
        "review/performance.md",
        "review/security.md",
        "qa-report.md",
      ]),
    ).toEqual([
      "test-plan.md",
      "review/{standards,performance,security}.md",
      "qa-report.md",
    ]);
  });

  it("leaves one or two files in a directory alone, and never merges different extensions", () => {
    expect(compactPaths(["review/a.md", "review/b.md"])).toEqual([
      "review/a.md",
      "review/b.md",
    ]);
    expect(compactPaths(["docs/a.md", "docs/b.yaml", "docs/c.md"])).toEqual([
      "docs/a.md",
      "docs/b.yaml",
      "docs/c.md",
    ]);
  });

  it("keeps every name, so nothing a reader was told about is dropped", () => {
    const files = [
      "review/a.md",
      "review/b.md",
      "review/c.md",
      "review/d.md",
      "x.md",
    ];
    const joined = compactPaths(files).join(" ");
    for (const name of ["a", "b", "c", "d"]) expect(joined).toContain(name);
    expect(joined).toContain("x.md");
  });
});
