import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import DemoExperience from "@/components/demo-experience";

export const metadata: Metadata = {
  title: "Demo : See ELION in Action",
  description:
    "Watch how ELION handles an incoming lead end-to-end: capture, qualification, response, booking and follow-up. Simulated with sample data.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Global ELION header */}
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <DemoExperience ctaHref="/audit" />
      </main>
      <SiteFooter />
    </div>
  );
}
