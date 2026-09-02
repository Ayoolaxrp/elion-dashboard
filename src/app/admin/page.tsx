"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import {
  Users, AlertTriangle, Clock, CheckCircle, XCircle, Settings, Activity, FileText, CreditCard, Handshake, TrendingUp, ArrowRight, Wrench, Eye, Pause, Shield, BarChart3, Layers
} from "lucide-react";
import { allClients as clients } from "@/lib/mock-lifecycle";
import { adminAutomations as clientAutomations } from "@/lib/mock-operations";

const attentionItems = [
  { type: "warning", client: "Fresh Ventures", message: "WhatsApp token expiring soon", icon: AlertTriangle },
  { type: "error", client: "Chidi & Sons", message: "Email SMTP authentication failed", icon: XCircle },
  { type: "info", client: "Dewdrops Hotel", message: "Awaiting contract signature", icon: FileText },
];

const quickLinks = [
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/proposals", label: "Proposals", icon: FileText },
  { href: "/admin/contracts", label: "Contracts", icon: Handshake },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/templates", label: "Templates", icon: Layers },
  { href: "/admin/provisioning", label: "Provisioning", icon: Wrench },
  { href: "/admin/integrations", label: "Integrations", icon: Settings },
  { href: "/admin/logs", label: "Logs", icon: Activity },
];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const liveClients = clients.filter((c: any) => c.lifecycle_status === "live").length;
  const onboardingClients = clients.filter((c: any) => c.lifecycle_status === "onboarding" || c.lifecycle_status === "implementation").length;
  const pendingContracts = clients.filter((c: any) => c.lifecycle_status === "contract_pending" || c.lifecycle_status === "payment_pending").length;
  const liveAutomations = clientAutomations.filter((a: any) => a.status === "live").length;
  const needsAttention = attentionItems.length;

  return (
    <div className="flex min-h-screen bg-[#0A0D14]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Operations</h1>
          <p className="text-gray-400 mb-8">What requires your attention today.</p>

          {/* Attention Section */}
          {attentionItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Attention Required
              </h2>
              <div className="space-y-3">
                {attentionItems.map((item, i) => (
                  <div key={i} className="bg-[#11161F] rounded-xl p-4 border border-gray-800 flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      item.type === "error" ? "bg-red-500/10" : item.type === "warning" ? "bg-amber-500/10" : "bg-blue-500/10"
                    }`}>
                      <item.icon className={`w-5 h-5 ${
                        item.type === "error" ? "text-red-400" : item.type === "warning" ? "text-amber-400" : "text-blue-400"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.client}</p>
                      <p className="text-sm text-gray-400">{item.message}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Live Clients", value: liveClients, icon: CheckCircle, color: "text-green-400" },
              { label: "Onboarding", value: onboardingClients, icon: Clock, color: "text-amber-400" },
              { label: "Pending", value: pendingContracts, icon: FileText, color: "text-blue-400" },
              { label: "Live Automations", value: liveAutomations, icon: Wrench, color: "text-purple-400" },
              { label: "Needs Attention", value: needsAttention, icon: AlertTriangle, color: "text-red-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#11161F] rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-[#11161F] rounded-xl p-4 border border-gray-800 hover:border-[#4F7CFF]/50 transition-all group"
                >
                  <link.icon className="w-5 h-5 text-[#4F7CFF] mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-white">{link.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Client Lifecycle Table */}
          <div className="bg-[#11161F] rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Client Lifecycle</h2>
              <Link href="/admin/clients" className="text-sm text-[#4F7CFF] hover:underline">
                View All
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Client</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Automations</th>
                  <th className="text-left p-4 text-sm text-gray-400 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client: any) => {
                  const clientAuto = clientAutomations.filter((a: any) => a.client_id === client.id);
                  return (
                    <tr key={client.id} className="border-b border-gray-800/50 hover:bg-[#161C27]">
                      <td className="p-4">
                        <p className="text-sm font-medium text-white">{client.organization?.organization_name || "-"}</p>
                        <p className="text-xs text-gray-500">{client.contact_name}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          client.lifecycle_status === "live" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          client.lifecycle_status === "onboarding" || client.lifecycle_status === "implementation" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {client.lifecycle_status === "live" ? <CheckCircle className="w-3 h-3" /> :
                           client.lifecycle_status === "onboarding" || client.lifecycle_status === "implementation" ? <Clock className="w-3 h-3" /> :
                           <FileText className="w-3 h-3" />}
                          {client.lifecycle_status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {clientAuto.length > 0 ? (
                          <span>{clientAuto.length} active</span>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </td>                        <td className="p-4 text-sm text-gray-300">{client.created_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
