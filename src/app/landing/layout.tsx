"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const landingNav = [
  { label: "Home", href: "/landing" },
  { label: "Pricing", href: "/landing/pricing" },
  { label: "About", href: "/landing/about" },
  { label: "Support", href: "/landing/support" },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-zinc-200 sticky top-0 z-40 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">E</span>
            </div>
            <span className="text-sm font-bold text-zinc-900 tracking-tight">ELION</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {landingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/audit"
              className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors"
            >
              Free Audit
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5 text-zinc-600" /> : <Menu className="w-5 h-5 text-zinc-600" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white">
            <div className="px-6 py-4 space-y-3">
              {landingNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block text-sm font-medium ${
                    pathname === item.href ? "text-zinc-900" : "text-zinc-500"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/audit"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-2.5 bg-zinc-900 text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors"
              >
                Free Audit
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">E</span>
                </div>
                <span className="text-sm font-bold text-zinc-900">ELION</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                business automation for SMEs in Nigeria and beyond.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/landing" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">Home</Link>
                <Link href="/landing/pricing" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</Link>
                <Link href="/demo" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">Demo</Link>
                <Link href="/audit" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">Free Audit</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">Company</h4>
              <div className="space-y-2">
                <Link href="/landing/about" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">About</Link>
                <Link href="/landing/support" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">Support</Link>
                <Link href="/landing/privacy" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">Privacy Policy</Link>
                <Link href="/landing/terms" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">Terms of Service</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">Contact</h4>
              <div className="space-y-2">
                <a href="mailto:hello@elion.ng" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">hello@elion.ng</a>
                <a href="https://wa.me/2348012345678" target="_blank" rel="noopener noreferrer" className="block text-xs text-zinc-500 hover:text-zinc-900 transition-colors">WhatsApp</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-xs text-zinc-400">&copy; {new Date().getFullYear()} ELION. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
