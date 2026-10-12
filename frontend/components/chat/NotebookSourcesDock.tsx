"use client";

import React, { useState } from "react";
import {
  BookOpen,
  FileText,
  Film,
  Presentation,
  Plus,
  PanelLeftClose,
  CheckSquare,
  Square,
  Search,
  ExternalLink,
  Play,
  Layers,
  Sparkles,
  X,
  FilePlus,
  StickyNote,
} from "lucide-react";
import { Material, MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ingestYouTubeLecture,
  extractYouTubeId,
  fetchYouTubeVideoInfo,
} from "@/lib/youtube-service";

export interface StudentNoteSource {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface NotebookSourcesDockProps {
  materials: Material[];
  selectedMaterialIds: Set<string>;
  onToggleMaterial: (materialId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenViewer: (material: Material) => void;
  onMaterialCreated?: (newMaterial: Material) => void;
}

export function NotebookSourcesDock({
  materials,
  selectedMaterialIds,
  onToggleMaterial,
  onSelectAll,
  onDeselectAll,
  isOpen,
  onToggleOpen,
  onOpenViewer,
  onMaterialCreated,
}: NotebookSourcesDockProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);

  // Add Source Modal state
  const [addSourceTab, setAddSourceTab] = useState<"youtube" | "file">("youtube");
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // Create Note state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const filteredMaterials = materials.filter((m) =>
    m.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.material_type.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const allSelected =
    materials.length > 0 && materials.every((m) => selectedMaterialIds.has(m.id));

  const handleSelectAllToggle = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const getModalityIcon = (type: MaterialType | string, isYouTube?: boolean) => {
    if (isYouTube) {
      return <Play className="h-3.5 w-3.5 text-rose-400 fill-rose-500/30" />;
    }
    switch (type) {
      case "lecture_video":
        return <Film className="h-3.5 w-3.5 text-purple-400" />;
      case "slide_deck":
        return <Presentation className="h-3.5 w-3.5 text-amber-400" />;
      case "textbook":
      default:
        return <FileText className="h-3.5 w-3.5 text-blue-400" />;
    }
  };

  const handleAddYouTubeSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setYtError(null);

    const videoId = extractYouTubeId(ytUrl);
    if (!videoId) {
      setYtError("Please enter a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=...)");
      return;
    }

