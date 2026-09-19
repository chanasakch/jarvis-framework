"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { PlusIcon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { StatusBadge } from "@/components/mdx/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Workflow, WorkflowPhase } from "@/lib/generated/schemas";
import type { Dictionary } from "@/lib/i18n";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

type Pipeline = Dictionary["landing"]["pipeline"];
type NodeState = "done" | "current" | "upcoming";

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function agentsOf(phase: WorkflowPhase): string[] {
  if (phase.agent) return [phase.agent];
  if (Array.isArray(phase.agents)) return phase.agents;
  if (phase.agents && typeof phase.agents === "object") return Object.values(phase.agents);
  return [];
}

function agentLine(phase: WorkflowPhase, pipeline: Pipeline): string {
  if (phase.agents && !Array.isArray(phase.agents) && typeof phase.agents === "object") {
    return Object.entries(phase.agents)
      .map(([layer, agent]) => `${layer}: ${agent}`)
      .join(" · ");
  }
  const agents = agentsOf(phase);
  if (agents.length) return agents.join(", ");
  return phase.owner ? `${pipeline.ownerLabel}: ${phase.owner}` : "—";
}

/** Short caption under a node: the agent's role without the prefix, or the owner. */
function caption(phase: WorkflowPhase): string {
  if (phase.agents && !Array.isArray(phase.agents) && typeof phase.agents === "object") {
    return Object.keys(phase.agents).join(" + ");
  }
  const agents = agentsOf(phase).map((a) => a.replace(/^[a-z0-9]+-/, ""));
  if (agents.length > 2) return `${agents.length} agents`;
  if (agents.length) return agents.join(" + ");
  return phase.owner ?? "";
}

/** Tracks the `md` breakpoint so the phase list's arrow keys match its visual direction. */
function useIsWide(): boolean {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    // Client-only media query read on mount; same justified case as useReducedMotion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWide(mql.matches);
    const onChange = () => setWide(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return wide;
}

function Marker({ index, state, phase }: { index: number; state: NodeState; phase: WorkflowPhase }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold",
        "transition-[transform,background-color,border-color,color] duration-(--motion-fast) group-hover:-translate-y-0.5",
        phase.optionalIfFalse && "border-dashed",
        state === "current" && "scale-110 border-brand bg-brand text-brand-foreground ring-4 ring-brand/20",
        state === "done" && "border-brand bg-background text-brand",
        state === "upcoming" && "border-border bg-background text-muted-foreground group-hover:border-brand group-hover:text-foreground",
      )}
    >
      {index + 1}
      {phase.approval === "human" && (
        <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-background bg-brand" />
      )}
      {phase.conditionalAgents && (
        <span className="absolute -right-1.5 -bottom-1.5 flex size-4 items-center justify-center rounded-full border-2 border-background bg-foreground text-background">
          <PlusIcon className="size-2.5" strokeWidth={3} />
        </span>
      )}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function PhaseDetail({ phase, index, total, pipeline }: { phase: WorkflowPhase; index: number; total: number; pipeline: Pipeline }) {
  const conditionalOutputs = Object.entries(phase.conditionalOutputs ?? {});
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h3 className="font-mono text-base font-semibold">{phase.id}</h3>
          <span className="text-xs text-muted-foreground">{fill(pipeline.stepOf, { n: index + 1, total })}</span>
        </div>
        <StatusBadge
          kind="approval"
          value={phase.approval === "human" ? "human" : "none"}
          label={phase.approval === "human" ? pipeline.approvalHuman : pipeline.approvalNone}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={pipeline.agentLabel}>
          <p className="font-mono text-sm break-words">{agentLine(phase, pipeline)}</p>
          {phase.mode && <p className="mt-1 text-xs text-muted-foreground">mode: {phase.mode}</p>}
          {Object.entries(phase.conditionalAgents ?? {}).map(([flag, agents]) => (
            <p key={flag} className="mt-1 text-xs text-muted-foreground">
              {pipeline.conditionalLabel} <code className="font-mono">{flag}</code>: <span className="font-mono">{agents.join(", ")}</span>
            </p>
          ))}
          {phase.optionalIfFalse && (
            <p className="mt-1 text-xs text-muted-foreground">
              {pipeline.optionalLabel} <code className="font-mono">{phase.optionalIfFalse}</code>
            </p>
          )}
        </Field>

        {(phase.outputs || conditionalOutputs.length > 0) && (
          <Field label={pipeline.outputsLabel}>
            <ul className="space-y-0.5">
              {phase.outputs?.map((o) => (
                <li key={o} className="font-mono text-xs text-muted-foreground">
                  {o}
                </li>
              ))}
              {conditionalOutputs.flatMap(([flag, files]) =>
                files.map((f) => (
                  <li key={`${flag}:${f}`} className="font-mono text-xs text-muted-foreground">
                    {f} <span className="font-sans">({pipeline.conditionalLabel} {flag})</span>
                  </li>
                )),
              )}
            </ul>
          </Field>
        )}

        {phase.checklistPrefix && (
          <Field label={pipeline.checklistLabel}>
            <p className="font-mono text-sm">{phase.checklistPrefix}-*</p>
          </Field>
        )}
      </div>
    </div>
  );
}

