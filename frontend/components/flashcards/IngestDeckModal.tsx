"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  BookOpen,
  Film,
  Presentation,
  Sparkles,
  Check,
  Search,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Material, MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IngestDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onGenerate: (selectedMaterial: Material | null) => void;
}

export function IngestDeckModal({
  isOpen,
  onClose,
  materials,
  onGenerate,
}: IngestDeckModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string>(materials[0]?.id || "all_combined");

  // Filter materials based on search and type tab
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.filename && m.filename.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesType = true;
      if (filterType === "pdf") {
        matchesType = m.material_type === "textbook";
      } else if (filterType === "video") {
        matchesType = m.material_type === "lecture_video" || m.id.startsWith("yt_");
      } else if (filterType === "slides") {
        matchesType = m.material_type === "slide_deck";
      }

      return matchesSearch && matchesType;
    });
  }, [materials, searchQuery, filterType]);

  if (!isOpen) return null;

  const handleSelectCard = (id: string) => {
    setSelectedId(id);
  };

  const handleConfirm = () => {
    if (selectedId === "all_combined") {
      onGenerate(null); // null represents all combined
    } else {
      const chosen = materials.find((m) => m.id === selectedId);
      onGenerate(chosen || null);
    }
    onClose();
  };

  const getMaterialIcon = (mat: Material) => {
    if (mat.material_type === "textbook") {
      return <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
    if (mat.material_type === "slide_deck") {
      return <Presentation className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    }
    return <Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
  };

  const getMaterialTypeBadge = (mat: Material) => {
    if (mat.id.startsWith("yt_") || (mat.filename && mat.filename.includes(".mp4") && mat.title.includes("Video"))) {
      return (
        <span className="rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 text-[10px] font-semibold border border-purple-200 dark:border-purple-800/60">
          Video URL / YouTube
        </span>
      );
    }
    if (mat.material_type === "textbook") {
      return (
        <span className="rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 text-[10px] font-semibold border border-blue-200 dark:border-blue-800/60">
          PDF Textbook
        </span>
      );
    }
    if (mat.material_type === "slide_deck") {
      return (
        <span className="rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 text-[10px] font-semibold border border-amber-200 dark:border-amber-800/60">
          Slide Deck (PPT)
        </span>
      );
    }
    return (
      <span className="rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 text-[10px] font-semibold border border-purple-200 dark:border-purple-800/60">
        Lecture Video
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingest-modal-title"
        className="w-full max-w-2xl rounded-2xl border border-sky-200 dark:border-blue-900/60 bg-white dark:bg-[#0A1222] p-5 sm:p-6 shadow-2xl transition-all max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-blue-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 text-lg">
              🧠
            </span>
            <div>
              <h3
                id="ingest-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                Ingest Study Material to Flashcards
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Choose any ingested PDF, lecture video, slide deck, or video URL to generate 10 bite-sized recall cards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="pt-3 pb-2 space-y-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                filterType === "all"
                  ? "bg-[#6C63FF] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
              )}
            >
              All ({materials.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("pdf")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                filterType === "pdf"
                  ? "bg-[#6C63FF] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
              )}
            >
              📄 PDF Textbooks
            </button>
            <button
              type="button"
              onClick={() => setFilterType("video")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                filterType === "video"
                  ? "bg-[#6C63FF] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
              )}
            >
              🎥 Videos & URLs
            </button>
            <button
              type="button"
              onClick={() => setFilterType("slides")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                filterType === "slides"
                  ? "bg-[#6C63FF] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
              )}
            >
              📊 Slide Decks (PPT)
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-blue-900/60 bg-slate-50/60 dark:bg-[#070D18] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#6C63FF]"
            />
          </div>
        </div>

        {/* Scrollable Materials List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 py-2">
          {/* Preset Option: All Ingested Materials */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSelectCard("all_combined")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectCard("all_combined")}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
              selectedId === "all_combined"
                ? "border-[#6C63FF] bg-[#6C63FF]/10 ring-2 ring-[#6C63FF]/20 dark:border-[#6C63FF] dark:bg-[#6C63FF]/20"
                : "border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0C1527] hover:border-slate-300 dark:hover:border-blue-800"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6C63FF]/15 text-[#6C63FF] shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    All Ingested Materials (Combined)
                  </h4>
                  <span className="rounded-md bg-[#6C63FF]/15 text-[#6C63FF] px-2 py-0.5 text-[10px] font-bold">
                    Comprehensive
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Generates 10 high-yield recall cards synthesized across all {materials.length} uploaded sources.
                </p>
              </div>
            </div>

            <div
              className={cn(
                "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors",
                selectedId === "all_combined"
                  ? "border-[#6C63FF] bg-[#6C63FF] text-white"
                  : "border-slate-300 dark:border-zinc-700 bg-transparent"
              )}
            >
              {selectedId === "all_combined" && <Check className="h-3 w-3 stroke-[3]" />}
            </div>
          </div>

          {/* Individual Material Cards */}
          {filteredMaterials.map((mat) => {
            const isSelected = selectedId === mat.id;
            return (
              <div
                key={mat.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectCard(mat.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectCard(mat.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                  isSelected
                    ? "border-[#6C63FF] bg-[#6C63FF]/10 ring-2 ring-[#6C63FF]/20 dark:border-[#6C63FF] dark:bg-[#6C63FF]/20"
                    : "border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0C1527] hover:border-slate-300 dark:hover:border-blue-800"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800/80 shrink-0">
                    {getMaterialIcon(mat)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-sm">
                        {mat.title}
                      </h4>
                      {getMaterialTypeBadge(mat)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate font-mono">
                      {mat.filename || mat.title}
                      {mat.total_units_extracted ? ` · ${mat.total_units_extracted} knowledge units` : ""}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-colors",
                    isSelected
                      ? "border-[#6C63FF] bg-[#6C63FF] text-white"
                      : "border-slate-300 dark:border-zinc-700 bg-transparent"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
              No matching study materials found. Try clearing your search query.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-sky-100 dark:border-blue-900/40 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-[#6C63FF]" />
            Generates 10 cards with 1-sentence answers and zero cognitive fatigue.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#6C63FF] hover:bg-[#5850EC] shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🧠 Generate 10 Flashcards</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
