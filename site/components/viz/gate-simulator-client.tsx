"use client";

import { Bot, CircleCheck, Lock, Scale, Terminal, TriangleAlert, UserCheck, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/mdx/status-badge";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import { ACTIONS, initGate, stepGate, type GateEvent, type GateLog, type GateNode } from "@/lib/viz/gate-sim";
import { cn } from "@/lib/utils";

const fill = (template: string, vars: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

type TrackNode = "agent" | "script" | "gatekeeper" | "approval" | "next";
const ICONS: Record<TrackNode, LucideIcon> = { agent: Bot, script: Terminal, gatekeeper: Scale, approval: UserCheck, next: CircleCheck };

/** Where the phase is on the track. The menu and parked states sit "at" the gate that failed. */
function trackPosition(node: GateNode, failedAt?: "script" | "gatekeeper"): TrackNode {
  if (node === "menu" || node === "parked") return failedAt ?? "script";
  return node as TrackNode;
}

/**
 * A phase walking through the gates, driven by the reader. Each button is one real outcome
 * (the agent returns DONE, a gate passes or fails, you approve, retry, force or park) and the
 * phase moves exactly as the orchestrator moves it: a failure returns the issues to the same
 * agent and counts an attempt, and at `gates.max_retries` the orchestrator stops at the Gate
 * Failure Menu. Nothing plays by itself, so there is nothing to pause.
 */
export function GateSimulatorClient({ dict, maxRetries }: { dict: Dictionary; maxRetries: number }) {
  const t = dict.viz.gateSim;
  const [needsApproval, setNeedsApproval] = useState(true);
  const [state, setState] = useState(() => initGate(true));
  const [log, setLog] = useState<GateLog[]>([]);

  const act = (event: GateEvent) => {
    const result = stepGate(state, event, maxRetries);
    setState(result.state);
    if (result.log) setLog((l) => [...l, result.log as GateLog].slice(-7));
  };
  const restart = (approval: boolean) => {
    setState(initGate(approval));
    setLog([]);
  };

  const track: TrackNode[] = needsApproval ? ["agent", "script", "gatekeeper", "approval", "next"] : ["agent", "script", "gatekeeper", "next"];
  const at = trackPosition(state.node, state.failedAt);
  const atIndex = track.indexOf(at);
  const failed = state.node === "menu" || state.returned;
  const actions = ACTIONS[state.node];

  const nowText = fill(t.now[state.node === "menu" || state.node === "parked" || state.node === "next" ? state.node : (state.node as TrackNode)], { max: maxRetries });
  const label = (e: GateEvent) => (e === "done" ? t.actions.done : t.actions[e]);

  return (
    <div className="not-prose @container my-6 rounded-lg border border-border bg-card p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{t.intro}</p>

      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          role="switch"
          checked={needsApproval}
          onChange={(e) => {
            setNeedsApproval(e.target.checked);
            restart(e.target.checked);
          }}
          className="size-4 accent-brand"
        />
        {t.approvalToggle}
      </label>

      <ol aria-label={t.trackLabel} className="mt-5 grid grid-cols-2 gap-2 @lg:flex @lg:items-stretch @lg:gap-0">
        {track.map((n, i) => {
          const Icon = ICONS[n];
          const isCurrent = i === atIndex && state.node !== "next";
          const done = i < atIndex || (state.node === "next" && true);
          const isFail = i === atIndex && failed && (n === "script" || n === "gatekeeper");
          return (
            <li key={n} aria-current={isCurrent ? "step" : undefined} className="relative flex-1 @lg:flex @lg:items-stretch">
              <div
                className={cn(
                  "h-full w-full rounded-lg border p-3 text-center transition-[background-color,border-color,box-shadow] duration-(--motion-base)",
                  isCurrent && !isFail && "border-brand bg-brand/5 ring-4 ring-brand/15",
                  isFail && "border-phase-gate-failed bg-phase-gate-failed/5 ring-4 ring-phase-gate-failed/15",
                  !isCurrent && done && "border-brand/40 bg-background",
                  !isCurrent && !done && "border-dashed border-border bg-background",
                )}
              >
                <Icon aria-hidden="true" className={cn("mx-auto size-5", isFail ? "text-phase-gate-failed" : done || isCurrent ? "text-brand" : "text-muted-foreground")} />
                <p className="mt-1.5 text-sm font-medium">{t.nodes[n]}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{t.captions[n]}</p>
              </div>
              {i < track.length - 1 && (
                <span aria-hidden="true" className={cn("hidden self-center px-1 text-lg @lg:block", i < atIndex ? "text-brand" : "text-border")}>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid gap-4 @lg:grid-cols-[1fr_auto] @lg:items-start">
        <div role="status" aria-live="polite">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <StatusBadge kind="phase" value={state.status === "forced" ? "forced" : state.status} label={state.status} />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="flex gap-1">
                {Array.from({ length: maxRetries }).map((_, i) => (
                  <span key={i} className={cn("size-2.5 rounded-full border transition-colors duration-(--motion-base)", i < state.attempts ? "border-phase-gate-failed bg-phase-gate-failed" : "border-border bg-background")} />
                ))}
              </span>
              {fill(t.attempts, { n: state.attempts, max: maxRetries })}
            </span>
          </div>
          <p className="mt-2 text-sm">{nowText}</p>
          {state.returned && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-phase-gate-failed">
              <TriangleAlert aria-hidden="true" className="size-3.5" />
              {t.returned}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 @lg:justify-end">
          {actions.map((e) => (
            <Button key={e} type="button" size="sm" variant={e === "fail" || e === "park" ? "outline" : "default"} onClick={() => act(e)}>
              {label(e)}
            </Button>
          ))}
          {actions.length === 0 && (
            <Button type="button" size="sm" variant="outline" onClick={() => restart(needsApproval)}>
              {t.actions.restart}
            </Button>
          )}
        </div>
      </div>

      {state.node === "menu" && (
        <div className="mt-4 rounded-md border border-phase-gate-failed/40 bg-phase-gate-failed/5 p-3 font-mono text-xs animate-in fade-in-0 slide-in-from-top-1 duration-(--motion-base)">
          <p className="font-semibold">{t.menu.title}</p>
          <ol className="mt-1.5 space-y-0.5 text-muted-foreground">
            <li>1) {t.menu.o1}</li>
            <li>2) {t.menu.o2}</li>
            <li>3) {t.menu.o3}</li>
            <li>4) {t.menu.o4}</li>
          </ol>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t.log.title}</p>
        {log.length === 0 ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{t.log.empty}</p>
        ) : (
          <ol className="mt-1.5 space-y-1 text-sm">
            {log.map((entry, i) => (
              <li key={`${i}-${entry.key}`} className="flex gap-2 animate-in fade-in-0 slide-in-from-left-1 duration-(--motion-base)">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                {fill(t.log.entries[entry.key], { n: entry.attempt ?? 0, max: maxRetries })}
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        {t.humanOnly}
      </p>
    </div>
  );
}
