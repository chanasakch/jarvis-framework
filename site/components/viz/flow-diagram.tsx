"use client";

import { ArrowRight, Bot, ChevronDown, Eye, FilePen, FileText, GitBranch, MessageSquare, RotateCcw, ScanSearch, Shield, ShieldCheck, Terminal, Undo2, Wrench, type LucideIcon } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import type { Dictionary } from "@/lib/i18n";

type Flow = "overview" | "handoff" | "guard";

interface NodeDef {
  key: string;
  icon: LucideIcon;
}

/** Which nodes each flow has and which icon draws them. The words live in the dictionary. */
const FLOWS: Record<Flow, NodeDef[]> = {
  overview: [
    { key: "request", icon: MessageSquare },
    { key: "orchestrator", icon: GitBranch },
    { key: "agent", icon: Bot },
    { key: "gate", icon: ShieldCheck },
    { key: "next", icon: ArrowRight },
  ],
  handoff: [
    { key: "brief", icon: FileText },
    { key: "read", icon: Eye },
    { key: "write", icon: FilePen },
    { key: "result", icon: Terminal },
    { key: "gate", icon: ShieldCheck },
  ],
  guard: [
    { key: "call", icon: Wrench },
    { key: "guard", icon: ScanSearch },
    { key: "outcome", icon: Shield },
    { key: "post", icon: FilePen },
  ],
};

/**
 * A short left-to-right sequence, drawn once when it scrolls into view: the nodes appear in
 * order and the arrows between them follow. Three of the framework's core mechanisms use it
 * (a request's path, how a phase is handed off, what the guard hook does). It is a picture of
 * a process the page already describes in words, so all of its text is real page content and
 * a screen reader gets the same ordered list. Replay re-runs the entrance.
 */
export function FlowDiagram({ dict, flow }: { dict: Dictionary; flow: Flow }) {
  const t = dict.viz.flows;
  const copy = t[flow];
  const nodes = FLOWS[flow];
  const { ref, seen } = useInView<HTMLDivElement>(0.3);
  const [run, setRun] = useState(0);

  const stepText = (key: string) => (copy.steps as Record<string, { title: string; caption: string }>)[key]!;

  return (
    <div ref={ref} data-seen={seen ? "true" : "false"} className="not-prose @container my-6 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={() => setRun((n) => n + 1)} className="-mt-1 -mr-2">
          <RotateCcw aria-hidden="true" />
          {t.replay}
        </Button>
      </div>

      <ol key={run} aria-label={copy.ariaLabel} className="mt-1 grid gap-2 @2xl:flex @2xl:items-stretch @2xl:gap-0">
        {nodes.map((n, i) => {
          const Icon = n.icon;
          const text = stepText(n.key);
          const isOutcome = flow === "guard" && n.key === "outcome";
          return (
            <li key={n.key} className="flex flex-col @2xl:flex-1 @2xl:flex-row @2xl:items-stretch">
              <div style={{ "--i": i * 2 } as CSSProperties} className="reveal flex-1 rounded-lg border border-border bg-background p-3.5 @2xl:text-center">
                <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand @2xl:mx-auto">
                  <Icon className="size-4.5" />
                </span>
                <p className="mt-2 text-sm font-semibold">
                  <span className="mr-1.5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  {text.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{text.caption}</p>
                {isOutcome && (
                  <ul className="mt-2.5 space-y-1.5 text-left font-mono text-[11px]">
                    <li className="rounded border border-brand/40 bg-brand/5 px-2 py-1">{(copy as typeof t.guard).allow}</li>
                    <li className="rounded border border-phase-gate-failed/40 bg-phase-gate-failed/5 px-2 py-1">{(copy as typeof t.guard).block}</li>
                  </ul>
                )}
              </div>
              {i < nodes.length - 1 && (
                <span style={{ "--i": i * 2 + 1 } as CSSProperties} aria-hidden="true" className="reveal flex items-center justify-center text-brand @2xl:px-1.5">
                  <ChevronDown className="my-0.5 size-4 @2xl:hidden" />
                  <ArrowRight className="hidden size-4 @2xl:block" />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {flow === "overview" && (
        <p style={{ "--i": nodes.length * 2 } as CSSProperties} key={`r${run}`} className="reveal mt-3 flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Undo2 aria-hidden="true" className="size-3.5 shrink-0 text-brand" />
          {t.overview.returned}
        </p>
      )}
    </div>
  );
}
