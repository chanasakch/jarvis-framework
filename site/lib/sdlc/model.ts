import type {
  Agent,
  SlashCommand,
  Workflow,
  WorkflowPhase,
} from "@/lib/generated/schemas";

/**
 * The SDLC lifecycle shown on the landing page and /docs/sdlc.
 *
 * What is editorial here is only the *grouping*: which workflow phases sit in which of
 * six lifecycle stages, and which team role maps to which agent. Everything a reader is
 * told about those phases (agents, outputs, approval points, checklist prefixes) is read
 * from the generated workflow JSON, never copied. `validateLifecycle` and
 * `validateRoles` throw when this file and the framework disagree (a phase renamed, an
 * agent removed), so the diagram cannot drift from the framework silently — the same
 * "throw on shape mismatch" contract as every generated-content parser (SITE_SPEC.md,
 * "Content accuracy").
 */

/** The workflow the lifecycle is drawn from. Other work types reorder or skip phases. */
export const LIFECYCLE_WORKFLOW = "feature";

export const STAGE_IDS = [
  "discover",
  "define",
  "design",
  "build",
  "verify",
  "ship",
] as const;
export type StageId = (typeof STAGE_IDS)[number];

export interface StageDef {
  id: StageId;
  /** Phase ids from the feature workflow, in order. */
  phases: string[];
}

export const STAGES: StageDef[] = [
  { id: "discover", phases: ["intake", "brief"] },
  { id: "define", phases: ["requirements", "business-flow", "ux"] },
  { id: "design", phases: ["architecture", "plan"] },
  { id: "build", phases: ["implement"] },
  { id: "verify", phases: ["test", "review", "qa"] },
  { id: "ship", phases: ["release"] },
];

export const ROLE_IDS = [
  "product-owner",
  "business-analyst",
  "ux-designer",
  "solution-architect",
  "tech-lead",
  "backend-developer",
  "frontend-developer",
  "full-stack-developer",
  "qa-engineer",
  "reviewers",
  "devops-engineer",
  "release-manager",
  "investigator",
  "staff-engineer",
  "project-manager",
  "gatekeeper",
] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export interface RoleDef {
  id: RoleId;
  /** Agent ids that cover the role. */
  agents: string[];
  /** Slash command names (no leading slash) that cover the role, when it is not an agent. */
  commands?: string[];
}

export const ROLES: RoleDef[] = [
  { id: "product-owner", agents: ["jarvis-po"] },
  { id: "business-analyst", agents: ["jarvis-analyst", "jarvis-ba"] },
  { id: "ux-designer", agents: ["jarvis-ux"] },
  { id: "solution-architect", agents: ["jarvis-architect"] },
  { id: "tech-lead", agents: ["jarvis-planner"] },
  { id: "backend-developer", agents: ["jarvis-dev-backend"] },
  { id: "frontend-developer", agents: ["jarvis-dev-frontend"] },
  // No agent of its own: every plan task has exactly one layer, so full-stack work is a
  // backend task plus a frontend task, each routed to the agent above.
  {
    id: "full-stack-developer",
    agents: ["jarvis-dev-backend", "jarvis-dev-frontend"],
  },
  { id: "qa-engineer", agents: ["jarvis-tester", "jarvis-qa"] },
  {
    id: "reviewers",
    agents: [
      "jarvis-review-standards",
      "jarvis-review-performance",
      "jarvis-review-security",
      "jarvis-review-database",
    ],
  },
  { id: "devops-engineer", agents: ["jarvis-devops", "jarvis-review-devops"] },
  { id: "release-manager", agents: ["jarvis-release"] },
  { id: "investigator", agents: ["jarvis-investigator"] },
  {
    id: "staff-engineer",
    agents: ["jarvis-staff"],
    commands: ["jarvis-health"],
  },
  // A CLI command, not an agent: the data is deterministic state, so a script reports it
  // exactly (DECISIONS.md D-049).
  { id: "project-manager", agents: [], commands: ["jarvis-portfolio"] },
  { id: "gatekeeper", agents: ["jarvis-gatekeeper"] },
];

