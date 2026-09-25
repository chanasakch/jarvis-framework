"use client";

import { RotateCcw } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import type { Dictionary } from "@/lib/i18n";
import { MODEL_IDS, type ModelId } from "@/lib/sdlc/model";

/** Each diagram is a 120 x 76 sketch of how the model moves through the work. */
function Waterfall() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 76" className="mx-auto h-auto w-full max-w-56">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={4 + i * 18} y={6 + i * 13} width={30} height={9} rx={2.5} style={{ "--i": i } as CSSProperties} className="model-bar fill-brand" />
      ))}
    </svg>
  );
}

function Agile() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 76" className="mx-auto h-auto w-full max-w-56">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={24 + i * 36} cy={38} r={14} fill="none" strokeWidth={3} strokeLinecap="round" pathLength={1} style={{ "--i": i } as CSSProperties} className="model-ring stroke-brand" />
          <text x={24 + i * 36} y={42} textAnchor="middle" className="fill-foreground font-mono text-[11px]">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

const LOOP = "M 60 38 C 78 8, 110 8, 110 38 C 110 68, 78 68, 60 38 C 42 8, 10 8, 10 38 C 10 68, 42 68, 60 38 Z";

function Devops() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 76" className="mx-auto h-auto w-full max-w-56">
      <path d={LOOP} fill="none" strokeWidth={3} strokeLinecap="round" pathLength={1} className="model-loop stroke-border" />
      <path d={LOOP} fill="none" strokeWidth={3} strokeLinecap="round" pathLength={1} className="model-loop stroke-brand" />
      <circle r={4.5} className="model-dot fill-brand" style={{ offsetPath: `path("${LOOP}")` }} />
    </svg>
  );
}

const DIAGRAMS: Record<ModelId, () => React.JSX.Element> = { waterfall: Waterfall, agile: Agile, devops: Devops };

/**
 * Three common ways of running the stages, each with a small diagram that plays once:
 * Waterfall (in order, each stage finishing first), Agile (short rounds through every stage,
 * with feedback between them) and DevOps (automated building, testing and releasing, so small
 * changes ship often). Neutral on purpose: each says what it suits and what to watch for.
 */
export function ModelsCompare({ dict }: { dict: Dictionary }) {
  const { models } = dict.sdlc.business;
  const { ref, seen } = useInView<HTMLDivElement>(0.3);
  const [run, setRun] = useState(0);

  return (
    <div ref={ref} data-seen={seen ? "true" : "false"} className="not-prose @container my-6">
      <div className="mb-3 flex justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={() => setRun((n) => n + 1)}>
          <RotateCcw aria-hidden="true" />
          {models.replay}
        </Button>
      </div>

      {/* Remounting the cards on `run` restarts their animations: that is all "replay" does. */}
      <ul key={run} className="grid gap-3 @2xl:grid-cols-3">
        {MODEL_IDS.map((id) => {
          const Diagram = DIAGRAMS[id];
          const copy = models.items[id];
          return (
            <li key={id} className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors duration-(--motion-fast) hover:border-brand">
              <div className="rounded-md bg-muted/50 p-2">
                <Diagram />
              </div>
              <h3 className="mt-3 text-base font-semibold">{copy.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{copy.how}</p>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div>
                  <dt className="text-xs font-medium tracking-wide text-brand uppercase">{models.whenLabel}</dt>
                  <dd className="mt-0.5">{copy.when}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{models.watchLabel}</dt>
                  <dd className="mt-0.5">{copy.watch}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
