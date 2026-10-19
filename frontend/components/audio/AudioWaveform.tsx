"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
  speaker?: "Alex" | "Jordan" | string | null;
  variant?: "bars" | "spectrum" | "pill";
  size?: "sm" | "md" | "lg";
}

export function AudioWaveform({
  isPlaying,
  barCount = 5,
  className,
  speaker,
  variant = "bars",
  size = "md",
}: AudioWaveformProps) {
  const isJordan = speaker?.toLowerCase().includes("jordan");
  const isAlex = speaker?.toLowerCase().includes("alex");

  // Multi-frequency simulated heights with harmonic jitter
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 60);
    }, 90);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Height preset arrays for harmonic cadence
  const harmonicProfiles = [
    [35, 70, 95, 60, 40],
    [50, 90, 65, 80, 45],
    [75, 45, 85, 95, 55],
    [40, 80, 50, 70, 90],
    [60, 95, 80, 50, 65],
    [90, 60, 40, 85, 50],
  ];

  const currentProfile = harmonicProfiles[frame % harmonicProfiles.length];

  const barHeight = (index: number): number => {
    if (!isPlaying) return 20;
    const base = currentProfile[index % currentProfile.length];
    // Gentle sine oscillation
    const osc = Math.sin((frame + index) * 0.7) * 15;
    return Math.max(18, Math.min(100, Math.round(base + osc)));
  };

  const getGradient = () => {
    if (isJordan) {
      return "bg-gradient-to-t from-teal-600 via-emerald-500 to-emerald-400 shadow-emerald-500/20";
    }
    if (isAlex) {
      return "bg-gradient-to-t from-[#5850EC] via-[#6C63FF] to-violet-400 shadow-[#6C63FF]/20";
    }
    return "bg-gradient-to-t from-slate-400 to-slate-300 dark:from-zinc-600 dark:to-zinc-400";
  };

  const sizeClasses = {
    sm: "h-3 gap-0.5",
    md: "h-4 gap-0.5 sm:gap-1",
    lg: "h-6 gap-1",
  }[size];

  const barWidthClass = {
    sm: "w-0.5 sm:w-1",
    md: "w-1",
    lg: "w-1.5",
  }[size];

  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold transition-all select-none",
          isJordan
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            : isAlex
            ? "bg-[#6C63FF]/10 border-[#6C63FF]/30 text-[#6C63FF] dark:text-[#8B85FF]"
            : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400",
          className
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isPlaying ? "animate-ping" : "opacity-50",
            isJordan ? "bg-emerald-500" : isAlex ? "bg-[#6C63FF]" : "bg-slate-400"
          )}
        />
        <div className={cn("flex items-end h-3 gap-0.5", sizeClasses)}>
          {Array.from({ length: barCount }).map((_, i) => (
            <span
              key={i}
              className={cn("w-0.5 rounded-full transition-all duration-150", getGradient())}
              style={{ height: `${barHeight(i)}%` }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px]">
          {isPlaying ? (speaker ? `${speaker} speaking` : "Playing") : "Audio Ready"}
        </span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={isPlaying ? `${speaker || "Podcast"} audio playing` : "Audio idle"}
      className={cn("flex items-end select-none motion-reduce:transition-none", sizeClasses, className)}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const height = barHeight(i);
        return (
          <span
            key={i}
            className={cn(
              "rounded-full transition-all duration-150 ease-out",
              barWidthClass,
              getGradient(),
              isPlaying ? "shadow-2xs opacity-100" : "opacity-30"
            )}
            style={{
              height: `${height}%`,
              transitionDelay: `${i * 15}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