export function agentsOf(phase: WorkflowPhase): string[] {
  if (phase.agent) return [phase.agent];
  if (Array.isArray(phase.agents)) return phase.agents;
  if (phase.agents && typeof phase.agents === "object")
    return Object.values(phase.agents);
  return [];
}

export interface StageView {
  id: StageId;
  phases: WorkflowPhase[];
  /** Agents that always run in this stage, de-duplicated, in phase order. */
  agents: string[];
  /** Agents that join only when an intake flag is true. */
  conditionalAgents: { flag: string; agent: string }[];
  outputs: string[];
  conditionalOutputs: { flag: string; file: string }[];
  /** Phases that stop for a human to approve. */
  approvals: string[];
  checklistPrefixes: string[];
  /** Phases skipped unless a flag is true. */
  optional: { phase: string; flag: string }[];
}

const uniq = <T>(list: T[]) => [...new Set(list)];

/** Resolves every stage against the workflow. Throws when a stage names a phase the
 *  workflow does not have, or when the workflow has a phase no stage claims. */
export function validateLifecycle(workflow: Workflow): StageView[] {
  const byId = new Map(workflow.phases.map((p) => [p.id, p]));
  const claimed = new Set<string>();

  const views = STAGES.map((stage): StageView => {
    const phases = stage.phases.map((id) => {
      const phase = byId.get(id);
      if (!phase) {
        throw new Error(
          `lifecycle stage "${stage.id}" names phase "${id}", which the ${workflow.id} workflow does not have. Update lib/sdlc/model.ts.`,
        );
      }
      if (claimed.has(id))
        throw new Error(
          `lifecycle phase "${id}" is claimed by more than one stage.`,
        );
      claimed.add(id);
      return phase;
    });

    return {
      id: stage.id,
      phases,
      agents: uniq(phases.flatMap(agentsOf)),
      conditionalAgents: phases.flatMap((p) =>
        Object.entries(p.conditionalAgents ?? {}).flatMap(([flag, agents]) =>
          agents.map((agent) => ({ flag, agent })),
        ),
      ),
      outputs: uniq(phases.flatMap((p) => p.outputs ?? [])),
      conditionalOutputs: phases.flatMap((p) =>
        Object.entries(p.conditionalOutputs ?? {}).flatMap(([flag, files]) =>
          files.map((file) => ({ flag, file })),
        ),
      ),
      approvals: phases.filter((p) => p.approval === "human").map((p) => p.id),
      checklistPrefixes: uniq(
        phases.map((p) => p.checklistPrefix).filter((x): x is string => !!x),
      ),
      optional: phases
        .filter((p) => p.optionalIfFalse)
        .map((p) => ({ phase: p.id, flag: p.optionalIfFalse as string })),
    };
  });

  const unclaimed = workflow.phases
    .map((p) => p.id)
    .filter((id) => !claimed.has(id));
  if (unclaimed.length) {
    throw new Error(
      `the ${workflow.id} workflow has phases no lifecycle stage claims: ${unclaimed.join(", ")}. Add them to lib/sdlc/model.ts.`,
    );
  }
  return views;
}

/** Throws when a role names an agent or slash command the framework does not have. */
export function validateRoles(agents: Agent[], commands: SlashCommand[]): void {
  const agentIds = new Set(agents.map((a) => a.id));
  const commandNames = new Set(commands.map((c) => c.name));
  for (const role of ROLES) {
    for (const a of role.agents) {
      if (!agentIds.has(a))
        throw new Error(
          `role "${role.id}" names agent "${a}", which does not exist. Update lib/sdlc/model.ts.`,
        );
    }
    for (const c of role.commands ?? []) {
      if (!commandNames.has(c))
        throw new Error(
          `role "${role.id}" names command "/${c}", which does not exist. Update lib/sdlc/model.ts.`,
        );
    }
  }
}

