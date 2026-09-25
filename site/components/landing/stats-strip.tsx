import { Reveal } from "@/components/ui/reveal";
import { stagger } from "@/lib/reveal";
import { getAgents, getCli, getCommands, getStandards, getWorkflows } from "@/lib/generated/loaders";
import type { Dictionary } from "@/lib/i18n";
import { CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

/**
 * Four real numbers, read from the generated framework data at build time, that count up
 * once when the strip scrolls in. Nothing here is typed by hand, so the strip cannot drift
 * from the framework: add an agent and the number changes on the next build.
 */
export function StatsStrip({ dict }: { dict: Dictionary }) {
  const { stats } = dict.viz;
  const items = [
    { key: "agents", value: getAgents().length },
    { key: "workTypes", value: getWorkflows().length },
    { key: "rules", value: getStandards().reduce((n, s) => n + s.rules.length, 0) },
    { key: "commands", value: getCommands().length + getCli().length },
  ] as const;

  return (
    <section aria-labelledby="stats-heading" className={cn(CONTAINER, "pb-4")}>
      <h2 id="stats-heading" className="sr-only">
        {stats.heading}
      </h2>
      <Reveal threshold={0.4} className="mx-auto grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        {items.map((item, i) => (
          <div key={item.key} style={stagger(i)} className="reveal bg-card px-4 py-5 text-center">
            {/* The number is drawn by a CSS counter, which a screen reader may not announce
                mid-animation, so the real value is also present as text. */}
            <span className="sr-only">{item.value}</span>
            <span aria-hidden="true" style={{ "--n": item.value, ...stagger(i) } as React.CSSProperties} className="stat-num block font-mono text-3xl font-semibold tracking-tight text-brand tabular-nums" />
            <span className="mt-1 block text-xs text-muted-foreground">{stats.items[item.key]}</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
