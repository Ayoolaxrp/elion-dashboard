import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCatalog } from "@/components/products/product-catalog";

export const metadata: Metadata = {
  title: "AI Employees & Automation Systems",
  description:
    "ELION packages its automation capabilities as AI employees: Lead Response, Follow-Up, Booking, Revenue Recovery, Operations, AI Receptionist, and AI Sales Agent. Each is scoped, priced, and deployed around how your business actually works.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <a href="#main" className="skip-to-content">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <ProductCatalog />
      </main>
      <SiteFooter />
    </div>
  );
}
