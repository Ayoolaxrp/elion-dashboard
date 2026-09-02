"use client";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ArrowLeft, Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Integration {
  id: string;
  client: string;
  type: string;
  status: "connected" | "needs_attention" | "not_connected" | "failed";
  lastVerified: string;
  error?: string;
}

const integrations: Integration[] = [
  {
    id: "int_001",
    client: "ABC Properties",
    type: "WhatsApp",
    status: "connected",
    lastVerified: "2026-08-30 14:22",
  },
  {
    id: "int_002",
    client: "ABC Properties",
    type: "Email",
    status: "connected",
    lastVerified: "2026-08-30 14:20",
  },
  {
    id: "int_003",
    client: "ABC Properties",
    type: "Calendar",
    status: "connected",
    lastVerified: "2026-08-30 13:45",
  },
  {
    id: "int_004",
    client: "Fresh Ventures",
    type: "WhatsApp",
    status: "needs_attention",
    lastVerified: "2026-08-29 11:00",
    error: "Token expiring soon",
  },
  {
    id: "int_005",
    client: "Fresh Ventures",
    type: "Email",
    status: "connected",
    lastVerified: "2026-08-30 10:15",
  },
  {
    id: "int_006",
    client: "Fresh Ventures",
    type: "Calendar",
    status: "not_connected",
    lastVerified: "Never",
  },
  {
    id: "int_007",
    client: "Chidi & Sons",
    type: "WhatsApp",
    status: "not_connected",
    lastVerified: "Never",
  },
  {
    id: "int_008",
    client: "Chidi & Sons",
    type: "Email",
    status: "failed",
    lastVerified: "2026-08-25 09:30",
    error: "SMTP authentication failed",
  },
  {
    id: "int_009",
    client: "Dewdrops Hotel",
    type: "WhatsApp",
    status: "not_connected",
    lastVerified: "Never",
  },
  {
    id: "int_010",
    client: "Dewdrops Hotel",
    type: "Email",
    status: "connected",
    lastVerified: "2026-08-30 08:00",
  },
];

export default function IntegrationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? integrations
      : integrations.filter((i) => i.status === statusFilter);

  const statusColor = (s: string) => {
    switch (s) {
      case "connected":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "needs_attention":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "not_connected":
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "";
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-400" />;
      case "needs_attention":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "not_connected":
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      case "failed":
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0D14]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>

          <h1 className="text-3xl font-bold mb-2">Integration Health</h1>
          <p className="text-gray-400 mb-8">
            Monitor the status of all client integrations.
          </p>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Connected",
                count: integrations.filter((i) => i.status === "connected").length,
                color: "text-green-400",
              },
              {
                label: "Needs Attention",
                count: integrations.filter((i) => i.status === "needs_attention").length,
                color: "text-amber-400",
              },
              {
                label: "Not Connected",
                count: integrations.filter((i) => i.status === "not_connected").length,
                color: "text-gray-400",
              },
              {
                label: "Failed",
                count: integrations.filter((i) => i.status === "failed").length,
                color: "text-red-400",
              },
            ].map((s) => (
              <div key={s.label} className="bg-[#11161F] rounded-xl p-4 border border-gray-800">
                <p className="text-sm text-gray-400">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6">
            {["all", "connected", "needs_attention", "not_connected", "failed"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  statusFilter === f
                    ? "bg-[#4F7CFF] text-white"
                    : "bg-[#11161F] text-gray-400 hover:text-white"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-[#11161F] rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Client</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Integration</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Last Verified</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Error</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((int) => (
                  <tr key={int.id} className="border-b border-gray-800/50 hover:bg-[#161C27]">
                    <td className="p-4 text-sm text-white font-medium">{int.client}</td>
                    <td className="p-4 text-sm text-gray-300">{int.type}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusColor(int.status)}`}
                      >
                        {statusIcon(int.status)}
                        {int.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{int.lastVerified}</td>
                    <td className="p-4 text-sm text-red-400">{int.error || "-"}</td>
                    <td className="p-4">
                      <button className="text-sm text-[#4F7CFF] hover:text-[#3B66E8] flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
