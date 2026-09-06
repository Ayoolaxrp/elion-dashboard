import type { Metadata } from "next";
import { LandingShell } from "@/components/landing-shell";
import AboutPage from "@/app/landing/about/page";

export const metadata: Metadata = {
  title: "About",
  description:
    "ELION builds AI operations systems for growing businesses: audit first, then automate the leaks in lead response, follow-up, booking and operations.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <LandingShell>
      <AboutPage />
    </LandingShell>
  );
}
