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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white/85 px-8 backdrop-blur-md shadow-xs">
      <div>
        <h1 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-2">
          {info.title}
        </h1>
        <p className="text-xs text-gray-500 italic hidden sm:block">
          {info.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Source-Tracking Verified Badge with live animated pulse dot */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-800 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Source-Tracking Verified</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-[#6C63FF] shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-[#6C63FF]" />
          <span>AdaptFlow v2.0</span>
        </div>
      </div>
    </header>
  );
}
