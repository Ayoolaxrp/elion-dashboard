"use client";

import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import { UtmTracker } from "@/components/utm-tracker";

const navLinks = [
  { label: "Home", href: "/landing" },
  { label: "Audit", href: "/landing/audit" },
  { label: "Lead Response", href: "/landing/leads" },
  { label: "Follow-Up", href: "/landing/followup" },
  { label: "Recovery", href: "/landing/recovery" },
  { label: "Booking", href: "/landing/booking" },
  { label: "Pricing", href: "/landing/pricing" },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <UtmTracker />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold">Elion</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a href="#audit" className="hidden sm:inline-flex px-5 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors">Free Audit</a>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-zinc-400 hover:text-white cursor-pointer" aria-label="Toggle menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 hover:text-white transition-colors py-2">{link.label}</Link>
              ))}
              <a href="#audit" onClick={() => setMobileOpen(false)} className="block w-full text-center px-5 py-2.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors mt-2">Free Audit</a>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
                <span className="text-lg font-bold">Elion</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">AI-powered business automation for companies in Nigeria and beyond.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Services</h4>
              <div className="space-y-2">
                <Link href="/landing/audit" className="block text-sm text-zinc-500 hover:text-white transition-colors">Automation Audit</Link>
                <Link href="/landing/leads" className="block text-sm text-zinc-500 hover:text-white transition-colors">Lead Response</Link>
                <Link href="/landing/followup" className="block text-sm text-zinc-500 hover:text-white transition-colors">Follow-Up Engine</Link>
                <Link href="/landing/recovery" className="block text-sm text-zinc-500 hover:text-white transition-colors">Revenue Recovery</Link>
                <Link href="/landing/booking" className="block text-sm text-zinc-500 hover:text-white transition-colors">Booking Engine</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <div className="space-y-2">
                <Link href="/landing/about" className="block text-sm text-zinc-500 hover:text-white transition-colors">About</Link>
                <Link href="/landing/pricing" className="block text-sm text-zinc-500 hover:text-white transition-colors">Pricing</Link>
                <Link href="/demo" className="block text-sm text-zinc-500 hover:text-white transition-colors">Demo</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <div className="space-y-2">
                <Link href="/landing/terms" className="block text-sm text-zinc-500 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/landing/privacy" className="block text-sm text-zinc-500 hover:text-white transition-colors">Privacy Policy</Link>
                <a href="mailto:hello@elion.ng" className="block text-sm text-zinc-500 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">&copy; 2026 Elion. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <Link href="/landing/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
              <Link href="/landing/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
              <a href="mailto:hello@elion.ng" className="hover:text-zinc-400 transition-colors">hello@elion.ng</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
