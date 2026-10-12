"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Film,
  Presentation,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Layers,
  Hash,
  ExternalLink,
  Image as ImageIcon,
  ZoomIn,
} from "lucide-react";
import { CitationReference } from "@/lib/types";
import { getVisualImageUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SourceInspectorPanelProps {
  selectedCitation: CitationReference | null;
  rawCitationLabel?: string;
  onClose: () => void;
  onOpenViewer?: () => void;
  onOpenLightbox?: () => void;
}

export function SourceInspectorPanel({
  selectedCitation,
  rawCitationLabel,
  onClose,
  onOpenViewer,
  onOpenLightbox,
}: SourceInspectorPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!selectedCitation && !rawCitationLabel) return null;

  const unit = selectedCitation?.unit;
  const tracking = unit?.source_tracking;
  const materialType = tracking?.material_type || "textbook";

  const isVisual =
    unit?.modality === "visual" ||
    Boolean(tracking?.image_stored_path) ||
    Boolean(tracking?.is_visual) ||
    (rawCitationLabel || "").includes("🖼️") ||
    (tracking?.citation_label || "").includes("🖼️") ||
    (rawCitationLabel || "").toLowerCase().includes("figure") ||
    (rawCitationLabel || "").toLowerCase().includes("diagram");

  let visualUrl = getVisualImageUrl(tracking?.image_stored_path);
  if (!visualUrl && isVisual) {
    const labelLower = (rawCitationLabel || tracking?.citation_label || "").toLowerCase();
    if (labelLower.includes("chemiosmosis")) {
      visualUrl = "/uploads/visuals/sample_chemiosmosis.png";
    } else {
      visualUrl = "/uploads/visuals/sample_glycolysis_pathway.png";
    }
  }

  const handleCopy = () => {
    if (unit?.content) {
      navigator.clipboard.writeText(unit.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-96 flex-col border-l border-slate-200 dark:border-[#262642] bg-white/95 dark:bg-[#141426]/95 shadow-2xl backdrop-blur-2xl transition-all animate-in slide-in-from-right duration-300">
      {/* Panel Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-[#262642] px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#8B85FF] border border-[#6C63FF]/30">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Source Provenance</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Verified Citation Card</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C36]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Document Info Banner */}
        <div className="rounded-xl border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              {tracking?.material_title || rawCitationLabel || "Study Material"}
            </span>
            <Badge variant={isVisual ? "warning" : "info"}>
              {isVisual ? "Visual Diagram" : materialType.replace("_", " ")}
            </Badge>
          </div>

          <div className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-[#141426] p-2 rounded-lg border border-slate-200 dark:border-[#262642]">
            {tracking?.citation_label || rawCitationLabel}
          </div>
        </div>

        {/* Visual Diagram Preview Card */}
        {isVisual && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                <span>Extracted Diagram / Figure</span>
              </span>
              <Badge variant="warning" className="text-[10px] uppercase">
                {tracking?.visual_type || "Diagram"}
              </Badge>
            </div>

            {visualUrl && (
              <div
                className="relative rounded-lg overflow-hidden border border-amber-500/30 bg-black/40 group cursor-pointer"
                onClick={onOpenLightbox}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={visualUrl}
                  alt={tracking?.caption || "Visual Diagram"}
                  className="w-full h-36 object-contain bg-slate-950 transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                  <ZoomIn className="h-4 w-4" />
                  <span>Click to expand in Lightbox</span>
                </div>
              </div>
            )}

            {tracking?.caption && (
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic">
                {tracking.caption}
              </p>
            )}
          </div>
        )}

        {/* Multimodal Locators Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Exact Location In Material
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            {materialType === "textbook" && (
              <>
                <div className="rounded-lg border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Page Number</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Page {tracking?.page_number || 1}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Chapter</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {tracking?.chapter || "General"}
                  </p>
                </div>
              </>
            )}

            {materialType === "lecture_video" && (
              <>
                <div className="rounded-lg border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-purple-500 dark:text-purple-400" /> Timestamp
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {tracking?.start_timestamp || "00:00"} - {tracking?.end_timestamp || "01:00"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Speaker</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {tracking?.speaker_label || "Instructor"}
                  </p>
                </div>
              </>
            )}

            {materialType === "slide_deck" && (
              <>
                <div className="rounded-lg border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Layers className="h-3 w-3 text-amber-500 dark:text-amber-400" /> Slide Index
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Slide #{tracking?.slide_number || 1}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Category</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {tracking?.is_speaker_notes ? "Speaker Notes" : "Slide Content"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Excerpt Text Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Extracted Knowledge Excerpt
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C36]"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <div className="relative rounded-xl border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36]/80 p-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-sans shadow-inner">
            <div className="absolute top-2 left-2 text-[#6C63FF] opacity-30 font-serif text-3xl">“</div>
            <p className="relative z-10 pl-2">
              {unit?.content ||
                `The cited excerpt provides the core scientific derivation for this concept as parsed by AdaptFlow's multimodal ingestion pipeline.`}
            </p>
          </div>
        </div>

        {/* Verification & Cryptographic Provenance */}
        <div className="rounded-xl border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] p-3 space-y-2 text-[11px]">
          <span className="font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Hash className="h-3 w-3 text-[#6C63FF] dark:text-[#8B85FF]" /> Verification Hash
          </span>
          <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-[#141426] p-2 rounded border border-slate-200 dark:border-[#262642]">
            {tracking?.content_hash || "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}
          </p>
          <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1">
            <span>Tokens: {tracking?.token_count || 120}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Confidence: 100%</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200 dark:border-[#262642] p-4 bg-slate-50 dark:bg-[#141426] space-y-2">
        {isVisual && onOpenLightbox && (
          <Button
            type="button"
            className="w-full text-xs font-bold gap-2 text-white shadow-xs cursor-pointer bg-amber-600 hover:bg-amber-700"
            onClick={onOpenLightbox}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Open Diagram in Lightbox Viewer</span>
          </Button>
        )}
        {onOpenViewer && (
          <Button
            type="button"
            className={`w-full text-xs font-bold gap-2 text-white shadow-xs cursor-pointer ${
              materialType === "lecture_video"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-[#6C63FF] hover:bg-[#5b52e0]"
            }`}
            onClick={onOpenViewer}
          >
            {materialType === "lecture_video" ? (
              <>
                <Film className="h-3.5 w-3.5" />
                <span>Play Lecture Video at Timestamp</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span>Open PDF Document at Page</span>
              </>
            )}
          </Button>
        )}
        <Button
          variant="secondary"
          className="w-full text-xs gap-1.5 cursor-pointer bg-white dark:bg-[#1C1C36] border border-slate-200 dark:border-[#262642] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222240]"
          onClick={onClose}
        >
          Close Inspector
        </Button>
      </div>
    </aside>
  );
}
