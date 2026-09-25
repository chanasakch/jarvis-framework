import type { CSSProperties } from "react";

/** Stagger index for a `.reveal` child, capped so a long list never waits more than a moment.
 *  A plain module, not part of components/ui/reveal.tsx: that file is a client component, and
 *  a server component cannot call a function exported from one. */
export const stagger = (i: number, cap = 10) => ({ "--i": Math.min(i, cap) }) as CSSProperties;
