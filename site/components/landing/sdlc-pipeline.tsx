"use client";

import { useState } from "react";

import { StatusBadge } from "@/components/mdx/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Workflow, WorkflowPhase } from "@/lib/generated/schemas";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTAINER } from "@/lib/layout";

function agentLine(phase: WorkflowPhase, dict: Dictionary): string {
  const { pipeline } = dict.landing;
  if (phase.agent) return phase.agent;
  if (Array.isArray(phase.agents)) return phase.agents.join(", ");
  if (phase.agents && typeof phase.agents === "object") {
    return Object.entries(phase.agents)
      .map(([layer, agent]) => `${layer}: ${agent}`)
      .join(" · ");
  }
  return phase.owner ? `${pipeline.ownerLabel}: ${phase.owner}` : "—";
}

function PhaseDetail({ phase, dict }: { phase: WorkflowPhase; dict: Dictionary }) {
  const { pipeline } = dict.landing;
  return (
    <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{pipeline.agentLabel}</p>
        <p className="mt-1 font-mono text-sm">{agentLine(phase, dict)}</p>
        {phase.mode && <p className="mt-1 text-xs text-muted-foreground">mode: {phase.mode}</p>}
        {Object.entries(phase.conditionalAgents ?? {}).map(([flag, agents]) => (
          <p key={flag} className="mt-1 text-xs text-muted-foreground">
            {pipeline.conditionalLabel} <code className="font-mono">{flag}</code>: <span className="font-mono">{agents.join(", ")}</span>
          </p>
        ))}
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{pipeline.approvalLabel}</p>
        <div className="mt-1">
          <StatusBadge
            kind="approval"
            value={phase.approval === "human" ? "human" : "none"}
            label={phase.approval === "human" ? pipeline.approvalHuman : pipeline.approvalNone}
          />
        </div>
        {phase.optionalIfFalse && (
          <p className="mt-1 text-xs text-muted-foreground">
            {pipeline.optionalLabel} <code className="font-mono">{phase.optionalIfFalse}</code>
          </p>
        )}
      </div>
      {phase.outputs && (
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{pipeline.outputsLabel}</p>
          <ul className="mt-1 space-y-0.5">
            {phase.outputs.map((o) => (
              <li key={o} className="font-mono text-xs text-muted-foreground">
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}
      {phase.checklistPrefix && (
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{pipeline.checklistLabel}</p>
          <p className="mt-1 font-mono text-sm">{phase.checklistPrefix}-*</p>
        </div>
      )}
    </div>
  );
}

function WorkflowPipeline({ workflow, dict }: { workflow: Workflow; dict: Dictionary }) {
  const [selected, setSelected] = useState(workflow.phases[0]?.id ?? "");
  const phase = workflow.phases.find((p) => p.id === selected) ?? workflow.phases[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{workflow.description}</p>

      <Tabs value={selected} onValueChange={setSelected}>
        <TabsList
          aria-label={dict.landing.pipeline.phasesLabel}
          className={cn(
            "h-auto w-full flex-col items-stretch justify-start bg-transparent p-0",
            "sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5",
          )}
        >
          {workflow.phases.map((p) => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className={cn(
                "justify-between gap-2 rounded-md border border-border bg-background px-3 py-1.5",
                "data-[state=active]:border-brand data-[state=active]:bg-accent data-[state=active]:shadow-none",
                "sm:flex-none sm:justify-center",
              )}
            >
              <span className="font-mono">{p.id}</span>
              {p.approval === "human" && <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />}
            </TabsTrigger>
          ))}
        </TabsList>
        {workflow.phases.map((p) => (
          <TabsContent key={p.id} value={p.id} className="mt-4">
            {p.id === phase?.id && <PhaseDetail phase={p} dict={dict} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export function SdlcPipeline({ dict, workflows }: { dict: Dictionary; workflows: Workflow[] }) {
  const { pipeline } = dict.landing;
  const [workType, setWorkType] = useState(workflows[0]?.id ?? "");

  return (
    <section className={cn(CONTAINER, "py-16")}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{pipeline.heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{pipeline.subhead}</p>
      </div>

      <Tabs value={workType} onValueChange={setWorkType} className="mt-8">
        <TabsList aria-label={pipeline.workTypeLabel} className="h-auto flex-wrap justify-center gap-1 bg-transparent p-0">
          {workflows.map((w) => (
            <TabsTrigger
              key={w.id}
              value={w.id}
              className="rounded-full border border-border bg-background px-3 py-1 data-[state=active]:border-brand data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-none"
            >
              {w.id}
            </TabsTrigger>
          ))}
        </TabsList>
        {workflows.map((w) => (
          <TabsContent key={w.id} value={w.id} className="mt-6">
            {w.id === workType && <WorkflowPipeline workflow={w} dict={dict} />}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
