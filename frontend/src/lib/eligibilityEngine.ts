import { schemes, Scheme, SchemeMatch, MatchCategory } from "./schemes";

export interface UserProfile {
    name?: string;
    age?: number;
    gender?: string;
    location?: string;
    state?: string;
    occupation?: string;
    income?: number;
    category?: string;
    landOwner?: boolean;
    studentStatus?: boolean;
    familySize?: number;
    maritalStatus?: string;
}

function calculateMatch(scheme: Scheme, profile: UserProfile): SchemeMatch {
    const metCriteria: string[] = [];
    const missingCriteria: string[] = [];
    let totalCriteria = 0;
    let metCount = 0;

    const el = scheme.eligibility;

    // Age check
    if (el.minAge !== undefined || el.maxAge !== undefined) {
        totalCriteria++;
        const age = profile.age ?? 25;
        if (el.minAge !== undefined && age < el.minAge) {
            missingCriteria.push(`Age must be ≥ ${el.minAge} years (you: ${age})`);
        } else if (el.maxAge !== undefined && age > el.maxAge) {
            missingCriteria.push(`Age must be ≤ ${el.maxAge} years (you: ${age})`);
        } else {
            metCriteria.push(`Age ${age} ✓`);
            metCount++;
        }
    }

    // Income check
    if (el.maxIncome !== undefined) {
        totalCriteria++;
        const income = profile.income ?? Infinity;
        if (income <= el.maxIncome) {
            metCriteria.push(`Income ₹${income.toLocaleString()} ≤ ₹${el.maxIncome.toLocaleString()} ✓`);
            metCount++;
        } else {
            missingCriteria.push(`Income must be ≤ ₹${el.maxIncome.toLocaleString()} (yours: ₹${income.toLocaleString()})`);
        }
    }

    // Occupation check
    if (el.occupation && el.occupation.length > 0) {
        totalCriteria++;
        const userOcc = profile.occupation?.toLowerCase() ?? "";
        const matches = el.occupation.some(
            (o) => userOcc.includes(o.toLowerCase()) || o.toLowerCase().includes(userOcc)
        );
        if (matches) {
            metCriteria.push(`Occupation '${profile.occupation}' qualifies ✓`);
            metCount++;
        } else {
            missingCriteria.push(`Must be: ${el.occupation.join(" / ")} (yours: ${profile.occupation || "not specified"})`);
        }
    }

    // Category check
    if (el.category && el.category.length > 0) {
        totalCriteria++;
        const userCat = profile.category?.toUpperCase() ?? "";
        const matches = el.category.some(
            (c) => c.toUpperCase() === userCat || c.toLowerCase() === "general"
        );
        if (matches) {
            metCriteria.push(`Category '${profile.category}' eligible ✓`);
            metCount++;
        } else {
            missingCriteria.push(`Must belong to: ${el.category.join(" / ")} (yours: ${profile.category || "not specified"})`);
        }
    }

    // Land owner check
    if (el.landOwner !== undefined) {
        totalCriteria++;
        if (profile.landOwner === el.landOwner) {
            metCriteria.push(`Land ownership: ${profile.landOwner ? "Yes" : "No"} ✓`);
            metCount++;
        } else {
            missingCriteria.push(`Land ownership required: ${el.landOwner ? "Yes" : "No"}`);
        }
    }

    // Student status
    if (el.studentStatus !== undefined) {
        totalCriteria++;
        if (profile.studentStatus === el.studentStatus) {
            metCriteria.push(`Student status ✓`);
            metCount++;
        } else {
            missingCriteria.push(`Must be ${el.studentStatus ? "a student" : "not a student"}`);
        }
    }

    // State check
    if (el.state && el.state.length > 0) {
        totalCriteria++;
        const matches = el.state.some(
            (s) => s.toLowerCase() === (profile.state ?? "").toLowerCase()
        );
        if (matches) {
            metCriteria.push(`State '${profile.state}' eligible ✓`);
            metCount++;
        } else {
            missingCriteria.push(`Only available in: ${el.state.join(", ")} (yours: ${profile.state || "not specified"})`);
        }
    }

    // Gender check
    if (el.gender && el.gender.length > 0) {
        totalCriteria++;
        const matches = el.gender.some(
            (g) => g.toLowerCase() === (profile.gender ?? "").toLowerCase()
        );
        if (matches) {
            metCriteria.push(`Gender ✓`);
            metCount++;
        } else {
            missingCriteria.push(`Restricted to: ${el.gender.join(" / ")} gender`);
        }
    }

    if (totalCriteria === 0) {
        // No specific criteria → general scheme
        return {
            scheme,
            category: "eligible",
            matchScore: 100,
            metCriteria: ["Open to all citizens ✓"],
            missingCriteria: [],
        };
    }

    const matchScore = Math.round((metCount / totalCriteria) * 100);

    let category: MatchCategory;
    if (matchScore === 100) {
        category = "eligible";
    } else if (matchScore >= 60) {
        category = "almost";
    } else {
        category = "not_eligible";
    }

    return { scheme, category, matchScore, metCriteria, missingCriteria };
}

export function matchSchemes(profile: UserProfile): {
    eligible: SchemeMatch[];
    almost: SchemeMatch[];
    notEligible: SchemeMatch[];
    totalBenefit: number;
} {
    const matches = schemes.map((s) => calculateMatch(s, profile));

    const eligible = matches.filter((m) => m.category === "eligible").sort((a, b) => b.matchScore - a.matchScore);
    const almost = matches.filter((m) => m.category === "almost").sort((a, b) => b.matchScore - a.matchScore);
    const notEligible = matches.filter((m) => m.category === "not_eligible").sort((a, b) => b.matchScore - a.matchScore);

    const totalBenefit = eligible.reduce((sum, m) => sum + m.scheme.benefitAmount, 0);

    return { eligible, almost, notEligible, totalBenefit };
}

export const DEMO_PROFILES: Record<string, UserProfile> = {
    farmer: {
        name: "Ravi Kumar",
        age: 42,
        gender: "male",
        location: "Patna, Bihar",
        state: "Bihar",
        occupation: "farmer",
        income: 85000,
        category: "OBC",
        landOwner: true,
        studentStatus: false,
        familySize: 5,
        maritalStatus: "married",
    },
    student: {
        name: "Priya Sharma",
        age: 20,
        gender: "female",
        location: "Chennai, Tamil Nadu",
        state: "Tamil Nadu",
        occupation: "student",
        income: 120000,
        category: "BC",
        landOwner: false,
        studentStatus: true,
        familySize: 4,
        maritalStatus: "single",
    },
    artisan: {
        name: "Mohammed Rafiq",
        age: 35,
        gender: "male",
        location: "Jaipur, Rajasthan",
        state: "Rajasthan",
        occupation: "carpenter",
        income: 180000,
        category: "OBC",
        landOwner: false,
        studentStatus: false,
        familySize: 6,
        maritalStatus: "married",
    },
};
