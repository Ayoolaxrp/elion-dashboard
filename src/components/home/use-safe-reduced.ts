"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Safe reduced-motion flag for *structural* branches.
 *
 * `useReducedMotion()` resolves synchronously on the client, so a markup
 * branch on it (e.g. rendering a static list instead of a sticky story)
 * would produce server HTML that differs from the first client render —
 * a React hydration error for reduced-motion users.
 *
 * This hook reports `false` until after mount (matching the SSR render) and
 * only then flips to the real preference, so structural branches swap in a
 * clean post-hydration re-render. Animation-only branches can keep using
 * `useReducedMotion()` directly.
 */
export function useSafeReduced(): boolean {
  const prefersReduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return Boolean(prefersReduced) && ready;
}
