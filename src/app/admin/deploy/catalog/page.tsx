"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Rocket, AlertTriangle, CircleDollarSign, ExternalLink } from "lucide-react";
import {
  PRODUCT_CATALOG, PRODUCT_CATEGORY_LABELS,
  fmtNgn, ProductCategory, ProductDefinition,
} from "@/lib/products";

const CATEGORY_ORDER: ProductCategory[] = ["communication", "sales", "booking", "revenue", "operations"];

export default function AdminCatalogPage() {
  const [filter, setFilter] = useState<string>("all");

  const products = useMemo(() => {
    return PRODUCT_CATALOG.filter((p) => filter === "all" || p.category === filter);
  }, [filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: PRODUCT_CATALOG.length };
    for (const cat of CATEGORY_ORDER) c[cat] = PRODUCT_CATALOG.filter((p) => p.category === cat).length;
    return c;
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>System catalog</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Every deployable ELION system. Each defines its own required configuration, ELION fees and third-party infrastructure.</p>
          </div>
          <Link href="/admin/deploy" className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all">
            <Rocket className="w-3.5 h-3.5" /> New deployment
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilter("all")} className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer " + (filter === "all" ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "border-[var(--color-border)]/60 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]")}>
            All ({counts.all})
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer " + (filter === cat ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "border-[var(--color-border)]/60 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]")}>
              {PRODUCT_CATEGORY_LABELS[cat]} ({counts[cat]})
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-amber-400/5 border border-amber-400/15 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <p className="font-semibold text-amber-400 mb-1">About third-party infrastructure</p>
          <p>Where a system requires a third-party provider (WhatsApp/Meta, voice AI, AI models, calendars, email), provider charges are separate from ELION fees and billed by the provider — directly to the client or via ELION at cost. Prices shown are configurable and never treated as provider quotes.</p>
        </div>
      </main>
    </div>
  );
}

function ProductCard({ p }: { p: ProductDefinition }) {
  const [open, setOpen] = useState(false);
  const infraRequired = p.infrastructure.items.filter((i) => i.required);
  const configCount = p.config_groups.reduce((s, g) => s + g.fields.length, 0);
  const requiredConfig = p.config_groups.reduce((s, g) => s + g.fields.filter((f) => f.required).length, 0);

  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/60 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-5 hover:bg-[var(--color-surface)]/40 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{p.name}</h3>
              <span className={"px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider " + (p.kind === "agent" ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]/50")}>
                {p.kind === "agent" ? "AI Agent" : "Automation"}
              </span>
              <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">{PRODUCT_CATEGORY_LABELS[p.category]}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed max-w-md">{p.tagline}</p>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">v{p.version.replace("v", "")}</span>
        </div>

        <div className="flex items-center gap-2 mt-3 text-[10px] flex-wrap">
          <span className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)]/50 text-[var(--color-text-secondary)]">
            ELION · {fmtNgn(p.pricing.setup_fee)} setup
          </span>
          <span className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)]/50 text-[var(--color-text-secondary)]">
            {fmtNgn(p.pricing.monthly_fee)}/mo
          </span>
          {p.pricing.third_party_required && (
            <span className="px-2 py-1 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
              {infraRequired.length} required third-party
            </span>
          )}
          <span className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)]/50 text-[var(--color-text-secondary)]">
            {configCount} config fields ({requiredConfig} required)
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)]/40 px-5 py-4 space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{p.description}</p>

          {p.infrastructure.items.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] font-semibold mb-1.5">Required infrastructure</p>
              <div className="space-y-1.5">
                {p.infrastructure.items.map((item) => (
                  <div key={item.provider} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.required ? (
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      ) : (
                        <CircleDollarSign className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                      )}
                      <span className="text-[var(--color-text-secondary)] truncate">{item.provider}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline">{item.purpose}</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                      {item.billing_type === "client_pays_directly" ? "Client pays provider" : "Via ELION at cost"}{item.usage_based ? " · usage" : ""}
                    </span>
                  </div>
                ))}
              </div>
              {p.infrastructure.notes.length > 0 && (
                <p className="text-[10px] text-[var(--color-text-muted)] italic mt-1.5">{p.infrastructure.notes[0]}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[var(--color-text-muted)]">{p.clients_using} client{p.clients_using === 1 ? "" : "s"} using this system</span>
            <Link href="/admin/deploy" className="text-[11px] text-[var(--color-accent)] hover:underline inline-flex items-center gap-1">Deploy for a client <ExternalLink className="w-3 h-3" /></Link>
          </div>
        </div>
      )}
    </div>
  );
}
