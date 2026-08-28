"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle, Zap, Mail, RotateCcw, Calendar, Settings, Play, Star, Shield, Clock, Users, TrendingUp, Globe, MessageSquare, Phone, ChevronDown, ChevronUp, Award, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import { submitForm } from "@/lib/api";

const steps = [
  { num: "01", title: "We Map Your Processes", desc: "We create a visual map of all your systems, manual tasks, and apps.", icon: <Target className="w-5 h-5" /> },
  { num: "02", title: "We Find Automation Opportunities", desc: "We audit your workflows to pinpoint opportunities with the highest ROI.", icon: <Search className="w-5 h-5" /> },
  { num: "03", title: "We Build & Test", desc: "We use custom code, AI tools, n8n, Make.com and your tech stack.", icon: <Zap className="w-5 h-5" /> },
  { num: "04", title: "We Manage & Iterate", desc: "Every client grows, so there's always new things to automate.", icon: <Settings className="w-5 h-5" /> },
];

// Need Search import
import { Search } from "lucide-react";

const useCases = [
  { icon: <MessageSquare className="w-5 h-5" />, title: "Lead Response", desc: "Every lead gets an instant response via WhatsApp or email within 3 seconds.", stat: "40% more conversions" },
  { icon: <Mail className="w-5 h-5" />, title: "Follow-Up Automation", desc: "Multi-step sequences across email, WhatsApp, and SMS, automatically.", stat: "3x reply rate" },
  { icon: <RotateCcw className="w-5 h-5" />, title: "Revenue Recovery", desc: "Reactivate dormant leads and old customers sitting in your database.", stat: "NGN 8M+ recovered" },
  { icon: <Calendar className="w-5 h-5" />, title: "Booking Engine", desc: "Turn enquiries into booked appointments without the back-and-forth.", stat: "92% show-up rate" },
  { icon: <Settings className="w-5 h-5" />, title: "Operations", desc: "Remove repetitive work, data entry, reports, notifications, onboarding.", stat: "32 hrs/week saved" },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Analytics & Reporting", desc: "Real-time dashboards replace manual weekly report compilation.", stat: "100% automation" },
];

const testimonials = [
  { name: "Adebayo Johnson", role: "CEO, TechCorp Nigeria", text: "We were losing 50+ leads per month because nobody responded fast enough. Within 2 weeks of implementing Elion's system, our response time dropped from 4 hours to 3 seconds. Conversion went up 40%.", stars: 5, metric: "40% more conversions" },
  { name: "Chioma Okafor", role: "Head of Sales, Premier Realty", text: "Our sales team used to spend 3 hours a day just following up with leads manually. Now the system does it for us, and it does it better. We closed 23% more deals last quarter.", stars: 5, metric: "23% more deals" },
  { name: "Gideon Mensah", role: "Managing Director, Swift Logistics", text: "I was skeptical about automation. But after seeing the ROI on just the lead response system, I signed up for the full suite. Best business decision I've made this year.", stars: 5, metric: "3-5x ROI" },
];

const guarantees = [
  { title: "Results in 14 Days", desc: "Most clients see measurable improvement within the first two weeks of implementation.", icon: <Clock className="w-5 h-5" /> },
  { title: "You Own Everything", desc: "No recurring licensing. No platform lock-in. The automations are yours forever.", icon: <Shield className="w-5 h-5" /> },
  { title: "Money-Back Guarantee", desc: "If you don't see ROI within 90 days, we'll refund your investment. No questions asked.", icon: <Award className="w-5 h-5" /> },
];

