import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  // /landing was the pre-redesign homepage. The canonical public homepage
  // is now /. Redirect here rather than into the ad-only funnel.
  redirect("/");
}
