import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(0)}K`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatFullCurrency(amount: number): string {
    return `₹${amount.toLocaleString("en-IN")}`;
}
