import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BharatAssist AI – Discover Government Benefits | India",
  description: "AI-powered platform to discover and apply for Indian government schemes. Match your profile to PM-KISAN, Ayushman Bharat, scholarships and more in seconds.",
  keywords: "government schemes India, PM-KISAN, Ayushman Bharat, sarkari yojana, scholarship India",
  openGraph: {
    title: "BharatAssist AI – Smart Government Scheme Discovery",
    description: "Find every government scheme you qualify for in under 2 minutes.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        {/* Ambient mesh background */}
        <div className="mesh-bg">
          <div className="mesh-blob-3" />
        </div>
        {/* Page content sits above mesh */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
