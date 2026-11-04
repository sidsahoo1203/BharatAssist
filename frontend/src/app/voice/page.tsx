"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic, Send, Volume2, Bot, User, MicOff, ArrowLeft,
    RefreshCw, X, ChevronRight, Sparkles, Globe
} from "lucide-react";
import Link from "next/link";

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
    time: string;
    typing?: boolean;
}

interface ConversationContext {
    lastTopic: string | null;
    mentionedSchemes: string[];
    userProfile: {
        occupation?: string;
        state?: string;
        category?: string;
        income?: string;
    };
}

// ── Rich knowledge base ──────────────────────────────────────────────────────

const SCHEME_DETAILS: Record<string, {
    summary: string; benefit: string; eligibility: string;
    documents: string; howToApply: string; link: string; emoji: string;
}> = {
    "pm-kisan": {
        emoji: "🌾",
        summary: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) sarkar ki ek scheme hai jisme kisanon ko saal ka ₹6,000 milta hai.",
        benefit: "₹6,000 har saal — ₹2,000 ki 3 kishto mein (April, August, December) seedhe account mein aata hai.",
        eligibility: "Koi bhi kisan parivar jiske paas jameen hai wo apply kar sakta hai. Income limit nahi hai, chote aur bade dono kisan isme aate hain.",
        documents: "1. Aadhaar Card\n2. Zameen ke kagaz (Khasra/Khatauni)\n3. Bank Account (Aadhaar account le linked)\n4. Mobile number",
        howToApply: "Aap pmkisan.gov.in par ja kar 'New Farmer Registration' pe click karein. Ya fir paas ke CSC center ya Taluka office jaa sakte hain.",
        link: "https://pmkisan.gov.in",
    },
    "ayushman": {
        emoji: "🏥",
        summary: "Ayushman Bharat PM-JAY duniya ki sabase badi health insurance scheme hai, jisme garib parivaron ko saal ka ₹5 lakh tak ka ilaj muft milta hai.",
        benefit: "₹5 lakh har saal — sarkari ya empanelled private hospital mein admit hone par.",
        eligibility: "SECC 2011 data mein aane wale parivar. Isme income limit nahi hai, ye economically weak logo ke liye auto-applicable hai.",
        documents: "1. Aadhaar Card\n2. Ration Card (family members ke liye)\n3. Mobile number\n4. Ayushman Card (hospital mein banta hai)",
        howToApply: "Aap mera.pmjay.gov.in par check kar sakte hain. Ya kisi bhi empanelled hospital ja kar apna Aadhaar card dikhayen.",
        link: "https://pmjay.gov.in",
    },
    "kcc": {
        emoji: "💳",
        summary: "Kisan Credit Card se kisanon ko ₹3 lakh tak ka loan sirf 4% byaj par milta hai — private loan se bahut sasta.",
        benefit: "₹3 lakh tak ka credit sirf 4% interest par (sarkar 3% subsidy deti hai). Ye kheti, machinery ya fasal katne ke baad ke kharch ke liye hai.",
        eligibility: "Kisan (akele ya joint), self-help groups, ya tenant farmers. Umar 18 se 75 saal ke beech honi chahiye.",
        documents: "1. Aadhaar Card\n2. Zameen ke kagaz\n3. Passport photo\n4. Bank account details\n5. No-dues certificate",
        howToApply: "Kisi bhi sarkari bank (SBI, PNB), cooperative bank, ya rural bank mein apply karein. Form ke sath zameen ke kagaz dene honge.",
        link: "https://www.nabard.org/content.aspx?id=21",
    },
    "vishwakarma": {
        emoji: "🔨",
        summary: "PM Vishwakarma Yojana mein traditional karigaron ko tool kits, saste loans, aur skill training di jati hai.",
        benefit: "• Free skill training aur ₹500/din stipend\n• ₹15,000 ka toolkit grant\n• ₹1 lakh ka loan sirf 5% interest pe (bina kisi guarantee ke)\n• ₹2 lakh ka dusra loan bhi mil sakta hai",
        eligibility: "18 tarah ke karigar jaise baddhai (carpenter), lohar, mochi, darzi, sunar, aadi. Umar 18-60 saal honi chahiye. Sarkari naukri wale yogy nahi hain.",
        documents: "1. Aadhaar Card\n2. Mobile (Aadhaar linked)\n3. Bank account\n4. Caste certificate (agar hai)\n5. Business ka proof",
        howToApply: "pmvishwakarma.gov.in par jayein → mobile OTP se register karein → digital training poori karein → aur certificate paayen.",
        link: "https://pmvishwakarma.gov.in",
    },
    "scholarship": {
        emoji: "🎓",
        summary: "National Scholarship Portal (NSP) par SC/ST/OBC/minority aur EWS students ke liye 50+ sarkari scholarships milti hain.",
        benefit: "• Pre-matric: ₹1,000 se ₹3,500/mahina\n• Post-matric: ₹3,000 se ₹12,000/mahina\n• Professional courses ke liye ₹75,000/saal tak\n• Minority students: ₹30,000 tak",
        eligibility: "SC/ST/OBC/EWS/minority students. Family income zyada tar ₹2.5 lakh se kam honi chahiye. Kisi valid school/college mein padhai chal rahi ho.",
        documents: "1. Aadhaar Card\n2. Income (Aay) Certificate\n3. Caste/Community Certificate\n4. School/College ka Bonafide\n5. Pichli marksheet\n6. Bank account",
        howToApply: "scholarships.gov.in par jayen → Aadhaar se register karein → scheme chunein → form bharein → documents upload karein. (Deadline yaad rakhein!)",
        link: "https://scholarships.gov.in",
    },
    "pmay": {
        emoji: "🏠",
        summary: "Pradhan Mantri Awas Yojana (PMAY-G gaon ke liye, PMAY-U shehar ke liye) ghar banane ke liye paise ya loan pe subsidy deti hai.",
        benefit: "Gaon: ₹1.2 lakh (plains) ya ₹1.3 lakh (hilly/NE states) seedhi madad.\nShehar: CLSS scheme mein home loan par ₹2.5 lakh tak ki interest subsidy.",
        eligibility: "Aise parivar jinke paas pucca ghar nahi hai. Aay(Income) ₹3 lakh (EWS) ya ₹6 lakh (LIG) se kam ho. SC/ST aur mahilao ko priority.",
        documents: "1. Aadhaar Card\n2. Income Certificate\n3. Bank account\n4. Caste Certificate (agar hai)\n5. Zameen ke papers",
        howToApply: "Gaon ke liye: Gram Panchayat ya block office mein. Shehar ke liye: City municipality ya kisi bhi loan dene wale bank mein apply karein.",
        link: "https://pmayg.nic.in",
    },
};

