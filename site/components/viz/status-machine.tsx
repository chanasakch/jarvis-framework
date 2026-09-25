import { Bot, Cog, User, type LucideIcon } from "lucide-react";

import { StatusBadge, type PhaseStatus } from "@/components/mdx/status-badge";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n";
import { stagger } from "@/lib/reveal";

/** Who sets each status (conventions.md section 3). `skipped` appears twice on purpose: the CLI
 *  sets it when an optional phase's flag is false, and a person sets it with `skip`. */
const LANES: { id: "cli" | "claude" | "you"; icon: LucideIcon; statuses: PhaseStatus[] }[] = [
  { id: "cli", icon: Cog, statuses: ["pending", "skipped"] },
  { id: "claude", icon: Bot, statuses: ["in_progress", "gate_failed", "passed", "blocked"] },
  { id: "you", icon: User, statuses: ["approved", "forced", "skipped", "parked"] },
];
const UNLOCKS: PhaseStatus[] = ["approved", "passed", "forced", "skipped"];

export function StatusMachine({ dict }: { dict: Dictionary }) {
  const t = dict.viz.statusMachine;
  return (
    <Reveal className="not-prose my-6">
      <p className="mb-3 text-sm text-muted-foreground">{t.intro}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {LANES.map((lane, i) => {
          const Icon = lane.icon;
          return (
            <div key={lane.id} style={stagger(i)} className="reveal rounded-lg border border-border bg-card p-4">
              <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <Icon aria-hidden="true" className="size-4 text-brand" />
                {t.lanes[lane.id]}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lane.statuses.map((s) => (
                  <StatusBadge key={s} kind="phase" value={s} label={s} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t.skippedNote}</p>
      <div style={stagger(3)} className="reveal mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm">
        <span>{t.unlock}</span>
        {UNLOCKS.map((s) => (
          <StatusBadge key={s} kind="phase" value={s} label={s} />
        ))}
      </div>
    </Reveal>
  );
}
