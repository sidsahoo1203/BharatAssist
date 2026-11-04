"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    CartesianGrid,
    Legend,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
} from "recharts";
import { ArrowLeft, BarChart3, PieChartIcon, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { matchSchemes, DEMO_PROFILES } from "@/lib/eligibilityEngine";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];

const COMPARISON_DATA = [
    { scheme: "PM-KISAN", benefit: 6000, documents: 4, time: 30 },
    { scheme: "Ayushman", benefit: 500000, documents: 3, time: 7 },
    { scheme: "KCC", benefit: 300000, documents: 4, time: 15 },
    { scheme: "PM Vishwakarma", benefit: 315000, documents: 5, time: 30 },
    { scheme: "NSP", benefit: 75000, documents: 6, time: 45 },
    { scheme: "PMAY", benefit: 250000, documents: 5, time: 60 },
];

const PAYMENT_TIMELINE = [
    { month: "Apr", amount: 2000, scheme: "PM-KISAN Q1" },
    { month: "May", amount: 0 },
    { month: "Jun", amount: 0 },
    { month: "Jul", amount: 0 },
    { month: "Aug", amount: 2000, scheme: "PM-KISAN Q2" },
    { month: "Sep", amount: 25000, scheme: "NSP Scholarship" },
    { month: "Oct", amount: 0 },
    { month: "Nov", amount: 0 },
    { month: "Dec", amount: 2000, scheme: "PM-KISAN Q3" },
    { month: "Jan", amount: 0 },
    { month: "Feb", amount: 0 },
    { month: "Mar", amount: 0 },
];

const RADAR_DATA = [
    { subject: "Agriculture", A: 90, B: 20 },
    { subject: "Health", A: 80, B: 95 },
    { subject: "Education", A: 40, B: 85 },
    { subject: "Housing", A: 60, B: 60 },
    { subject: "Skill Dev", A: 70, B: 50 },
    { subject: "Women", A: 50, B: 75 },
];

const CATEGORY_COVERAGE = [
    { name: "Agriculture", value: 3, color: "#22c55e" },
    { name: "Health", value: 2, color: "#ef4444" },
    { name: "Education", value: 2, color: "#06b6d4" },
    { name: "Housing", value: 1, color: "#0ea5e9" },
    { name: "Skill", value: 1, color: "#8b5cf6" },
    { name: "Women", value: 1, color: "#ec4899" },
];

