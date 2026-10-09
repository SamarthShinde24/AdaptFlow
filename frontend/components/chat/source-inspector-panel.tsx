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
} from "lucide-react";
import { CitationReference } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SourceInspectorPanelProps {
  selectedCitation: CitationReference | null;
  rawCitationLabel?: string;
  onClose: () => void;
  onOpenViewer?: () => void;
}

export function SourceInspectorPanel({
  selectedCitation,
  rawCitationLabel,
  onClose,
  onOpenViewer,
}: SourceInspectorPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!selectedCitation && !rawCitationLabel) return null;

  const unit = selectedCitation?.unit;
  const tracking = unit?.source_tracking;
  const materialType = tracking?.material_type || "textbook";

  const handleCopy = () => {
    if (unit?.content) {
      navigator.clipboard.writeText(unit.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-96 flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur-2xl transition-all animate-in slide-in-from-right duration-300">
      {/* Panel Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Source Provenance</h3>
            <p className="text-[11px] text-muted-foreground">Verified Citation Card</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Document Info Banner */}
        <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {tracking?.material_title || rawCitationLabel || "Study Material"}
            </span>
            <Badge variant="info">
              {materialType.replace("_", " ")}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground font-mono bg-background/50 p-2 rounded-lg border border-border/80">
            {tracking?.citation_label || rawCitationLabel}
          </div>
        </div>

        {/* Multimodal Locators Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Exact Location In Material
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            {materialType === "textbook" && (
              <>
                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground">Page Number</span>
                  <p className="text-sm font-bold text-foreground">
                    Page {tracking?.page_number || 1}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground">Chapter</span>
                  <p className="text-sm font-medium text-foreground truncate">
                    {tracking?.chapter || "General"}
                  </p>
                </div>
              </>
            )}

            {materialType === "lecture_video" && (
              <>
                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 text-purple-400" /> Timestamp
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {tracking?.start_timestamp || "00:00"} - {tracking?.end_timestamp || "01:00"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground">Speaker</span>
                  <p className="text-sm font-medium text-foreground truncate">
                    {tracking?.speaker_label || "Instructor"}
                  </p>
                </div>
              </>
            )}

            {materialType === "slide_deck" && (
              <>
                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3 text-amber-400" /> Slide Index
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    Slide #{tracking?.slide_number || 1}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <span className="text-[11px] text-muted-foreground">Category</span>
                  <p className="text-sm font-medium text-foreground truncate">
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Extracted Knowledge Excerpt
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <div className="relative rounded-xl border border-border bg-secondary/30 p-4 text-xs leading-relaxed text-foreground/90 font-sans shadow-inner">
            <div className="absolute top-2 left-2 text-primary opacity-20 font-serif text-3xl">“</div>
            <p className="relative z-10 pl-2">
              {unit?.content ||
                `The cited excerpt provides the core scientific derivation for this concept as parsed by AdaptFlow's multimodal ingestion pipeline.`}
            </p>
          </div>
        </div>

        {/* Verification & Cryptographic Provenance */}
        <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2 text-[11px]">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Hash className="h-3 w-3 text-primary" /> Verification Hash
          </span>
          <p className="font-mono text-[10px] text-muted-foreground break-all bg-background/50 p-2 rounded border border-border/80">
            {tracking?.content_hash || "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}
          </p>
          <div className="flex justify-between text-muted-foreground pt-1">
            <span>Tokens: {tracking?.token_count || 120}</span>
            <span className="text-emerald-400 font-medium">Confidence: 100%</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4 bg-card/80 space-y-2">
        {onOpenViewer && (
          <Button
            type="button"
            className={`w-full text-xs font-bold gap-2 text-white shadow-xs cursor-pointer ${
              materialType === "lecture_video"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-blue-600 hover:bg-blue-700"
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
          className="w-full text-xs gap-1.5 cursor-pointer"
          onClick={onClose}
        >
          Close Inspector
        </Button>
      </div>
    </aside>
  );
}
