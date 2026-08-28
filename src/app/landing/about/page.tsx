"use client";
import { Shield, Zap, Users, Globe, CheckCircle, ArrowRight, Target } from "lucide-react";
import { TeamIllustration, AutomationFlowIllustration } from "@/components/illustrations";
import Link from "next/link";

const values = [
  { icon: <Zap className="w-6 h-6" />, title: "Results First", desc: "We don't sell automation projects. We sell business outcomes. Every system we build is tied to a measurable business result." },
  { icon: <Shield className="w-6 h-6" />, title: "Transparency", desc: "No hidden fees, no jargon, no smoke and mirrors. We tell you exactly what we'll build, what it costs, and what results to expect." },
  { icon: <Users className="w-6 h-6" />, title: "Done-For-You", desc: "You don't need to learn new tools. We handle everything from strategy to implementation to ongoing optimization." },
  { icon: <Target className="w-6 h-6" />, title: "Industry Expertise", desc: "We've built systems for real estate, healthcare, education, recruitment, e-commerce, and professional services." },
];

const clients = [
  "TechCorp Nigeria", "Premier Realty", "PayFlow Africa", "Wellness Clinic",
  "Swift Logistics", "Bright Academy", "TradeZone", "Glamour Salon",
];

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      {/* Hero */}
      <div className="text-center mb-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">We Fix Operational Leaks That Cost Businesses Time, Leads, and Revenue</h1>
        <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">Elion is an AI automation agency that helps businesses in Nigeria and beyond eliminate manual work, respond to leads instantly, and recover dormant revenue.</p>
        <div className="max-w-lg mx-auto"><AutomationFlowIllustration /></div>
      </div>

      {/* Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
        <div>
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-zinc-400 mb-4">We believe every business deserves to operate at peak efficiency. Too many companies lose leads, waste time on manual tasks, and leave money on the table because they don&apos;t have the right systems in place.</p>
          <p className="text-zinc-400 mb-4">Our mission is to make AI-powered automation accessible to businesses of all sizes. We don&apos;t just build technology — we build operational excellence.</p>
          <p className="text-zinc-400">We combine deep industry knowledge with cutting-edge AI tools to create systems that actually work. Every automation we build is tested, optimized, and designed to scale with your business.</p>
        </div>
        <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="grid grid-cols-2 gap-6">
            {[
              { value: "400+", label: "Clients Automated" },
              { value: "50,000+", label: "Hours Saved" },
              { value: "1,000+", label: "Workflows Built" },
              { value: "3-5x", label: "Conversion Increase" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-zinc-800/50">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Elion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((v) => (
            <div key={v.title} className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">{v.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-zinc-400">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">How We Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Discovery Call", desc: "We learn about your business, challenges, and goals. Free, no commitment." },
            { step: "02", title: "Automation Audit", desc: "We research your business online and identify where you're losing time, leads, and money." },
            { step: "03", title: "Build & Deploy", desc: "We build your automations, test them thoroughly, and deploy them live." },
            { step: "04", title: "Optimize & Scale", desc: "We monitor performance, optimize workflows, and build new automations as you grow." },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-4">{s.step}</div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Clients */}
      <div className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Trusted by Businesses Across Industries</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {clients.map((c) => (
            <div key={c} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
              <p className="text-sm font-medium text-zinc-300">{c}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center p-12 rounded-2xl bg-primary/5 border border-primary/20">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">Get your free automation audit and see where we can help you save time, recover revenue, and grow faster.</p>
        <Link href="/landing" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
          Get Free Audit <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