/**
 * Shortens a list of output paths for display: three or more files that share a
 * directory and an extension collapse to brace form, so `review/standards.md`,
 * `review/performance.md`, `review/security.md` and `review/database.md` read as
 * `review/{standards,performance,security,database}.md`. Every file is still named, so
 * nothing is hidden; only the repeated prefix goes. Order follows first appearance.
 */
export function compactPaths(files: string[]): string[] {
  const groups = new Map<string, string[]>();
  for (const f of files) {
    const slash = f.lastIndexOf("/");
    const dot = f.lastIndexOf(".");
    const key = slash > 0 && dot > slash ? `${f.slice(0, slash)}/\u0000${f.slice(dot)}` : `\u0001${f}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  const out: string[] = [];
  const emitted = new Set<string>();
  for (const f of files) {
    const slash = f.lastIndexOf("/");
    const dot = f.lastIndexOf(".");
    const key = slash > 0 && dot > slash ? `${f.slice(0, slash)}/\u0000${f.slice(dot)}` : `\u0001${f}`;
    const members = groups.get(key) ?? [f];
    if (members.length < 3) {
      out.push(f);
    } else if (!emitted.has(key)) {
      emitted.add(key);
      const dir = f.slice(0, slash + 1);
      const ext = f.slice(dot);
      out.push(`${dir}{${members.map((m) => m.slice(slash + 1, m.lastIndexOf("."))).join(",")}}${ext}`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------
// The business-side explainer that precedes the Jarvis lifecycle on /docs/sdlc. Nothing here
// is about Jarvis: it is what an SDLC is, who is involved when, and how to tell whether one
// works. Ids only; every word a reader sees lives in the dictionary (EN and TH).
// ---------------------------------------------------------------------------------------

/** The six stages plus the point after release, where a problem costs the most to fix. */
export const COST_POINT_IDS = [...STAGE_IDS, "live"] as const;
export type CostPointId = (typeof COST_POINT_IDS)[number];

export const MODEL_IDS = ["waterfall", "agile", "devops"] as const;
export type ModelId = (typeof MODEL_IDS)[number];

export const METRIC_IDS = ["leadTime", "frequency", "failureRate", "restoreTime"] as const;
export type MetricId = (typeof METRIC_IDS)[number];

export const BRIDGE_IDS = ["drift", "decisions", "review", "approval", "skipped", "docs", "parallel"] as const;
export type BridgeId = (typeof BRIDGE_IDS)[number];

export const WHO_IDS = ["owner", "analyst", "designer", "architect", "developer", "qa", "devops", "pm"] as const;
export type WhoId = (typeof WHO_IDS)[number];

/** How involved a role typically is in a stage: 2 leads it, 1 takes part, 0 is not involved.
 *  A typical split, not a rule; teams divide the work differently, and the page says so. */
export type Involvement = 0 | 1 | 2;

export const WHO_WHEN: Record<WhoId, Record<StageId, Involvement>> = {
  owner: { discover: 2, define: 2, design: 1, build: 0, verify: 1, ship: 2 },
  analyst: { discover: 2, define: 2, design: 1, build: 1, verify: 1, ship: 0 },
  designer: { discover: 0, define: 2, design: 2, build: 1, verify: 1, ship: 0 },
  architect: { discover: 1, define: 1, design: 2, build: 1, verify: 1, ship: 1 },
  developer: { discover: 0, define: 1, design: 1, build: 2, verify: 1, ship: 1 },
  qa: { discover: 0, define: 1, design: 1, build: 1, verify: 2, ship: 1 },
  devops: { discover: 0, define: 0, design: 1, build: 1, verify: 1, ship: 2 },
  pm: { discover: 1, define: 1, design: 2, build: 1, verify: 1, ship: 2 },
};
