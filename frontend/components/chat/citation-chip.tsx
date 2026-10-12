"use client";

import React from "react";
import { FileText, Film, Presentation, Image as ImageIcon } from "lucide-react";
import { CitationReference } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CitationChipProps {
  label: string;
  citation?: CitationReference;
  onClick: (citation: CitationReference | null, rawLabel: string) => void;
}

export function CitationChip({ label, citation, onClick }: CitationChipProps) {
  const cleanLabel = label.replace(/[\[\]]/g, "").trim();

  // Detect type from citation or string
  const isVisual =
    citation?.unit?.modality === "visual" ||
    Boolean(citation?.unit?.source_tracking?.image_stored_path) ||
    Boolean(citation?.unit?.source_tracking?.is_visual) ||
    cleanLabel.includes("🖼️") ||
    label.startsWith("[🖼️") ||
    cleanLabel.toLowerCase().includes("figure") ||
    cleanLabel.toLowerCase().includes("diagram");

  const isVideo =
    !isVisual &&
    (citation?.unit.source_tracking.material_type === "lecture_video" ||
      cleanLabel.toLowerCase().includes("video") ||
      cleanLabel.toLowerCase().includes("lecture") ||
      cleanLabel.includes(":") ||
      cleanLabel.includes("@"));

  const isSlide =
    !isVisual &&
    (citation?.unit.source_tracking.material_type === "slide_deck" ||
      cleanLabel.toLowerCase().includes("slide"));

  const getStyle = () => {
    if (isVisual) {
      return {
        icon: ImageIcon,
        classes:
          "border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 hover:border-amber-500 dark:hover:border-amber-400 shadow-xs",
        dotColor: "bg-amber-500 dark:bg-amber-400",
      };
    }
    if (isVideo) {
      return {
        icon: Film,
        classes:
          "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-xs",
        dotColor: "bg-emerald-500 dark:bg-emerald-400",
      };
    }
    if (isSlide) {
      return {
        icon: Presentation,
        classes:
          "border-purple-500/40 bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 dark:hover:bg-purple-500/25 hover:border-purple-500 dark:hover:border-purple-400 shadow-xs",
        dotColor: "bg-purple-500 dark:bg-purple-400",
      };
    }
    return {
      icon: FileText,
      classes:
        "border-blue-500/40 bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 hover:border-blue-500 dark:hover:border-blue-400 shadow-xs",
      dotColor: "bg-blue-500 dark:bg-blue-400",
    };
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(citation || null, label);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 mx-1 my-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-200 ease-out cursor-pointer select-none active:scale-95 group align-baseline max-w-full break-words",
        style.classes
      )}
      title="Click to view verified source excerpt & provenance"
    >
      <Icon className="h-3 w-3 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
      <span className="truncate max-w-[200px] sm:max-w-xs">{cleanLabel}</span>
    </button>
  );
}
