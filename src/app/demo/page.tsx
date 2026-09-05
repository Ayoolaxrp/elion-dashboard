import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DemoExperience from "@/components/demo-experience";

export const metadata: Metadata = {
  title: "Demo : See ELION in Action",
  description:
    "Watch how ELION handles an incoming lead end-to-end: capture, qualification, response, booking and follow-up. Simulated with sample data.",
  alternates: { canonical: "/demo" },
};

const nav = [
  { label: "Home", href: "/" },
  { label: "Audit", href: "/audit" },
  { label: "Pricing", href: "/landing/pricing" },
  { label: "About", href: "/landing/about" },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Glass nav */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="ELION home">
            <Image src="/brand/elion-e-icon.svg" alt="" width={28} height={28} priority />
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
                {item.label}
              </Link>
            ))}
            <span className="text-[var(--color-accent)] font-medium text-sm">Demo</span>
          </div>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.97]"
          >
            Run Free Audit
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <DemoExperience ctaHref="/audit" />
      </main>
    </div>
  );
}
