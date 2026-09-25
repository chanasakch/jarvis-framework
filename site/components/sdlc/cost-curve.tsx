"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { RotateCcw } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { areaPath, CHART, chartPoints, smoothPath } from "@/lib/sdlc/chart";
import type { Dictionary } from "@/lib/i18n";
import { COST_POINT_IDS, type CostPointId } from "@/lib/sdlc/model";
import { cn } from "@/lib/utils";

/**
 * "The later you find a problem, the more it costs to fix." An illustrative curve over the
 * six stages and the point after release. It has no scale on purpose: the values are not
 * measured (see lib/sdlc/chart.ts), and the caption says so. Pick a point to read what
 * fixing a problem found there involves.
 */
export function CostCurve({ dict }: { dict: Dictionary }) {
  const { cost } = dict.sdlc.business;
  const { ref, seen } = useInView<HTMLDivElement>(0.3);
  const points = chartPoints();
  const [selected, setSelected] = useState<CostPointId>("live");
  const [run, setRun] = useState(0);

  const at =
    points.find((p) => p.id === selected) ?? points[points.length - 1]!;
  const baseline = CHART.height - CHART.bottom;

  return (
    <div
      ref={ref}
      data-seen={seen ? "true" : "false"}
      className="not-prose @container my-6 rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {cost.ariaLabel}
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setRun((n) => n + 1)}
          className="-mt-1 shrink-0"
        >
          <RotateCcw aria-hidden="true" />
          {cost.replay}
        </Button>
      </div>

      <svg
        role="img"
        aria-label={cost.ariaLabel}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="mt-2 h-auto w-full overflow-visible"
      >
        {/* baseline */}
        <line
          x1={CHART.left}
          x2={CHART.width - CHART.right}
          y1={baseline}
          y2={baseline}
          className="stroke-border"
          strokeWidth={1.5}
        />

        {/* Remounting on `run` restarts every animation inside, which is the whole of "replay". */}
        <g key={run}>
          <path
            d={areaPath(points)}
            className={cn("fill-brand/10", seen && "chart-fade")}
          />
          <path
            d={smoothPath(points)}
            fill="none"
            pathLength={1}
            strokeWidth={3}
            strokeLinecap="round"
            className={cn("stroke-brand", seen && "chart-draw")}
          />
          {points.map((p, i) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={5}
              style={{ "--i": i } as CSSProperties}
              className={cn(
                "fill-background stroke-brand",
                seen && "reveal-pop",
              )}
              strokeWidth={2.5}
            />
          ))}
        </g>

        {/* The picked point: a guide down to the baseline and a ring, gliding between points. */}
        <g
          className="transition-transform duration-(--motion-travel) ease-in-out"
          style={{ transform: `translate(${at.x}px, ${at.y}px)` }}
        >
          <line
            x1={0}
            x2={0}
            y1={8}
            y2={Math.round((baseline - at.y) * 10) / 10}
            className="stroke-brand/50"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <circle
            r={10}
            className="fill-brand/15 stroke-brand"
            strokeWidth={2}
          />
          <circle r={4} className="fill-brand" />
        </g>
      </svg>

      <TabsPrimitive.Root
        value={selected}
        onValueChange={(v) => setSelected(v as CostPointId)}
        className="mt-3"
      >
        <TabsPrimitive.List
          aria-label={cost.tabsLabel}
          className="flex flex-wrap justify-center gap-1.5"
        >
          {COST_POINT_IDS.map((id) => (
            <TabsPrimitive.Trigger
              key={id}
              value={id}
              className={cn(
                "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground outline-none",
                "transition-colors duration-(--motion-fast) hover:border-brand hover:text-foreground",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                "data-[state=active]:border-brand data-[state=active]:bg-brand data-[state=active]:text-brand-foreground",
              )}
            >
              {cost.points[id].label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {COST_POINT_IDS.map((id) => (
          <TabsPrimitive.Content
            key={id}
            value={id}
            className="mt-4 min-h-16 rounded-md bg-muted/50 p-3.5 text-center outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-(--motion-base)"
          >
            <p className="text-xs text-muted-foreground">{cost.foundHere}</p>
            <p className="mt-1 text-sm font-medium">{cost.points[id].note}</p>
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>

      <p className="mt-4 text-xs text-muted-foreground">{cost.caption}</p>
    </div>
  );
}
