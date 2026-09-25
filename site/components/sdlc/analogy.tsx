"use client";

import {
  ArrowDown,
  ClipboardList,
  Compass,
  Hammer,
  KeyRound,
  PencilRuler,
  ClipboardCheck,
  House,
  Code,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { STAGE_ICONS } from "@/components/sdlc/stage-icons";
import { useInView } from "@/hooks/use-in-view";
import type { Dictionary } from "@/lib/i18n";
import { STAGE_IDS, type StageId } from "@/lib/sdlc/model";

const HOUSE_ICONS: Record<StageId, LucideIcon> = {
  discover: Compass,
  define: ClipboardList,
  design: PencilRuler,
  build: Hammer,
  verify: ClipboardCheck,
  ship: KeyRound,
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The SDLC by analogy: building a house, stage by stage, next to building software. For a
 * reader with no software background this is the fastest way in, and it needs no Jarvis
 * context. Each card is one stage: the house step above, the software step below.
 */
export function SdlcAnalogy({ dict }: { dict: Dictionary }) {
  const { analogy } = dict.sdlc.business;
  const { ref, seen } = useInView<HTMLDivElement>(0.2);

  return (
    <div
      ref={ref}
      data-seen={seen ? "true" : "false"}
      className="not-prose @container my-6"
    >
      <ul
        className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"
        aria-hidden="true"
      >
        <li className="flex items-center gap-1.5">
          <House className="size-3.5" />
          {analogy.houseLabel}
        </li>
        <li className="flex items-center gap-1.5 text-brand">
          <Code className="size-3.5" />
          {analogy.softwareLabel}
        </li>
      </ul>

      <ol
        aria-label={analogy.ariaLabel}
        className="grid grid-cols-1 gap-3 @lg:grid-cols-3"
      >
        {STAGE_IDS.map((id, i) => {
          const HouseIcon = HOUSE_ICONS[id];
          const SoftIcon = STAGE_ICONS[id];
          const copy = analogy.steps[id];
          return (
            <li
              key={id}
              style={{ "--i": i } as CSSProperties}
              className="reveal flex flex-col overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="flex-1 bg-muted/50 p-3.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HouseIcon aria-hidden="true" className="size-4" />
                  <span className="sr-only">{analogy.houseLabel}</span>
                  <span className="font-mono text-[11px] tracking-wide uppercase">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {copy.house}
                </p>
              </div>
              <div
                aria-hidden="true"
                className="flex justify-center border-y border-border bg-background py-0.5 text-brand"
              >
                <ArrowDown className="size-3.5" />
              </div>
              <div className="flex-1 bg-brand/5 p-3.5">
                <div className="flex items-center gap-2 text-brand">
                  <SoftIcon aria-hidden="true" className="size-4" />
                  <span className="sr-only">{analogy.softwareLabel}</span>
                  <span className="text-xs font-semibold">
                    {capitalize(id)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm">{copy.software}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-sm text-muted-foreground">{analogy.note}</p>
    </div>
  );
}
