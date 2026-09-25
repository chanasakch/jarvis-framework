"use client";

import { CircleHelp, Lightbulb, TriangleAlert } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { STAGE_ICONS } from "@/components/sdlc/stage-icons";
import type { Dictionary } from "@/lib/i18n";
import { STAGE_IDS } from "@/lib/sdlc/model";
import { cn } from "@/lib/utils";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Field({
  icon,
  label,
  children,
  tone,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  tone?: "warn" | "example";
}) {
  return (
    <div
      className={cn(
        "rounded-md p-3",
        tone === "warn" && "border border-dashed border-border bg-muted/40",
        tone === "example" && "border border-brand/30 bg-brand/5",
        !tone && "bg-muted/50",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase",
          tone === "example" ? "text-brand" : "text-muted-foreground",
        )}
      >
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-sm">{children}</p>
    </div>
  );
}

/**
 * One idea followed from a request to a live product, one card per stage. As the reader
 * scrolls, the rail fills to the card nearest the middle of the screen and its node lights,
 * so the page reads as a journey. Cards reveal once as they come into view.
 *
 * The example (a restaurant adding online table booking) is invented and labelled as such.
 */
export function BusinessJourney({ dict }: { dict: Dictionary }) {
  const { journey } = dict.sdlc.business;
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    STAGE_IDS.map(() => false),
  );

  useEffect(() => {
    const els = cards.current.filter((e): e is HTMLLIElement => !!e);
    // The card crossing the middle band of the screen is the current one.
    const center = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting)
            setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    // A card reveals the first time any part of it is comfortably on screen.
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          setRevealed((r) =>
            r[i] ? r : r.map((v, k) => (k === i ? true : v)),
          );
          reveal.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    for (const el of els) {
      center.observe(el);
      reveal.observe(el);
    }
    return () => {
      center.disconnect();
      reveal.disconnect();
    };
  }, []);

  const fillPercent = Math.round(((active + 1) / STAGE_IDS.length) * 1000) / 10;

  return (
    <div className="not-prose @container my-8">
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs text-brand">
        <Lightbulb aria-hidden="true" className="size-3.5" />
        {journey.exampleTag}
      </p>

      <div className="relative">
        {/* The rail: a track behind the nodes, and the part already travelled. */}
        <div
          aria-hidden="true"
          className="absolute top-5 bottom-5 left-5 w-0.5 -translate-x-1/2 rounded-full bg-border"
        />
        <div
          aria-hidden="true"
          className="absolute top-5 left-5 w-0.5 -translate-x-1/2 rounded-full bg-brand transition-[height] duration-(--motion-travel) ease-in-out"
          style={{ height: `calc(${fillPercent}% - 1.25rem)` }}
        />

        <ol aria-label={journey.ariaLabel} className="space-y-5">
          {STAGE_IDS.map((id, i) => {
            const Icon = STAGE_ICONS[id];
            const copy = journey.stages[id];
            const reached = i <= active;
            return (
              <li
                key={id}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                data-index={i}
                data-active={i === active ? "true" : "false"}
                style={{ "--i": 0 } as CSSProperties}
                className={cn("relative pl-14", revealed[i] && "journey-card")}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 left-0 z-10 flex size-10 items-center justify-center rounded-full border-2 transition-[background-color,border-color,color,scale] duration-(--motion-base)",
                    reached
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-background text-muted-foreground",
                    i === active && "scale-110 ring-4 ring-brand/20",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>

                <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-base font-semibold">{copy.title}</h3>
                    <span className="font-mono text-xs text-muted-foreground">
                      {i + 1}/{STAGE_IDS.length} · {capitalize(id)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 @xl:grid-cols-2">
                    <Field
                      icon={
                        <CircleHelp aria-hidden="true" className="size-3.5" />
                      }
                      label={journey.questionLabel}
                    >
                      {copy.question}
                    </Field>
                    <Field
                      icon={
                        <STAGE_ICONS.verify
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      }
                      label={journey.outputLabel}
                    >
                      {copy.output}
                    </Field>
                    <Field
                      icon={
                        <TriangleAlert
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      }
                      label={journey.skippedLabel}
                      tone="warn"
                    >
                      {copy.skipped}
                    </Field>
                    <Field
                      icon={
                        <Lightbulb aria-hidden="true" className="size-3.5" />
                      }
                      label={journey.exampleLabel}
                      tone="example"
                    >
                      {copy.example}
                    </Field>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
