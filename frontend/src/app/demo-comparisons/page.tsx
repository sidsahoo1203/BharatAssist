"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, AlertCircle, Bot, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DemoComparisonsPage() {
    return (
        <div className="min-h-screen py-12 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] -z-10" />

            <div className="max-w-6xl mx-auto">
                <div className="mb-12 text-center md:text-left">
                    <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full glass border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm mb-6 pointer-events-auto shadow-lg shadow-black/50">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
                        Why <span className="gradient-text">BharatAssist AI</span>?
                    </h1>
                    <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
                        A definitive side-by-side demonstration explaining why traditional government portals and general-purpose LLMs fail Indian citizens, and how BharatAssist AI solves these precise problems for its course project goals.
                    </p>
                </div>

                <div className="space-y-24">
                    {/* Comparison 1: Government Website vs BharatAssist */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 font-black text-xl border border-blue-500/30">1</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Traditional UX vs. BharatAssist AI</h2>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* The Problem */}
                            <div className="card-no-hover rounded-3xl p-8 border-red-500/20 relative overflow-hidden bg-black/40">
                                <div className="absolute top-0 right-0 p-5">
                                    <div className="bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-red-500/30 uppercase tracking-widest shadow-lg shadow-red-500/20">
                                        <XCircle className="w-4 h-4" /> The Problem
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-10 text-slate-300">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shadow-inner">
                                        <Globe className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <h3 className="font-bold text-xl tracking-tight">Official Scheme Websites</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-black/60 border border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] space-y-4 opacity-80 backdrop-blur-sm">
                                        <div className="h-5 w-3/4 bg-slate-800 rounded animate-pulse" />
                                        <div className="h-3 w-full bg-slate-800 rounded animate-pulse mt-4" />
                                        <div className="h-3 w-5/6 bg-slate-800 rounded animate-pulse" />
                                        <div className="h-3 w-full bg-slate-800 rounded animate-pulse" />
                                        <div className="h-3 w-2/3 bg-slate-800 rounded animate-pulse" />
                                        <div className="flex gap-2 mt-4">
                                            <div className="h-8 w-24 bg-blue-600/50 rounded animate-pulse" />
                                            <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <ul className="space-y-4 pt-4 border-t border-slate-800/50">
                                        <li className="flex items-start gap-3 text-slate-400 leading-relaxed">
                                            <div className="mt-1 bg-amber-500/10 p-1 rounded-md border border-amber-500/20"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                                            <span><strong>Text-Heavy & Bureaucratic:</strong> Relies on dense PDFs and complex English legalese instead of natural conversation.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-slate-400 leading-relaxed">
                                            <div className="mt-1 bg-amber-500/10 p-1 rounded-md border border-amber-500/20"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                                            <span><strong>Manual Browsing:</strong> Citizens must manually sift through hundreds of schemes trying to guess what applies to them.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-slate-400 leading-relaxed">
                                            <div className="mt-1 bg-amber-500/10 p-1 rounded-md border border-amber-500/20"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                                            <span><strong>Blind Applying:</strong> Does not calculate eligibility until *after* the lengthy application is submitted.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* The Solution */}
                            <div className="card-no-hover rounded-3xl p-8 border-green-500/40 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent relative shadow-[0_0_40px_rgba(34,197,94,0.05)]">
                                <div className="absolute top-0 right-0 p-5">
                                    <div className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-green-500/40 uppercase tracking-widest shadow-lg shadow-green-500/20">
                                        <CheckCircle2 className="w-4 h-4" /> The Solution
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-10 text-white">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-2.5 shadow-lg shadow-green-500/30 pointer-events-none">
                                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <h3 className="font-bold text-xl tracking-tight">BharatAssist AI</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 rounded-2xl bg-black/40 border border-green-500/30 flex gap-5 items-center backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex flex-shrink-0 items-center justify-center text-3xl border border-white/10 shadow-inner">👨‍🌾</div>
                                        <div>
                                            <p className="text-slate-300 font-semibold text-sm tracking-wide">Farmer, Age 42, Patna</p>
                                            <div className="flex items-end gap-2 mt-1">
                                                <p className="text-green-400 font-black text-2xl tracking-tighter">₹6,000<span className="text-sm font-medium text-green-400/70">/yr</span></p>
                                                <p className="text-xs text-white/50 mb-1 ml-1 bg-white/5 px-2 py-0.5 rounded-full">PM-KISAN</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-4 pt-4 border-t border-green-500/20">
                                        <li className="flex items-start gap-3 text-slate-200 leading-relaxed">
                                            <div className="mt-1 bg-green-500/20 p-1 rounded-md border border-green-500/40"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
                                            <span><strong>Voice-First (Hinglish):</strong> Speak naturally in Hindi or Hinglish. Zero typing skills required for rural adoption.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-slate-200 leading-relaxed">
                                            <div className="mt-1 bg-green-500/20 p-1 rounded-md border border-green-500/40"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
                                            <span><strong>Reverse Eligibility Engine:</strong> The AI extracts profile data and instantly calculates exact matches and benefit sums across all 100+ criteria.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-slate-200 leading-relaxed">
                                            <div className="mt-1 bg-green-500/20 p-1 rounded-md border border-green-500/40"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
                                            <span><strong>Auto-Filled PDFs:</strong> FormFriend instantly converts conversational data into downloadable, ready-to-print forms.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Comparison 2: ChatGPT vs BharatAssist */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-black text-xl border border-purple-500/30">2</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">General LLM vs. Logic Engine AI</h2>
                        </div>
                        <p className="text-base text-slate-400 mb-8 max-w-3xl leading-relaxed">
                            <strong>The "Land Cap" Test:</strong> We ask a complex Indian constraint question about the PM-KISAN scheme to demonstrate why relying solely on ChatGPT fails in government contexts.
                        </p>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* General LLM */}
                            <div className="card-no-hover rounded-3xl p-8 border-red-500/20 bg-black/40">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4 text-slate-300">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center border border-slate-700 shadow-inner">
                                            <Bot className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <h3 className="font-bold text-xl tracking-tight">ChatGPT / Gemini</h3>
                                    </div>
                                    <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30 uppercase tracking-widest font-bold shadow-lg shadow-red-500/10 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Hallucination</span>
                                </div>

                                <div className="space-y-6">
                                    {/* User Bubble */}
                                    <div className="ml-auto w-[90%] bg-blue-600/90 rounded-2xl p-4 text-white text-sm md:text-base rounded-tr-none shadow-md border border-blue-500/50">
                                        "Mere paas 3 hectare zameen hai. Kya main PM-KISAN ke liye eligible hoon?"
                                    </div>
                                    {/* Bot Bubble */}
                                    <div className="w-[90%] bg-slate-900 border border-red-500/40 rounded-2xl p-5 text-slate-300 text-sm md:text-base rounded-tl-none relative shadow-[0_0_20px_rgba(239,68,68,0.15)] leading-relaxed">
                                        <div className="absolute top-4 right-4 text-red-500 opacity-20"><Bot className="w-16 h-16" /></div>
                                        <p className="relative z-10">Nahi, PM-KISAN yojana keval chote aur seemant kisanon ke liye hai <span className="bg-red-500/30 text-red-200 px-1.5 rounded line-through border border-red-500/50 font-medium">jinke paas 2 hectare tak zameen hai.</span> Aapke paas 3 hectare hai isliye aap aavedan nahi kar sakte.</p>

                                        <div className="mt-6 pt-5 border-t border-red-500/30 flex gap-3 relative z-10 bg-red-500/5 p-4 rounded-xl">
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-400 leading-snug">
                                                <strong>Outdated / Confidently Incorrect!</strong><br />The 2-hectare cap was completely removed by the Govt of India in 2019. Large farmers ARE eligible. General LLMs frequently freeze on outdated legal constraints and mislead citizens.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BharatAssist AI */}
                            <div className="card-no-hover rounded-3xl p-8 border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent relative shadow-[0_0_40px_rgba(168,85,247,0.05)]">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4 text-white">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-[1px] shadow-lg shadow-purple-500/20">
                                            <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-lg font-black tracking-tighter shadow-inner">LV</div>
                                        </div>
                                        <h3 className="font-bold text-xl tracking-tight">BharatAssist AI</h3>
                                    </div>
                                    <span className="text-xs text-purple-300 bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/40 uppercase tracking-widest font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Grounded RAG</span>
                                </div>

                                <div className="space-y-6">
                                    {/* User Bubble */}
                                    <div className="ml-auto w-[90%] bg-blue-600/90 rounded-2xl p-4 text-white text-sm md:text-base rounded-tr-none shadow-md border border-blue-500/50 relative z-10">
                                        "Mere paas 3 hectare zameen hai. Kya main PM-KISAN ke liye eligible hoon?"
                                    </div>
                                    {/* Bot Bubble */}
                                    <div className="w-[90%] glass border border-green-500/40 rounded-2xl p-5 text-white text-sm md:text-base rounded-tl-none shadow-[0_0_25px_rgba(34,197,94,0.15)] leading-relaxed relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

                                        <p className="relative z-10 text-lg">✅ <strong className="text-green-300">Haan, aap bilkul eligible hain!</strong></p>
                                        <p className="mt-3 text-slate-200 relative z-10">Shuru mein PM-KISAN sirf 2 hectare tak zameen waale kisanon ke liye thi, par <span className="text-white font-bold bg-green-500/20 px-1.5 rounded">2019 mein sarkar ne land limit hata di hai</span>. Ab sabhi landholding kisan parivar eligible hain.</p>

                                        <div className="mt-6 pt-5 border-t border-white/10 flex gap-3 relative z-10">
                                            <Link href="/form" className="w-full">
                                                <button className="w-full flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-green-600/30 to-emerald-600/30 hover:from-green-600/50 hover:to-emerald-600/50 py-3 rounded-xl border border-green-500/30 transition-all font-semibold text-green-300 hover:text-white shadow-lg shadow-green-900/20">
                                                    Download Form Now <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 ml-[10%] w-[90%]">
                                        <p className="text-xs text-purple-300 leading-relaxed font-medium">
                                            <strong>Why LV Succeeds:</strong> Uses a deterministic rules-engine overlaid with RAG against an isolated, up-to-date government API schema DB, eliminating outdated training data poisoning.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Bottom CTA */}
                    <div className="text-center pt-8 mb-20">
                        <Link href="/dashboard">
                            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 active:scale-95 transition-all text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-blue-500/25 border border-white/10 text-lg flex items-center gap-3 mx-auto">
                                View Dashboard <ArrowRight className="w-5 h-5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add ArrowRight icon component since it wasn't imported
function ArrowRight(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
        </svg>
    )
}
