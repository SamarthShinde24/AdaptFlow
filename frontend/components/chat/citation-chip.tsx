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
          "border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 hover:border-purple-400 shadow-sm",
      };
    }
    if (isSlide) {
      return {
        icon: Presentation,
        classes:
          "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400 shadow-sm",
      };
    }
    return {
      icon: FileText,
      classes:
        "border-blue-500/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 hover:border-blue-400 shadow-sm",
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
        "inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95 group align-baseline",
        style.classes
      )}
      title="Click to view verified source excerpt & provenance"
    >
      <Icon className="h-3 w-3 shrink-0 opacity-80 group-hover:opacity-100" />
      <span>{cleanLabel}</span>
    </button>
  );
}
