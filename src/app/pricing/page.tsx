import type { Metadata } from "next";
import { LandingShell } from "@/components/landing-shell";
import PricingPage from "@/app/landing/pricing/page";

export const metadata: Metadata = {
  title: "Pricing & Plans",
  description:
    "ELION pricing: Starter NGN 100,000, Growth NGN 350,000 and Scale NGN 750,000 one-time implementation, with optional monthly support. Find the plan for your business.",
  alternates: { canonical: "/pricing" },
};

export default function Pricing() {
  return (
    <LandingShell>
      <PricingPage />
    </LandingShell>
  );
}
