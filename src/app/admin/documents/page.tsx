"use client";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import Link from "next/link";
import {
  FileText, Shield, CreditCard, Mail, Settings, Handshake,
  Send, Eye, CheckCircle, ArrowLeft, Loader2, ExternalLink, Copy, ChevronDown, ChevronUp
} from "lucide-react";

const DOC_TYPES = [
  { key: "proposal", label: "Proposal", icon: FileText, color: "#3B66E8", description: "Scope, deliverables, pricing" },
  { key: "contract", label: "Contract", icon: Shield, color: "#8B5CF6", description: "Agreement and terms" },
  { key: "invoice", label: "Invoice", icon: CreditCard, color: "#F59E0B", description: "Payment request" },
  { key: "welcome", label: "Welcome Doc", icon: Mail, color: "#10B981", description: "Sets expectations" },
  { key: "portal", label: "Client Portal", icon: Settings, color: "#00D4FF", description: "Where everything lives" },
  { key: "thankyou", label: "Thank You", icon: Handshake, color: "#10B981", description: "Completion and handover" },
];

interface ClientPipeline {
  id: string;
  company: string;
  contact: string;
  email: string;
  current_stage: string;
  documents: {
    type: string;
    status: "not_started" | "draft" | "sent" | "viewed" | "accepted" | "signed" | "paid" | "completed";
    sent_at: string | null;
    viewed_at: string | null;
  }[];
}

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  not_started: { color: "text-gray-500", label: "Not Started", bg: "bg-gray-500/10 border border-gray-500/20" },
  draft: { color: "text-amber-400", label: "Draft", bg: "bg-amber-400/10 border border-amber-500/20" },
  sent: { color: "text-blue-400", label: "Sent", bg: "bg-blue-400/10 border border-blue-500/20" },
  viewed: { color: "text-purple-400", label: "Viewed", bg: "bg-purple-400/10 border border-purple-500/20" },
  accepted: { color: "text-emerald-400", label: "Accepted", bg: "bg-emerald-400/10 border border-emerald-500/20" },
  signed: { color: "text-emerald-400", label: "Signed", bg: "bg-emerald-400/10 border border-emerald-500/20" },
  paid: { color: "text-emerald-400", label: "Paid", bg: "bg-emerald-400/10 border border-emerald-500/20" },
  completed: { color: "text-emerald-400", label: "Completed", bg: "bg-emerald-400/10 border border-emerald-500/20" },
};

type PipelineDocument = ClientPipeline["documents"][number];
type Pipeline = Omit<ClientPipeline, "documents"> & { documents: PipelineDocument[] };

