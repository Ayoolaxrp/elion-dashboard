import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing & Plans",
  description:
    "ELION pricing: Starter NGN 100,000, Growth NGN 350,000 and Scale NGN 750,000 one-time implementation, with optional monthly support. Find the plan for your business.",
  alternates: { canonical: "/landing/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
