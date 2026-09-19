"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Scroll-spy: highlights whichever heading's section is currently most visible.
 *  Falls back to no highlight if headings haven't mounted yet (SSR-safe, no-op without JS). */
export function DocsToc({ headings, title }: { headings: Heading[]; title: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveId(topMost.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label={title} className="space-y-2 text-sm">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="space-y-1 border-l border-border">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1.5rem" : "0.75rem" }}>
            <a
              href={`#${h.id}`}
              aria-current={activeId === h.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l-2 py-0.5 pl-3 transition-colors",
                activeId === h.id
                  ? "border-brand font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
