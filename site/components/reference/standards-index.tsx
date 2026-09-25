import { Reveal } from "@/components/ui/reveal";
import { stagger } from "@/lib/reveal";
import generatedTh from "@/content/i18n/generated.th.json";
import { getStandards } from "@/lib/generated/loaders";
import { translate } from "@/lib/generated/translatable";
import { getDictionary, type Locale } from "@/lib/i18n";

/** One row per `.jarvis/standards/*.md`, generated — a new standards file shows up here
 *  with no edit to the docs page. Rule lists use <details> so they work without JS. */
export function StandardsIndex({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).reference.standards;
  const thDict = locale === "th" ? (generatedTh as Record<string, string>) : {};
  const standards = getStandards();

  return (
    <Reveal className="not-prose my-6 space-y-3">
      {standards.map((s, i) => {
        const must = s.rules.filter((r) => r.level === "MUST").length;
        const should = s.rules.length - must;
        return (
          <div key={s.id} id={`std-${s.id}`} style={stagger(i)} className="reveal scroll-mt-24 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <code className="font-mono text-sm font-medium">{s.file}</code>
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">{s.area}-</span>
              <span className="text-xs text-muted-foreground">
                {t.mustCount} {must} · {t.shouldCount} {should}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-foreground/90">{translate(`standard:${s.id}.summary`, s.summary, thDict).text}</p>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                {t.showRules} ({s.rules.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {s.rules.map((r) => (
                  <li key={r.id} className="flex gap-2">
                    <code className="shrink-0 font-mono text-xs text-muted-foreground">{r.id}</code>
                    <span>{r.title}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </Reveal>
  );
}
