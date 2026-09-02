"use client";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import Link from "next/link";
import {
  FileText, Shield, CreditCard, Mail, Settings, Handshake,
  Send, Eye, CheckCircle, Clock, ArrowLeft, Loader2, ExternalLink, Copy, ChevronDown, ChevronUp
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

const mockPipelines: ClientPipeline[] = [
  {
    id: "client_001",
    company: "ABC Properties",
    contact: "Adebayo Okonkwo",
    email: "adebayo@abcproperties.ng",
    current_stage: "thankyou",
    documents: [
      { type: "proposal", status: "accepted", sent_at: "2026-08-16", viewed_at: "2026-08-16" },
      { type: "contract", status: "signed", sent_at: "2026-08-21", viewed_at: "2026-08-21" },
      { type: "invoice", status: "paid", sent_at: "2026-08-22", viewed_at: "2026-08-22" },
      { type: "welcome", status: "completed", sent_at: "2026-08-23", viewed_at: "2026-08-23" },
      { type: "portal", status: "completed", sent_at: "2026-08-24", viewed_at: "2026-08-25" },
      { type: "thankyou", status: "completed", sent_at: "2026-09-01", viewed_at: "2026-09-01" },
    ],
  },
  {
    id: "client_002",
    company: "Fresh Ventures",
    contact: "Tunde Bakare",
    email: "tunde@freshventures.ng",
    current_stage: "invoice",
    documents: [
      { type: "proposal", status: "accepted", sent_at: "2026-08-25", viewed_at: "2026-08-25" },
      { type: "contract", status: "signed", sent_at: "2026-08-27", viewed_at: "2026-08-27" },
      { type: "invoice", status: "sent", sent_at: "2026-08-28", viewed_at: null },
      { type: "welcome", status: "not_started", sent_at: null, viewed_at: null },
      { type: "portal", status: "not_started", sent_at: null, viewed_at: null },
      { type: "thankyou", status: "not_started", sent_at: null, viewed_at: null },
    ],
  },
  {
    id: "client_003",
    company: "Chidi & Sons",
    contact: "Chidi Nwosu",
    email: "chidi@chidiandsons.ng",
    current_stage: "proposal",
    documents: [
      { type: "proposal", status: "draft", sent_at: null, viewed_at: null },
      { type: "contract", status: "not_started", sent_at: null, viewed_at: null },
      { type: "invoice", status: "not_started", sent_at: null, viewed_at: null },
      { type: "welcome", status: "not_started", sent_at: null, viewed_at: null },
      { type: "portal", status: "not_started", sent_at: null, viewed_at: null },
      { type: "thankyou", status: "not_started", sent_at: null, viewed_at: null },
    ],
  },
  {
    id: "client_004",
    company: "Dewdrops Hotel",
    contact: "Ngozi Eze",
    email: "ngozi@dewdropshotel.ng",
    current_stage: "proposal",
    documents: [
      { type: "proposal", status: "not_started", sent_at: null, viewed_at: null },
      { type: "contract", status: "not_started", sent_at: null, viewed_at: null },
      { type: "invoice", status: "not_started", sent_at: null, viewed_at: null },
      { type: "welcome", status: "not_started", sent_at: null, viewed_at: null },
      { type: "portal", status: "not_started", sent_at: null, viewed_at: null },
      { type: "thankyou", status: "not_started", sent_at: null, viewed_at: null },
    ],
  },
];

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

export default function AdminDocumentsPage() {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ clientId: string; docType: string } | null>(null);

  const handleSend = async (clientId: string, docType: string) => {
    setSending(`${clientId}-${docType}`);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    setSending(null);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
              Document Pipeline
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Generate, send, and track the 6 onboarding documents for each client.
            </p>
          </div>

          {/* System Overview */}
          <div className="mb-8 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-3">The 6-Document System</p>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((doc, i) => (
                <span key={doc.key} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  {i + 1}. {doc.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-3 italic">
              "Nothing else changes between a $2k project and a $12k project."
            </p>
          </div>

          {/* Client Pipelines */}
          <div className="space-y-4">
            {mockPipelines.map(client => {
              const isExpanded = expandedClient === client.id;
              const completedCount = client.documents.filter(d => ["accepted", "signed", "paid", "completed"].includes(d.status)).length;
              const progress = (completedCount / 6) * 100;

              return (
                <div key={client.id} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                  {/* Client Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-[var(--color-surface-elevated)] transition-colors"
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
                    <div className="border-t border-[var(--color-border)] p-5">
                      {/* Pipeline Visual */}
                      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
                        {DOC_TYPES.map((doc, i) => {
                          const docData = client.documents.find(d => d.type === doc.key);
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
                          const docData = client.documents.find(d => d.type === doc.key);
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
