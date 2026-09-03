"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Thin premium scroll-progress bar pinned to the top of the viewport.
 * Uses a passive scroll listener throttled to the animation frame;
 * writes only transform (compositor-friendly), no layout shift.
 * Reduced-motion: bar remains functional but updates instantly, no easing.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Mounted client-side only (SSR renders nothing to avoid hydration shift)
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = barRef.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      el.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] h-[2px] pointer-events-none"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left will-change-transform"
        style={{
          background:
            "linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-cyan) 100%)",
          transform: "scaleX(0)",
        }}
      />
    </div>
  );
}