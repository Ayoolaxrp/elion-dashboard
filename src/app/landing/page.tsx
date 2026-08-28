"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle, Zap, Mail, RotateCcw, Calendar, Settings, Play, Star, ChevronRight, Shield, Clock, Users, TrendingUp, Globe, MessageSquare } from "lucide-react";
import { HeroIllustration, WorkflowIllustration, AnalyticsIllustration, AutomationFlowIllustration } from "@/components/illustrations";
import Link from "next/link";
import { submitForm } from "@/lib/api";

const steps = [
  { num: "01", title: "We Map Your Processes", desc: "We create a visual map of all your systems, manual tasks, and apps." },
  { num: "02", title: "We Find Automation Opportunities", desc: "We audit your workflows to pinpoint opportunities with the highest ROI." },
  { num: "03", title: "We Build & Test", desc: "We use custom code, AI tools, n8n, Make.com and your tech stack." },
  { num: "04", title: "We Manage & Iterate", desc: "Every client grows, so there's always new things to automate." },
];

const useCases = [
  { icon: <MessageSquare className="w-6 h-6" />, title: "Sales & Marketing", desc: "Lead routing, CRM, outbound, payments, contracts and more." },
  { icon: <Zap className="w-6 h-6" />, title: "Conversational AI", desc: "Auto-replies for customer service, sales, chatbots, front-office." },
  { icon: <TrendingUp className="w-6 h-6" />, title: "Predictive Analytics", desc: "Data-driven decisions through risk analytics and demand forecasting." },
  { icon: <Settings className="w-6 h-6" />, title: "Project Management", desc: "Connect manual steps from task handoff to completion." },
  { icon: <Users className="w-6 h-6" />, title: "Staff Augmentation", desc: "Save employees hours a day by automating their most tedious tasks." },
  { icon: <Globe className="w-6 h-6" />, title: "Data Integration", desc: "Automate data entry, collection, cleansing and reporting." },
];

const testimonials = [
  { name: "Sarah M.", role: "Director, Finance", text: "They helped us streamline our workflow and cut down our workload significantly. We are now able to focus on what matters most.", stars: 5 },
  { name: "John D.", role: "CEO", text: "They helped me automate all of my repetitive tasks, which has given me back so much time in my day. I can now focus on the things that I'm passionate about.", stars: 5 },
  { name: "Aisha K.", role: "Operations Manager", text: "The automation system they built handles our lead response in 3 seconds. Our conversion rate went up 40% in the first month.", stars: 5 },
];

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", industry: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    await submitForm("/webhook/leak-audit", { ...form, company_name: form.name });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-6 py-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" /> AI-Powered Business Automation
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            We Fix Your <span className="text-primary">Operational Leaks</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            We combine artificial intelligence with automation to create incredibly efficient processes that replace manual work for massive gains.
          </p>
          <div className="max-w-xl mx-auto mb-12"><HeroIllustration /></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
              Get Free Audit <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-800 text-white rounded-xl font-semibold text-lg hover:bg-zinc-700 transition-colors">
              <Play className="w-5 h-5" /> See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "50,000+", label: "Hours of manual work replaced" },
            { value: "400+", label: "Clients automated" },
            { value: "1,000+", label: "Workflows built" },
            { value: "3-5x", label: "Higher conversion rates" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-zinc-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Our AI Automation Agency Works</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">We get under the hood of your business and find opportunities to replace the most manual, repetitive and expensive bottlenecks with AI-powered, automated processes.</p>
        </div>
        <div className="max-w-2xl mx-auto mb-12"><WorkflowIllustration /></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <div className="text-5xl font-bold text-primary/20 mb-4">{step.num}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-400">{step.desc}</p>
              {step.num !== "04" && <ChevronRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-zinc-700" />}
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Endless Use Cases of AI & Automation</h2>
            <p className="text-zinc-400">Our clients make their employees 10x more efficient by taking tedious, repetitive tasks off their plate.</p>
          </div>
          <div className="max-w-lg mx-auto mb-12"><AutomationFlowIllustration /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <div key={uc.title} className="p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">{uc.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{uc.title}</h3>
                <p className="text-sm text-zinc-400">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit CTA */}
      <section id="audit" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Your Free Automation Audit</h2>
            <div className="max-w-sm mb-6"><AnalyticsIllustration /></div>
            <p className="text-zinc-400 mb-6">We'll analyze your business, identify where you're losing time, leads, and money, and give you a prioritized automation roadmap.</p>
            <ul className="space-y-3 mb-8">
              {["Real web research on your business", "Industry-specific benchmarks", "Role-based task assignments", "Exportable PDF report", "No commitment required"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm"><CheckCircle className="w-5 h-5 text-primary shrink-0" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="p-8 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Audit Request Submitted!</h3>
                <p className="text-zinc-400">We'll contact you within 24 hours with your custom automation roadmap.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="text" placeholder="Your Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary" />
                <input type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary" />
                <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary" />
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select Industry</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Recruitment">Recruitment</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Financial Services">Financial Services</option>
                </select>
                <button onClick={handleSubmit} disabled={loading || !form.name || !form.email} className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Submitting..." : "Get Free Audit"}
                </button>
                <p className="text-xs text-zinc-500 text-center">Free · 30 minutes · No commitment</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Clients Achieve Operational Excellence</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex gap-1 mb-4">{Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}</div>
                <p className="text-sm text-zinc-300 mb-4">&ldquo;{t.text}&rdquo;</p>
                <div><p className="font-semibold">{t.name}</p><p className="text-xs text-zinc-500">{t.role}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Automate Your Business?</h2>
        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">Stop losing leads, time, and money to manual processes. Get your free audit and see where automation can transform your business.</p>
        <a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
          Get Free Audit <ArrowRight className="w-5 h-5" />
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /><span className="font-semibold">Elion</span></div>
          <p className="text-sm text-zinc-500">&copy; 2026 Elion AI Agency. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/landing/about" className="hover:text-white">About</Link>
            <Link href="/landing/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/landing/audit" className="hover:text-white">Audit</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
