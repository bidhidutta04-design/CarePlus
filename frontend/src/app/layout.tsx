import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CarePlus — Enterprise Hospital Management System",
  description: "Production-grade HMS / Healthcare ERP for clinical operations, billing, pharmacy, labs, and inpatient management.",
  keywords: ["hospital management", "HMS", "healthcare ERP", "EHR", "EMR", "OPD", "IPD", "billing", "pharmacy", "laboratory"],
  authors: [{ name: "CarePlus Team" }],
  openGraph: { title: "CarePlus", description: "Enterprise Hospital Management System", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#0b2b4a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={cn(inter.variable, "min-h-screen bg-canvas antialiased")} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}