// ── Multi-turn AI engine ─────────────────────────────────────────────────────

function detectIntent(text: string, ctx: ConversationContext): {
    intent: string; scheme?: string; followUp?: boolean;
} {
    const lower = text.toLowerCase().trim();

    // Follow-up detection
    const followUpWords = [
        "more", "details", "elaborate", "explain", "aur", "batao", "aur batao", "samjhao", "tell me more",
        "how", "kaise", "kab", "apply", "documents", "eligibility", "benefit", "money", "paisa", "kitne", "kitna",
        "और बताओ", "विवरण", "जानकारी", "कैसे", "कब", "फायदा", "दस्तावेज", "पात्रता", "पैसे", "कितने", "कितना" // Hindi terms
    ];
    const isFollowUp = followUpWords.some(w => lower.includes(w)) && ctx.lastTopic !== null;

    // Scheme detection (Latin and Devanagari)
    const schemeMap: Record<string, string[]> = {
        "pm-kisan": [
            "pm kisan", "pm-kisan", "pmkisan", "kisan samman", "6000", "₹6000", "6,000", "kisan nidhi",
            "पीएम किसान", "किसान सम्मान", "निधि", "खेती का पैसा", "किसानों का पैसा"
        ],
        "ayushman": [
            "ayushman", "pmjay", "pm-jay", "ayushman bharat", "health insurance", "5 lakh health", "hospital", "bimar", "hospital mein",
            "आयुष्मान", "भारत", "इलाज", "अस्पताल", "बीमार", "५ लाख", "हेल्थ इंश्योरेंस"
        ],
        "kcc": [
            "kisan credit", "kcc", "credit card farmer", "kisan loan", "4% interest",
            "केसीसी", "किसान क्रेडिट", "कर्ज", "लोन", "ब्याज"
        ],
        "vishwakarma": [
            "vishwakarma", "artisan", "karigar", "carpenter", "blacksmith", "weaver", "cobbler", "tailor", "toolkit", "craft",
            "विश्वकर्मा", "कारीगर", "टूलकिट", "लोहार", "बढ़ई", "दर्जी", "मोची"
        ],
        "scholarship": [
            "scholarship", "chatravritti", "nsp", "padhai", "study", "student", "college", "school", "fees",
            "स्कॉलरशिप", "छात्रवृत्ति", "पढ़ाई", "कॉलेज", "छात्र", "फीस"
        ],
        "pmay": [
            "pmay", "awas", "home", "house", "ghar", "housing", "flat",
            "पीएम आवास", "घर", "मकान", "आवास", "घर बनाने"
        ],
    };

    let detectedScheme: string | undefined;
    for (const [key, keywords] of Object.entries(schemeMap)) {
        if (keywords.some(kw => lower.includes(kw))) {
            detectedScheme = key;
            break;
        }
    }

    if (!detectedScheme && isFollowUp && ctx.lastTopic) {
        detectedScheme = ctx.lastTopic;
    }

    // Intent detection (Latin and Devanagari)
    let intent = "general";
    if (lower.includes("eligib") || lower.includes("eligible") || lower.includes("qualify") || lower.includes("yogya") || lower.includes("valid") ||
        lower.includes("पात्र") || lower.includes("योग्यता") || lower.includes("अप्लाई") || lower.includes("योग्य"))
        intent = "eligibility";
    else if (lower.includes("apply") || lower.includes("kaise") || lower.includes("apply kare") || lower.includes("register") || lower.includes("registration") ||
        lower.includes("आवेदन") || lower.includes("रजिस्टर") || lower.includes("कैसे भरें"))
        intent = "apply";
    else if (lower.includes("document") || lower.includes("papers") || lower.includes("kagaz") || lower.includes("id") ||
        lower.includes("दस्तावेज") || lower.includes("कागज") || lower.includes("पेपर"))
        intent = "documents";
    else if (lower.includes("benefit") || lower.includes("money") || lower.includes("paisa") || lower.includes("kitna") || lower.includes("amount") || lower.includes("kitne") ||
        lower.includes("फायदा") || lower.includes("कितना") || lower.includes("पैसे") || lower.includes("लाभ"))
        intent = "benefit";
    else if (lower.includes("kya hai") || lower.includes("what is") || lower.includes("explain") || lower.includes("batao") || lower.includes("tell me") || lower.includes("about") ||
        lower.includes("क्या है") || lower.includes("जानकारी") || lower.includes("बताओ") || detectedScheme)
        intent = "explain";
    else if (lower.includes("list") || lower.includes("all scheme") || lower.includes("sabhi") || lower.includes("kitni") || lower.includes("schemes hai") ||
        lower.includes("सूची") || lower.includes("सारी योजनाएं") || lower.includes("कितनी योजनाएं"))
        intent = "list";
    else if (lower.includes("farmer") || lower.includes("kisan") || lower.includes("kheti") || lower.includes("किसान") || lower.includes("खेती"))
        intent = "farming";
    else if (lower.includes("health") || lower.includes("hospital") || lower.includes("bimar") || lower.includes("doctor") || lower.includes("स्वास्थ्य") || lower.includes("अस्पताल"))
        intent = "health";
    else if (lower.includes("student") || lower.includes("padhai") || lower.includes("education") || lower.includes("छात्र") || lower.includes("शिक्षा"))
        intent = "education";
    else if (isFollowUp)
        intent = "followup";

    return { intent, scheme: detectedScheme, followUp: isFollowUp };
}