const faqs = [
  { q: "How quickly will I see results?", a: "Most clients see measurable improvement within 2 weeks. Lead response times drop from hours to seconds on day one." },
  { q: "Do I need to change my existing tools?", a: "No. We integrate with what you already use, WhatsApp, HubSpot, Google Calendar, Slack, and any tool with an API." },
  { q: "What if I'm not technical?", a: "You don't need to be. We handle everything, setup, integration, testing, and training. You just use the dashboard." },
  { q: "How much does it cost?", a: "Starting from NGN 100,000 for a single workflow. Most businesses start with the Growth plan at NGN 350,000." },
];

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", industry: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    await submitForm("/webhook/leak-audit", { ...form, company_name: form.name });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero, Gadzhi-style bold headline */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center relative">
          {/* Social proof bar */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex -space-x-2">
              {["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-rose-500"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold`}>
                  {["AJ", "CO", "GM", "FA"][i]}
                </div>
              ))}
            </div>
            <span className="text-sm text-zinc-400">400+ businesses automated</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Business Automation
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Your Business Is Losing<br />
            <span className="bg-gradient-to-r from-primary via-violet-400 to-primary bg-clip-text text-transparent">Money Every Day</span><br />
            <span className="text-zinc-400 text-3xl md:text-4xl lg:text-5xl font-semibold">You Just Can&apos;t See It Yet</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            Slow lead response. Forgotten follow-ups. Manual data entry. Dormant customers.
            These are the leaks costing your business NGN 5-10M per year.
          </p>
          <p className="text-base text-zinc-500 max-w-xl mx-auto mb-10">
            We build AI-powered systems that respond to leads in 3 seconds, follow up automatically, and recover revenue you didn&apos;t know you were losing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href="#audit" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Get Your Free Audit <ArrowRight className="w-5 h-5" />
            </a>
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-800 text-white rounded-xl font-semibold text-lg hover:bg-zinc-700 transition-all border border-zinc-700">
              <Play className="w-5 h-5" /> See It In Action
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Free audit, no credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Results in 14 days</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> You own everything</span>
          </div>
        </div>
      </section>

      {/* Stats Bar, Brunson-style proof */}
      <section className="border-y border-zinc-800/80 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "50,000+", label: "Hours of manual work replaced", icon: <Clock className="w-5 h-5 text-primary" /> },
            { value: "400+", label: "Clients automated worldwide", icon: <Users className="w-5 h-5 text-primary" /> },
            { value: "3-5x", label: "Average return on investment", icon: <TrendingUp className="w-5 h-5 text-primary" /> },
            { value: "3 seconds", label: "Average lead response time", icon: <Zap className="w-5 h-5 text-primary" /> },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">{stat.icon}</div>
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem, Gadzhi-style pain agitation */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Here&apos;s What&apos;s <span className="text-red-400">Actually Happening</span> In Your Business Right Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 text-left">
            {[
              { pain: "A lead fills out your form at 2am", result: "Nobody responds until 10am. By then, they've already contacted your competitor.", cost: "NGN 2.4M/year in lost leads" },
              { pain: "A customer doesn't buy for 90 days", result: "Nobody follows up. They forget about you. You spend more money finding new customers.", cost: "NGN 5M+/year in lost revenue" },
              { pain: "Your team spends 15 hours/week on data entry", result: "That's 15 hours they could spend closing deals, not copying data between spreadsheets.", cost: "NGN 3.9M/year in wasted labor" },
              { pain: "A prospect books a consultation", result: "They forget. No-show. You reschedule. They no-show again. Cycle repeats.", cost: "NGN 1.2M/year in lost appointments" },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
                <p className="text-sm font-semibold text-zinc-300 mb-2">{item.pain}</p>
                <p className="text-sm text-zinc-500 mb-3">{item.result}</p>
                <p className="text-sm font-bold text-red-400">{item.cost}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-6 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-lg font-bold text-red-400">Total: NGN 12.5M+ per year lost to operational leaks</p>
            <p className="text-sm text-zinc-400 mt-1">And that&apos;s just for a mid-size business. Larger companies lose significantly more.</p>
          </div>
        </div>
      </section>

      {/* The Solution, What We Build */}
      <section className="py-20 px-6 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Here&apos;s What We <span className="text-primary">Build For You</span></h2>
            <p className="text-zinc-400 max-w-xl mx-auto">Six automation systems that plug the leaks and turn your operations into a revenue machine.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((uc) => (
              <div key={uc.title} className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/15 transition-colors">{uc.icon}</div>
                <h3 className="text-base font-bold mb-2">{uc.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">{uc.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">{uc.stat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works, 4 Steps */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-zinc-400">From audit to live automation in as little as 5 days.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="relative text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
                  {step.icon}
                </div>
                <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">Step {step.num}</span>
                <h3 className="text-sm font-bold mt-2 mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof, Gadzhi-style testimonials */}
      <section className="py-20 px-6 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Don&apos;t Take Our Word For It</h2>
            <p className="text-zinc-400">Here&apos;s what our clients say after implementing their automation systems.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">{t.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee, Brunson-style risk reversal */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our <span className="text-emerald-400">Iron-Clad Guarantee</span></h2>
            <p className="text-zinc-400">We put our money where our mouth is. If you don&apos;t see results, you don&apos;t pay.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guarantees.map((g) => (
              <div key={g.title} className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-4">{g.icon}</div>
                <h3 className="text-sm font-bold mb-2">{g.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Form, Lead Capture */}
      <section id="audit" className="py-20 px-6 bg-zinc-900/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Your Free Automation Audit</h2>
            <p className="text-zinc-400">We&apos;ll analyze your business and show you exactly where you&apos; losing time and money. Takes 2 minutes.</p>
          </div>
          {submitted ? (
            <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Audit Request Received!</h3>
              <p className="text-zinc-400">We&apos;ll send your custom automation roadmap within 24 hours. Check your email.</p>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="Your name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input type="email" placeholder="Email address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                  <option value="">Select your industry</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="General">Other</option>
                </select>
              </div>
              <button onClick={handleSubmit} disabled={loading || !form.name || !form.email} className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20">
                {loading ? "Analyzing..." : "Get My Free Audit →"}
              </button>
              <p className="text-[11px] text-zinc-600 text-center mt-3">No credit card required. Free forever.</p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden hover:border-zinc-700 transition-colors">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left cursor-pointer">
                  <span className="text-sm font-semibold pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA, Brunson-style urgency */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/10 via-zinc-950 to-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Every Day You Wait, You&apos;re Losing Money</h2>
          <p className="text-zinc-400 mb-8">Your competitors are automating right now. The businesses that move fastest win the most.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#audit" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
              Start With a Free Audit <ArrowRight className="w-5 h-5" />
            </a>
            <Link href="/landing/pricing" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-800 text-white rounded-xl font-semibold text-lg hover:bg-zinc-700 transition-all border border-zinc-700">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
