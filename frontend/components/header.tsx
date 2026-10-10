"use client";

import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";

const TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Multimodal Library & Ingestion",
    subtitle: "Upload PDF textbooks, lecture videos, and slide decks with provenance tracking.",
  },
  "/assignments": {
    title: "Course Assignments & Tasks",
    subtitle: "Review task requirements, track upcoming deadlines, and submit deliverables.",
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
  "/instructor/assignments": {
    title: "Student Assignment Submissions Ledger",
    subtitle: "Review student assignment uploads, evaluate scores, and export Excel gradebooks.",
  },
  "/instructor/chat": {
    title: "Faculty Curriculum AI Assistant",
    subtitle: "Ask questions, review lecture provenance, and query course syllabus materials.",
  },
  "/instructor/quiz": {
    title: "Curriculum Quiz & Assessment Manager",
    subtitle: "Generate, inspect, and assign adaptive quizzes to cohort students from uploaded sources.",
  },
};

export function Header() {
  const pathname = usePathname();
  const info = TITLE_MAP[pathname] || {
    title: "AdaptFlow Adaptive Learning",
    subtitle: "Multimodal study platform with verified citation provenance.",
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-gray-200/90 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 px-3 sm:px-6 md:px-8 backdrop-blur-md shadow-xs pt-[env(safe-area-inset-top,0px)]">
      {/* Title & Subtitle with responsive sizing and ellipsis truncation to prevent vertical wrapping */}
      <div className="min-w-0 flex-1 mr-2 sm:mr-4">
        <h1 className="text-xs xs:text-sm sm:text-base font-bold tracking-tight text-gray-900 dark:text-white truncate flex items-center gap-1.5 sm:gap-2">
          <span className="truncate">{info.title}</span>
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 italic hidden md:block truncate">
          {info.subtitle}
        </p>
      </div>

      {/* Top Badges: Compact on mobile, full on desktop, strictly single-line nowrap */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Source-Tracking Verified Badge with live animated pulse dot */}
        <div className="flex items-center gap-1 sm:gap-2 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/50 px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-emerald-800 dark:text-emerald-300 shadow-xs whitespace-nowrap shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">Source-Tracking Verified</span>
          <span className="sm:hidden text-[10px] font-semibold">Verified</span>
        </div>

        {/* AdaptFlow v2.0 Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/50 px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-[#6C63FF] dark:text-[#a78bfa] shadow-xs whitespace-nowrap shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-[#6C63FF] dark:text-[#a78bfa] shrink-0" />
          <span className="hidden xs:inline">AdaptFlow </span>
          <span>v2.0</span>
        </div>
      </div>
    </header>
  );
}
