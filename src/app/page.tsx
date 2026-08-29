"use client";

import { Search, Zap, Mail, RotateCcw, Calendar, Settings, ArrowRight, TrendingUp, Users, Activity, DollarSign, Globe, FileText } from "lucide-react";
import Link from "next/link";
import { StatCard, Card, Badge, StatusDot } from "@/components/ui";
import { useState } from "react";

const offers = [
  {
    id: "audit",
    title: "Automation Leak Audit",
    description: "Examine customer journey and operations to identify where leads are lost and repetitive tasks waste resources.",
    icon: Search,
    href: "/audit",
    landing: "/landing/audit",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    metrics: { scanned: 47, leaks: 12, saved: "NGN 2.4M" },
  },
  {
    id: "leads",
    title: "Lead Response System",
    description: "Instant lead intake from any channel. Auto-qualify, score, assign, and follow up within seconds.",
    icon: Zap,
    href: "/leads",
    landing: "/landing/leads",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    metrics: { leads: 1284, responseTime: "3s", conversion: "34%" },
  },
  {
    id: "followup",
    title: "Follow-Up Engine",
    description: "Multi-step follow-up sequences across email, WhatsApp, and SMS automatically.",
    icon: Mail,
    href: "/followup",
    landing: "/landing/followup",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    metrics: { sequences: 23, sent: 4821, replies: 892 },
  },
  {
    id: "recovery",
    title: "Revenue Recovery System",
    description: "Reactivate dormant leads and old customers with personalized reactivation campaigns.",
    icon: RotateCcw,
    href: "/recovery",
    landing: "/landing/recovery",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    metrics: { dormant: 3420, reactivated: 487, revenue: "NGN 8.2M" },
  },
  {
    id: "booking",
    title: "Booking Engine",
    description: "Turn enquiries into booked appointments without the back-and-forth.",
    icon: Calendar,
    href: "/booking",
    landing: "/landing/booking",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    metrics: { bookings: 312, noShows: "8%", satisfaction: "96%" },
  },
  {
    id: "operations",
    title: "Operations Automation",
    description: "Remove repetitive work from your team's day. Data entry, reports, notifications, and more.",
    icon: Settings,
    href: "/operations",
    landing: "/landing/operations",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    metrics: { workflows: 18, tasksSaved: 1240, hoursWeekly: 32 },
  },
];

function generateQuickReport() {
  const now = new Date();
  const report = `<!DOCTYPE html><html><head><title>Elion Weekly Report - ${now.toLocaleDateString()}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#18181b}
h1{font-size:20px;margin-bottom:4px}h2{font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;margin-top:32px;border-bottom:1px solid #e4e4e7;padding-bottom:8px}
table{width:100%;border-collapse:collapse;margin:12px 0}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #f4f4f5;font-size:13px}
th{background:#f4f4f5;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0}
.card{background:#f4f4f5;padding:16px;border-radius:6px;text-align:center}
.card h3{font-size:20px;color:#18181b;margin:0}.card p{font-size:11px;color:#71717a;margin:4px 0 0}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:11px;color:#a1a1aa}
@media print{body{padding:20px}}</style></head><body>
<h1>Elion AI Agency</h1><p style="color:#71717a;font-size:13px">Weekly Operations Report &bull; ${now.toLocaleDateString()}</p>
<div class="grid">
<div class="card"><h3>1,284</h3><p>Total Leads</p></div>
<div class="card"><h3>34.2%</h3><p>Conversion Rate</p></div>
<div class="card"><h3>4,821</h3><p>Messages Sent</p></div>
<div class="card"><h3>NGN 8.2M</h3><p>Revenue Recovered</p></div>
</div>
<h2>Lead Pipeline</h2>
<table><tr><th>Status</th><th>Count</th><th>Conversion</th></tr>
<tr><td>New</td><td>127</td><td>-</td></tr>
<tr><td>Qualified</td><td>89</td><td>70%</td></tr>
<tr><td>Contacted</td><td>234</td><td>56%</td></tr>
<tr><td>Meeting</td><td>56</td><td>24%</td></tr>
<tr><td>Won</td><td>42</td><td>75%</td></tr></table>
<h2>Active Automations</h2>
<table><tr><th>System</th><th>Status</th><th>Monthly Savings</th></tr>
<tr><td>Lead Response</td><td>Active</td><td>NGN 1.2M</td></tr>
<tr><td>Follow-Up Engine</td><td>Active</td><td>NGN 850K</td></tr>
<tr><td>Revenue Recovery</td><td>Active</td><td>NGN 6.9M</td></tr>
<tr><td>Booking Engine</td><td>Active</td><td>NGN 320K</td></tr>
<tr><td>Operations</td><td>Active</td><td>NGN 390K</td></tr></table>
<h2>Key Metrics</h2>
<ul style="font-size:13px;line-height:1.8">
<li>Average Response Time: 2.8s (Target: &lt;3s)</li>
<li>Email Open Rate: 67.3%</li>
<li>WhatsApp Reply Rate: 42.1%</li>
<li>No-Show Rate: 8% (Down from 18%)</li>
<li>Client Satisfaction: 96%</li>
</ul>
<div class="footer">Generated by Elion AI Agency &bull; elion.ng &bull; ${now.toLocaleString()}</div>
</body></html>`;
  const blob = new Blob([report], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `elion-report-${now.toISOString().split("T")[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [notif, setNotif] = useState("");
  const showNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {notif && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg animate-fade-in">
          {notif}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Your automation command center. Six systems, one platform.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              generateQuickReport();
              showNotif("Report downloaded");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />Export Report
          </button>
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors"
          >
            <Globe className="w-4 h-4" />Landing Pages
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <Link href="/leads">
          <StatCard label="Total Leads" value="1,284" change={23} changeLabel="vs last month" icon={<Users className="w-5 h-5" />} gradient="primary" />
        </Link>
        <Link href="/followup">
          <StatCard label="Active Sequences" value="23" change={8} changeLabel="new this week" icon={<Activity className="w-5 h-5" />} gradient="success" />
        </Link>
        <Link href="/recovery">
          <StatCard label="Revenue Recovered" value="NGN 8.2M" change={42} changeLabel="vs last quarter" icon={<DollarSign className="w-5 h-5" />} gradient="warning" />
        </Link>
        <Link href="/operations">
          <StatCard label="Hours Saved Weekly" value="32" change={12} changeLabel="vs last month" icon={<TrendingUp className="w-5 h-5" />} gradient="primary" />
        </Link>
      </div>

      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">Automation Systems</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Each system solves a specific business problem.</p>
      </div>

      {/* Offer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {offers.map((offer) => (
          <Link key={offer.id} href={offer.href}>
            <div className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 transition-colors cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${offer.bgColor} flex items-center justify-center`}>
                  <offer.icon className={`w-4.5 h-4.5 ${offer.color}`} />
                </div>
                <Badge variant="success">
                  <StatusDot status="active" /> Active
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">{offer.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">{offer.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <div className="flex gap-4">
                  {Object.entries(offer.metrics).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="text-sm font-semibold text-zinc-900">{String(val)}</p>
                    </div>
                  ))}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-300" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Deploy CTA */}
      <div className="mt-6 bg-white border border-zinc-200 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Ready to deploy?</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Connect your WhatsApp Business API, CRM, and email provider to go live.</p>
          </div>
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded hover:bg-blue-100 transition-colors"
          >
            Start with Leak Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