    setYtLoading(true);
    try {
      const newMaterial = await ingestYouTubeLecture({
        url: ytUrl,
        title: ytTitle || undefined,
        courseId: "CS101",
        subject: "Computer Science",
      });

      if (onMaterialCreated) {
        onMaterialCreated(newMaterial);
      }
      setIsAddSourceModalOpen(false);
      setYtUrl("");
      setYtTitle("");
    } catch (err: any) {
      setYtError(err.message || "Failed to ingest YouTube video");
    } finally {
      setYtLoading(false);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const noteMaterial: Material = {
      id: `note_${Date.now()}`,
      title: noteTitle.trim(),
      filename: `student_note_${Date.now()}.txt`,
      material_type: "textbook",
      file_size_bytes: noteContent.length * 2,
      total_units_extracted: 1,
      course_id: "STUDY_NOTES",
      subject: "Personal Notes",
      status: "indexed",
      status_message: "User study note saved and indexed",
      metadata: {
        is_user_note: true,
        note_body: noteContent,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const stored: Material[] = JSON.parse(
          localStorage.getItem("adaptflow_client_materials") || "[]"
        );
        stored.unshift(noteMaterial);
        localStorage.setItem("adaptflow_client_materials", JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent("materials_updated", { detail: { material: noteMaterial } }));
      } catch {}
    }

    if (onMaterialCreated) {
      onMaterialCreated(noteMaterial);
    }

    setIsCreateNoteModalOpen(false);
    setNoteTitle("");
    setNoteContent("");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* NotebookLM Sources Left Dock */}
      <aside className="w-72 sm:w-80 h-full flex flex-col shrink-0 border-r border-slate-200 dark:border-[#262642] bg-white dark:bg-[#141426] select-none shadow-md transition-all duration-200">
        {/* Dock Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200 dark:border-[#262642]">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight uppercase">
              Sources
            </h2>
            <span className="rounded-full bg-slate-100 dark:bg-[#1C1C36] border border-slate-200 dark:border-[#262642] px-2 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {materials.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleOpen}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1C1C36] transition-colors cursor-pointer"
            title="Collapse sources panel"
            aria-label="Collapse sources"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons: + Add sources and + Create note */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-200 dark:border-[#262642]">
          <button
            type="button"
            onClick={() => setIsAddSourceModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-[#6C63FF]/50 hover:bg-purple-50/60 dark:hover:bg-[#202040] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-[#6C63FF]" />
            <span>Add sources</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateNoteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/50 hover:bg-emerald-50/60 dark:hover:bg-[#1b2b28] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Create note</span>
          </button>
        </div>

        {/* Sources Filter Search Bar */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter active sources..."
              className="w-full rounded-xl border border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#1C1C36] pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#202040] focus:border-[#6C63FF] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Source Cards List with Checkboxes */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800">
          {filteredMaterials.map((mat) => {
            const isChecked = selectedMaterialIds.has(mat.id);
            const isYouTube =
              mat.id.startsWith("yt_") ||
              mat.filename?.includes("youtube") ||
              Boolean((mat.metadata as any)?.youtube_id);

            return (
              <div
                key={mat.id}
                onClick={() => onToggleMaterial(mat.id)}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all duration-150 cursor-pointer border select-none",
                  isChecked
                    ? "bg-purple-50/70 dark:bg-[#1C1C36] border-[#6C63FF]/30 dark:border-[#383866] text-slate-900 dark:text-white shadow-2xs"
                    : "bg-white dark:bg-[#141426] border-slate-200 dark:border-[#22223c] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A1A32] hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1 flex-1">
                  <div className="shrink-0 p-1 rounded-lg bg-slate-100 dark:bg-[#141426] border border-slate-200 dark:border-[#262642]">
                    {getModalityIcon(mat.material_type, isYouTube)}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs truncate leading-snug group-hover:text-[#6C63FF] dark:group-hover:text-white transition-colors" title={mat.title}>
                      {mat.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {isYouTube ? "YouTube Stream" : mat.material_type.replace("_", " ")} · {mat.total_units_extracted || 6} units
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {/* Inspect modal button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenViewer(mat);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-opacity"
                    title="Open material viewer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>

                  {/* Checkbox */}
                  <div className="text-slate-300">
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No matching sources found.
            </div>
          )}
        </div>

        {/* Dock Footer: Select All + Total Selected Count */}
        <div className="p-3 border-t border-slate-200 dark:border-[#262642] bg-slate-50 dark:bg-[#141426] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={handleSelectAllToggle}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
            ) : (
              <Square className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            )}
            <span className="font-semibold text-xs">Select all</span>
          </button>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {selectedMaterialIds.size} of {materials.length} selected
          </span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD SOURCES (YOUTUBE / UPLOAD)                                    */}
      {/* ========================================================================= */}
      {isAddSourceModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddSourceModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#262642] bg-[#141426] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#262642]">
              <div className="flex items-center gap-2">
                <FilePlus className="h-5 w-5 text-[#8B85FF]" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Add Study Sources to Chat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSourceModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-[#1C1C36]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-[#1C1C36] border border-[#262642]">
                <button
                  type="button"
                  onClick={() => setAddSourceTab("youtube")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    addSourceTab === "youtube"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>YouTube URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddSourceTab("file")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    addSourceTab === "file"
                      ? "bg-[#6C63FF] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>
              </div>

              {addSourceTab === "youtube" ? (
                <form onSubmit={handleAddYouTubeSource} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      YouTube Lecture URL:
                    </label>
                    <input
                      type="text"
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full rounded-xl border border-[#262642] bg-[#1C1C36] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Title (Optional):
                    </label>
                    <input
                      type="text"
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
                      placeholder="e.g. Distributed Consensus & Raft Algorithm"
                      className="w-full rounded-xl border border-[#262642] bg-[#1C1C36] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  {ytError && (
                    <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                      {ytError}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddSourceModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#1C1C36]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={ytLoading || !ytUrl.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {ytLoading ? "Ingesting..." : "Add to Sources"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-400">
                    Use the Dashboard to upload full PDF textbooks or slide decks into your global library.
                  </p>
                  <a
                    href="/dashboard#upload-zone-section"
                    className="inline-block rounded-xl bg-[#6C63FF] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#5b52e0] transition-colors"
                  >
                    Open Dashboard Ingestion
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE NOTE SOURCE                                               */}
      {/* ========================================================================= */}
      {isCreateNoteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsCreateNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#262642] bg-[#141426] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#262642]">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Create Study Note Source
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateNoteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-[#1C1C36]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="py-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Note Title:
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Key Reaction Formulas: Citric Acid Cycle"
                  className="w-full rounded-xl border border-[#262642] bg-[#1C1C36] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Note Content:
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Paste formulas, key definitions, or lecture insights that the AI tutor should cite..."
                  className="w-full rounded-xl border border-[#262642] bg-[#1C1C36] p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#1C1C36]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!noteTitle.trim() || !noteContent.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer disabled:opacity-50"
                >
                  Save Note Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
