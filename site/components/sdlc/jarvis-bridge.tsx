"use client";

import { ArrowDown, ArrowRight, ShieldCheck, TriangleAlert } from "lucide-react";
import type { CSSProperties } from "react";

import { useInView } from "@/hooks/use-in-view";
import type { Dictionary } from "@/lib/i18n";
import { BRIDGE_IDS } from "@/lib/sdlc/model";

/**
 * The hinge of the page: each problem a normal team runs into, next to the specific thing
 * Jarvis does about it. Every "how" is a mechanism the framework really has (IDs and the
 * script gate, ADRs, four reviewers, human-only approval, recorded forced gates, per-phase
 * documents, the portfolio command). None is a promise about outcomes.
 */
export function JarvisBridge({ dict }: { dict: Dictionary }) {
  const { bridge } = dict.sdlc.business;
  const { ref, seen } = useInView<HTMLDivElement>(0.15);

  return (
    <div ref={ref} data-seen={seen ? "true" : "false"} className="not-prose @container my-6">
      {/* Column headings at the wide layout; on a narrow one each card carries its own label. */}
      <div aria-hidden="true" className="mb-2 hidden gap-3 px-1 text-xs font-medium tracking-wide uppercase @xl:grid @xl:grid-cols-[1fr_2rem_1fr]">
        <span className="text-muted-foreground">{bridge.painLabel}</span>
        <span />
        <span className="text-brand">{bridge.howLabel}</span>
      </div>

      <ul className="space-y-3">
        {BRIDGE_IDS.map((id, i) => {
          const copy = bridge.items[id];
          return (
            <li key={id} style={{ "--i": i } as CSSProperties} className="reveal grid items-stretch gap-2 @xl:grid-cols-[1fr_2rem_1fr] @xl:gap-3">
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase @xl:sr-only">
                  <TriangleAlert aria-hidden="true" className="size-3.5" />
                  {bridge.painLabel}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground @xl:mt-0">{copy.pain}</p>
              </div>

              <div aria-hidden="true" className="flex items-center justify-center text-brand">
                <ArrowDown className="size-4 @xl:hidden" />
                <ArrowRight className="hidden size-4 @xl:block" />
              </div>

              <div className="rounded-lg border border-brand/30 bg-brand/5 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-brand uppercase @xl:sr-only">
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                  {bridge.howLabel}
                </p>
                <p className="mt-1.5 text-sm @xl:mt-0">{copy.how}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
