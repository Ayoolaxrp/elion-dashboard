/**
 * ELION layered environment backdrop.
 *
 * Pure-CSS decorative field (no hooks, no JS): a faint operational grid,
 * two radial light sources and a fine scanline texture. Shared by the hero
 * (top of the page) and the final CTA so the visual story forms a loop —
 * ENTER -> DESCEND -> EXPLORE -> RETURN. Cheap to paint: gradients + masks
 * only, no filters, no layout animation.
 */

export function EnvBackdrop({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Deep atmosphere */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[560px] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(59,102,232,0.16), transparent 72%)" }}
      />
      <div
        className="absolute top-24 right-[8%] w-[340px] h-[340px] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(0,212,255,0.10), transparent 72%)" }}
      />
      {/* Operational grid */}
      <div className="env-grid absolute inset-0" />
      {/* Horizon light */}
      <div
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[1200px] h-[380px]"
        style={{ background: "radial-gradient(ellipse closest-side, rgba(0,212,255,0.06), transparent 72%)" }}
      />
    </div>
  );
}

/** Thin double-ring + satellite dot motif, used as a foreground depth element. */
export function EnvRingMotif({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      <div className="relative w-full h-full animate-ring-drift">
        <div className="absolute inset-0 rounded-full border border-[rgba(124,155,255,0.14)]" />
        <div
          className="absolute inset-[18%] rounded-full border border-dashed border-[rgba(0,212,255,0.12)]"
        />
        <span className="absolute -top-[3px] left-1/2 w-1.5 h-1.5 -translate-x-1/2 rounded-full bg-[var(--color-accent-cyan)]/50" />
      </div>
    </div>
  );
}
