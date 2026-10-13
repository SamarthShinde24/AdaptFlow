"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

export interface AdaptFlowLogoProps {
  size?: LogoSize;
  showText?: boolean;
  textPosition?: "right" | "below";
  tagline?: string;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  priority?: boolean;
  animated?: boolean;
}

const SIZE_NUMBERS: Record<string, number> = {
  xs: 20,
  sm: 24,
  md: 36,
  lg: 64,
  xl: 80,
};

const TEXT_CLASSES: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export function AdaptFlowLogo({
  size = "md",
  showText = true,
  textPosition = "right",
  tagline,
  className,
  imageClassName,
  textClassName,
  priority = false,
  animated = false,
}: AdaptFlowLogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_NUMBERS[size] || 36;
  const sizeKey = typeof size === "string" ? size : size <= 24 ? "sm" : size <= 48 ? "md" : size <= 64 ? "lg" : "xl";
  const textSizeClass = TEXT_CLASSES[sizeKey] || "text-base";

  return (
    <div
      className={cn(
        "inline-flex select-none",
        textPosition === "below"
          ? "flex-col items-center justify-center text-center gap-2"
          : "items-center gap-2.5",
        className
      )}
    >
      {/* Custom Brand "A" Logo with Dark Mode Glow */}
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
          animated && "animate-pulse"
        )}
        style={{
          width: pixelSize,
          height: pixelSize,
        }}
      >
        <Image
          src="/logo.png"
          alt="AdaptFlow"
          width={pixelSize}
          height={pixelSize}
          priority={priority}
          className={cn(
            "h-full w-full object-contain drop-shadow-[0_0_8px_rgba(108,99,255,0.3)] transition-all",
            imageClassName
          )}
          style={{
            filter: "drop-shadow(0 0 8px rgba(108, 99, 255, 0.3))",
          }}
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div
          className={cn(
            "flex flex-col leading-tight",
            textPosition === "below" && "items-center",
            textClassName
          )}
        >
          <span
            className={cn(
              "font-bold tracking-tight text-slate-900 dark:text-white",
              textSizeClass
            )}
          >
            AdaptFlow
          </span>
          {tagline && (
            <span
              className={cn(
                "text-slate-500 dark:text-zinc-400 font-medium tracking-normal mt-0.5 whitespace-nowrap",
                pixelSize >= 64 ? "text-xs" : "text-[10px]"
              )}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default AdaptFlowLogo;
