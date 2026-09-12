"use client";

import dynamic from "next/dynamic";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/home/hero";

// Keep the initial page focused on diagnosis, evidence, and the next action.
const ProblemSection = dynamic(() => import("@/components/homepage-sections").then((m) => m.ProblemSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const AuditDeliverable = dynamic(() => import("@/components/homepage-sections").then((m) => m.AuditDeliverable), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const FindingsSection = dynamic(() => import("@/components/homepage-sections").then((m) => m.FindingsSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const SystemMap = dynamic(() => import("@/components/homepage-sections").then((m) => m.SystemMap), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const OwnershipSection = dynamic(() => import("@/components/homepage-sections").then((m) => m.OwnershipSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const FinalCta = dynamic(() => import("@/components/homepage-sections").then((m) => m.FinalCta), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <a href="#main" className="skip-to-content">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <ProblemSection />
        <AuditDeliverable />
        <FindingsSection />
        <SystemMap />
        <OwnershipSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
