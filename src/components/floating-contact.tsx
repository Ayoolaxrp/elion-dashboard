"use client";

import { useState } from "react";
import { Phone, X, MessageSquare, Mail } from "lucide-react";

export function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 bg-[var(--color-accent)] border border-[var(--color-border)] rounded-lg shadow-xl p-4 w-64 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Contact Us</h4>
            <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <a
              href="/funnel#audit"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-success)]/10 border border-emerald-500/20 text-[var(--color-success)] text-sm font-medium hover:bg-[var(--color-success)]/100/20 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href="/funnel#audit"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
            <a
              href="/funnel#audit"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="floating-contact"
        aria-label="Contact us"
      >
        {open ? <X className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
      </button>
    </div>
  );
}
