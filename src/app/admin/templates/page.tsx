"use client";
import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import Link from "next/link";
import { Zap, Users, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  status: string;
  clients_using: number;
  required_integrations: string[];
  required_credentials: string[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/automations")
      .then(r => r.json())
      .then(d => {
        const map = new Map<string, Template>();
        (d.automations || []).forEach((a: Record<string, unknown>) => {
          const wt = a.workflow_templates as Record<string, unknown>;
          if (wt && !map.has(wt.id as string)) {
            map.set(wt.id as string, {
              id: wt.id as string,
              name: wt.name as string,
              category: wt.category as string,
              description: wt.description as string,
              version: "1.0",
              status: "active",
              clients_using: 0,
              required_integrations: (wt.required_integrations as string[]) || [],
              required_credentials: [],
            });
          }
        });
        setTemplates(Array.from(map.values()));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Automation Templates</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{loading ? "Loading..." : `${templates.length} templates registered`}</p>
          </div>
          <Link href="/admin/templates/editor" className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-all">
            Edit Document Templates <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <Zap className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-muted)]">No templates found. Run the migration to seed templates.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-accent)]/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Version {t.version} · {t.category.replace(/_/g, " ")}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-semibold ${t.status === "active" ? "text-emerald-400 bg-emerald-400/10" : "text-gray-400 bg-gray-400/10"}`}>{t.status}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">{t.description}</p>
                <div className="space-y-2 text-xs">
                  {t.required_integrations?.length > 0 && (
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <CheckCircle className="w-3 h-3" />
                      <span>{t.required_integrations.length} integrations needed: {t.required_integrations.join(", ")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                    <Users className="w-3 h-3" />
                    <span>{t.clients_using} client{t.clients_using !== 1 ? "s" : ""} using this template</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}