import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import YAML from "yaml";

import type { Workflow, WorkflowPhase } from "@/lib/generated/schemas";

const require = createRequire(import.meta.url);

/**
 * Reads .jarvis/core/workflows/*.yaml directly — the same files and the same `yaml`
 * parser the CLI itself uses. Effective per-phase approval is computed with the
 * framework's OWN `approvalRequired()` (from .jarvis/scripts/lib/workflow.js), not
 * reimplemented, so the site can never drift from what `jarvis.js next` actually does:
 * a phase's `approval:` field overrides the default; otherwise it falls back to
 * `gates.human_approval` in jarvis.config.yaml.
 */
/** Reads the checklist item ID prefix from its first Blocking item, e.g. "REQ" from
 *  "- [ ] REQ-01 ..." in requirements.md — real data, not a guessed mapping. */
function checklistPrefix(checklistsDir: string, checklistFile: string | undefined): string | undefined {
  if (!checklistFile) return undefined;
  const full = path.join(checklistsDir, checklistFile);
  if (!fs.existsSync(full)) return undefined;
  const m = fs.readFileSync(full, "utf8").match(/- \[ \] ([A-Z]+)-\d+/);
  return m?.[1];
}

export function parseWorkflows(
  workflowsDir: string,
  frameworkWorkflowLibPath: string,
  config: { gates: { human_approval: string[] } },
  checklistsDir?: string,
): { workflows: Workflow[]; skipped: string[] } {
  const workflows: Workflow[] = [];
  const skipped: string[] = [];
  if (!fs.existsSync(workflowsDir)) return { workflows, skipped };

  const { approvalRequired } = require(frameworkWorkflowLibPath) as {
    approvalRequired: (cfg: unknown, phase: unknown) => boolean;
  };

  for (const file of fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".yaml")).sort()) {
    const id = file.replace(/\.yaml$/, "");
    const raw = fs.readFileSync(path.join(workflowsDir, file), "utf8");
    let doc: {
      name?: string;
      id_prefix?: string;
      description?: string;
      phases?: Array<Record<string, unknown>>;
    };
    try {
      doc = YAML.parse(raw);
    } catch {
      skipped.push(id);
      continue;
    }

    if (!doc.name || !doc.id_prefix || !doc.description || !Array.isArray(doc.phases)) {
      skipped.push(id);
      continue;
    }

    const phases: WorkflowPhase[] = doc.phases.map((p) => ({
      id: String(p.id),
      agent: typeof p.agent === "string" ? p.agent : undefined,
      agents: p.agents as WorkflowPhase["agents"],
      owner: typeof p.owner === "string" ? p.owner : undefined,
      mode: typeof p.mode === "string" ? p.mode : undefined,
      approval: approvalRequired(config, p) ? "human" : "none",
      optionalIfFalse: typeof p.optional_if_false === "string" ? p.optional_if_false : undefined,
      outputs: Array.isArray(p.outputs) ? (p.outputs as string[]) : undefined,
      checklistPrefix: checklistsDir ? checklistPrefix(checklistsDir, p.checklist as string | undefined) : undefined,
    }));

    workflows.push({ id: doc.name, idPrefix: doc.id_prefix, description: doc.description.trim(), phases });
  }

  return { workflows, skipped };
}
