"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
import { AdaptFlowLogo } from "@/components/ui/AdaptFlowLogo";
import { useLanguage } from "@/context/LanguageContext";

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
  "/flashcards": {
    title: "Flashcards Studio",
    subtitle: "Active recall topic cards grounded by verified course citations.",
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
  const { t } = useLanguage();
  const info = TITLE_MAP[pathname] || {
    title: "AdaptFlow Adaptive Learning",
    subtitle: "Multimodal study platform with verified citation provenance.",
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#121215]/95 px-3 sm:px-6 md:px-8 backdrop-blur-md shadow-xs pt-[env(safe-area-inset-top,0px)] transition-colors">
      {/* Left side brand logo: 28x28px + AdaptFlow text (mobile: logo only) */}
      <Link
        href="/dashboard"
        className="flex items-center mr-3 sm:mr-4 shrink-0 group hover:opacity-95 transition-opacity"
        aria-label="AdaptFlow Home"
      >
        <span className="sm:hidden">
          <AdaptFlowLogo size={28} showText={false} />
        </span>
        <span className="hidden sm:inline-flex">
          <AdaptFlowLogo size={28} showText={true} />
        </span>
      </Link>

      {/* Subtle Vertical Divider between Brand and Section Title */}
      <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/[0.08] mr-3 sm:mr-4 shrink-0 hidden sm:block" />

      {/* Title & Subtitle with responsive sizing and clear hierarchy */}
      <div className="min-w-0 flex-1 mr-2 sm:mr-4">
        <h1 className="text-xs xs:text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
          {info.title}
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden md:block truncate mt-0.5">
          {t(info.subtitle)}
        </p>
      </div>

      {/* Top Badges with subtle divider */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Source Tracking Verified Badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-300 shadow-2xs whitespace-nowrap shrink-0">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">{t("Source Tracking Verified")}</span>
          <span className="sm:hidden text-[10px] font-semibold">{t("Verified")}</span>
        </div>

        {/* Subtle Vertical Divider */}
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/[0.08] hidden sm:block" />

        {/* AdaptFlow Engine Badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/10 dark:bg-[#6C63FF]/15 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-[#6C63FF] dark:text-[#8B85FF] shadow-2xs whitespace-nowrap shrink-0">
          <AdaptFlowLogo size={16} showText={false} />
          <span>AdaptFlow</span>
        </div>
      </div>
    </header>
  );
}
