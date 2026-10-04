"use client";

import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";

const TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Multimodal Library & Ingestion",
    subtitle: "Upload PDF textbooks, lecture videos, and slide decks with provenance tracking.",
  },
  "/chat": {
    title: "Source-Grounded AI Tutor",
    subtitle: "Ask questions and receive answers linked to exact pages, timestamps, and slides.",
  },
  "/quiz": {
    title: "Adaptive Knowledge Assessment",
    subtitle: "Test your mastery with AI-generated questions backed by course materials.",
  },
  "/instructor/dashboard": {
    title: "Instructor Management Portal",
    subtitle: "Assign default curriculum subjects to students and oversee cohort mastery.",
  },
};

export function Header() {
  const pathname = usePathname();
  const info = TITLE_MAP[pathname] || {
    title: "AdaptFlow Adaptive Learning",
    subtitle: "Multimodal study platform with verified citation provenance.",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-8 backdrop-blur-md">
      <div>
        <h1 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-2">
          {info.title}
        </h1>
        <p className="text-xs text-gray-500 hidden sm:block">
          {info.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
          <ShieldCheck className="h-3.5 w-3.5 text-[#6C63FF]" />
          <span>Source-Tracking Verified</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#6C63FF]">
          <Sparkles className="h-3.5 w-3.5 text-[#6C63FF]" />
          <span>AdaptFlow v2.0</span>
        </div>
      </div>
    </header>
  );
}
