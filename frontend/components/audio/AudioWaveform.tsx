"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
  speaker?: "Alex" | "Jordan" | string | null;
}

export function AudioWaveform({
  isPlaying,
  barCount = 5,
  className,
  speaker,
}: AudioWaveformProps) {
  const isJordan = speaker?.toLowerCase().includes("jordan");
  const baseColor = isJordan
    ? "bg-emerald-500 dark:bg-emerald-400"
    : "bg-[#6C63FF] dark:bg-[#8B85FF]";

  // Heights array to simulate realistic wave movement
  const heights = [40, 75, 100, 60, 90, 45, 80, 65, 95, 50];

  return (
    <div className={cn("flex items-end gap-0.5 h-4 select-none", className)}>
      {Array.from({ length: barCount }).map((_, i) => {
        const heightPercent = isPlaying ? heights[i % heights.length] : 25;
        const animationDelay = `${(i * 0.12).toFixed(2)}s`;

        return (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-200",
              baseColor,
              isPlaying ? "animate-pulse" : "opacity-40"
            )}
            style={{
              height: `${heightPercent}%`,
              animationDelay,
              animationDuration: isPlaying ? "0.8s" : "0s",
            }}
          />
        );
      })}
    </div>
  );
}
