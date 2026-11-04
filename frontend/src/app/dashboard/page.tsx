"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    RefreshCw, Share2, CheckCircle2, AlertCircle,
    XCircle, ChevronDown, ChevronUp, ExternalLink, FileText,
    Mic, BarChart3, Search, TrendingUp, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { DEMO_PROFILES } from "@/lib/eligibilityEngine";
import { formatCurrency } from "@/lib/utils";
import type { SchemeMatch } from "@/lib/schemes";

const QUICK_ACTIONS = [
    { label: "Voice Assistant", href: "/voice", icon: Mic, color: "#8b5cf6" },
    { label: "Visual Charts", href: "/visual", icon: BarChart3, color: "#06b6d4" },
    { label: "Fill Application", href: "/form", icon: FileText, color: "#22c55e" },
    { label: "Browse Schemes", href: "/schemes", icon: Search, color: "#f59e0b" },
];

function SchemeCard({ match, defaultOpen = false }: { match: SchemeMatch; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    const pct = match.matchScore;
    const barColor = pct === 100 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="card-no-hover rounded-2xl overflow-hidden border border-white/6 hover:border-white/10 transition-all">
            {/* Card header - always visible */}
            <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/2 transition-colors">
                <span className="text-2xl flex-shrink-0">{match.scheme.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white font-semibold text-sm truncate">{match.scheme.name}</p>
                    </div>
                    <p className="text-slate-500 text-xs truncate">{match.scheme.ministry}</p>
                    {/* Progress bar */}
                    <div className="progress-bar mt-2 w-full">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-black text-base" style={{ color: match.scheme.color }}>{formatCurrency(match.scheme.benefitAmount)}</p>
                    <p className="text-xs" style={{ color: barColor }}>{pct}% match</p>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0" />}
            </button>

            {/* Expanded detail */}
            {open && (
                <div className="px-4 pb-4 border-t border-white/5">
                    <p className="text-slate-400 text-xs leading-relaxed my-3">{match.scheme.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {match.metCriteria.length > 0 && (
                            <div className="p-3 rounded-xl bg-green-500/6 border border-green-500/12">
                                <p className="text-green-400 text-xs font-bold mb-1.5">✓ Criteria Met</p>
                                {match.metCriteria.map((c, i) => (
                                    <p key={i} className="text-slate-400 text-xs flex items-start gap-1.5 mb-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />{c}
                                    </p>
                                ))}
                            </div>
                        )}
                        {match.missingCriteria.length > 0 && (
                            <div className="p-3 rounded-xl bg-amber-500/6 border border-amber-500/12">
                                <p className="text-amber-400 text-xs font-bold mb-1.5">⚠ Missing</p>
                                {match.missingCriteria.map((c, i) => (
                                    <p key={i} className="text-slate-400 text-xs flex items-start gap-1.5 mb-1">
                                        <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />{c}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Documents */}
                    <div className="mb-3">
                        <p className="text-xs text-slate-500 font-semibold mb-2">Required Documents:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {match.scheme.requiredDocuments.map((d, i) => (
                                <span key={i} className="badge badge-blue">{d}</span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                        <a href={match.scheme.applicationLink} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all"
                            style={{ background: match.scheme.color + "25", border: `1px solid ${match.scheme.color}40` }}>
                            Apply Online <ExternalLink className="w-3 h-3" />
                        </a>
                        <Link href={`/form?scheme=${match.scheme.id}`} className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/18 transition-all">
                                Auto-Fill PDF <FileText className="w-3 h-3" />
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default function DashboardPage() {
    // Result shape matches FastAPI response
    const [results, setResults] = useState<{
        eligible: SchemeMatch[],
        almost: SchemeMatch[],
        not_eligible: SchemeMatch[],
        total_benefit: number,
        summary: string
    } | null>(null);
    const [profile, setProfile] = useState<{ name?: string;[key: string]: unknown }>({});
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const stored = sessionStorage.getItem("userProfile");
                const p = stored ? JSON.parse(stored) : DEMO_PROFILES.farmer;
                setProfile(p);

                const profilePayload = {
                    name: p.name || "",
                    age: p.age || 25,
                    gender: p.gender || "male",
                    state: p.state || "",
                    occupation: p.occupation || "",
                    income: p.income || 0,
                    category: p.category || "General",
                    land_owner: p.land_owner || false,
                    student_status: p.student_status || false,
                    family_size: p.family_size || 4
                };

                const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
                const res = await fetch(`${apiBase}/schemes/match`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profile: profilePayload })
                });

                if (!res.ok) throw new Error("Failed to fetch matches from Python API");
                const data = await res.json();

                // Map API response to Component props
                const mappedResults = {
                    eligible: data.eligible.map((s: any) => ({ scheme: s, matchScore: s.match.score, metCriteria: s.match.met, missingCriteria: s.match.missing })),
                    almost: data.almost.map((s: any) => ({ scheme: s, matchScore: s.match.score, metCriteria: s.match.met, missingCriteria: s.match.missing })),
                    not_eligible: data.not_eligible.map((s: any) => ({ scheme: s, matchScore: s.match.score, metCriteria: s.match.met, missingCriteria: s.match.missing })),
                    total_benefit: data.total_benefit,
                    summary: data.summary
                };

                setResults(mappedResults);
            } catch (err: any) {
                console.error("API error:", err);
                setError("Please ensure the FastAPI backend is running on port 8000.");
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    const share = async () => {
        const text = `I found ${results?.eligible.length} schemes worth ${formatCurrency(results?.total_benefit ?? 0)} per year using BharatAssist AI! Check your eligibility at bharatassistai.in`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
        }
    };

    if (error) return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl max-w-lg">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Backend Connection Error</h2>
                <p className="text-slate-400 text-sm">{error}</p>
                <code className="block bg-black mt-4 p-4 rounded-xl text-xs text-left text-slate-300">
                    cd backend<br />
                    pip install -r requirements.txt<br />
                    uvicorn main:app --port 8000
                </code>
            </div>
        </div>
    );

    if (loading || !results) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
    );

    const name = (profile.name as string) || "You";
    const occ = (profile.occupation as string) || "";
    const state = (profile.state as string) || "";
    const income = profile.income as number;
    const cat = (profile.category as string) || "";
    const landOwner = Boolean(profile.land_owner);
    const studentStatus = Boolean(profile.student_status);
    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header row */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/onboard" className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Edit Profile
                    </Link>
                    <div className="hidden md:block">
                        <h1 className="text-3xl font-black gradient-text text-center">Your Eligibility Dashboard</h1>
                        <p className="text-slate-500 text-xs text-center mt-0.5">Based on your profile • {results.eligible.length + results.almost.length + results.not_eligible.length} schemes checked via Python Engine</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/onboard">
                            <button className="btn-ghost text-xs py-1.5 px-3 rounded-lg gap-1.5">
                                <RefreshCw className="w-3.5 h-3.5" /> Update
                            </button>
                        </Link>
                        <button onClick={share} className="btn-ghost text-xs py-1.5 px-3 rounded-lg gap-1.5">
                            <Share2 className="w-3.5 h-3.5" />
                            {copied ? "Copied!" : "Share"}
                        </button>
                    </div>
                </div>
                <div className="md:hidden text-center mb-4">
                    <h1 className="text-2xl font-black gradient-text">Your Dashboard</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6">

                    {/* ── Left: Profile ── */}
                    <div className="space-y-4">
                        {/* Avatar + name */}
                        <div className="card-no-hover rounded-2xl p-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl mb-3">
                                {name[0]?.toUpperCase()}
                            </div>
                            <h2 className="text-white font-bold text-lg">{name}</h2>
                            <div className="space-y-1.5 mt-3">
                                {[
                                    { label: "Age", val: profile.age ? `${profile.age} Yrs • ${profile.gender === "male" ? "Male" : "Female"}` : "—" },
                                    { label: "State", val: state || "—" },
                                    { label: "Occupation", val: occ || "—" },
                                    { label: "Income", val: income ? `₹${income.toLocaleString("en-IN")}/Yr` : "—" },
                                ].map(r => (
                                    <div key={r.label} className="flex justify-between text-xs">
                                        <span className="text-slate-500">{r.label}</span>
                                        <span className="text-slate-300 font-medium capitalize">{r.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {cat && <span className="badge badge-blue capitalize">{cat}</span>}
                                {landOwner && <span className="badge badge-green">🌱 Land Owner</span>}
                                {studentStatus && <span className="badge badge-blue">📚 Student</span>}
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="card-no-hover rounded-2xl p-4">
                            <p className="section-label mb-3">Quick Actions</p>
                            <div className="space-y-2">
                                {QUICK_ACTIONS.map(a => (
                                    <Link key={a.href} href={a.href}>
                                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/4 transition-colors group cursor-pointer">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.color + "18" }}>
                                                <a.icon className="w-4 h-4" style={{ color: a.color }} />
                                            </div>
                                            <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{a.label}</span>
                                            <span className="ml-auto text-slate-600 group-hover:text-slate-400 text-xs">→</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Center: Scheme Results ── */}
                    <div className="space-y-5">
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Fully Eligible", count: results.eligible.length, icon: CheckCircle2, color: "#22c55e", bg: "bg-green-500/8 border-green-500/15" },
                                { label: "Almost", count: results.almost.length, icon: AlertCircle, color: "#f59e0b", bg: "bg-amber-500/8 border-amber-500/15" },
                                { label: "Not Eligible", count: results.not_eligible.length, icon: XCircle, color: "#ef4444", bg: "bg-red-500/8 border-red-500/15" },
                            ].map(s => (
                                <div key={s.label} className={`rounded-2xl p-4 border text-center ${s.bg}`}>
                                    <p className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.count}</p>
                                    <p className="text-xs text-slate-500">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Eligible */}
                        {results.eligible.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <h3 className="text-white font-bold text-sm">Fully Eligible <span className="badge badge-green ml-1">{results.eligible.length}</span></h3>
                                </div>
                                <div className="space-y-2">
                                    {results.eligible.map((m, i) => <SchemeCard key={m.scheme.id} match={m} defaultOpen={i === 0} />)}
                                </div>
                            </div>
                        )}

                        {/* Almost */}
                        {results.almost.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-white font-bold text-sm">Almost Eligible <span className="badge badge-amber ml-1">{results.almost.length}</span></h3>
                                </div>
                                <div className="space-y-2">
                                    {results.almost.map(m => <SchemeCard key={m.scheme.id} match={m} />)}
                                </div>
                            </div>
                        )}

                        {/* Not eligible */}
                        {results.not_eligible.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <h3 className="text-white font-bold text-sm">Not Eligible Currently <span className="badge badge-red ml-1">{results.not_eligible.length}</span></h3>
                                </div>
                                <div className="space-y-2">
                                    {results.not_eligible.map(m => <SchemeCard key={m.scheme.id} match={m} />)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Summary ── */}
                    <div className="space-y-4">
                        {/* Total benefit card */}
                        <div className="rounded-2xl p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <p className="text-green-300 text-xs font-bold uppercase tracking-wide">Your Benefit Summary</p>
                            </div>
                            <p className="text-slate-400 text-xs mb-2">You are eligible for <strong className="text-green-400">{results.eligible.length} schemes</strong> worth</p>
                            <p className="text-4xl font-black gradient-text-green mb-0.5">{formatCurrency(results.total_benefit)}</p>
                            <p className="text-slate-500 text-xs">per year</p>
                        </div>

                        {/* Per-scheme breakdown */}
                        <div className="card-no-hover rounded-2xl p-4">
                            <p className="section-label mb-3">Benefits Breakdown</p>
                            <div className="space-y-3">
                                {results.eligible.map(m => (
                                    <div key={m.scheme.id} className="flex items-center gap-3">
                                        <span className="text-lg flex-shrink-0">{m.scheme.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-300 text-xs font-medium truncate">{m.scheme.name.split("(")[0].trim()}</p>
                                            <p className="text-slate-600 text-xs capitalize">{m.scheme.category}</p>
                                        </div>
                                        <span className="text-xs font-black flex-shrink-0" style={{ color: m.scheme.color }}>{formatCurrency(m.scheme.benefitAmount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/5 pt-3 mt-3 flex justify-between">
                                <span className="text-slate-400 text-xs">Total / Year</span>
                                <span className="text-white font-black text-sm">{formatCurrency(results.total_benefit)}</span>
                            </div>
                        </div>

                        {/* Tips */}
                        {results.almost.length > 0 && (
                            <div className="card-no-hover rounded-2xl p-4">
                                <p className="section-label mb-3 text-amber-400">💡 Improvement Tips</p>
                                <div className="space-y-3">
                                    {results.almost.slice(0, 2).map(m => (
                                        <div key={m.scheme.id} className="p-3 rounded-xl bg-amber-500/6 border border-amber-500/12">
                                            <p className="text-amber-300 font-bold text-xs mb-1">{m.scheme.name.split("(")[0].trim()}</p>
                                            <p className="text-slate-500 text-xs">Must be: {m.missingCriteria.join(", ")}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FormFriend CTA */}
                        <div className="card-no-hover rounded-2xl p-4 border-glow-blue">
                            <p className="text-white font-bold text-sm mb-1">📝 Auto-Fill Applications</p>
                            <p className="text-slate-500 text-xs mb-3">FormFriend fills your forms automatically. Download PDF in seconds.</p>
                            <Link href="/form">
                                <button className="btn-green w-full py-2.5 rounded-xl text-sm justify-center">
                                    Open FormFriend →
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