function generateResponse(
    text: string,
    ctx: ConversationContext,
    msgCount: number
): { response: string; newTopic: string | null } {
    const { intent, scheme } = detectIntent(text, ctx);
    const lower = text.toLowerCase();

    // Greeting detection
    if (msgCount <= 3 && (lower.includes("hello") || lower.includes("hi ") || lower === "hi" || lower.includes("namaste") || lower.includes("helo") || lower.includes("hey"))) {
        return {
            response: `Namaste! 🙏 Main BharatAssist AI hoon — aapka sarkari yojana saathi!\n\nMain aapki madad kar sakta hoon in cheezon mein:\n\n🌾 **PM-KISAN** — Kisanon ko ₹6,000/saal\n🏥 **Ayushman Bharat** — ₹5 lakh health coverage\n💳 **Kisan Credit Card** — 4% byaj par loan\n🔨 **PM Vishwakarma** — Karigaronke liye 3.15 lakh\n🎓 **Scholarship** — Students ke liye ₹75,000 tak\n🏠 **PMAY** — Ghar banane mein madad\n\nKaun si scheme ke baare mein jaanna chahte ho? Ya apni occupation/state batao — main best scheme suggest karunga! 😊`,
            newTopic: null,
        };
    }

    // Scheme specific response
    if (scheme && SCHEME_DETAILS[scheme]) {
        const d = SCHEME_DETAILS[scheme];

        if (intent === "benefit") {
            return {
                response: `${d.emoji} **${scheme === "pm-kisan" ? "PM-KISAN" : scheme.toUpperCase()} — Benefits:**\n\n${d.benefit}\n\n💡 Aur jaanna chahte ho? "documents" ya "how to apply" type karo!`,
                newTopic: scheme,
            };
        }
        if (intent === "eligibility") {
            return {
                response: `${d.emoji} **Eligibility (${scheme === "pm-kisan" ? "PM-KISAN" : scheme.toUpperCase()}):**\n\n${d.eligibility}\n\n📋 Documents dekhne ke liye "documents" type karo. Apply karne ke liye "how to apply" type karo.`,
                newTopic: scheme,
            };
        }
        if (intent === "documents") {
            return {
                response: `${d.emoji} **Required Documents:**\n\n${d.documents}\n\n📌 Tip: Sabhi documents ki photocopies rakhen. Aadhaar aur bank account linked hona zaroori hai.\n\nApply kaise karein? "how to apply" type karo! 🚀`,
                newTopic: scheme,
            };
        }
        if (intent === "apply") {
            return {
                response: `${d.emoji} **Apply kaise karein:**\n\n${d.howToApply}\n\n🔗 Official link: ${d.link}\n\n💡 Aap hamara FormFriend tool bhi use kar sakte ho — ek click mein pre-filled form download karo! → /form`,
                newTopic: scheme,
            };
        }
        // Default: explain
        return {
            response: `${d.emoji} **${scheme === "pm-kisan" ? "PM-KISAN" : scheme.charAt(0).toUpperCase() + scheme.slice(1)} — Overview:**\n\n${d.summary}\n\n**Benefit:** ${d.benefit}\n\nAur detail mein jaanna chahte ho? Poochho:\n• "eligibility" — kaun apply kar sakta hai?\n• "documents" — kya kya chahiye?\n• "how to apply" — application process\n• "benefits" — kitna paisa milta hai?`,
            newTopic: scheme,
        };
    }

    // Generic intent responses (no specific scheme)
    if (intent === "farming") {
        return {
            response: `🌾 Kisanon ke liye top sarkari yojnaayein:\n\n**1. PM-KISAN** — ₹6,000/saal seedha bank mein\n**2. Kisan Credit Card** — ₹3 lakh tak ka loan sirf 4% byaj par\n**3. PM Fasal Bima Yojana** — Fasal kharab ho toh muavza\n**4. Kisan Credit Card** — Short-term crop loans\n\nKis scheme ke baare mein zyada jaanna chahte ho? Scheme ka naam type karo, main poori detail bataunga! 🚜`,
            newTopic: "farming",
        };
    }

    if (intent === "health") {
        return {
            response: `🏥 Health aur medical schemes:\n\n**1. Ayushman Bharat PM-JAY** — ₹5 lakh/saal health insurance (largest in world!)\n**2. Janani Suraksha Yojana** — Pregnant women ke liye ₹1,400\n**3. PM Jan Aushadhi** — 900+ medicines 50-90% saste daam par\n**4. NHM (National Health Mission)** — Free OPD aur medicines\n\nAyushman Bharat ke baare mein zyada jaanna chahte ho? Type karo "Ayushman Bharat" ya "Ayushman eligibility"! 💊`,
            newTopic: "health",
        };
    }

    if (intent === "education") {
        return {
            response: `🎓 Students ke liye scholarships:\n\n**1. NSP Scholarship** — SC/ST/OBC/minority ke liye ₹75,000 tak/saal\n**2. PM Yasasvi** — OBC/EWS students ke liye ₹75,000-₹1,25,000\n**3. Begum Hazrat Mahal** — Minority girls ke liye pre-matric scholarship\n**4. TN BC scholarship** — Tamil Nadu ke BC/MBC students ke liye ₹12,000/saal\n\nApni category aur state batao — main exact scheme suggest karunga! 📚\n\nNSP ke baare mein "NSP scholarship eligibility" type karo.`,
            newTopic: "education",
        };
    }

    if (intent === "list") {
        return {
            response: `📋 Hamare database mein **8 major schemes** hain:\n\n🌾 **PM-KISAN** — Farmers, ₹6K/yr\n🏥 **Ayushman Bharat** — Health, ₹5L/yr\n💳 **Kisan Credit Card** — Farmers, ₹3L loan\n🔨 **PM Vishwakarma** — Artisans, ₹3.15L\n🎓 **NSP Scholarship** — Students, ₹75K/yr\n📚 **TN BC Scholarship** — TN Students, ₹12K/yr\n🏠 **PMAY** — Housing, ₹2.5L subsidy\n👧 **Sukanya Samriddhi** — Girl child, 8.2% interest\n\nKisi bhi scheme ka naam type karo — poori detail milegsi! 🎯`,
            newTopic: null,
        };
    }

    if (intent === "followup" && ctx.lastTopic) {
        const d = SCHEME_DETAILS[ctx.lastTopic];
        if (d) {
            return {
                response: `${d.emoji} Aapka sawaal ${ctx.lastTopic.toUpperCase()} ke bare mein lag raha hai.\n\nMain aur kya batau?\n• **"eligibility"** — Kaun apply kar sakta hai?\n• **"documents"** — Kya kya chahiye?\n• **"how to apply"** — Complete process\n• **"benefits"** — Kitna milega?\n• **"link"** — Official website\n\nKya poochna chahte ho? Type karo! 🤔`,
                newTopic: ctx.lastTopic,
            };
        }
    }

    // Default fallback with suggestions based on profile
    const occupationHint = ctx.userProfile.occupation
        ? `\n\n💡 Aapka occupation "${ctx.userProfile.occupation}" hai — kya main uss hisaab se schemes suggest karun?`
        : "";

    return {
        response: `Main samajhna chah raha hoon! 🤔\n\nShayad aap poochh rahe ho kisi specific scheme ke baare mein? Yahan kuch suggestions hain:\n\n• **"PM-KISAN kya hai?"** — Farmer income support\n• **"Ayushman card banwa sakte hain?"** — Health insurance\n• **"Scholarship ke liye kya chahiye?"** — Education\n• **"PM Vishwakarma eligibility"** — Artisan scheme\n• **"All schemes list"** — Sabhi schemes dekhein\n• **"PMAY apply kaise karein?"** — Housing${occupationHint}\n\nSabse simple tarika: Apna sawaal Hindi ya English mein seedha type karo! 😊`,
        newTopic: ctx.lastTopic,
    };
}

