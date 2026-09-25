import type { Workflow, WorkflowPhase } from "@/lib/generated/schemas";

/**
 * Canonical left-to-right order for the work-type x phase grid. A phase the framework adds
 * later is not in this list, so it is appended in the order it first appears rather than
 * dropped or thrown on: the grid keeps working, and the unit test below pins the current
 * set so a new phase is noticed and placed deliberately.
 */
export const PHASE_ORDER = [
  "intake",
  "brief",
  "investigation",
  "requirements",
  "business-flow",
  "ux",
  "architecture",
  "plan",
  "implement",
  "test",
  "review",
  "qa",
  "release",
  "postmortem",
] as const;

export interface MatrixCell {
  approval: boolean;
  /** Set when the phase runs only if this intake flag is true. */
  optionalFlag?: string;
  /** Flags that add an agent to this phase. */
  conditionalFlags: string[];
}

export interface MatrixRow {
  id: string;
  idPrefix: string;
  description: string;
  cells: Record<string, MatrixCell | undefined>;
  phaseCount: number;
  approvalCount: number;
}

export interface Matrix {
  phases: string[];
  rows: MatrixRow[];
}

const cellOf = (p: WorkflowPhase): MatrixCell => ({
  approval: p.approval === "human",
  optionalFlag: p.optionalIfFalse,
  conditionalFlags: Object.keys(p.conditionalAgents ?? {}),
});

export function buildMatrix(workflows: Workflow[]): Matrix {
  const present = new Set(workflows.flatMap((w) => w.phases.map((p) => p.id)));
  const known = PHASE_ORDER.filter((id) => present.has(id));
  const extra = [...present].filter((id) => !(PHASE_ORDER as readonly string[]).includes(id));
  const phases = [...known, ...extra];

  const rows = workflows.map((w): MatrixRow => {
    const cells: Record<string, MatrixCell | undefined> = {};
    for (const p of w.phases) cells[p.id] = cellOf(p);
    return {
      id: w.id,
      idPrefix: w.idPrefix,
      description: w.description,
      cells,
      phaseCount: w.phases.length,
      approvalCount: w.phases.filter((p) => p.approval === "human").length,
    };
  });
  return { phases, rows };
}
