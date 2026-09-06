import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Leak Finder",
  description:
    "Answer a few questions about your business and ELION will map your enquiry-to-customer flow, show where leads leak, and recommend the automation systems to fix them.",
  alternates: { canonical: "/funnel" },
};

export default function FunnelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
