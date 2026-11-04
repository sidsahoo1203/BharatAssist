"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Mic, FileText, BarChart3, Sparkles,
  CheckCircle, Users, TrendingUp, Shield, Zap, Globe,
  ChevronRight, Star, Presentation
} from "lucide-react";

const STATS = [
  { value: "8+", label: "Government Schemes", icon: "🏛️" },
  { value: "₹10.6L", label: "Avg. Annual Benefits", icon: "💰" },
  { value: "2 min", label: "Time to Match", icon: "⚡" },
  { value: "140Cr+", label: "Indians Can Benefit", icon: "🇮🇳" },
];

const FEATURES = [
  {
    icon: Sparkles,
    emoji: "🧠",
    title: "SchemeMatch AI",
    subtitle: "Reverse Eligibility Engine",
    desc: "Tell us who you are — age, occupation, income, state. Our AI instantly scans every scheme and shows what you qualify for.",
    color: "#3b82f6",
    gradient: "from-blue-500/10 to-blue-900/5",
    border: "border-blue-500/20",
    link: "/onboard",
  },
  {
    icon: Mic,
    emoji: "🎙️",
    title: "VoiceScheme AI",
    subtitle: "Speak in Hindi, English, or Hinglish",
    desc: "Ask about any government scheme using your voice. Get answers in Hindi. No forms, no jargon — just plain conversation.",
    color: "#8b5cf6",
    gradient: "from-purple-500/10 to-purple-900/5",
    border: "border-purple-500/20",
    link: "/voice",
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "VisualScheme AI",
    subtitle: "See benefits as charts",
    desc: "Beautiful infographics that break down your total benefits, payment timelines, scheme comparisons, and coverage radar.",
    color: "#06b6d4",
    gradient: "from-cyan-500/10 to-cyan-900/5",
    border: "border-cyan-500/20",
    link: "/visual",
  },
  {
    icon: FileText,
    emoji: "📝",
    title: "FormFriend AI",
    subtitle: "Auto-fill applications",
    desc: "Skip the paperwork. We auto-fill your government application with your profile and generate a ready-to-submit PDF.",
    color: "#22c55e",
    gradient: "from-green-500/10 to-green-900/5",
    border: "border-green-500/20",
    link: "/form",
  },
];

const SCHEMES_TICKER = [
  "🌾 PM-KISAN ₹6K/yr", "🏥 Ayushman Bharat ₹5L", "🔨 PM Vishwakarma ₹3.15L",
  "💳 Kisan Credit Card ₹3L", "🎓 NSP Scholarship ₹75K", "🏠 PMAY Housing Subsidy",
  "👧 Sukanya Samriddhi 8.2%", "📚 TN BC Scholarship ₹12K",
  "🌾 PM-KISAN ₹6K/yr", "🏥 Ayushman Bharat ₹5L", "🔨 PM Vishwakarma ₹3.15L",
  "💳 Kisan Credit Card ₹3L", "🎓 NSP Scholarship ₹75K", "🏠 PMAY Housing Subsidy",
  "👧 Sukanya Samriddhi 8.2%", "📚 TN BC Scholarship ₹12K",
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create Your Profile", desc: "Fill a quick form, or speak in Hindi/English, or upload your Aadhaar/income certificate.", icon: "👤" },
  { step: "02", title: "AI Matches Schemes", desc: "Our eligibility engine scores you against every scheme and ranks them by benefit amount.", icon: "🧠" },
  { step: "03", title: "See Your Benefits", desc: "View a personalized dashboard with eligible schemes, total benefits, and missing criteria.", icon: "📊" },
  { step: "04", title: "Apply in One Click", desc: "FormFriend auto-fills your application. Download your PDF and submit at the nearest office.", icon: "🚀" },
];

