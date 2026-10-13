import React from "react";
import { AdaptFlowLogo } from "@/components/ui/AdaptFlowLogo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 dark:bg-[#070D18]/90 backdrop-blur-sm select-none">
      <div className="flex flex-col items-center gap-3 text-center">
        <AdaptFlowLogo
          size="lg"
          showText
          textPosition="below"
          tagline="Multimodal AI Learning"
          animated
          priority
        />
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6C63FF] animate-pulse" />
          <span>Loading knowledge workspace...</span>
        </div>
      </div>
    </div>
  );
}
