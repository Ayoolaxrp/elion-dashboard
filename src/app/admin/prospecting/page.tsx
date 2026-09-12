"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";

type Candidate = {
  id: string;
  business_name: string;
  domain: string | null;
  preflight_status: string;
  qualification_state: string;
  industry?: string | null;
  location?: string | null;
};

const states = ["DISCOVERED", "VALIDATED", "AUDITED", "INVESTIGATE", "QUALIFIED", "REVIEWED", "APPROVED_FOR_OUTREACH", "REJECTED"];

export default function ProspectingPage() {
  const [csv, setCsv] = useState("business,website,industry,location\n");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadCandidates() {
    const response = await fetch("/api/admin/prospecting");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load prospects");
    setCandidates(body.candidates || []);
  }

  async function importCsv() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/prospecting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Import failed");
      setMessage(`${body.imported || 0} candidate(s) imported and preflighted.`);
      await loadCandidates();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateState(id: string, qualification_state: string) {
    const response = await fetch("/api/admin/prospecting", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, qualification_state }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error || "Could not update candidate");
      return;
    }
    setCandidates((current) => current.map((candidate) => candidate.id === id ? { ...candidate, qualification_state } : candidate));
  }

  return (
    <div className="workspace-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-5 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Zero-cost discovery</p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">Prospecting queue</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">Import an operator-verified batch, run SSRF-safe website preflight, then review candidates before any audit or outreach. Paid discovery providers are intentionally not connected.</p>
          </header>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
            <label htmlFor="prospect-csv" className="text-sm font-medium text-[var(--color-text-primary)]">CSV import</label>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Required columns: business and website. Optional: industry, location, source, source_url, source_record_id.</p>
            <textarea id="prospect-csv" value={csv} onChange={(event) => setCsv(event.target.value)} rows={7} className="mt-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-xs text-[var(--color-text-primary)]" />
            <div className="mt-3 flex items-center gap-3">
              <button type="button" onClick={importCsv} disabled={busy} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Checking…" : "Import and preflight"}</button>
              <button type="button" onClick={() => loadCandidates().catch((error) => setMessage(error.message))} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)]">Refresh queue</button>
              {message && <span className="text-xs text-[var(--color-text-muted)]" role="status">{message}</span>}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
            <div className="border-b border-[var(--color-border)] p-5"><h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Candidates</h2><p className="mt-1 text-xs text-[var(--color-text-muted)]">Only PASSED candidates may advance into audit/review, and outreach approval requires the REVIEWED state.</p></div>
            <div className="divide-y divide-[var(--color-border)]">
              {candidates.length === 0 ? <p className="p-5 text-sm text-[var(--color-text-muted)]">No candidates loaded.</p> : candidates.map((candidate) => (
                <div key={candidate.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div><p className="text-sm font-medium text-[var(--color-text-primary)]">{candidate.business_name}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{candidate.domain || "No domain"} · {candidate.industry || "Industry not set"} · {candidate.location || "Location not set"}</p></div>
                  <div className="text-xs"><span className="text-[var(--color-text-muted)]">Preflight:</span> <span className={candidate.preflight_status === "PASSED" ? "text-emerald-400" : "text-amber-400"}>{candidate.preflight_status}</span></div>
                  <label className="text-xs text-[var(--color-text-muted)]">State<select value={candidate.qualification_state} onChange={(event) => updateState(candidate.id, event.target.value)} className="ml-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)]">{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
