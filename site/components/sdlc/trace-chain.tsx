"use client";

import {
  ClipboardCheck,
  FileText,
  FlaskConical,
  ListChecks,
  User,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { StatusBadge } from "@/components/mdx/status-badge";
import { useInView } from "@/hooks/use-in-view";
import type { Dictionary } from "@/lib/i18n";

type StepKey = keyof Dictionary["sdlc"]["trace"]["steps"];

/** The ID formats are conventions.md §1's own examples (FR-003, US-004, AC-004-02,
 *  TC-021), so the chain reads as one real requirement followed all the way through. */
const STEPS: { key: StepKey; icon: LucideIcon; id?: string }[] = [
  { key: "requirement", icon: FileText, id: "FR-003" },
  { key: "story", icon: User, id: "US-004" },
  { key: "criterion", icon: ListChecks, id: "AC-004-02" },
  { key: "test", icon: FlaskConical, id: "TC-021" },
  { key: "report", icon: ClipboardCheck },
];

/**
 * One requirement followed from the PRD to the QA matrix. The links between nodes draw
 * in one after another when the chain scrolls into view (see `.trace-node` in
 * globals.css); before that, and without JavaScript, they are fully drawn.
 */
export function TraceChain({ dict }: { dict: Dictionary }) {
  const { trace } = dict.sdlc;
  const { ref, seen } = useInView<HTMLDivElement>(0.4);

  return (
    <div
      ref={ref}
      data-seen={seen ? "true" : "false"}
      className="not-prose my-6"
    >
      <ol
        aria-label={trace.ariaLabel}
        className="grid gap-4 md:grid-cols-5 md:gap-2"
      >
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const copy = trace.steps[step.key];
          return (
            <li
              key={step.key}
              style={{ "--i": i } as CSSProperties}
              className="trace-node flex items-start gap-3 md:flex-col md:items-center md:gap-2 md:text-center"
            >
              <span
                aria-hidden="true"
                className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-background text-brand"
              >
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{copy.label}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {copy.caption}
                </p>
                <div className="mt-1.5">
                  {step.id ? (
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {step.id}
                    </span>
                  ) : (
                    <StatusBadge kind="phase" value="passed" label="pass" />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-sm text-muted-foreground">{trace.note}</p>
    </div>
  );
}
