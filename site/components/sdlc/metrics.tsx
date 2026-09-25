import { HeartPulse, RotateCcw, Rocket, Timer, type LucideIcon } from "lucide-react";

import type { Dictionary } from "@/lib/i18n";
import { METRIC_IDS, type MetricId } from "@/lib/sdlc/model";

const ICONS: Record<MetricId, LucideIcon> = {
  leadTime: Timer,
  frequency: Rocket,
  failureRate: RotateCcw,
  restoreTime: HeartPulse,
};

/**
 * The four measures from the DORA research programme, in plain terms. They say how well a
 * delivery process works in business terms rather than by how busy the team looks. There
 * are deliberately no numbers: good values differ by product, and inventing a benchmark
 * would be the kind of unverifiable claim this site avoids.
 */
export function DoraMetrics({ dict }: { dict: Dictionary }) {
  const { metrics } = dict.sdlc.business;
  return (
    <div className="not-prose @container my-6">
      <ul className="grid gap-3 @lg:grid-cols-2">
        {METRIC_IDS.map((id) => {
          const Icon = ICONS[id];
          const copy = metrics.items[id];
          return (
            <li key={id} className="flex gap-3 rounded-lg border border-border bg-card p-4 transition-colors duration-(--motion-fast) hover:border-brand">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{copy.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{copy.meaning}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">{metrics.note}</p>
    </div>
  );
}
