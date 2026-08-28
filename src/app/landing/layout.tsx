import Link from "next/link";
import { Zap } from "lucide-react";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold">Elion</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <Link href="/landing" className="hover:text-white transition-colors">Home</Link>
            <Link href="/landing/audit" className="hover:text-white transition-colors">Audit</Link>
            <Link href="/landing/leads" className="hover:text-white transition-colors">Lead Response</Link>
            <Link href="/landing/followup" className="hover:text-white transition-colors">Follow-Up</Link>
            <Link href="/landing/recovery" className="hover:text-white transition-colors">Recovery</Link>
            <Link href="/landing/booking" className="hover:text-white transition-colors">Booking</Link>
            <Link href="/landing/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <a href="#audit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Free Audit</a>
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </div>
  );
}