interface TooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    const p = payload as Array<{ value: number; name: string }>;
    if (active && p && p.length) {
        return (
            <div className="glass border border-white/10 rounded-xl px-4 py-3 text-sm">
                <p className="text-slate-300 mb-1">{label as string}</p>
                {p.map((entry, i) => (
                    <p key={i} style={{ color: entry.name === "benefit" ? "#22c55e" : "#3b82f6" }}>
                        {entry.name === "benefit" ? formatCurrency(entry.value) : `${entry.value} days`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

type TabType = "benefits" | "comparison" | "timeline" | "radar";

export default function VisualPage() {
    const [activeTab, setActiveTab] = useState<TabType>("benefits");
    const [results, setResults] = useState<ReturnType<typeof matchSchemes> | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("userProfile");
        const profile = stored ? JSON.parse(stored) : DEMO_PROFILES.farmer;
        setResults(matchSchemes(profile));
    }, []);

    const benefitData = results?.eligible.map((m) => ({
        name: m.scheme.name.split("(")[0].trim().split(" ").slice(0, 2).join(" "),
        benefit: m.scheme.benefitAmount,
        color: m.scheme.color,
    })) || [];

    const TABS = [
        { id: "benefits" as TabType, label: "Benefits Chart", icon: BarChart3 },
        { id: "comparison" as TabType, label: "Scheme Compare", icon: Activity },
        { id: "timeline" as TabType, label: "Payment Timeline", icon: TrendingUp },
        { id: "radar" as TabType, label: "Coverage Radar", icon: PieChartIcon },
    ];

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-black gradient-text">VisualScheme AI</h1>
                        <p className="text-slate-400 text-sm">Infographic-based scheme insights</p>
                    </div>
                    <div className="w-20" />
                </div>

                {/* Summary cards */}
                {results && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Eligible Schemes", value: results.eligible.length, color: "#22c55e", suffix: "" },
                            { label: "Total Benefits", value: results.totalBenefit, color: "#3b82f6", suffix: "", format: true },
                            { label: "Almost Eligible", value: results.almost.length, color: "#f59e0b", suffix: "" },
                            { label: "Schemes Checked", value: 8, color: "#8b5cf6", suffix: "+" },
                        ].map((item) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass rounded-2xl p-4 text-center border border-white/5"
                            >
                                <p className="text-2xl font-black mb-1" style={{ color: item.color }}>
                                    {item.format ? formatCurrency(item.value) : `${item.value}${item.suffix}`}
                                </p>
                                <p className="text-slate-400 text-xs">{item.label}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Tab bar */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                : "glass border border-white/10 text-slate-400 hover:text-white"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Charts */}
                <div className="space-y-6">
                    {activeTab === "benefits" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Bar chart */}
                                <div className="glass rounded-3xl p-6 border border-white/5">
                                    <h3 className="text-white font-bold mb-4">Eligible Benefits by Scheme (₹)</h3>
                                    {benefitData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={benefitData}>
                                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                                                <Tooltip
                                                    formatter={(v: number | undefined) => [formatCurrency(v ?? 0), "Benefit"]}
                                                    contentStyle={{ background: "#0d1528", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                                    labelStyle={{ color: "#94a3b8" }}
                                                    itemStyle={{ color: "#22c55e" }}
                                                />
                                                <Bar dataKey="benefit" radius={[8, 8, 0, 0]}>
                                                    {benefitData.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-slate-500">
                                            <div className="text-center">
                                                <p className="text-4xl mb-2">📊</p>
                                                <p>No eligible schemes yet</p>
                                                <Link href="/onboard" className="text-blue-400 text-sm mt-2 block">Update profile →</Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Pie chart */}
                                <div className="glass rounded-3xl p-6 border border-white/5">
                                    <h3 className="text-white font-bold mb-4">Schemes by Category</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={CATEGORY_COVERAGE}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={110}
                                                paddingAngle={4}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                labelLine={{ stroke: "#334155" }}
                                            >
                                                {CATEGORY_COVERAGE.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(v: number | undefined) => [`${v ?? 0} schemes`, "Count"]}
                                                contentStyle={{ background: "#0d1528", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                                labelStyle={{ color: "#94a3b8" }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="glass rounded-2xl p-5 border border-white/5">
                                <h4 className="text-white font-semibold mb-4">All Eligible Schemes at a Glance</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {results?.eligible.map((m, i) => (
                                        <div key={m.scheme.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                                            <span className="text-xl">{m.scheme.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-semibold truncate">{m.scheme.name.split("(")[0]}</p>
                                                <p className="text-green-400 text-xs font-bold">{formatCurrency(m.scheme.benefitAmount)}/yr</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "comparison" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                <h3 className="text-white font-bold mb-6">Scheme Comparison — Benefit vs Processing Time</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={COMPARISON_DATA} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="scheme" tick={{ fill: "#64748b", fontSize: 11 }} />
                                        <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} unit=" days" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ color: "#94a3b8" }} />
                                        <Bar yAxisId="left" dataKey="benefit" name="benefit" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="time" name="days" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>

                                {/* Comparison table */}
                                <div className="mt-6 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-slate-500 border-b border-white/5">
                                                <th className="text-left py-2 pr-4">Scheme</th>
                                                <th className="text-right py-2 pr-4">Benefit</th>
                                                <th className="text-right py-2 pr-4">Documents</th>
                                                <th className="text-right py-2">Processing</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {COMPARISON_DATA.map((row, i) => (
                                                <tr key={i} className="border-b border-white/5 text-slate-300">
                                                    <td className="py-3 pr-4 font-medium text-white">{row.scheme}</td>
                                                    <td className="text-right pr-4 text-green-400 font-semibold">{formatCurrency(row.benefit)}</td>
                                                    <td className="text-right pr-4 text-slate-400">{row.documents}</td>
                                                    <td className="text-right text-blue-400">{row.time} days</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "timeline" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                <h3 className="text-white font-bold mb-2">Annual Payment Timeline</h3>
                                <p className="text-slate-400 text-sm mb-6">Monthly benefit disbursements (₹)</p>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={PAYMENT_TIMELINE}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                                        <Tooltip
                                            formatter={(v: number | undefined) => [formatCurrency(v ?? 0), "Amount"]}
                                            contentStyle={{ background: "#0d1528", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                            labelStyle={{ color: "#94a3b8" }}
                                            itemStyle={{ color: "#22c55e" }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            dot={{ fill: "#22c55e", r: 6 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>

                                {/* Timeline events */}
                                <div className="mt-6 space-y-3">
                                    {PAYMENT_TIMELINE.filter((t) => t.amount > 0).map((t, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                                            <div className="w-12 text-center text-green-400 font-bold text-sm">{t.month}</div>
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-medium">{t.scheme}</p>
                                            </div>
                                            <span className="text-green-400 font-black">{formatCurrency(t.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "radar" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                <h3 className="text-white font-bold mb-2">Welfare Coverage Radar</h3>
                                <p className="text-slate-400 text-sm mb-6">Comparing your state's welfare vs national average (%)</p>
                                <ResponsiveContainer width="100%" height={350}>
                                    <RadarChart data={RADAR_DATA}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                        <Radar name="Your State" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                                        <Radar name="National Avg" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                                        <Legend wrapperStyle={{ color: "#94a3b8" }} />
                                        <Tooltip
                                            contentStyle={{ background: "#0d1528", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                                            labelStyle={{ color: "#94a3b8" }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
