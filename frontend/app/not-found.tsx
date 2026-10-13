"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { AdaptFlowLogo } from "@/components/ui/AdaptFlowLogo";

export default function NotFound() {
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
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            404 Error - Page Not Found
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Topic or Route Unavailable
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
            The page or course material you requested does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#5850EC] text-white text-xs font-semibold px-4 py-2 shadow-xs transition-colors cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
