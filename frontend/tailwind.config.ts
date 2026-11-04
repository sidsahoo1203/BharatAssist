import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Rajdhani", "sans-serif"],
            },
            colors: {
                border: "rgba(255, 255, 255, 0.08)",
                background: "#050810",
                foreground: "#f0f4ff",
            },
            animation: {
                "gradient-xy": "gradient-xy 15s ease infinite",
                "float": "floating 3s ease-in-out infinite",
                "pulse-ring": "pulseRing 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite",
                "shimmer": "shimmer 2s infinite",
                "ticker": "ticker 20s linear infinite",
            },
            keyframes: {
                "gradient-xy": {
                    "0%, 100%": { backgroundSize: "400% 400%", backgroundPosition: "left center" },
                    "50%": { backgroundSize: "200% 200%", backgroundPosition: "right center" },
                },
                ticker: {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-33.33%)" },
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};

export default config;
