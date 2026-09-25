"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  FileText,
  Hammer,
  Pause,
  Play,
  Rocket,
  Ruler,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { StatusBadge } from "@/components/mdx/status-badge";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Dictionary } from "@/lib/i18n";
import {
  CENTER,
  LOOP_RADIUS,
  PIN_RADIUS,
  RING_RADIUS,
  arcPath,
  connectorChevron,
  connectorPath,
  polar,
  rotationDelta,
  stageAngle,
} from "@/lib/sdlc/geometry";
import { compactPaths, type StageId } from "@/lib/sdlc/model";
import { cn } from "@/lib/utils";

/** What the server wrapper passes down: plain data only, already resolved against the
 *  workflow (lib/sdlc/model.ts `validateLifecycle`). */
export interface StageData {
  id: StageId;
  phaseIds: string[];
  agents: string[];
  conditionalAgents: { flag: string; agent: string }[];
  outputs: string[];
  conditionalOutputs: { flag: string; file: string }[];
  approvals: string[];
  checklistPrefixes: string[];
  optional: { phase: string; flag: string }[];
}

const ICONS: Record<StageId, LucideIcon> = {
  discover: Search,
  define: FileText,
  design: Ruler,
  build: Hammer,
  verify: ShieldCheck,
  ship: Rocket,
};

/** Time on each stage while the walkthrough plays. Long enough to read the stage's
 *  headline; the reader can pause or pick a stage at any time. */
const AUTOPLAY_MS = 5200;

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Where a stage's name sits relative to its node: outward from the ring's centre. */
function labelSide(angle: number): "top" | "bottom" | "left" | "right" {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  if (Math.abs(cos) < 0.2) return sin < 0 ? "top" : "bottom";
  return cos > 0 ? "right" : "left";
}

const LABEL_CLASS: Record<ReturnType<typeof labelSide>, string> = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-3.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-3.5 -translate-y-1/2",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const chip =
  "rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs break-all";

