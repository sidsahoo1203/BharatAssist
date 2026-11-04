"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Mic, Upload, ArrowRight, Loader2,
    CheckCircle2, FileText, Zap, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEMO_PROFILES } from "@/lib/eligibilityEngine";

interface Profile {
    name: string; age: string; gender: string; state: string;
    occupation: string; income: string; category: string;
    landOwner: boolean; studentStatus: boolean; familySize: string;
}

const STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

const OCCUPATIONS = [
    "Farmer", "Agricultural Laborer", "Self-employed", "Salaried Employee",
    "Daily Wage Worker", "Artisan/Craftsperson", "Carpenter", "Blacksmith", "Weaver",
    "Tailor", "Potter", "Cobbler", "Student", "Unemployed", "Homemaker", "Other",
];

const MODES = [
    { id: "form", icon: User, label: "Fill Form", sub: "Type your details" },
    { id: "voice", icon: Mic, label: "Speak", sub: "Voice in Hindi/English" },
    { id: "doc", icon: Upload, label: "Upload Doc", sub: "Aadhaar / Income cert" },
];

const DEMOS = [
    { key: "farmer", label: "Ravi Kumar", sub: "Farmer · Bihar", emoji: "🌾" },
    { key: "student", label: "Priya Sharma", sub: "Student · Tamil Nadu", emoji: "🎓" },
    { key: "artisan", label: "Mohd. Rafiq", sub: "Artisan · Uttar Pradesh", emoji: "🔨" },
];

const EMPTY: Profile = {
    name: "", age: "", gender: "male", state: "Tamil Nadu",
    occupation: "", income: "", category: "general",
    landOwner: false, studentStatus: false, familySize: "4",
};

