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
  Check,
  Radio,
  Pause,
  Maximize2,
  Headphones,
} from "lucide-react";
import { Material, MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAudioOverview } from "@/context/AudioOverviewContext";
import { AudioWaveform } from "@/components/audio/AudioWaveform";
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

  const {
    currentEpisode,
    isPlaying,
    status,
    currentSpeaker,
    togglePlay,
    openModal,
    generateAndPlay,
    isGenerating,
  } = useAudioOverview();

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
      return <Play className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />;
    }
    switch (type) {
      case "lecture_video":
        return <Film className="h-3.5 w-3.5 text-purple-500" />;
      case "slide_deck":
        return <Presentation className="h-3.5 w-3.5 text-amber-500" />;
      case "textbook":
      default:
        return <FileText className="h-3.5 w-3.5 text-blue-500" />;
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
        window.dispatchEvent(
          new CustomEvent("materials_updated", { detail: { material: noteMaterial } })
        );
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
      <aside className="w-72 sm:w-80 h-full flex flex-col shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#161719] select-none shadow-xs transition-all duration-200">
        {/* Dock Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-200 tracking-tight uppercase">
              Sources
            </h2>
            <span className="rounded-full bg-slate-200/80 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              {materials.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleOpen}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Collapse sources panel"
            aria-label="Collapse sources"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* NotebookLM Action Buttons: + Add sources and + Create note */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => setIsAddSourceModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#202125] px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-[#6C63FF]" />
            <span>Add sources</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateNoteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#202125] px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" />
            <span>Create note</span>
          </button>
        </div>

        {/* NotebookLM Style Audio Overview Widget */}
        <div className="p-3 border-b border-slate-200/80 dark:border-white/10 bg-gradient-to-b from-[#6C63FF]/5 to-transparent">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1f2024] p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6C63FF]/10 text-[#6C63FF] dark:text-[#8B85FF]">
                  <Radio className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Audio Overview
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                Deep Dive
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
              Two AI hosts (Alex & Jordan) discuss core concepts from your selected study notes.
            </p>

            {currentEpisode ? (
              <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-white/5 p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[170px]"
                    title={currentEpisode.title}
                  >
                    {currentEpisode.title}
                  </span>
                  {isPlaying && (
                    <AudioWaveform
                      isPlaying={true}
                      speaker={currentSpeaker}
                      barCount={4}
                      className="h-3 shrink-0"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#6C63FF] hover:bg-[#5850EC] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-3 w-3 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                        <span>{status === "paused" ? "Resume" : "Play Deep Dive"}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal()}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
                    title="Open Audio Overview Studio"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  const selectedList = materials.filter((m) =>
                    selectedMaterialIds.has(m.id)
                  );
                  const ids = selectedList.map((m) => m.id);
                  const topicName =
                    selectedList.length > 0 ? selectedList[0].title : undefined;
                  generateAndPlay({ materialIds: ids, topic: topicName });
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#5850EC] py-2 px-3 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {isGenerating
                    ? "Synthesizing Podcast..."
                    : selectedMaterialIds.size > 0
                    ? `Generate (~4 min)`
                    : "Generate Audio Overview"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search your sources..."
              className="w-full rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#202125] pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#6C63FF] transition-all"
            />
          </div>
        </div>

        {/* Source Items */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-zinc-700">
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
                  "group relative flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs transition-all duration-150 cursor-pointer border select-none",
                  isChecked
                    ? "bg-white dark:bg-[#202125] border-slate-300/80 dark:border-white/20 text-slate-900 dark:text-zinc-100 shadow-2xs"
                    : "bg-slate-100/60 dark:bg-[#1a1b1e] border-transparent text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-[#202125] hover:border-slate-200 dark:hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1 flex-1">
                  <div className="shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-white/5">
                    {getModalityIcon(mat.material_type, isYouTube)}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span
                      className="font-semibold text-xs truncate leading-snug group-hover:text-[#6C63FF] dark:group-hover:text-white transition-colors"
                      title={mat.title}
                    >
                      {mat.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {isYouTube ? "Video stream" : mat.material_type.replace("_", " ")} · {mat.total_units_extracted || 6} units
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

                  {/* Clean checkbox */}
                  <div className="text-slate-300">
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300 dark:text-zinc-600 group-hover:text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
              No matching sources found.
            </div>
          )}
        </div>

        {/* Dock Footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#161719] flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={handleSelectAllToggle}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer select-none"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
            ) : (
              <Square className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
            )}
            <span className="font-semibold text-xs">Select all</span>
          </button>

          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
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
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1c1d21] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FilePlus className="h-5 w-5 text-[#6C63FF]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Add Study Sources to Chat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSourceModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2 p-1 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setAddSourceTab("youtube")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold transition-all",
                    addSourceTab === "youtube"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Video Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddSourceTab("file")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold transition-all",
                    addSourceTab === "file"
                      ? "bg-[#6C63FF] text-white shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>
              </div>

              {addSourceTab === "youtube" ? (
                <form onSubmit={handleAddYouTubeSource} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Video Link:
                    </label>
                    <input
                      type="text"
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      placeholder="https://... (e.g. video link or stream URL)"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Title (Optional):
                    </label>
                    <input
                      type="text"
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
                      placeholder="e.g. Distributed Consensus & Raft Algorithm"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  {ytError && (
                    <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                      {ytError}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddSourceModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={ytLoading || !ytUrl.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {ytLoading ? "Ingesting..." : "Add Video Source"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
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
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1c1d21] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Create Study Note Source
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateNoteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="py-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Note Title:
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Key Reaction Formulas: Citric Acid Cycle"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Note Content:
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Paste formulas, key definitions, or lecture insights that the AI tutor should cite..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
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
