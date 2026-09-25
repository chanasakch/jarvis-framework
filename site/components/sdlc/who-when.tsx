"use client";

import type { CSSProperties } from "react";

import { useInView } from "@/hooks/use-in-view";
import type { Dictionary } from "@/lib/i18n";
import { STAGE_IDS, WHO_IDS, WHO_WHEN, type Involvement } from "@/lib/sdlc/model";
import { cn } from "@/lib/utils";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Who is involved in which stage, as a grid. Shape carries the meaning as well as colour:
 * a filled dot leads the stage, a ring takes part, a dash is not involved, and each cell also
 * has a text label for a screen reader. It is a typical split, and the caption says teams differ.
 */
export function WhoWhen({ dict }: { dict: Dictionary }) {
  const { whoWhen } = dict.sdlc.business;
  const { ref, seen } = useInView<HTMLDivElement>(0.25);

  const label = (v: Involvement) => (v === 2 ? whoWhen.lead : v === 1 ? whoWhen.involved : whoWhen.none);

  return (
    <div ref={ref} data-seen={seen ? "true" : "false"} className="not-prose my-6">
      {/* Focusable, because the grid scrolls sideways on a phone and a keyboard user must be able to reach it. */}
      <div role="region" aria-label={whoWhen.caption} tabIndex={0} className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full border-collapse text-sm sm:min-w-136">
          <caption className="sr-only">{whoWhen.caption}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {whoWhen.roleHeader}
              </th>
              {STAGE_IDS.map((id) => (
                <th
                  key={id}
                  scope="col"
                  // Turned on its side below sm, so six columns fit a phone without sideways scrolling.
                  className="px-1 py-2.5 text-center text-xs font-semibold max-sm:h-20 max-sm:rotate-180 max-sm:align-bottom max-sm:[writing-mode:vertical-rl] sm:px-2"
                >
                  {capitalize(id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WHO_IDS.map((role, r) => (
              <tr key={role} className="border-b border-border last:border-0 transition-colors duration-(--motion-fast) hover:bg-muted/40">
                <th scope="row" className="px-3 py-2.5 text-left font-medium">
                  {whoWhen.roles[role]}
                </th>
                {STAGE_IDS.map((stage, c) => {
                  const v = WHO_WHEN[role][stage];
                  return (
                    <td key={stage} className="px-1 py-2.5 text-center sm:px-2">
                      <span className="sr-only">{label(v)}</span>
                      <span
                        aria-hidden="true"
                        style={{ "--i": r + c } as CSSProperties}
                        className={cn(
                          "reveal-pop mx-auto block rounded-full",
                          v === 2 && "size-4 bg-brand ring-4 ring-brand/20",
                          v === 1 && "size-3.5 border-2 border-brand",
                          v === 0 && "h-0.5 w-3 rounded-none bg-border",
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-brand ring-3 ring-brand/20" />
          {whoWhen.lead}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-brand" />
          {whoWhen.involved}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-border" />
          {whoWhen.none}
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{whoWhen.caption}</p>
    </div>
  );
}
