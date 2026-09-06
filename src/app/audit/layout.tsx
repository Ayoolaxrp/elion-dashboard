import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Business Audit",
  description:
    "Enter your business website and ELION will analyze your public customer journey, surface operational leaks, and recommend the automation systems that fix them. Free, evidence-based, no credit card required.",
  alternates: { canonical: "/audit" },
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
