import type { Metadata } from "next";
import HomePage from "./home";

export const metadata: Metadata = {
  title: {
    absolute: "ELION - Revenue Recovery & Business Automation for Nigerian Businesses",
  },
  description:
    "ELION finds the leaks in your business and automates them. Run a free business audit to see where you lose leads, then deploy automation systems for lead response, follow-up, booking and recovery.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HomePage />;
}