export default function AdminDocumentsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/documents")
      .then(r => r.json())
      .then(d => { setPipelines(d.pipelines || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSend = async (clientId: string, docType: string) => {
    setSending(`${clientId}-${docType}`);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, doc_type: docType }),
      });
      if (res.ok) {
        // Refresh pipelines
        const d = await fetch("/api/admin/documents").then(r => r.json());
        setPipelines(d.pipelines || []);
      }
    } catch {}
    setSending(null);
  };

  if (loading) return (
    <div className="workspace-page">
      <AdminSidebar />
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      </main>
    </div>
  );

  return (
    <div className="workspace-page">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="admin-content-gutter">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>

          <header className="workspace-header mb-8">
            <p className="workspace-kicker">Client delivery</p>
            <h1 className="page-title mt-3 text-[var(--color-text-primary)]">Document pipeline</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Generate, send, and track the six onboarding documents for each real client record.</p>
          </header>

          {/* System Overview */}
          <div className="mb-8 border-y border-[var(--color-border)] py-5">
            <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-3">The 6-Document System</p>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((doc, i) => (
                <span key={doc.key} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  {i + 1}. {doc.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-3 italic">
              &quot;Nothing else changes between a $2k project and a $12k project.&quot;
            </p>
          </div>

          {/* Client Pipelines */}
          <div className="space-y-0 border-y border-[var(--color-border)]">
            {pipelines.map(client => {
              const isExpanded = expandedClient === client.id;
              const completedCount = client.documents.filter((d) => ["accepted", "signed", "paid", "completed"].includes(d.status)).length;
              const progress = (completedCount / 6) * 100;

              return (
                <div key={client.id} className="border-b border-[var(--color-border)]/70 transition-colors last:border-0 hover:bg-[var(--color-surface-raised)]">
                  {/* Client Header */}
                  <div
                    className="cursor-pointer p-5 md:p-6"
                    onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-[var(--color-accent)]">{client.company.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{client.company}</h3>
                          <p className="text-xs text-[var(--color-text-muted)]">{client.contact} / {client.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-[var(--color-text-muted)]">{completedCount}/6 documents</p>
                          <div className="w-24 h-1.5 bg-[var(--color-surface)] rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-[var(--color-accent)] rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Document Pipeline */}
                  {isExpanded && (
                    <div className="border-t border-[var(--color-border)] p-5 md:p-6">
                      {/* Pipeline Visual */}
                      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
                        {DOC_TYPES.map((doc, i) => {
                          const docData = client.documents.find((d) => d.type === doc.key);
                          const isComplete = docData && ["accepted", "signed", "paid", "completed"].includes(docData.status);
                          const isActive = doc.key === client.current_stage;
                          return (
                            <div key={doc.key} className="flex items-center gap-1 shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? "bg-emerald-500/20 text-emerald-400" : isActive ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"}`}>
                                {isComplete ? <CheckCircle className="w-4 h-4" /> : i + 1}
                              </div>
                              {i < DOC_TYPES.length - 1 && <div className={`w-8 h-0.5 ${isComplete ? "bg-emerald-500/30" : "bg-[var(--color-border)]"}`} />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Document Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {DOC_TYPES.map(doc => {
                          const docData = client.documents.find((d) => d.type === doc.key);
                          const status = docData?.status || "not_started";
                          const sc = STATUS_CONFIG[status];
                          const Icon = doc.icon;
                          const isSending = sending === `${client.id}-${doc.key}`;

                          return (
                            <div key={doc.key} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border)]/80 transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${doc.color}15` }}>
                                    <Icon className="w-4 h-4" style={{ color: doc.color }} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{doc.label}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{doc.description}</p>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${sc.bg} ${sc.color}`}>
                                  {sc.label}
                                </span>
                              </div>

                              {/* Dates */}
                              {docData?.sent_at && (
                                <p className="text-xs text-[var(--color-text-muted)] mb-3">
                                  Sent: {new Date(docData.sent_at).toLocaleDateString("en-NG")}
                                  {docData.viewed_at && ` | Viewed: ${new Date(docData.viewed_at).toLocaleDateString("en-NG")}`}
                                </p>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2">
                                {status === "not_started" && (
                                  <button
                                    onClick={() => handleSend(client.id, doc.key)}
                                    disabled={isSending}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                                  >
                                    {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Generate & Send
                                  </button>
                                )}
                                {status === "draft" && (
                                  <>
                                    <button
                                      onClick={() => handleSend(client.id, doc.key)}
                                      disabled={isSending}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                                    >
                                      {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                      Send
                                    </button>
                                    <Link
                                      href={`/dashboard/documents/${doc.key}`}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-white transition-colors"
                                    >
                                      <Eye className="w-3 h-3" /> Preview
                                    </Link>
                                  </>
                                )}
                                {(status === "sent" || status === "viewed") && (
                                  <>
                                    <Link
                                      href={`/dashboard/documents/${doc.key}`}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-white transition-colors"
                                    >
                                      <Eye className="w-3 h-3" /> View
                                    </Link>
                                    <button
                                      onClick={() => handleSend(client.id, doc.key)}
                                      disabled={isSending}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-white transition-colors disabled:opacity-50"
                                    >
                                      <Send className="w-3 h-3" /> Resend
                                    </button>
                                  </>
                                )}
                                {["accepted", "signed", "paid", "completed"].includes(status) && (
                                  <Link
                                    href={`/dashboard/documents/${doc.key}`}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                                  >
                                    <CheckCircle className="w-3 h-3" /> View Completed
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Client Link */}
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                        >
                          View client details <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://elion.com.ng/dashboard/documents/proposal`);
                          }}
                          className="text-xs text-[var(--color-text-muted)] hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" /> Copy client link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
