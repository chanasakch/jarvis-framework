import { Reveal } from "@/components/ui/reveal";
import type { Standard } from "@/lib/generated/schemas";
import type { Dictionary } from "@/lib/i18n";
import { stagger } from "@/lib/reveal";

const fill = (template: string, vars: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * The standards as a chart: one bar per area, as long as its rule count, split into MUST and
 * SHOULD. Read from the generated standards data, so a new standards file gets its own bar
 * without an edit. Each bar links to that area's rules in the index below it.
 */
export function StandardsMap({ dict, standards }: { dict: Dictionary; standards: Standard[] }) {
  const t = dict.viz.standardsMap;
  const rows = standards
    .map((s) => {
      const must = s.rules.filter((r) => r.level === "MUST").length;
      return { id: s.id, area: s.area, file: s.file, must, should: s.rules.length - must, total: s.rules.length };
    })
    .sort((a, b) => b.total - a.total || a.area.localeCompare(b.area));
  const max = Math.max(...rows.map((r) => r.total), 1);
  const totals = rows.reduce((acc, r) => ({ rules: acc.rules + r.total, must: acc.must + r.must, should: acc.should + r.should }), { rules: 0, must: 0, should: 0 });
  const pct = (n: number) => Math.round((n / max) * 1000) / 10;

  return (
    <Reveal className="not-prose @container my-6 rounded-lg border border-border bg-card p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{t.intro}</p>
      <p className="mt-2 text-sm font-medium">{fill(t.total, { rules: totals.rules, areas: rows.length, must: totals.must, should: totals.should })}</p>

      <ul className="mt-4 grid gap-x-8 gap-y-1 @2xl:grid-cols-2">
        {rows.map((r, i) => (
          <li key={r.id}>
            <a href={`#std-${r.id}`} aria-label={`${t.jump} ${r.file}`} className="group -mx-2 block rounded-md px-2 py-1.5 transition-colors duration-(--motion-fast) hover:bg-muted/60">
              <span className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-mono">
                  <span className="font-semibold">{r.area}</span> <span className="text-muted-foreground">{r.file}</span>
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">{r.total}</span>
              </span>
              {/* MUST and SHOULD share one bar, so its length is the area's rule count. */}
              <span aria-hidden="true" style={{ width: `${pct(r.total)}%`, ...stagger(i, 14) }} className="bar-fill mt-1 flex h-2 overflow-hidden rounded-full bg-border">
                <span className="bg-brand" style={{ width: `${r.total ? Math.round((r.must / r.total) * 1000) / 10 : 0}%` }} />
                <span className="bg-brand/35" style={{ width: `${r.total ? Math.round((r.should / r.total) * 1000) / 10 : 0}%` }} />
              </span>
              <span className="sr-only">
                {r.must} {t.must}, {r.should} {t.should}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-brand" />
          {t.must}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-brand/35" />
          {t.should}
        </li>
      </ul>
    </Reveal>
  );
}
