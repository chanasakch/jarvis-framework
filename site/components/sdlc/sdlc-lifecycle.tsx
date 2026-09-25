import { getWorkflows } from "@/lib/generated/loaders";
import type { Dictionary } from "@/lib/i18n";
import { LIFECYCLE_WORKFLOW, validateLifecycle } from "@/lib/sdlc/model";

import { LifecycleExplorer, type StageData } from "./lifecycle-explorer";

/**
 * Server wrapper for the lifecycle diagram. It resolves the six stages against the
 * generated feature workflow, so the agents, outputs and approval points shown are the
 * framework's own, and `validateLifecycle` fails the build if the two ever disagree.
 * Only plain data crosses into the client component.
 */
export function SdlcLifecycle({ dict }: { dict: Dictionary }) {
  const workflow = getWorkflows().find((w) => w.id === LIFECYCLE_WORKFLOW);
  if (!workflow)
    throw new Error(
      `the SDLC lifecycle needs the "${LIFECYCLE_WORKFLOW}" workflow, which content/generated/workflows.json does not contain.`,
    );

  const stages: StageData[] = validateLifecycle(workflow).map((s) => ({
    id: s.id,
    phaseIds: s.phases.map((p) => p.id),
    agents: s.agents,
    conditionalAgents: s.conditionalAgents,
    outputs: s.outputs,
    conditionalOutputs: s.conditionalOutputs,
    approvals: s.approvals,
    checklistPrefixes: s.checklistPrefixes,
    optional: s.optional,
  }));

  return <LifecycleExplorer dict={dict} stages={stages} />;
}
