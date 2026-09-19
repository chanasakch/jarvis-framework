import type { ComponentProps } from "react";

/**
 * Original geometric mark: three rounded nodes on a diagonal, connected — a small
 * abstraction of a pipeline moving through checkpoints (the framework's three-layer
 * gates), not a reference to any existing character, film or comic mark. Uses
 * currentColor so it themes with text color; the brand-colored variant sets its own
 * `text-brand` className where used.
 */
export function Logo(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 17 L19 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.35" />
      <rect x="2.5" y="14.5" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="16.5" y="4.5" width="5" height="5" rx="1.5" fill="currentColor" />
    </svg>
  );
}
