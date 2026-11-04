"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Search, ExternalLink, FileText, ArrowLeft, CheckCircle2,
    Loader2, Filter, X
} from "lucide-react";
import Link from "next/link";
import { schemes } from "@/lib/schemes";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = ["All", "Agriculture", "Health", "Education", "Housing", "Skill & Livelihood", "Women & Child"];

function SchemesContent() {
    const searchParams = useSearchParams();
    const initCat = searchParams.get("cat") || "";

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState(
        initCat === "agriculture" ? "Agriculture" :
            initCat === "education" ? "Education" :
                initCat === "health" ? "Health" : "All"
    );

    const filtered = schemes.filter((s) => {
        const matchCat = category === "All" || s.category === category;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some(t => t.toLowerCase().includes(q)) ||
            s.category.toLowerCase().includes(q);
        return matchCat && matchSearch;
    });

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Home
                    </Link>
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-black gradient-text">Government Schemes</h1>
                        <p className="text-slate-500 text-xs mt-1">{schemes.length} schemes in our database</p>
                    </div>
                    <Link href="/onboard">
                        <button className="btn-primary text-xs py-2 px-4 rounded-xl">Check Eligibility →</button>
                    </Link>
                </div>

                {/* Search + filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, category, keyword..."
                            className="input-field pl-10 pr-10"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {/* Category tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${category === cat
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                                        : "btn-ghost py-2 px-3.5"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Result count */}
                <div className="flex items-center gap-2 mb-5 text-xs text-slate-500">
                    <Filter className="w-3.5 h-3.5" />
                    Showing <span className="text-white font-bold">{filtered.length}</span> of {schemes.length} schemes
                    {(search || category !== "All") && (
                        <button onClick={() => { setSearch(""); setCategory("All"); }} className="text-blue-400 hover:text-blue-300 ml-1">Clear filters</button>
                    )}
                </div>

                {/* Schemes grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((scheme, i) => (
                        <motion.div
                            key={scheme.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="card p-5 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                    style={{ background: scheme.color + "15", border: `1px solid ${scheme.color}25` }}>
                                    {scheme.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-sm leading-tight mb-0.5">{scheme.name}</h3>
                                    <p className="text-slate-600 text-xs truncate">{scheme.ministry}</p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
                                    style={{ background: scheme.color + "18", color: scheme.color }}>
                                    {scheme.category}
                                </span>
                            </div>

                            {/* Benefit highlight */}
                            <div className="rounded-xl p-3 mb-4" style={{ background: scheme.color + "0C", border: `1px solid ${scheme.color}20` }}>
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">Annual Benefit</p>
                                <p className="text-2xl font-black" style={{ color: scheme.color }}>{formatCurrency(scheme.benefitAmount)}</p>
                                <p className="text-slate-400 text-xs mt-0.5">{scheme.benefitDescription}</p>
                            </div>

                            {/* Description */}
                            <p className="text-slate-500 text-xs leading-relaxed mb-4 flex-1 line-clamp-3">{scheme.description}</p>

                            {/* Documents */}
                            <div className="mb-4">
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mb-2">Documents Required</p>
                                <div className="flex flex-wrap gap-1">
                                    {scheme.requiredDocuments.slice(0, 3).map((d, j) => (
                                        <span key={j} className="badge badge-blue text-[10px]">{d}</span>
                                    ))}
                                    {scheme.requiredDocuments.length > 3 && (
                                        <span className="badge badge-blue text-[10px]">+{scheme.requiredDocuments.length - 3}</span>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mb-4">
                                {scheme.tags.slice(0, 4).map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/4 text-slate-500 border border-white/6">#{tag}</span>
                                ))}
                            </div>

                            {/* Timeline */}
                            <div className="flex items-center gap-1.5 mb-4 text-slate-600 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span>{scheme.timeline}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-auto">
                                <a href={scheme.applicationLink} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                                    style={{ background: scheme.color + "25", border: `1px solid ${scheme.color}40` }}>
                                    Apply <ExternalLink className="w-3 h-3" />
                                </a>
                                <Link href={`/form?scheme=${scheme.id}`} className="flex-1">
                                    <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/18 transition-all">
                                        Auto-Fill <FileText className="w-3 h-3" />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-5xl mb-4">🔍</p>
                        <p className="text-white font-bold text-lg mb-1">No schemes found</p>
                        <p className="text-slate-500 text-sm">Try a different keyword or remove filters</p>
                        <button onClick={() => { setSearch(""); setCategory("All"); }} className="btn-ghost mt-5 text-sm px-5 py-2.5 rounded-xl">
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SchemesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
        }>
            <SchemesContent />
        </Suspense>
    );
}