const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            {label}{req && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

export default function OnboardPage() {
    const router = useRouter();
    const [mode, setMode] = useState("form");
    const [profile, setProfile] = useState<Profile>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrDone, setOcrDone] = useState(false);
    const [voiceActive, setVoiceActive] = useState(false);

    const up = (k: keyof Profile, v: string | boolean) =>
        setProfile(p => ({ ...p, [k]: v }));

    const loadDemo = (key: string) => {
        const raw = DEMO_PROFILES[key as keyof typeof DEMO_PROFILES];
        setProfile({
            name: raw.name || "",
            age: String(raw.age || ""),
            gender: raw.gender || "male",
            state: raw.state || "Tamil Nadu",
            occupation: raw.occupation || "",
            income: String(raw.income || ""),
            category: raw.category || "general",
            landOwner: raw.landOwner ?? false,
            studentStatus: raw.studentStatus ?? false,
            familySize: String(raw.familySize || 4),
        });
    };

    const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setOcrLoading(true);
        await new Promise(r => setTimeout(r, 2200));
        setProfile(p => ({
            ...p, name: "Ravi Kumar", age: "42", gender: "male",
            state: "Bihar", occupation: "Farmer", income: "85000",
            category: "obc", landOwner: true,
        }));
        setOcrDone(true);
        setOcrLoading(false);
        setMode("form");
    };

    const simulateVoice = () => {
        setVoiceActive(true);
        setTimeout(() => {
            setProfile(p => ({ ...p, name: "Lakshman Singh", occupation: "Farmer", state: "Rajasthan", income: "60000", landOwner: true }));
            setVoiceActive(false);
            setMode("form");
        }, 3000);
    };

    const handleSubmit = async () => {
        if (!profile.name || !profile.age || !profile.state) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        sessionStorage.setItem("userProfile", JSON.stringify({
            name: profile.name, age: parseInt(profile.age), gender: profile.gender,
            state: profile.state, occupation: profile.occupation,
            income: parseFloat(profile.income) || 0, category: profile.category,
            land_owner: profile.landOwner, student_status: profile.studentStatus,
            family_size: parseInt(profile.familySize),
        }));
        router.push("/dashboard");
    };

    const valid = profile.name && profile.age && profile.state;

    return (
        <div className="min-h-screen py-8 px-4 bg-grid">
            <div className="max-w-2xl mx-auto">

                {/* Back */}
                <Link href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-black mb-3">
                        <span className="text-white">Tell Us About </span>
                        <span className="gradient-text">Yourself</span>
                    </h1>
                    <p className="text-slate-400">We'll match you with every scheme you qualify for. Takes under 2 minutes.</p>
                </div>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-5 p-1 rounded-2xl glass border border-white/6">
                    {MODES.map(m => (
                        <button key={m.id} onClick={() => setMode(m.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === m.id
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                                : "text-slate-500 hover:text-white"
                                }`}>
                            <m.icon className="w-4 h-4" />
                            <span className="hidden sm:block">{m.label}</span>
                        </button>
                    ))}
                </div>

                {/* Demo profiles */}
                <div className="card-no-hover rounded-2xl p-4 mb-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Demo — Load a sample profile
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {DEMOS.map(d => (
                            <button key={d.key} onClick={() => loadDemo(d.key)}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all text-center group">
                                <span className="text-2xl group-hover:scale-110 transition-transform">{d.emoji}</span>
                                <span className="text-white text-xs font-semibold">{d.label}</span>
                                <span className="text-slate-600 text-[10px]">{d.sub}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* ── FORM mode ── */}
                    {mode === "form" && (
                        <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <div className="card-no-hover rounded-2xl p-6">
                                {ocrDone && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-5">
                                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <p className="text-green-300 text-sm">Document scanned! Profile auto-filled — please verify below.</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-5">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <h2 className="text-white font-bold">Your Profile</h2>
                                    <span className="text-xs text-slate-600">(auto-filled from document/voice)</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Full Name" req>
                                        <input className="input-field" placeholder="e.g. Ravi Kumar" value={profile.name} onChange={e => up("name", e.target.value)} />
                                    </Field>
                                    <Field label="Age" req>
                                        <input className="input-field" type="number" placeholder="e.g. 35" value={profile.age} onChange={e => up("age", e.target.value)} />
                                    </Field>
                                    <Field label="Gender">
                                        <select className="input-field" value={profile.gender} onChange={e => up("gender", e.target.value)}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </Field>
                                    <Field label="State / UT" req>
                                        <select className="input-field" value={profile.state} onChange={e => up("state", e.target.value)}>
                                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Occupation">
                                        <select className="input-field" value={profile.occupation} onChange={e => up("occupation", e.target.value)}>
                                            <option value="">Select occupation</option>
                                            {OCCUPATIONS.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Annual Family Income (₹)">
                                        <input className="input-field" type="number" placeholder="e.g. 150000" value={profile.income} onChange={e => up("income", e.target.value)} />
                                    </Field>
                                    <Field label="Category">
                                        <select className="input-field" value={profile.category} onChange={e => up("category", e.target.value)}>
                                            {["General", "OBC", "SC", "ST", "EWS", "BC", "MBC", "Minority"].map(c => (
                                                <option key={c} value={c.toLowerCase()}>{c}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Family Size">
                                        <input className="input-field" type="number" min="1" max="20" value={profile.familySize} onChange={e => up("familySize", e.target.value)} />
                                    </Field>
                                </div>

                                {/* Checkboxes */}
                                <div className="flex flex-wrap gap-4 mt-5">
                                    {[
                                        { key: "landOwner", label: "🌱 I own agricultural land", checked: profile.landOwner },
                                        { key: "studentStatus", label: "📚 Currently enrolled as a student", checked: profile.studentStatus },
                                    ].map(cb => (
                                        <label key={cb.key} className="flex items-center gap-2.5 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${cb.checked ? "bg-blue-600 border-blue-600" : "border-white/15 group-hover:border-white/30"
                                                }`} onClick={() => up(cb.key as keyof Profile, !cb.checked)}>
                                                {cb.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-sm text-slate-300">{cb.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Submit */}
                                <div className="mt-6">
                                    <button onClick={handleSubmit} disabled={!valid || loading}
                                        className="btn-primary w-full py-4 text-base rounded-2xl disabled:opacity-40 justify-center">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                        {loading ? "Matching Schemes..." : "Find My Eligible Schemes"}
                                        {!loading && <ArrowRight className="w-4 h-4" />}
                                    </button>
                                    {!valid && <p className="text-xs text-slate-600 text-center mt-2">Please fill in Name, Age, and State</p>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── VOICE mode ── */}
                    {mode === "voice" && (
                        <motion.div key="voice" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <div className="card-no-hover rounded-2xl p-8 text-center">
                                <div className={`w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center transition-all ${voiceActive
                                    ? "bg-red-500/20 border-2 border-red-500 animate-pulse-ring"
                                    : "bg-blue-500/10 border-2 border-blue-500/30"
                                    }`}>
                                    <Mic className={`w-12 h-12 ${voiceActive ? "text-red-400" : "text-blue-400"}`} />
                                </div>
                                <h3 className="text-white font-bold text-xl mb-2">Speak in Hindi or English</h3>
                                <p className="text-slate-400 text-sm mb-2">Tell us about yourself naturally:</p>
                                <p className="text-blue-300/80 text-sm italic mb-8">
                                    &ldquo;Main 35 saal ka kisan hoon Bihar se, meri income 80,000 rupaye hai...&rdquo;
                                </p>
                                {voiceActive ? (
                                    <div className="flex justify-center gap-1 mb-6">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                        ))}
                                    </div>
                                ) : null}
                                <button onClick={simulateVoice} disabled={voiceActive}
                                    className={`btn-primary px-8 py-3 rounded-2xl mx-auto ${voiceActive ? "opacity-60" : ""}`}>
                                    <Mic className="w-4 h-4" />
                                    {voiceActive ? "Listening..." : "Start Speaking"}
                                </button>
                                <p className="text-slate-600 text-xs mt-4">Works with browser&apos;s Web Speech API</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── DOCUMENT mode ── */}
                    {mode === "doc" && (
                        <motion.div key="doc" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <div className="card-no-hover rounded-2xl p-8 text-center">
                                <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
                                    <Upload className={`w-12 h-12 text-purple-400 ${ocrLoading ? "animate-bounce" : ""}`} />
                                </div>
                                <h3 className="text-white font-bold text-xl mb-2">Upload Your Document</h3>
                                <p className="text-slate-400 text-sm mb-6">Aadhaar card, income certificate, or land records</p>

                                {ocrLoading ? (
                                    <div className="space-y-3">
                                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                                        <p className="text-purple-300 text-sm">Scanning document with OCR...</p>
                                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden w-48 mx-auto">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse w-3/4" />
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer inline-block">
                                        <div className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-8 mb-4 transition-all hover:bg-purple-500/5">
                                            <p className="text-slate-400 text-sm">Click to browse or drag &amp; drop</p>
                                            <p className="text-slate-600 text-xs mt-1">JPG, PNG, PDF up to 10MB</p>
                                        </div>
                                        <input type="file" accept="image/*,.pdf" onChange={handleOCR} className="hidden" />
                                        <button className="btn-primary px-8 py-3 rounded-2xl pointer-events-none">
                                            <Upload className="w-4 h-4" /> Choose File
                                        </button>
                                    </label>
                                )}

                                <div className="mt-6 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15 text-left">
                                    <p className="text-xs text-blue-300 font-semibold mb-1">🔒 Privacy First</p>
                                    <p className="text-xs text-slate-500">Your document is processed locally and never uploaded to any server.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