function StagePanel({
  stage,
  index,
  total,
  dict,
}: {
  stage: StageData;
  index: number;
  total: number;
  dict: Dictionary;
}) {
  const L = dict.sdlc.lifecycle;
  const copy = L.stages[stage.id];
  const Icon = ICONS[stage.id];
  const hasApproval = stage.approvals.length > 0;

  return (
    <div className="h-full rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground"
          >
            <Icon className="size-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">
              {fill(L.stageOf, { n: index + 1, total })}
            </p>
            <h3 className="text-xl font-semibold tracking-tight">
              {capitalize(stage.id)}
            </h3>
          </div>
        </div>
        <StatusBadge
          kind="approval"
          value={hasApproval ? "human" : "none"}
          label={
            hasApproval
              ? dict.landing.pipeline.approvalHuman
              : dict.landing.pipeline.approvalNone
          }
        />
      </div>

      <p className="mt-4 text-sm font-medium">{copy.tagline}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {copy.adds}
      </p>

      <div className="mt-5 grid gap-5 @xl:grid-cols-2">
        <Field label={L.whoLabel}>
          <p className="text-sm">{copy.who}</p>
        </Field>

        <Field label={L.agentsLabel}>
          <ul className="flex flex-wrap gap-1.5">
            {stage.agents.map((a) => (
              <li key={a} className={chip}>
                {a}
              </li>
            ))}
            {stage.conditionalAgents.map((c) => (
              <li key={c.agent} className={cn(chip, "border-dashed")}>
                {c.agent}
              </li>
            ))}
          </ul>
          {stage.conditionalAgents.map((c) => (
            <p key={c.agent} className="mt-1.5 text-xs text-muted-foreground">
              <span className="font-mono">{c.agent}</span>{" "}
              {fill(L.conditionalWhen, { flag: c.flag })}
            </p>
          ))}
        </Field>

        <Field label={L.producesLabel}>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {compactPaths(stage.outputs).map((o) => (
              <li key={o} className="font-mono text-xs text-muted-foreground">
                {o}
              </li>
            ))}
            {stage.conditionalOutputs.map((o) => (
              <li
                key={`${o.flag}:${o.file}`}
                className="font-mono text-xs text-muted-foreground"
              >
                {o.file}{" "}
                <span className="font-sans">
                  ({fill(L.conditionalWhen, { flag: o.flag })})
                </span>
              </li>
            ))}
          </ul>
        </Field>

        <Field label={L.gateLabel}>
          <p className="text-sm text-muted-foreground">
            {fill(L.gateChecklist, {
              prefixes: stage.checklistPrefixes.map((p) => `${p}-*`).join(", "),
            })}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {hasApproval
              ? fill(L.approvalOn, { phases: stage.approvals.join(", ") })
              : L.noApproval}
          </p>
        </Field>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {L.phasesLabel}
        </p>
        <ol className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1.5">
          {stage.phaseIds.map((id, i) => (
            <li key={id} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="text-muted-foreground">
                  →
                </span>
              )}
              <span className={chip}>{id}</span>
            </li>
          ))}
        </ol>
        {stage.optional.map((o) => (
          <p key={o.phase} className="mt-2 text-xs text-muted-foreground">
            {fill(L.optionalWhen, { phase: o.phase, flag: o.flag })}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * The lifecycle ring: six stages joined by connectors, a marker that carries the work
 * item from stage to stage, and a panel that says who does the stage, which agents run,
 * what it produces and how it is checked.
 *
 * Interaction: the stages are a real tablist (arrow keys, focus ring). A walkthrough
 * advances the selection on its own only while the diagram is on screen, the pointer is
 * not over it, focus is not inside it and the reader has not asked for reduced motion.
 * Picking a stage stops it for good, and a Play/Pause button always overrides it, so the
 * moving content is never something a reader cannot stop (WCAG 2.2.2).
 * Without JavaScript the first stage renders statically.
 *
 * Layout follows the width the component is given (container queries), not the window:
 * on the landing page it is two columns, inside the narrow docs article it stacks.
 */
export function LifecycleExplorer({
  dict,
  stages,
}: {
  dict: Dictionary;
  stages: StageData[];
}) {
  const L = dict.sdlc.lifecycle;
  const count = stages.length;
  const { ref, inView, seen } = useInView<HTMLDivElement>(0.35);
  const reducedMotion = useReducedMotion();

  const [pos, setPos] = useState({ index: 0, rotation: 0 });
  const [auto, setAuto] = useState(true);
  const [engaged, setEngaged] = useState(false);

  const playing = auto && inView && !engaged && !reducedMotion;
  const active = stages[pos.index] ?? stages[0]!;

  const goTo = (to: number) =>
    setPos((p) =>
      p.index === to
        ? p
        : {
            index: to,
            rotation: p.rotation + rotationDelta(p.index, to, count),
          },
    );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setPos((p) => {
        const to = (p.index + 1) % count;
        return {
          index: to,
          rotation: p.rotation + rotationDelta(p.index, to, count),
        };
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, count]);

  const onSelect = (id: string) => {
    setAuto(false);
    const to = stages.findIndex((s) => s.id === id);
    if (to >= 0) goTo(to);
  };

  const loopFrom = stageAngle(4, count);
  const loopTo = stageAngle(3, count);
  const loopActive = active.id === "verify";
  const loopEnd = polar(loopTo + 9, LOOP_RADIUS);

  return (
    <div
      ref={ref}
      data-seen={seen ? "true" : "false"}
      // The walkthrough's real state. Tests wait on it before moving a fake clock: the
      // interval is created in an effect after the render that flips this, so advancing
      // time straight after a pointer or click event races that effect.
      data-playing={playing ? "true" : "false"}
      className="not-prose @container"
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
    >
      <TabsPrimitive.Root
        value={active.id}
        onValueChange={onSelect}
        orientation="horizontal"
        className="grid items-center gap-8 @4xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
      >
        <div>
          <div className="relative mx-auto aspect-square w-full max-w-104">
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute inset-0 size-full overflow-visible"
            >
              {stages.map((_, i) => {
                const last = i === count - 1;
                const reached = i < pos.index;
                const chev = connectorChevron(i, count);
                const stroke = reached ? "stroke-brand" : "stroke-border";
                return (
                  <g key={i} style={{ "--i": i } as CSSProperties}>
                    <path
                      d={connectorPath(i, count)}
                      fill="none"
                      strokeWidth={1.1}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={last ? "0.02 0.035" : undefined}
                      className={cn(
                        "lifecycle-arc",
                        stroke,
                        seen && !last && "pipeline-segment",
                      )}
                    />
                    <path
                      d="M -1.5 -1.3 L 0.2 0 L -1.5 1.3"
                      fill="none"
                      strokeWidth={0.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform={`translate(${chev.x} ${chev.y}) rotate(${chev.rotation})`}
                      className={cn("lifecycle-arc", stroke)}
                    />
                  </g>
                );
              })}

              {/* Review failed: back to build. Counter-clockwise, inside the ring. */}
              <path
                d={arcPath(loopFrom - 9, loopTo + 9, LOOP_RADIUS, false)}
                fill="none"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeDasharray="1.3 1.5"
                className={cn(
                  "lifecycle-arc",
                  loopActive ? "stroke-brand" : "stroke-border",
                )}
              />
              <path
                d="M -1.5 -1.3 L 0.2 0 L -1.5 1.3"
                fill="none"
                strokeWidth={0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={`translate(${loopEnd.x} ${loopEnd.y}) rotate(${loopTo + 9 - 90})`}
                className={cn(
                  "lifecycle-arc",
                  loopActive ? "stroke-brand" : "stroke-border",
                )}
              />
            </svg>

            <span
              aria-hidden="true"
              className={cn(
                "absolute hidden text-[11px] font-medium transition-colors duration-(--motion-base) sm:block",
                loopActive ? "text-brand" : "text-muted-foreground",
              )}
              style={{ left: "31%", top: "69%" }}
            >
              {L.loopLabel}
            </span>

            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 flex size-[26%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-border bg-card text-center"
            >
              {playing && (
                <span className="absolute inset-0 animate-ping rounded-full border border-brand/40" />
              )}
              <span className="text-sm font-semibold tracking-tight sm:text-base">
                {L.hubTitle}
              </span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">
                {L.hubSubtitle}
              </span>
            </div>

            {/* The work item. It turns about the ring's centre, so it glides from stage to
                stage along the inner edge and keeps going forward through the wrap. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 transition-transform duration-(--motion-travel) ease-in-out"
              style={{ transform: `rotate(${pos.rotation}deg)` }}
            >
              <span
                className="absolute left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-4 ring-brand/25"
                style={{ top: `${CENTER - PIN_RADIUS}%` }}
              />
            </div>

            <TabsPrimitive.List
              aria-label={L.ringLabel}
              className="pointer-events-none absolute inset-0"
            >
              {stages.map((stage, i) => {
                const angle = stageAngle(i, count);
                const { x, y } = polar(angle, RING_RADIUS);
                const state =
                  i < pos.index
                    ? "done"
                    : i === pos.index
                      ? "current"
                      : "upcoming";
                const Icon = ICONS[stage.id];
                return (
                  <TabsPrimitive.Trigger
                    key={stage.id}
                    value={stage.id}
                    style={
                      { left: `${x}%`, top: `${y}%`, "--i": i } as CSSProperties
                    }
                    className={cn(
                      "group pointer-events-auto absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 outline-none",
                      "transition-[background-color,border-color,color,scale] duration-(--motion-fast)",
                      "focus-visible:ring-3 focus-visible:ring-ring/50",
                      seen &&
                        "pipeline-stagger animate-in fade-in-0 zoom-in-95 duration-(--motion-base)",
                      state === "current" &&
                        "scale-110 border-brand bg-brand text-brand-foreground ring-4 ring-brand/20",
                      state === "done" &&
                        "border-brand bg-background text-brand",
                      state === "upcoming" &&
                        "border-border bg-background text-muted-foreground hover:border-brand hover:text-foreground",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {stage.approvals.length > 0 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          // On the side away from the stage name, so the dot never reads as a bullet before it.
                          "absolute -top-1 size-3 rounded-full border-2 border-background bg-brand",
                          labelSide(angle) === "right" ? "-left-1" : "-right-1",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "sr-only text-xs font-medium whitespace-nowrap sm:not-sr-only sm:absolute",
                        LABEL_CLASS[labelSide(angle)],
                        state === "current"
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {capitalize(stage.id)}
                    </span>
                  </TabsPrimitive.Trigger>
                );
              })}
            </TabsPrimitive.List>
          </div>

          <div className="mx-auto mt-5 flex max-w-104 flex-col items-center gap-3">
            <ul
              className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
              aria-hidden="true"
            >
              <li className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-brand" />
                {L.legendApproval}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-muted-foreground" />
                {L.legendLoop}
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dotted border-muted-foreground" />
                {L.legendNext}
              </li>
            </ul>
            {!reducedMotion && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAuto((a) => !a)}
              >
                {auto ? (
                  <Pause aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
                {auto ? L.pause : L.play}
              </Button>
            )}
          </div>
        </div>

        {/* Every panel sits in one grid cell, so the column is as tall as the tallest and
            picking a stage never moves the page. Inactive panels stay mounted but are
            invisible, which also removes them from the accessibility tree. */}
        <div className="grid">
          {stages.map((stage, i) => (
            <TabsPrimitive.Content
              key={stage.id}
              value={stage.id}
              forceMount
              className="col-start-1 row-start-1 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-(--motion-base) data-[state=inactive]:invisible"
            >
              <StagePanel stage={stage} index={i} total={count} dict={dict} />
            </TabsPrimitive.Content>
          ))}
        </div>
      </TabsPrimitive.Root>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {L.workTypeNote}
      </p>
    </div>
  );
}
