"use client";

import type { ComponentProps } from "react";

import { useInView } from "@/hooks/use-in-view";

/**
 * Marks a region so the `.reveal` / `.reveal-pop` / `.chart-*` classes inside it play once,
 * when it first scrolls into view (see the "SDLC business explainer" block in globals.css).
 * Nothing here hides content: before it plays, and without JavaScript, everything is fully
 * visible. Give each child `className="reveal"` and `style={{ "--i": index }}` for a stagger.
 */
export function Reveal({ children, threshold = 0.15, ...props }: ComponentProps<"div"> & { threshold?: number }) {
  const { ref, seen } = useInView<HTMLDivElement>(threshold);
  return (
    <div ref={ref} data-seen={seen ? "true" : "false"} {...props}>
      {children}
    </div>
  );
}