// Quick chat prompts organized by category
const QUICK_PROMPTS = [
    { text: "Mujhe PM-KISAN ke baare mein batao", category: "🌾 Farmer" },
    { text: "Ayushman Bharat ke liye kaun eligible hai?", category: "🏥 Health" },
    { text: "Scholarship ke liye kya documents chahiye?", category: "🎓 Student" },
    { text: "PM Vishwakarma mein kitna loan milta hai?", category: "🔨 Artisan" },
    { text: "PMAY ke liye kaise apply karein?", category: "🏠 Housing" },
    { text: "Sabhi schemes ki list dikhao", category: "📋 All" },
];

export default function VoicePage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "0",
            role: "assistant",
            text: `Namaste! 🙏 Main BharatAssist AI hoon — aapka sarkari yojana saathi!\n\nMain aapki madad kar sakta hoon in cheezon mein:\n\n🌾 **PM-KISAN** — Kisanon ko ₹6,000/saal\n🏥 **Ayushman Bharat** — ₹5 lakh health coverage\n💳 **Kisan Credit Card** — 4% byaj par loan\n🔨 **PM Vishwakarma** — Karigaronke liye 3.15 lakh\n🎓 **Scholarship** — Students ke liye ₹75,000 tak\n🏠 **PMAY** — Ghar banane mein madad\n\nKaun si scheme ke baare mein jaanna chahte ho? 😊`,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [context, setContext] = useState<ConversationContext>({
        lastTopic: null,
        mentionedSchemes: [],
        userProfile: {},
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load user profile from session storage
        const stored = sessionStorage.getItem("userProfile");
        if (stored) {
            const p = JSON.parse(stored);
            setContext(c => ({
                ...c,
                userProfile: {
                    occupation: p.occupation,
                    state: p.state,
                    category: p.category,
                    income: p.income?.toString(),
                },
            }));
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const renderText = (text: string) => {
        // Bold **text**, newlines to <br>
        return text.split("\n").map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
                <span key={i}>
                    {parts.map((part, j) =>
                        j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
                    )}
                    {i < text.split("\n").length - 1 && <br />}
                </span>
            );
        });
    };

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Variable delay for realism
        await new Promise(r => setTimeout(r, 600 + Math.random() * 900));

        // ML safety guard: the backend checks the message first (skipped if the backend is offline)
        let verdict: { action: string; language: string; score: number } | null = null;
        try {
            const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
            const res = await fetch(`${apiBase}/moderate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (res.ok) verdict = await res.json();
        } catch {
            /* backend not running: answer as before */
        }

        if (verdict?.action === "block") {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: "🛡️ Maaf kijiye, main is request mein madad nahi kar sakta. Main sarkari yojanaon, eligibility aur documents ke baare mein bata sakta hoon.",
                time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            }]);
            return;
        }

        const { response, newTopic } = generateResponse(text, context, messages.length);

        setContext(prev => ({
            ...prev,
            lastTopic: newTopic,
            mentionedSchemes: newTopic && !prev.mentionedSchemes.includes(newTopic)
                ? [...prev.mentionedSchemes, newTopic]
                : prev.mentionedSchemes,
        }));

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            text: response,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };

        setIsTyping(false);
        setMessages(prev => [...prev, aiMsg]);

        // TTS — speak cleaned text
        const speakable = response.replace(/\*\*(.*?)\*\*/g, "$1").replace(/•/g, "").split("\n").slice(0, 3).join(". ");
        speakText(speakable);
    }, [context, messages.length]);

    const speakText = (text: string) => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text.substring(0, 250));
            utter.lang = "hi-IN";
            utter.rate = 0.85;
            utter.pitch = 1;
            utter.onstart = () => setIsSpeaking(true);
            utter.onend = () => setIsSpeaking(false);
            utter.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utter);
        }
    };

    const toggleListening = () => {
        if (isListening) { setIsListening(false); return; }

        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognitionAPI: new () => SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognitionAPI();
            recognition.lang = "hi-IN";
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                inputRef.current?.focus();
            };
            recognition.onerror = () => {
                setIsListening(false);
                setInput("PM-KISAN ke baare mein batao");
            };
            recognition.onend = () => setIsListening(false);
            recognition.start();
        } else {
            setIsListening(true);
            setTimeout(() => {
                setIsListening(false);
                setInput("Mujhe farming ke liye koi scheme batao");
                inputRef.current?.focus();
            }, 2000);
        }
    };

    const resetChat = () => {
        window.speechSynthesis?.cancel();
        setMessages([{
            id: "0",
            role: "assistant",
            text: "Naya session shuru! 🙏 Koi bhi government scheme ke baare mein poochhen. Kya jaanna chahte ho?",
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        }]);
        setContext({ lastTopic: null, mentionedSchemes: [], userProfile: context.userProfile });
        setInput("");
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #050810 100%)" }}>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-xl px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Home
                    </Link>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-0.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-xl font-black gradient-text">VoiceScheme AI</h1>
                        </div>
                        <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
                            <Globe className="w-3 h-3" /> Hindi • English • Hinglish
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={resetChat} title="New chat" className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <div className="flex-shrink-0 flex items-center justify-center gap-3 py-2 border-b border-white/5">
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all ${isListening ? "bg-red-500/20 text-red-300 border border-red-500/30" : "text-slate-600"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-red-400 animate-pulse" : "bg-slate-600"}`} />
                    {isListening ? "Listening..." : "Mic ready"}
                </div>
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all ${isSpeaking ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-600"}`}>
                    <Volume2 className={`w-3 h-3 ${isSpeaking ? "animate-pulse" : ""}`} />
                    {isSpeaking ? "Speaking..." : "TTS ready"}
                </div>
                {context.lastTopic && (
                    <div className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        <Sparkles className="w-3 h-3" />
                        Topic: {context.lastTopic}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 px-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === "assistant"
                                    ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20"
                                    : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20"
                                    }`}>
                                    {msg.role === "assistant" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[82%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "assistant"
                                        ? "bg-white/5 border border-white/8 text-slate-200 rounded-tl-sm"
                                        : "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm"
                                        }`}>
                                        {renderText(msg.text)}
                                    </div>
                                    <span className="text-slate-600 text-xs mt-1 px-1">{msg.time}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="flex gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-blue-400"
                                            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick prompts */}
            <div className="flex-shrink-0 px-4 pb-2 pt-1">
                <div className="max-w-3xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {QUICK_PROMPTS.map((q) => (
                            <button
                                key={q.text}
                                onClick={() => sendMessage(q.text)}
                                disabled={isTyping}
                                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:text-white hover:bg-white/10 hover:border-blue-500/30 transition-all disabled:opacity-40 whitespace-nowrap"
                            >
                                {q.category} <ChevronRight className="inline w-3 h-3 ml-0.5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 border-t border-white/5 bg-black/20 backdrop-blur-xl px-4 py-3">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 focus-within:border-blue-500/40 transition-all">
                        {/* Mic button */}
                        <motion.button
                            onClick={toggleListening}
                            whileTap={{ scale: 0.9 }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isListening ? "bg-red-500 shadow-lg shadow-red-500/30" : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                                }`}
                        >
                            {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                        </motion.button>

                        {/* Voice wave animation */}
                        {isListening && (
                            <div className="flex gap-0.5 items-center px-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 rounded-full bg-red-400"
                                        animate={{ height: ["6px", "18px", "6px"] }}
                                        transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                                    />
                                ))}
                            </div>
                        )}

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !isTyping && sendMessage(input)}
                            placeholder={isListening ? "Bol raha hoon..." : "Type or speak in Hindi / English..."}
                            className="flex-1 bg-transparent text-white placeholder-slate-600 text-sm focus:outline-none"
                            disabled={isListening}
                        />

                        {/* Clear input */}
                        {input && (
                            <button onClick={() => setInput("")} className="text-slate-600 hover:text-slate-400 p-1 transition-colors flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Send */}
                        <motion.button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isTyping}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </motion.button>
                    </div>
                    <p className="text-center text-slate-700 text-xs mt-2">
                        Speak or type in Hindi, English, or Hinglish
                    </p>
                </div>
            </div>
        </div>
    );
}
