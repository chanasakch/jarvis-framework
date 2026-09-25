import { FolderCog, FolderSync, Lock, RefreshCw, type LucideIcon } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/lib/i18n";
import { stagger } from "@/lib/reveal";
import { OWNERSHIP, validateOwnership } from "@/lib/viz/ownership";
import { cn } from "@/lib/utils";

const COLUMNS: { id: keyof typeof OWNERSHIP; icon: LucideIcon; tone: string }[] = [
  { id: "framework", icon: RefreshCw, tone: "border-brand/40 bg-brand/5" },
  { id: "project", icon: Lock, tone: "border-border bg-card" },
  { id: "runtime", icon: FolderSync, tone: "border-dashed border-border bg-muted/40" },
];

/**
 * What `upgrade` replaces, what it never touches, and what grows as you work. Lists come from
 * lib/viz/ownership.ts, which mirrors the installer's own FRAMEWORK and PROJECT lists and
 * fails the build if a listed path has left the repo.
 */
export function OwnershipMap({ dict }: { dict: Dictionary }) {
  validateOwnership();
  const t = dict.viz.ownership;
  return (
    <Reveal className="not-prose @container my-6">
      <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <FolderCog aria-hidden="true" className="size-4 shrink-0 text-brand" />
        {t.intro}
      </p>
      <div className="grid gap-3 @2xl:grid-cols-3">
        {COLUMNS.map((col, i) => {
          const Icon = col.icon;
          return (
            <section key={col.id} style={stagger(i)} className={cn("reveal rounded-lg border p-4", col.tone)} aria-labelledby={`own-${col.id}`}>
              <h3 id={`own-${col.id}`} className="flex items-center gap-2 text-sm font-semibold">
                <Icon aria-hidden="true" className="size-4 text-brand" />
                {t[col.id].title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t[col.id].note}</p>
              <ul className="mt-3 space-y-2.5">
                {OWNERSHIP[col.id].map((p) => (
                  <li key={p}>
                    <code className="font-mono text-xs break-words">
                      {/* Break after a slash, never inside a file name: registry.ya / ml reads as a typo. */}
                      {p.split("/").map((seg, k, all) => (
                        <span key={k}>
                          {seg}
                          {k < all.length - 1 && (
                            <>
                              /<wbr />
                            </>
                          )}
                        </span>
                      ))}
                    </code>
                    <span className="block text-xs text-muted-foreground">{t.paths[p]}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Reveal>
  );
}
