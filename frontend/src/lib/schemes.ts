export interface Scheme {
  id: string;
  name: string;
  nameHindi: string;
  ministry: string;
  category: string;
  benefitAmount: number;
  benefitDescription: string;
  eligibility: {
    minAge?: number;
    maxAge?: number;
    maxIncome?: number;
    minIncome?: number;
    occupation?: string[];
    category?: string[];
    state?: string[];
    gender?: string[];
    landOwner?: boolean;
    studentStatus?: boolean;
    maritalStatus?: string[];
  };
  requiredDocuments: string[];
  applicationLink: string;
  description: string;
  descriptionHindi: string;
  timeline: string;
  tags: string[];
  color: string;
  icon: string;
}

export const schemes: Scheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    nameHindi: "प्रधानमंत्री किसान सम्मान निधि",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Agriculture",
    benefitAmount: 6000,
    benefitDescription: "₹6,000 per year in 3 equal installments of ₹2,000 each",
    eligibility: {
      occupation: ["farmer"],
      maxIncome: 200000,
      landOwner: true,
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Land Records (Khatauni/Patta)",
      "Bank Account details",
      "Mobile Number linked to Aadhaar",
    ],
    applicationLink: "https://pmkisan.gov.in/",
    description: "Direct income support to farmer families with cultivable land holding. ₹6,000 per year paid directly to bank account in 3 installments.",
    descriptionHindi: "छोटे और सीमांत किसानों को प्रत्यक्ष आय सहायता। प्रति वर्ष ₹6,000 तीन किस्तों में बैंक खाते में सीधे भेजा जाता है।",
    timeline: "Every 4 months (April, August, December)",
    tags: ["farmer", "agriculture", "income support", "direct benefit"],
    color: "#22c55e",
    icon: "🌾",
  },
  {
    id: "ayushman-bharat",
    name: "Ayushman Bharat – PM Jan Arogya Yojana",
    nameHindi: "आयुष्मान भारत – प्रधानमंत्री जन आरोग्य योजना",
    ministry: "Ministry of Health and Family Welfare",
    category: "Health",
    benefitAmount: 500000,
    benefitDescription: "Health coverage up to ₹5 lakh per family per year",
    eligibility: {
      maxIncome: 200000,
      category: ["general", "SC", "ST", "OBC", "EWS"],
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Ration Card (SECC Database verification)",
      "Income Certificate",
      "Family ID",
    ],
    applicationLink: "https://pmjay.gov.in/",
    description: "World's largest health insurance scheme providing ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
    descriptionHindi: "गरीब और कमजोर परिवारों के लिए प्रति वर्ष ₹5 लाख तक की स्वास्थ्य बीमा सुरक्षा।",
    timeline: "Ongoing – claim at empanelled hospital",
    tags: ["health", "insurance", "hospital", "medical"],
    color: "#ef4444",
    icon: "🏥",
  },
  {
    id: "kisan-credit-card",
    name: "Kisan Credit Card (KCC)",
    nameHindi: "किसान क्रेडिट कार्ड",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Agriculture",
    benefitAmount: 300000,
    benefitDescription: "Credit up to ₹3 lakh at 4% interest rate per year",
    eligibility: {
      occupation: ["farmer"],
      landOwner: true,
      minAge: 18,
      maxAge: 75,
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Land Records",
      "Recent passport-size photograph",
      "Bank account details",
    ],
    applicationLink: "https://www.nabard.org/content1.aspx?id=591&catid=8&mid=537",
    description: "Provides farmers with timely credit support for agricultural needs, purchase of inputs, allied & non-farm activities at subsidized interest of 4%.",
    descriptionHindi: "किसानों को कृषि जरूरतों के लिए 4% ब्याज दर पर ₹3 लाख तक का ऋण।",
    timeline: "Issued within 15 working days of application",
    tags: ["farmer", "credit", "loan", "agriculture"],
    color: "#f59e0b",
    icon: "💳",
  },
  {
    id: "pm-vishwakarma",
    name: "PM Vishwakarma Yojana",
    nameHindi: "पीएम विश्वकर्मा योजना",
    ministry: "Ministry of Micro, Small & Medium Enterprises",
    category: "Skill & Livelihood",
    benefitAmount: 315000,
    benefitDescription: "₹15,000 toolkit grant + loan up to ₹3 lakh + skill training + ₹500/day stipend",
    eligibility: {
      occupation: ["artisan", "craftsman", "carpenter", "blacksmith", "weaver", "potter", "tailor", "cobbler", "washerman"],
      minAge: 18,
      maxAge: 60,
      maxIncome: 300000,
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Mobile number linked to Aadhaar",
      "Bank account details",
      "Caste Certificate (if applicable)",
      "Trade-related certificate",
    ],
    applicationLink: "https://pmvishwakarma.gov.in/",
    description: "Supports traditional artisans and craftsmen. Provides recognition, skill upgradation, collateral-free loans, digital payment incentives, and market linkage support.",
    descriptionHindi: "पारंपरिक शिल्पकारों और कारीगरों के लिए कौशल उन्नयन, ऋण और बाजार सहायता।",
    timeline: "Training: 5-15 days | Loan disbursed within 30 days",
    tags: ["artisan", "craft", "skill", "loan", "MSME"],
    color: "#8b5cf6",
    icon: "🔨",
  },
  {
    id: "national-scholarship",
    name: "National Scholarship Portal (NSP) – Central Schemes",
    nameHindi: "राष्ट्रीय छात्रवृत्ति पोर्टल",
    ministry: "Ministry of Education",
    category: "Education",
    benefitAmount: 75000,
    benefitDescription: "₹25,000–₹75,000 per year depending on course level",
    eligibility: {
      studentStatus: true,
      maxAge: 30,
      maxIncome: 250000,
      category: ["SC", "ST", "OBC", "minority", "EWS"],
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Income Certificate",
      "Caste/Category Certificate",
      "Current Course Admission Proof",
      "Previous Year Mark Sheet",
      "Bank Account Details",
    ],
    applicationLink: "https://scholarships.gov.in/",
    description: "One-stop platform for students seeking central & state government scholarships. Multiple schemes for SC, ST, OBC, minority, and differently-abled students.",
    descriptionHindi: "SC, ST, OBC, अल्पसंख्यक और दिव्यांग छात्रों के लिए केंद्र और राज्य सरकार की छात्रवृत्तियाँ।",
    timeline: "Annual – Applications open July to October",
    tags: ["student", "scholarship", "education", "minority", "SC/ST/OBC"],
    color: "#06b6d4",
    icon: "🎓",
  },
  {
    id: "tn-bc-scholarship",
    name: "Tamil Nadu BC/MBC Scholarship",
    nameHindi: "तमिलनाडु पिछड़ा वर्ग छात्रवृत्ति",
    ministry: "Tamil Nadu Backward Classes Welfare Dept.",
    category: "Education",
    benefitAmount: 12000,
    benefitDescription: "₹1,000/month (₹12,000/year) for eligible BC/MBC students",
    eligibility: {
      studentStatus: true,
      maxAge: 25,
      maxIncome: 200000,
      category: ["BC", "MBC"],
      state: ["Tamil Nadu"],
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Community Certificate (BC/MBC)",
      "Income Certificate",
      "College Bonafide Certificate",
      "Bank Account Details",
    ],
    applicationLink: "https://adi.tn.gov.in/",
    description: "Monthly stipend for BC/MBC students in Tamil Nadu studying in recognized institutions. Supports continuation of higher education.",
    descriptionHindi: "तमिलनाडु में मान्यता प्राप्त संस्थानों में पढ़ने वाले BC/MBC छात्रों के लिए मासिक वजीफा।",
    timeline: "Annual – disbursed monthly via DBT",
    tags: ["Tamil Nadu", "BC", "MBC", "scholarship", "student"],
    color: "#f97316",
    icon: "📚",
  },
  {
    id: "pradhan-mantri-awas",
    name: "Pradhan Mantri Awas Yojana (PMAY)",
    nameHindi: "प्रधानमंत्री आवास योजना",
    ministry: "Ministry of Housing and Urban Affairs",
    category: "Housing",
    benefitAmount: 250000,
    benefitDescription: "Subsidy up to ₹2.5 lakh on home loans for EWS/LIG families",
    eligibility: {
      maxIncome: 300000,
      category: ["EWS", "SC", "ST", "OBC"],
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Income Certificate",
      "Property Documents",
      "Bank Account",
      "Caste Certificate",
    ],
    applicationLink: "https://pmayg.nic.in/",
    description: "Housing for All mission providing affordable housing to urban poor with interest subsidy on home loans.",
    descriptionHindi: "शहरी गरीबों के लिए किफायती आवास। होम लोन पर ब्याज सब्सिडी।",
    timeline: "Ongoing – apply through bank or CSC",
    tags: ["housing", "home loan", "subsidy", "EWS"],
    color: "#0ea5e9",
    icon: "🏠",
  },
  {
    id: "sukanya-samriddhi",
    name: "Sukanya Samriddhi Yojana",
    nameHindi: "सुकन्या समृद्धि योजना",
    ministry: "Ministry of Finance",
    category: "Women & Child",
    benefitAmount: 150000,
    benefitDescription: "8.2% interest + tax exemption under 80C; save for girl child education & marriage",
    eligibility: {
      gender: ["female"],
      maxAge: 10,
    },
    requiredDocuments: [
      "Aadhaar Card of girl child",
      "Birth Certificate",
      "Parent's ID proof",
      "Bank or Post Office account",
    ],
    applicationLink: "https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya-Samridhi-Account.aspx",
    description: "Small deposit scheme for parents of girl child (below 10 years) with high interest rate and tax benefits.",
    descriptionHindi: "10 वर्ष से कम आयु की बालिकाओं के लिए उच्च ब्याज और कर लाभ के साथ बचत योजना।",
    timeline: "21 years maturity or until girl turns 18 (for marriage)",
    tags: ["girl child", "savings", "tax benefit", "education", "women"],
    color: "#ec4899",
    icon: "👧",
  },
];

export type MatchCategory = "eligible" | "almost" | "not_eligible";

export interface SchemeMatch {
  scheme: Scheme;
  category: MatchCategory;
  matchScore: number;
  missingCriteria: string[];
  metCriteria: string[];
}
