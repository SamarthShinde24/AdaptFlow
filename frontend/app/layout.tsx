import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayoutShell } from "@/components/app-layout-shell";

export const metadata: Metadata = {
  title: "AdaptFlow - Multimodal Adaptive Learning Platform",
  description:
    "AI-powered learning platform with source-grounded multimodal ingestion, interactive citations, and adaptive assessments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-white text-gray-900 antialiased selection:bg-[#6C63FF]/20 selection:text-[#6C63FF]">
        <AuthProvider>
          <AppLayoutShell>{children}</AppLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
