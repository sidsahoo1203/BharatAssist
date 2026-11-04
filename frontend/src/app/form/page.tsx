"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Download,
    FileText,
    Loader2,
    User,
    MapPin,
    Phone,
    Calendar,
    Briefcase,
    CreditCard,
} from "lucide-react";
import Link from "next/link";
import { schemes, Scheme } from "@/lib/schemes";
import { DEMO_PROFILES } from "@/lib/eligibilityEngine";

interface FormData {
    // Personal
    applicantName: string;
    dob: string;
    gender: string;
    fatherName: string;
    motherName: string;
    // Address
    address: string;
    village: string;
    district: string;
    state: string;
    pincode: string;
    mobile: string;
    // Financial
    aadhaarNo: string;
    bankAccount: string;
    ifscCode: string;
    bankName: string;
    // Scheme specific
    occupation: string;
    income: string;
    category: string;
    landArea: string;
}

const STEPS = [
    { id: 1, label: "Select Scheme", icon: FileText },
    { id: 2, label: "Personal Info", icon: User },
    { id: 3, label: "Address", icon: MapPin },
    { id: 4, label: "Bank & ID", icon: CreditCard },
    { id: 5, label: "Preview & Download", icon: Download },
];

function FormFriendContent() {
    const searchParams = useSearchParams();
    const preSelectedId = searchParams.get("scheme");

    const [step, setStep] = useState(preSelectedId ? 2 : 1);
    const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(
        preSelectedId ? schemes.find((s) => s.id === preSelectedId) || null : null
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [pdfDone, setPdfDone] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        applicantName: "",
        dob: "",
        gender: "Male",
        fatherName: "",
        motherName: "",
        address: "",
        village: "",
        district: "",
        state: "",
        pincode: "",
        mobile: "",
        aadhaarNo: "",
        bankAccount: "",
        ifscCode: "",
        bankName: "",
        occupation: "",
        income: "",
        category: "General",
        landArea: "",
    });

    useEffect(() => {
        // Auto-fill from stored profile
        const stored = sessionStorage.getItem("userProfile");
        const profile = stored ? JSON.parse(stored) : DEMO_PROFILES.farmer;
        setFormData((prev) => ({
            ...prev,
            applicantName: profile.name || "",
            state: profile.state || "",
            occupation: profile.occupation || "",
            income: profile.income?.toString() || "",
            category: profile.category || "General",
            gender: profile.gender === "male" ? "Male" : profile.gender === "female" ? "Female" : "Other",
            // Demo defaults
            aadhaarNo: "XXXX XXXX 4521",
            bankAccount: "3847XXXXXXX891",
            ifscCode: "SBIN0001234",
            bankName: "State Bank of India",
            mobile: "98XXXXXX34",
            district: "Patna",
            pincode: "800001",
        }));
    }, []);

    const updateForm = (key: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const scheme = selectedScheme!;
            const profilePayload = {
                name: formData.applicantName || "",
                age: 25, // Mock defaults for missing form fields since this is a demo
                gender: formData.gender || "Male",
                state: formData.state || "",
                occupation: formData.occupation || "",
                income: formData.income ? parseFloat(formData.income) : 0,
                category: formData.category || "General",
                land_owner: formData.landArea ? parseFloat(formData.landArea) > 0 : false,
            };

            const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
            const response = await fetch(`${apiBase}/form/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheme_id: scheme.id, profile: profilePayload })
            });

            if (!response.ok) throw new Error("Failed to generate PDF from backend");

            // We get a PDF blob back
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${scheme.id}_application.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setPdfDone(true);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Could not connect to FastAPI backend on port 8000 to generate the PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    const InputField = ({ label, field, type = "text", placeholder }: {
        label: string; field: keyof FormData; type?: string; placeholder?: string
    }) => (
        <div>
            <label className="block text-slate-400 text-xs mb-1.5">{label}</label>
            <input
                type={type}
                value={formData[field]}
                onChange={(e) => updateForm(field, e.target.value)}
                placeholder={placeholder || label}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
        </div>
    );

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Link>
                    <div className="text-center">
                        <h1 className="text-3xl font-black gradient-text">FormFriend AI</h1>
                        <p className="text-slate-400 text-sm">Auto-fill government applications</p>
                    </div>
                    <div className="w-24" />
                </div>

                {/* Progress steps */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center flex-shrink-0">
                            <div className={`flex flex-col items-center gap-1 ${step >= s.id ? "opacity-100" : "opacity-40"}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step > s.id ? "bg-green-500" : step === s.id ? "bg-blue-500" : "bg-white/10"
                                    }`}>
                                    {step > s.id ? <CheckCircle2 className="w-4 h-4 text-white" /> : <s.icon className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`w-10 md:w-16 h-0.5 mx-2 mb-5 transition-all ${step > s.id ? "bg-green-500" : "bg-white/10"}`} />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: Select Scheme */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                <h2 className="text-xl font-bold text-white mb-4">Select a Scheme to Apply For</h2>
                                <div className="space-y-3">
                                    {schemes.map((s) => (
                                        <motion.div
                                            key={s.id}
                                            onClick={() => { setSelectedScheme(s); setStep(2); }}
                                            whileHover={{ scale: 1.01 }}
                                            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${selectedScheme?.id === s.id
                                                ? "border-blue-500/50 bg-blue-500/10"
                                                : "border-white/5 hover:border-white/10 bg-white/3"
                                                }`}
                                        >
                                            <span className="text-2xl flex-shrink-0">{s.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-sm">{s.name}</p>
                                                <p className="text-slate-400 text-xs truncate">{s.benefitDescription}</p>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: s.color + "20", color: s.color }}>
                                                {s.category}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Personal */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                {selectedScheme && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-6">
                                        <span className="text-xl">{selectedScheme.icon}</span>
                                        <p className="text-white font-semibold text-sm">{selectedScheme.name}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <h2 className="text-lg font-bold text-white">Personal Information</h2>
                                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Auto-filled ✓</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Full Name *" field="applicantName" />
                                    <InputField label="Date of Birth" field="dob" type="date" />
                                    <div>
                                        <label className="block text-slate-400 text-xs mb-1.5">Gender</label>
                                        <select value={formData.gender} onChange={(e) => updateForm("gender", e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
                                            {["Male", "Female", "Other"].map((g) => <option key={g} value={g} className="bg-gray-900">{g}</option>)}
                                        </select>
                                    </div>
                                    <InputField label="Category" field="category" />
                                    <InputField label="Father's Name" field="fatherName" />
                                    <InputField label="Mother's Name" field="motherName" />
                                    <InputField label="Mobile Number" field="mobile" type="tel" />
                                    <InputField label="Occupation" field="occupation" />
                                    <InputField label="Annual Income (₹)" field="income" type="number" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Address */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-5">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                    <h2 className="text-lg font-bold text-white">Address Details</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <InputField label="Full Address" field="address" placeholder="House No, Street, Area" />
                                    </div>
                                    <InputField label="Village / Ward / Locality" field="village" />
                                    <InputField label="District" field="district" />
                                    <InputField label="State" field="state" />
                                    <InputField label="PIN Code" field="pincode" type="number" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Bank & ID */}
                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-5">
                                    <CreditCard className="w-4 h-4 text-blue-400" />
                                    <h2 className="text-lg font-bold text-white">Bank & ID Details</h2>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-5">
                                    <p className="text-blue-300 text-xs">🔒 Secure: Your details are only used for PDF generation and never stored on servers.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Aadhaar Number" field="aadhaarNo" placeholder="XXXX XXXX XXXX" />
                                    <InputField label="Bank Account Number" field="bankAccount" />
                                    <InputField label="IFSC Code" field="ifscCode" placeholder="e.g. SBIN0001234" />
                                    <InputField label="Bank Name" field="bankName" />
                                    <div className="md:col-span-2">
                                        <InputField label="Land Area (if applicable, in acres)" field="landArea" type="number" placeholder="e.g. 2.5" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 5: Preview & Download */}
                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                            <div className="glass rounded-3xl p-6 border border-white/5">
                                <h2 className="text-lg font-bold text-white mb-4">Application Preview</h2>

                                <div className="bg-white/3 rounded-2xl p-5 mb-6 space-y-3">
                                    <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                                        <span className="text-2xl">{selectedScheme?.icon}</span>
                                        <div>
                                            <p className="text-white font-bold">{selectedScheme?.name}</p>
                                            <p className="text-slate-400 text-xs">{selectedScheme?.ministry}</p>
                                        </div>
                                    </div>
                                    {Object.entries({
                                        "Name": formData.applicantName,
                                        "Gender": formData.gender,
                                        "District": formData.district,
                                        "State": formData.state,
                                        "Mobile": formData.mobile,
                                        "Aadhaar": formData.aadhaarNo,
                                        "Bank": formData.bankName,
                                        "IFSC": formData.ifscCode,
                                    }).map(([key, val]) => val && (
                                        <div key={key} className="grid grid-cols-2 text-sm">
                                            <span className="text-slate-400">{key}</span>
                                            <span className="text-white">{val}</span>
                                        </div>
                                    ))}
                                </div>

                                {!pdfDone ? (
                                    <motion.button
                                        onClick={generatePDF}
                                        disabled={isGenerating}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black text-lg flex items-center justify-center gap-3 disabled:opacity-70"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" />Generating PDF...</>
                                        ) : (
                                            <><Download className="w-5 h-5" />Download Pre-filled PDF</>
                                        )}
                                    </motion.button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                                            <p className="text-green-300 font-bold">PDF Downloaded Successfully!</p>
                                        </div>
                                        <button
                                            onClick={() => setPdfDone(false)}
                                            className="w-full py-3 rounded-2xl glass border border-white/10 text-slate-300 text-sm hover:text-white"
                                        >
                                            Download Again
                                        </button>
                                        <Link href="/dashboard">
                                            <button className="w-full py-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold hover:bg-blue-500/30 transition-all">
                                                Back to Dashboard
                                            </button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation buttons */}
                {step > 1 && step < 5 && (
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-1 py-3 rounded-2xl glass border border-white/10 text-slate-300 font-semibold hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                            onClick={() => setStep((s) => s + 1)}
                            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2"
                        >
                            {step === 4 ? "Preview Form" : "Next"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function FormPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
        }>
            <FormFriendContent />
        </Suspense>
    );
}