const SCHEMES_PREVIEW = [
  { name: "PM-KISAN", category: "Agriculture", benefit: "₹6,000/yr", icon: "🌾", color: "#22c55e", link: "/schemes?cat=agriculture" },
  { name: "Ayushman Bharat", category: "Health", benefit: "₹5L/yr", icon: "🏥", color: "#ef4444", link: "/schemes?cat=health" },
  { name: "PM Vishwakarma", category: "Skill", benefit: "₹3.15L", icon: "🔨", color: "#8b5cf6", link: "/schemes" },
  { name: "NSP Scholarship", category: "Education", benefit: "₹75K/yr", icon: "🎓", color: "#06b6d4", link: "/schemes?cat=education" },
  { name: "PMAY Housing", category: "Housing", benefit: "₹2.5L subsidy", icon: "🏠", color: "#0ea5e9", link: "/schemes" },
  { name: "Kisan Credit Card", category: "Agriculture", benefit: "₹3L loan @4%", icon: "💳", color: "#f59e0b", link: "/schemes?cat=agriculture" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Sticky Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass border-b border-white/5 shadow-xl shadow-black/30" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
              LV
            </div>
            <span className="font-black text-lg gradient-text">BharatAssist</span>
            <span className="text-slate-500 font-medium text-sm hidden sm:block">AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {[["Schemes", "/schemes"], ["Visual", "/visual"], ["Voice AI", "/voice"]].map(([label, href]) => (
              <Link key={href} href={href} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">{label}</Link>
            ))}
          </div>
          <Link href="/onboard">
            <button className="btn-primary text-sm py-2 px-5">
              Check Eligibility <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 px-4 relative overflow-hidden">
        {/* Background glow rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-white/3 absolute" />
          <div className="w-[900px] h-[900px] rounded-full border border-white/2 absolute" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-blue-500/20 text-blue-300 text-xs font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered • 8+ Schemes • Works in Hindi
            <span className="ml-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            <span className="text-white">Indian Government</span>
            <br />
            <span className="gradient-text">Chatbot Hallucination</span>
            <br />
            <span className="text-white text-[2.5rem] md:text-[3.5rem]">
              Building Trust in Digital Governance
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            India&apos;s smartest government scheme discovery platform. Tell us about yourself and AI finds every scheme you&apos;re eligible for — in under 2 minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/onboard">
              <button className="btn-primary text-base px-8 py-3.5 rounded-2xl shadow-2xl shadow-blue-500/20">
                <Zap className="w-5 h-5" />
                Check My Eligibility
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/demo-comparisons">
              <button className="text-base px-7 py-3.5 rounded-2xl flex items-center gap-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:text-white transition-all font-bold shadow-lg shadow-indigo-500/10">
                <Presentation className="w-5 h-5" />
                See Live Demo Comparisons
              </button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}
            className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {["🧑‍🌾", "👩‍🎓", "🧑‍💼", "👩‍⚕️"].map((e, i) => (
                <div key={i} className="w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-sm">{e}</div>
              ))}
            </div>
            <span>Helping farmers, students, artisans & families across India</span>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-6 px-4 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}
              className="text-center py-3">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl md:text-3xl font-black gradient-text">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Scheme Ticker ── */}
      <section className="py-4 overflow-hidden border-b border-white/5 bg-black/20">
        <div className="flex gap-8 animate-ticker whitespace-nowrap">
          {SCHEMES_TICKER.map((s, i) => (
            <span key={i} className="text-sm text-slate-400 font-medium flex-shrink-0 flex items-center gap-2">
              {s}
              <span className="text-white/10">•</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── 4 Core Features ── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <motion.p className="section-label mb-3" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              Core Innovations
            </motion.p>
            <motion.h2 className="text-3xl md:text-4xl font-black text-white mb-4" variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}>
              4 Ways AI Helps You
            </motion.h2>
            <motion.p className="text-slate-400 max-w-xl mx-auto" variants={fadeUp} initial="hidden" whileInView="show" custom={2} viewport={{ once: true }}>
              From discovering what you qualify for to filling the forms — BharatAssist AI handles everything.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="show" custom={i * 0.5} viewport={{ once: true }}>
                <Link href={f.link}>
                  <div className={`card group p-6 bg-gradient-to-br ${f.gradient} ${f.border} cursor-pointer h-full`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: f.color + "18", border: `1px solid ${f.color}30` }}>
                        {f.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-white font-bold text-lg">{f.title}</h3>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-xs font-semibold mb-2" style={{ color: f.color }}>{f.subtitle}</p>
                        <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <motion.p className="section-label mb-3" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>Process</motion.p>
            <motion.h2 className="text-3xl md:text-4xl font-black text-white" variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}>
              From Profile to PDF in 4 Steps
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} variants={fadeUp} initial="hidden" whileInView="show" custom={i * 0.15} viewport={{ once: true }}
                className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-2xl glass border border-white/8 flex items-center justify-center text-3xl mx-auto">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-white font-bold mb-2 text-sm">{step.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 text-slate-700">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Schemes Grid ── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <motion.p className="section-label mb-2" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>Database</motion.p>
              <motion.h2 className="text-3xl md:text-4xl font-black text-white" variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}>
                Schemes We Cover
              </motion.h2>
            </div>
            <Link href="/schemes">
              <button className="btn-ghost text-sm hidden md:flex">View All <ChevronRight className="w-4 h-4" /></button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SCHEMES_PREVIEW.map((scheme, i) => (
              <motion.div key={scheme.name} variants={fadeUp} initial="hidden" whileInView="show" custom={i * 0.1} viewport={{ once: true }}>
                <Link href={scheme.link}>
                  <div className="card p-4 group cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{scheme.icon}</span>
                      <div>
                        <p className="text-white font-semibold text-sm leading-tight">{scheme.name}</p>
                        <p className="text-xs" style={{ color: scheme.color }}>{scheme.category}</p>
                      </div>
                    </div>
                    <div className="text-xl font-black" style={{ color: scheme.color }}>{scheme.benefit}</div>
                    <div className="text-slate-600 text-xs mt-1.5 group-hover:text-slate-400 transition-colors">
                      View details →
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6 md:hidden">
            <Link href="/schemes"><button className="btn-ghost text-sm">View All Schemes →</button></Link>
          </div>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="py-16 px-4 border-t border-white/5" style={{ background: "rgba(0,0,0,0.25)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "No Data Stored", desc: "Your profile stays in your browser session only. Zero server-side storage.", color: "#22c55e" },
              { icon: Globe, title: "Works in Hindi", desc: "Voice AI and chat responses are available in Hindi, English, and Hinglish.", color: "#3b82f6" },
              { icon: Zap, title: "Always Free", desc: "All scheme matching, voice AI, and form generation are completely free.", color: "#f59e0b" },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} initial="hidden" whileInView="show" custom={i * 0.15} viewport={{ once: true }}
                className="flex items-start gap-4 p-5 card-no-hover rounded-2xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.color + "15", border: `1px solid ${item.color}25` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="p-10 rounded-3xl glass border border-white/8 border-glow-blue relative overflow-hidden">
            {/* BG decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none rounded-3xl" />
            <div className="relative">
              <div className="text-5xl mb-4">🇮🇳</div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Find Your Benefits Today
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Answer 8 quick questions. See every scheme you qualify for. It's free, private, and takes under 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/onboard">
                  <button className="btn-primary text-base px-8 py-3.5 rounded-2xl">
                    <Sparkles className="w-5 h-5" />
                    Get Started Free
                  </button>
                </Link>
                <Link href="/schemes">
                  <button className="btn-ghost text-sm px-6 py-3.5 rounded-2xl">Browse All Schemes</button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-4 mt-8 text-slate-600 text-xs">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> No signup required</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Always free</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Works in Hindi</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xs">LV</div>
            <span className="font-bold text-white text-sm">BharatAssist AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            {[["Schemes", "/schemes"], ["Voice AI", "/voice"], ["Visual", "/visual"], ["Form Filler", "/form"]].map(([l, h]) => (
              <Link key={h} href={h} className="hover:text-white transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-xs text-slate-700">Built for India 🇮🇳 • Course Project 2026</p>
        </div>
      </footer>
    </div>
  );
}
