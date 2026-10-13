"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

/**
 * AdaptFlow.AI Official Logo
 * Features the Fluid Ribbon "A" monogram with gradient depth and the AdaptFlow.AI typographic lockup.
 */
export function AdaptFlowLogo({
  size = 36,
  className,
  showText = false,
  subtitle = "Multimodal AI Platform",
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Fluid Ribbon "A" Vector Icon */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-md transition-transform duration-200 group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Primary Arch Gradient: Deep Violet to Electric Cyan */}
            <linearGradient id="af-arch-grad" x1="15" y1="85" x2="85" y2="15" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="35%" stopColor="#6366F1" />
              <stop offset="70%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* Kinetic Wave Crossbar Gradient: Cyan Wave with Bright Highlights */}
            <linearGradient id="af-wave-grad" x1="25" y1="65" x2="88" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="30%" stopColor="#2563EB" />
              <stop offset="65%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>

            {/* Deep Shading for 3D Over-Under Ribbon Fold */}
            <linearGradient id="af-shade-grad" x1="38" y1="52" x2="62" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.1" />
            </linearGradient>

            {/* Subtle Top Apex Glow */}
            <linearGradient id="af-apex-glow" x1="45" y1="12" x2="68" y2="35" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>

          {/* Background Rounded Shield Tile */}
          <rect width="100" height="100" rx="22" fill="#0A0F1D" />

          {/* Ambient Inner Glow Mesh */}
          <circle cx="50" cy="30" r="32" fill="#6366F1" opacity="0.18" />
          <circle cx="68" cy="45" r="24" fill="#06B6D4" opacity="0.22" />

          {/* Outer Main "A" Ribbon Arch */}
          <path
            d="M23 78 C25 66 33 46 44 26 C47 20 53 20 56 26 C66 45 74 65 77 78 C74 79 66 79 63 76 C59 66 54 53 50 44 C46 53 41 66 37 76 C34 79 26 79 23 78 Z"
            fill="url(#af-arch-grad)"
          />

          {/* Apex Highlight Fold */}
          <path
            d="M44 26 C47 20 53 20 56 26 C60 33 63 42 65 50 C61 46 56 39 50 34 C46 39 43 45 40 49 C41 42 43 33 44 26 Z"
            fill="url(#af-apex-glow)"
          />

          {/* Dimensional Shadow under Wave */}
          <path
            d="M36 58 C42 55 48 53 54 55 C58 56 62 60 65 65 C60 65 52 64 45 62 C40 60 37 59 36 58 Z"
            fill="url(#af-shade-grad)"
          />

          {/* Fluid Crossbar Kinetic Wave (curving up and out like a wave crest) */}
          <path
            d="M26 62 C34 58 43 51 51 51 C61 51 68 57 73 53 C77 50 81 42 84 32 C82 38 78 45 73 48 C67 52 59 47 50 47 C41 47 33 54 26 62 Z"
            fill="url(#af-wave-grad)"
          />

          {/* Cyan Glow Flare Tip */}
          <circle cx="83.5" cy="33.5" r="2.5" fill="#A5F3FC" opacity="0.8" />
        </svg>
      </div>

      {/* Typography: AdaptFlow.AI */}
      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-baseline tracking-tight">
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              AdaptFlow
            </span>
            <span className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent ml-0.5">
              .AI
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
