import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";

export function LegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <LandingNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}