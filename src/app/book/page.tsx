import type { Metadata } from "next";
import { LandingShell } from "@/components/landing-shell";
import BookPage from "@/app/landing/book/page";

export const metadata: Metadata = {
  title: "Book a Discovery Call",
  description:
    "Pick a time on ELION's live calendar for a strategy call. Real availability from Google Calendar with automatic Google Meet confirmation.",
  alternates: { canonical: "/book" },
};

export default function Book() {
  return (
    <LandingShell>
      <BookPage />
    </LandingShell>
  );
}
