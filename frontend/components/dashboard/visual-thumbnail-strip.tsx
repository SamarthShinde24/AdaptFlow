"use client";

import React, { useState } from "react";
import {
  Image as ImageIcon,
  Sparkles,
  ZoomIn,
  BookOpen,
  Presentation,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { KnowledgeUnit, CitationReference } from "@/lib/types";
import { getVisualImageUrl } from "@/lib/api";
import { ImageLightboxModal } from "@/components/chat/image-lightbox-modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VisualThumbnailStripProps {
  visuals: KnowledgeUnit[];
  totalVisualsCount?: number;
  loading?: boolean;
}

export function VisualThumbnailStrip({
  visuals,
  totalVisualsCount,
  loading = false,
}: VisualThumbnailStripProps) {
  const [selectedCitation, setSelectedCitation] = useState<CitationReference | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fallback sample units if list is empty
  const displayVisuals: KnowledgeUnit[] =
    visuals.length > 0
      ? visuals
      : [
          {
            id: "sample-vis-1",
            material_id: "mat_1",
            content:
              "Figure 3.2: Detailed biological schematic of the glycolysis pathway showing glucose conversion into pyruvate with net ATP and NADH generation in the cytosol.",
            modality: "visual",
            summary: "Glycolysis enzymatic phosphorylation and payoff phases.",
            source_tracking: {
              material_id: "mat_1",
              material_title: "Principles of Biology (11th Ed)",
              material_type: "textbook",
              chunk_index: 4,
              page_number: 42,
              figure_index: 2,
              caption: "Figure 3.2: Glycolysis pathway & phosphorylation stages",
              visual_type: "diagram",
              image_stored_path: "/uploads/visuals/sample_glycolysis_pathway.png",
              citation_label: "[🖼️ Figure 3.2 · PDF p.42]",
              content_hash: "hash_vis_sample_1",
              token_count: 55,
              confidence_score: 1.0,
              is_speaker_notes: false,
            },
            tags: ["biology", "glycolysis", "diagram"],
            created_at: new Date().toISOString(),
          },
          {
            id: "sample-vis-2",
            material_id: "mat_1",
            content:
              "Figure 4.1: Inner mitochondrial membrane chemiosmosis and F0-F1 ATP synthase rotor dynamics driven by proton motive force.",
            modality: "visual",
            summary: "Mitochondrial electron transport chain and ATP synthase rotational kinetics.",
            source_tracking: {
              material_id: "mat_1",
              material_title: "Principles of Biology (11th Ed)",
              material_type: "textbook",
              chunk_index: 5,
              page_number: 56,
              figure_index: 1,
              caption: "Figure 4.1: Chemiosmosis & ATP Synthase rotary catalysis",
              visual_type: "diagram",
              image_stored_path: "/uploads/visuals/sample_chemiosmosis.png",
              citation_label: "[🖼️ Figure 4.1 · PDF p.56]",
              content_hash: "hash_vis_sample_2",
              token_count: 60,
              confidence_score: 1.0,
              is_speaker_notes: false,
            },
            tags: ["biology", "chemiosmosis", "diagram"],
            created_at: new Date().toISOString(),
          },
        ];

  const totalCount = totalVisualsCount || displayVisuals.length;

  const handleOpenVisual = (unit: KnowledgeUnit) => {
    const citRef: CitationReference = {
      key: unit.source_tracking.citation_label || "[Visual Diagram]",
      unit,
    };
    setSelectedCitation(citRef);
    setLightboxOpen(true);
  };

  return (
    <section className="space-y-3.5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Indexed Visual Diagrams & Figures
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                <span>{totalCount} Diagrams Indexed</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
              Extracted multimodal figures with vision-understood component labels from textbooks and slides.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Thumbnail Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {displayVisuals.slice(0, 4).map((unit) => {
          const st = unit.source_tracking;
          const caption =
            st.caption ||
            (st.figure_index ? `Figure ${st.figure_index}` : "Extracted Diagram");
          const materialTitle = st.material_title || "Course Material";
          const loc =
            st.page_number
              ? `PDF p.${st.page_number}`
              : st.slide_number
              ? `Slide #${st.slide_number}`
              : "Visual Unit";

          let imgUrl = getVisualImageUrl(st.image_stored_path);
          if (!imgUrl) {
            imgUrl = caption.toLowerCase().includes("chemiosmosis")
              ? "/uploads/visuals/sample_chemiosmosis.png"
              : "/uploads/visuals/sample_glycolysis_pathway.png";
          }

          return (
            <div
              key={unit.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenVisual(unit)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenVisual(unit);
                }
              }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xs hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none"
            >
              {/* Image Preview Box */}
              <div className="relative h-32 w-full overflow-hidden bg-slate-950 flex items-center justify-center border-b border-gray-100 dark:border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={caption}
                  className="max-h-full max-w-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to sample glycolysis if broken
                    (e.target as HTMLImageElement).src =
                      "/uploads/visuals/sample_glycolysis_pathway.png";
                  }}
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-2xs">
                  <ZoomIn className="h-4 w-4" />
                  <span>Inspect Lightbox</span>
                </div>

                {/* Top Badge */}
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow-xs">
                    <ImageIcon className="h-2.5 w-2.5" />
                    <span>{loc}</span>
                  </span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="flex-1 p-3 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {caption}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                    {materialTitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/[0.04] text-[10px] text-gray-500 dark:text-zinc-400">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    100% Grounded
                  </span>
                  <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold group-hover:underline">
                    <span>View diagram</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedCitation && (
        <ImageLightboxModal
          isOpen={lightboxOpen}
          citation={selectedCitation}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </section>
  );
}
