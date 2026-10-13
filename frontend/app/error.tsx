"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertCircle } from "lucide-react";
import { AdaptFlowLogo } from "@/components/ui/AdaptFlowLogo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AdaptFlow application error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070D18] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full flex flex-col items-center gap-4 bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] p-8 rounded-2xl shadow-sm">
        <AdaptFlowLogo
          size="lg"
          showText
          textPosition="below"
          tagline="Multimodal AI Learning"
          priority
        />

        <div className="mt-2 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="h-3 w-3" />
            <span>Workspace Application Error</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Something Went Wrong
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-mono bg-slate-50 dark:bg-[#070D18] p-2.5 rounded-lg border border-slate-200 dark:border-white/[0.06] text-left break-words">
            {error?.message || "An unexpected error occurred while loading this view."}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#5850EC] text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold px-4 py-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
