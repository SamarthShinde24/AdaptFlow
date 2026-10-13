"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdaptFlowLogo } from "@/components/ui/AdaptFlowLogo";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#070D18]">
      <div className="flex flex-col items-center gap-4 text-center">
        <AdaptFlowLogo
          size="lg"
          showText
          textPosition="below"
          tagline="Multimodal AI Learning"
          animated
          priority
        />
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
          <div className="h-2 w-2 rounded-full bg-[#6C63FF] animate-ping" />
          <span>Initializing workspace...</span>
        </div>
      </div>
    </div>
  );
}
