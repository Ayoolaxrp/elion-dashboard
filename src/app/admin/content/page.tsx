"use client";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Loader2, CheckCircle2, XCircle, FileText } from "lucide-react";

type ContentItem = {
  id: string;
  source_event: string;
  topic: string;
  angle: string;
  hook: string;
  linkedin: string;
  x_post: string;
  instagram_caption: string;
  carousel_slides: string[];
  reel_script: string;
  cta: string;
  evidence_sources: string[];
  status: string;
  approved_by?: string | null;
  updated_at: string;
  blog?: string | null;
  email?: string | null;
  script?: string | null;
  product_idea?: string | null;
};

const TEMPLATE_TYPES = [
    { key: "linkedin", label: "LinkedIn post", fields: ["LinkedIn post", "linkedin"] },
    { key: "x", label: "X thread", fields: ["X thread", "x_post"] },
    { key: "blog", label: "Blog article", fields: ["Blog article", "blog"] },
    { key: "email", label: "Email draft", fields: ["Email draft", "email"] },
    { key: "script", label: "Video script", fields: ["Video script", "script"] },
    { key: "product", label: "Product improvement", fields: ["Product improvement", "product_idea"] },
  ] as const;

export default function ContentStudioPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/content");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || "Could not load Content Studio");
    else setItems(body.items || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const transition = async (id: string, status: "approved" | "rejected") => {
    await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, rejection_reason: status === "rejected" ? "Rejected during founder review" : undefined }),
    });
    void load();
  };

  return <div className="flex min-h-screen bg-[var(--color-surface)]">
    <AdminSidebar />
    <main className="flex-1 p-5 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Content Studio</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Real ELION events → structured drafts → founder approval. Nothing publishes automatically.</p>
        </div>
        {loading && <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />}
        {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">{error}. Apply migration <code>034_content_studio.sql</code> before using this queue.</div>}
        {!loading && !error && items.length === 0 && <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-10 text-center"><FileText className="mx-auto mb-3 text-[var(--color-text-muted)]" /><p className="text-sm text-[var(--color-text-muted)]">No content drafts yet.</p></div>}
        <div className="space-y-4">
          {items.map((item) => <article key={item.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs uppercase tracking-wider text-[var(--color-accent)]">{item.status}</p><h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{item.topic}</h2><p className="text-xs text-[var(--color-text-muted)]">Source: {item.source_event} · {item.angle}</p></div>
              <div className="flex gap-2">
                {item.status === "review" && <><button onClick={() => transition(item.id, "approved")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button><button onClick={() => transition(item.id, "rejected")} className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300"><XCircle className="w-3.5 h-3.5" /> Reject</button></>}
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--color-text-primary)]">{item.hook}</p>
            <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Drafts</div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-[10px] uppercase text-[var(--color-text-muted)]">LinkedIn post</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{item.linkedin || "No draft yet"}</p></div>
            <div><p className="text-[10px] uppercase text-[var(--color-text-muted)]">X thread</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{item.x_post || "No draft yet"}</p></div>
            <div><p className="text-[10px] uppercase text-[var(--color-text-muted)]">Blog article</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{item.blog || "No draft yet"}</p></div>
            <div><p className="text-[10px] uppercase text-[var(--color-text-muted)]">Email draft</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{item.email || "No draft yet"}</p></div>
            <div><p className="text-[10px] uppercase text-[var(--color-text-muted)]">Video script</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{item.script || "No draft yet"}</p></div>
            <div><p className="text-[10px] uppercase text-[var(--color-text-muted)]">Product improvement</p><p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{item.product_idea || "No draft yet"}</p></div>
          </div>
        </div>
            <div className="mt-4 border-t border-[var(--color-border)] pt-3"><p className="text-[10px] uppercase text-[var(--color-text-muted)]">Evidence sources</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.evidence_sources?.join(" · ") || "None recorded"}</p></div>
          </article>)}
        </div>
      </div>
    </main>
  </div>;
}
