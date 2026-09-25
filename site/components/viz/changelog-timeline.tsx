import { Fragment } from "react";
import { Archive, Plus, RefreshCw, ShieldCheck, Tag, Trash2, Wrench, type LucideIcon } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type { ChangelogEntry } from "@/lib/generated/schemas";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Keep a Changelog's own section names, each with an icon and a colour, so a section is
 *  recognisable by shape and by its label as well as by colour. An unknown heading gets a
 *  neutral tag and still renders. */
const SECTIONS: Record<string, { icon: LucideIcon; tone: string }> = {
  Added: { icon: Plus, tone: "text-phase-passed" },
  Changed: { icon: RefreshCw, tone: "text-severity-minor" },
  Fixed: { icon: Wrench, tone: "text-severity-major" },
  Security: { icon: ShieldCheck, tone: "text-severity-critical" },
  Removed: { icon: Trash2, tone: "text-phase-blocked" },
  Deprecated: { icon: Archive, tone: "text-phase-skipped" },
};

/** Renders `inline code` in a release note as code, and everything else as text. It builds
 *  elements from the split text rather than injecting HTML, so a note can never inject markup. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
          <code key={i} className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * The release history as a timeline: a rail down the left with a node per version, the newest
 * marked, each release's sections labelled with their Keep a Changelog heading. Entries are
 * English on both language routes (they are release notes sourced from CHANGELOG.md); only
 * the chrome around them is translated. Each release draws in once as it scrolls into view.
 */
export function ChangelogTimeline({ dict, entries }: { dict: Dictionary; entries: ChangelogEntry[] }) {
  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => (
        <li key={entry.version}>
          <Reveal threshold={0.2} className="step relative pb-10 pl-12 last:pb-0" aria-labelledby={`v${entry.version}`}>
            <span aria-hidden="true" className="step-number absolute top-0 left-0 flex size-9 items-center justify-center rounded-full border-2 border-brand bg-background font-mono text-[11px] font-semibold text-brand">
              {entry.version.split(".")[0]}
            </span>
            {index < entries.length - 1 && (
              <>
                <span aria-hidden="true" className="absolute top-9 left-[1.0625rem] h-[calc(100%-2.25rem)] w-px bg-border" />
                <span aria-hidden="true" className="step-line absolute top-9 left-[1.0625rem] h-[calc(100%-2.25rem)] w-px bg-brand" />
              </>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 id={`v${entry.version}`} className="scroll-mt-24 font-mono text-lg font-semibold">
                v{entry.version}
              </h2>
              {index === 0 && (
                <span className="rounded-full border border-brand/40 bg-background px-2 py-0.5 text-[11px] font-medium text-brand">{dict.viz.changelog.latest}</span>
              )}
              <time dateTime={entry.date} className="text-sm text-muted-foreground">
                {entry.date}
              </time>
            </div>

            <div className="mt-3 space-y-4">
              {entry.sections.map((section) => {
                const meta = SECTIONS[section.heading] ?? { icon: Tag, tone: "text-muted-foreground" };
                const Icon = meta.icon;
                return (
                  <section key={section.heading} aria-label={section.heading} className="rounded-lg border border-border bg-card p-4">
                    <h3 className={cn("flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase", meta.tone)}>
                      <Icon aria-hidden="true" className="size-3.5" />
                      {section.heading}
                    </h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
                      {section.items.map((item, i) => (
                        <li key={i}>
                          <Inline text={item} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
