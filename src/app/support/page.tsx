import type { Metadata } from "next";
import { LandingShell } from "@/components/landing-shell";
import SupportPage from "@/app/landing/support/page";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with ELION: instant answers from the AI support assistant, business hours, or send the team a message and we reply within 24 hours on business days.",
  alternates: { canonical: "/support" },
};

export default function Support() {
  return (
    <LandingShell>
      <SupportPage />
    </LandingShell>
  );
}
