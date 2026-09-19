"use client";

import { useEffect, useState } from "react";

/** SSR-safe: starts `false` (matches server output) and updates on mount, so hydration
 *  never mismatches. Consumers that must render differently for reduced motion should
 *  treat the first render as "motion allowed" and adjust after mount. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Same justified case as components/theme/theme-toggle.tsx: reading a client-only
    // media query on mount, not modeling an external subscription's steady state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mql.matches);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
