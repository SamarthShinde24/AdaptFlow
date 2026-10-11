"use client";

import React from "react";
import { FileText, Film, Presentation, Bookmark } from "lucide-react";
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
  const isVideo =
    citation?.unit.source_tracking.material_type === "lecture_video" ||
    cleanLabel.toLowerCase().includes("video") ||
    cleanLabel.toLowerCase().includes("lecture") ||
    cleanLabel.includes(":") ||
    cleanLabel.includes("@");

  const isSlide =
    citation?.unit.source_tracking.material_type === "slide_deck" ||
    cleanLabel.toLowerCase().includes("slide");

  const getStyle = () => {
    if (isVideo) {
      return {
        icon: Film,
        classes:
          "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400 shadow-xs",
        dotColor: "bg-emerald-400",
      };
    }
    if (isSlide) {
      return {
        icon: Presentation,
        classes:
          "border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 hover:border-purple-400 shadow-xs",
        dotColor: "bg-purple-400",
      };
    }
    return {
      icon: FileText,
      classes:
        "border-blue-500/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 hover:border-blue-400 shadow-xs",
      dotColor: "bg-blue-400",
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
