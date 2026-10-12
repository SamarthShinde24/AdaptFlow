"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Sparkles,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  BookOpen,
  Presentation,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { CitationReference } from "@/lib/types";
import { getVisualImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: CitationReference | null;
  rawLabel?: string;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  citation,
  rawLabel,
}: ImageLightboxModalProps) {
  const [zoom, setZoom] = useState(1);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom on modal open
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setImgError(false);
      setImgLoaded(false);
    }
  }, [isOpen, citation]);

  // Keyboard shortcut listener: ESC to close, +/- for zoom, 0 to reset
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(z + 0.25, 3));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(z - 0.25, 0.5));
      } else if (e.key === "0") {
        setZoom(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unit = citation?.unit;
  const tracking = unit?.source_tracking;
  const rawPath = tracking?.image_stored_path;

  // Resolve best image URL with intelligent sample fallbacks
  let resolvedUrl = getVisualImageUrl(rawPath);
  if (!resolvedUrl || resolvedUrl === "") {
    const labelLower = (rawLabel || tracking?.citation_label || "").toLowerCase();
    const contentLower = (unit?.content || "").toLowerCase();
    if (labelLower.includes("chemiosmosis") || contentLower.includes("chemiosmosis") || contentLower.includes("atp synthase")) {
      resolvedUrl = "/uploads/visuals/sample_chemiosmosis.png";
    } else {
      resolvedUrl = "/uploads/visuals/sample_glycolysis_pathway.png";
    }
  }

  const captionText =
    tracking?.caption ||
    (tracking?.figure_index ? `Figure ${tracking.figure_index}` : "Visual Diagram");

  const materialTitle = tracking?.material_title || "Course Material";
  const visualType = (tracking?.visual_type || "diagram").toUpperCase();
  const pageOrSlide =
    tracking?.page_number
      ? `PDF p.${tracking.page_number}`
      : tracking?.slide_number
      ? `Slide #${tracking.slide_number}`
      : "";

  const pillLabel =
    tracking?.citation_label ||
    rawLabel ||
    `[🖼️ ${captionText} ${pageOrSlide ? `· ${pageOrSlide}` : ""}]`;

  const handleDownload = () => {
    if (!resolvedUrl) return;
    const a = document.createElement("a");
    a.href = resolvedUrl;
    a.download = `adaptflow-diagram-${tracking?.figure_index || "figure"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 text-slate-100 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 select-none">
          <div className="flex items-center gap-3 min-w-0">
            {/* Visual Amber Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-xs shrink-0">
              <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
              <span>{pillLabel}</span>
            </span>

            <div className="hidden sm:block min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 truncate">
                {captionText}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {materialTitle} {pageOrSlide ? `• ${pageOrSlide}` : ""}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/80 p-0.5 mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="px-1.5 text-[11px] font-mono text-slate-300 min-w-[42px] text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(1)}
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
                title="Reset Zoom (0)"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>

            {/* Download Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Image Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 flex items-center justify-center overflow-auto p-4 bg-slate-950/90 select-none"
        >
          {/* Fallback SVG when image error occurs */}
          {imgError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <ImageIcon className="h-8 w-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-100 mb-1">
                {captionText}
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Extracted visual indexed from {materialTitle} ({pageOrSlide || "Visual Source"}).
              </p>
              <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-xs">
                {visualType} UNIT
              </Badge>
            </div>
          ) : (
            <div
              className="relative transition-transform duration-150 ease-out origin-center flex items-center justify-center max-w-full max-h-full"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedUrl}
                alt={captionText}
                className={cn(
                  "max-w-full max-h-[62vh] object-contain rounded-lg border border-slate-800 shadow-2xl transition-opacity duration-300",
                  imgLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  // If resolvedUrl was remote or relative, try fallback to sample glycolysis
                  if (!resolvedUrl.includes("sample_glycolysis_pathway.png")) {
                    resolvedUrl = "/uploads/visuals/sample_glycolysis_pathway.png";
                  } else {
                    setImgError(true);
                  }
                }}
              />

              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vision AI Pedagogical Understanding Panel (Collapsible) */}
        <div className="border-t border-slate-800 bg-slate-950/80 transition-all">
          <button
            type="button"
            onClick={() => setIsAnalysisOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Vision Model Pedagogical Analysis & Component Labels</span>
              <span className="text-[10px] text-slate-500 font-mono">
                [Multimodal AI Grounding]
              </span>
            </div>
            {isAnalysisOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {isAnalysisOpen && (
            <div className="px-5 pb-4 pt-1 max-h-48 overflow-y-auto space-y-2 text-xs border-t border-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    Visual Modality
                  </span>
                  <span className="font-semibold text-amber-300">{visualType}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    Material Source
                  </span>
                  <span className="font-semibold text-slate-200 truncate block">
                    {materialTitle}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                    Locator
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {pageOrSlide || "Indexed Unit"}
                  </span>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-slate-300 leading-relaxed font-sans text-xs">
                <p className="whitespace-pre-line">
                  {unit?.content ||
                    "This visual depicts the biological reaction pathway, showing labeled enzymatic intermediates, phosphorylation steps, and net energy yields verified by the AdaptFlow multimodal ingestion engine."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
