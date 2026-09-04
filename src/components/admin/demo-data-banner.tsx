import { Info } from "lucide-react";

/**
 * Marks sections backed by the hardcoded mock-lifecycle dataset as
 * illustrative, so they are never mistaken for live production records.
 */
export function DemoDataBanner({ text }: { text?: string }) {
  return (
    <div className="mb-6 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20">
      <Info className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {text || "Illustrative demo data — these records are sample data from the onboarding journey demo, not live production records."}
      </p>
    </div>
  );
}