function Legend({ pipeline }: { pipeline: Pipeline }) {
  const item = "flex items-center gap-1.5";
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
      <li className={item}>
        <span className="size-2.5 rounded-full bg-brand" />
        {pipeline.legendApproval}
      </li>
      <li className={item}>
        <span className="size-3 rounded-full border-2 border-dashed border-muted-foreground" />
        {pipeline.legendOptional}
      </li>
      <li className={item}>
        <span className="flex size-3.5 items-center justify-center rounded-full bg-foreground text-background">
          <PlusIcon className="size-2.5" strokeWidth={3} />
        </span>
        {pipeline.legendConditional}
      </li>
    </ul>
  );
}

function WorkflowPipeline({ workflow, pipeline }: { workflow: Workflow; pipeline: Pipeline }) {
  const phases = workflow.phases;
  const [selected, setSelected] = useState(phases[0]?.id ?? "");
  const selectedIndex = Math.max(0, phases.findIndex((p) => p.id === selected));
  const wide = useIsWide();
  const reducedMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const approvals = phases.filter((p) => p.approval === "human").length;

  // Keep the selected node visible when the track scrolls horizontally (narrow containers).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    listRef.current
      ?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  }, [selected, reducedMotion]);

  const stateOf = (i: number): NodeState => (i < selectedIndex ? "done" : i === selectedIndex ? "current" : "upcoming");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">{workflow.description}</p>
        <p className="text-xs text-muted-foreground">{fill(pipeline.summary, { phases: phases.length, approvals })}</p>
      </div>

      <TabsPrimitive.Root value={selected} onValueChange={setSelected} orientation={wide ? "horizontal" : "vertical"}>
        <div className="md:-mx-1 md:overflow-x-auto md:px-1 md:pt-2 md:pb-3">
          <TabsPrimitive.List
            ref={listRef}
            aria-label={pipeline.phasesLabel}
            className="pipeline-track relative flex flex-col md:grid"
            style={{ "--n": phases.length } as CSSProperties}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-4 hidden h-px w-full overflow-visible md:block"
              viewBox={`0 0 ${phases.length} 1`}
              preserveAspectRatio="none"
            >
              {phases.slice(0, -1).map((p, i) => (
                <line
                  key={p.id}
                  x1={i + 0.5}
                  y1={0.5}
                  x2={i + 1.5}
                  y2={0.5}
                  pathLength={1}
                  strokeWidth={2}
                  className={cn("pipeline-segment", i < selectedIndex ? "stroke-brand" : "stroke-border")}
                  style={stagger(i)}
                />
              ))}
            </svg>

            {phases.map((p, i) => (
              <TabsPrimitive.Trigger
                key={p.id}
                value={p.id}
                style={stagger(i)}
                className={cn(
                  "group pipeline-stagger relative flex items-center gap-3 rounded-md pb-4 text-left outline-none",
                  "animate-in fade-in-0 zoom-in-95 duration-(--motion-base)",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "md:flex-col md:gap-2 md:px-1 md:pb-1 md:text-center",
                  // Narrow screens: vertical connector from this marker to the next.
                  "after:absolute after:top-9 after:bottom-1 after:left-3.75 after:w-0.5 after:rounded-full after:transition-colors after:duration-(--motion-base) last:after:hidden md:after:hidden",
                  i < selectedIndex ? "after:bg-brand" : "after:bg-border",
                )}
              >
                <Marker index={i} state={stateOf(i)} phase={p} />
                <span className="flex min-w-0 flex-col md:w-full md:items-center">
                  <span className="font-mono text-sm whitespace-nowrap text-muted-foreground transition-colors group-hover:text-foreground group-data-[state=active]:font-semibold group-data-[state=active]:text-foreground md:text-xs">
                    {p.id}
                  </span>
                  <span aria-hidden="true" className="truncate text-xs text-muted-foreground md:w-full">
                    {caption(p)}
                  </span>
                </span>
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>
        </div>

        <Legend pipeline={pipeline} />

        {phases.map((p, i) => (
          <TabsPrimitive.Content
            key={p.id}
            value={p.id}
            className="mt-4 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-(--motion-base)"
          >
            <PhaseDetail phase={p} index={i} total={phases.length} pipeline={pipeline} />
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>
    </div>
  );
}

/** Interactive SDLC diagram: pick a work type, then step through its phases (click or
 *  arrow keys). Connectors and nodes use the motion tokens in globals.css, which the
 *  reduced-motion rule there collapses to instant. Without JS the first work type and
 *  its first phase render statically. */
export function SdlcPipeline({ dict, workflows, embedded = false }: { dict: Dictionary; workflows: Workflow[]; embedded?: boolean }) {
  const { pipeline } = dict.landing;
  const [workType, setWorkType] = useState(workflows[0]?.id ?? "");

  return (
    <section className={embedded ? "not-prose" : cn(CONTAINER, "py-16")}>
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
              className="flex-none rounded-full border border-border bg-background px-3 py-1 transition-colors duration-(--motion-fast) hover:border-brand data-[state=active]:border-brand data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-none"
            >
              {w.id}
            </TabsTrigger>
          ))}
        </TabsList>
        {workflows.map((w) => (
          <TabsContent key={w.id} value={w.id} className="mt-6">
            {w.id === workType && <WorkflowPipeline key={w.id} workflow={w} pipeline={pipeline} />}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
