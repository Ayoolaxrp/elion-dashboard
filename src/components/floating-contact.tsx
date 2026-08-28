"use client";

import { useState } from "react";
import { Phone, X, MessageSquare, Mail } from "lucide-react";

export function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 w-64 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Contact Us</h4>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <a
              href="https://wa.me/2348012345678?text=Hi%20Elion%2C%20I%27m%20interested%20in%20your%20automation%20services"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href="mailto:hello@elion.ng?subject=Automation%20Inquiry"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
            <a
              href="tel:+2348012345678"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
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
