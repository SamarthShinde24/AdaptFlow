import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary-200">
        <div className="flex min-h-screen">
          {/* Fixed Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col pl-64">
            <Header />
            <main className="flex-1 p-8 bg-grid-pattern relative">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
