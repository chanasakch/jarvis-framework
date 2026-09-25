"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element is on screen. `inView` follows the element in and out;
 * `seen` turns true the first time it appears and stays true, which is what a
 * reveal-on-scroll animation needs (play once, when the reader can actually see it).
 *
 * Both start `false`, so server output and the first client render match. Consumers that
 * animate on `seen` must render a fully visible static state before it flips, so the
 * content is still readable without JavaScript.
 */
export function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView, seen };
}
