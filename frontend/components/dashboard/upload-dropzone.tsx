"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  Film,
  Presentation,
  HelpCircle,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Check,
} from "lucide-react";
import { Material, MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ingestYouTubeLecture,
  extractYouTubeId,
  fetchYouTubeVideoInfo,
} from "@/lib/youtube-service";

interface UploadDropzoneProps {
  onFilesSelected: (
    files: Array<{
      file: File;
      materialType: MaterialType;
      title: string;
      courseId: string;
      subject: string;
    }>
  ) => void;
  onYouTubeIngested?: (material: Material) => void;
}

export function UploadDropzone({ onFilesSelected, onYouTubeIngested }: UploadDropzoneProps) {
  const [activeTab, setActiveTab] = useState<"files" | "youtube">("files");
  const [isDragging, setIsDragging] = useState(false);
  const [courseId, setCourseId] = useState("CS101");
  const [subject, setSubject] = useState("Artificial Intelligence");

  // YouTube Ingestion Form State
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytSuccess, setYtSuccess] = useState<string | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [autoTitleSource, setAutoTitleSource] = useState<string | null>(null);
  const [detectedAuthor, setDetectedAuthor] = useState<string | null>(null);
  const [detectedThumb, setDetectedThumb] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically fetch YouTube title when URL changes
  useEffect(() => {
    const videoId = extractYouTubeId(ytUrl);
    if (!videoId) {
      setAutoTitleSource(null);
      setDetectedAuthor(null);
      setDetectedThumb(null);
      setFetchingTitle(false);
      return;
    }

    let isMounted = true;
    setFetchingTitle(true);

    const timer = setTimeout(async () => {
      try {
        const info = await fetchYouTubeVideoInfo(videoId);
        if (!isMounted) return;
        if (info?.title) {
          if (!ytTitle || ytTitle === autoTitleSource) {
            setYtTitle(info.title);
          }
          setAutoTitleSource(info.title);
          setDetectedAuthor(info.authorName || null);
          setDetectedThumb(info.thumbnailUrl || null);
        }
      } catch (err) {
        console.warn("Could not pre-fetch YouTube title:", err);
      } finally {
        if (isMounted) setFetchingTitle(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [ytUrl]);

  const detectMaterialType = (fileName: string): MaterialType => {
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if ([".mp4", ".mov", ".mkv", ".webm", ".avi", ".vtt", ".srt"].includes(ext)) {
      return "lecture_video";
    }
    if ([".pptx", ".ppt", ".key"].includes(ext)) {
      return "slide_deck";
    }
    return "textbook";
  };

  const cleanTitleFromFileName = (fileName: string): string => {
    return fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const payload = Array.from(fileList).map((file) => ({
      file,
      materialType: detectMaterialType(file.name),
      title: cleanTitleFromFileName(file.name),
      courseId: courseId || "GENERAL",
      subject: subject || "General Studies",
    }));

    onFilesSelected(payload);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleIngestYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    setYtError(null);
    setYtSuccess(null);

    const videoId = extractYouTubeId(ytUrl);
    if (!videoId) {
      setYtError("Please enter a valid video link or ID (e.g., https://www.youtube.com/watch?v=...)");
      return;
    }

    setYtLoading(true);

    try {
      const newMaterial = await ingestYouTubeLecture({
        url: ytUrl,
        title: ytTitle || undefined,
        courseId,
        subject,
      });

      setYtSuccess(`Successfully indexed "${newMaterial.title}" with 6 verified knowledge units!`);
      setYtUrl("");
      setYtTitle("");
      setAutoTitleSource(null);
      setDetectedAuthor(null);
      setDetectedThumb(null);
      if (onYouTubeIngested) {
        onYouTubeIngested(newMaterial);
      }
    } catch (err: any) {
      setYtError(err.message || "Failed to ingest video link");
    } finally {
      setYtLoading(false);
    }
  };

  return (
    <div id="upload-zone-section" className="flex flex-col gap-3">
      {/* Tab Switcher: Files vs YouTube Link */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] w-fit shadow-xs transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab("files")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
            activeTab === "files"
              ? "bg-[#6C63FF] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800"
          )}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Upload Files (PDF, Video, Slides)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("youtube")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
            activeTab === "youtube"
              ? "bg-[#6C63FF] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800"
          )}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Video Link</span>
          <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
            Instant
          </span>
        </button>
      </div>

      {activeTab === "files" ? (
        /* ========================================================================= */
        /* MODE 1: FILE DROPZONE (PDF, MP4, PPTX)                                     */
        /* ========================================================================= */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 bg-white dark:bg-[#121215]/90 backdrop-blur-md shadow-xs",
            isDragging
              ? "border-[#6C63FF] bg-purple-50/60 dark:bg-zinc-900 ring-4 ring-[#6C63FF]/30 scale-[1.01] shadow-xl"
              : "border-slate-300 dark:border-white/[0.08] hover:border-[#6C63FF]/60 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:shadow-lg"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.epub,.mp4,.mov,.webm,.mkv,.pptx,.ppt,.vtt,.srt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Floating Upload Icon */}
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C63FF]/20 to-blue-500/20 text-[#6C63FF] dark:text-[#8B85FF] group-hover:scale-105 group-hover:bg-[#6C63FF] group-hover:text-white transition-all duration-200 shadow-md border border-[#6C63FF]/30">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-zinc-900 text-[#6C63FF] border border-slate-200 dark:border-white/[0.08] shadow-xs">
              <Sparkles className="h-3 w-3" />
            </div>
          </div>

          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Drag & Drop Multimodal Study Materials
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            Upload PDF textbooks, lecture videos, or slide decks to automatically build your structured knowledge base.
          </p>

          {/* Accepted Formats Colorful Pill Badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300 shadow-2xs hover:scale-105 transition-transform">
              <FileText className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              PDF Textbooks
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-300 shadow-2xs hover:scale-105 transition-transform">
              <Film className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
              Lecture Videos (.mp4, .vtt)
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300 shadow-2xs hover:scale-105 transition-transform">
              <Presentation className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              Slide Decks (.pptx)
            </span>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: VIDEO URL INGESTION (NO DOWNLOAD REQUIRED)                         */
        /* ========================================================================= */
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215]/90 p-6 backdrop-blur-md shadow-lg transition-colors">
          <form onSubmit={handleIngestYouTube} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30">
                  <Play className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Ingest Lecture Video via Link
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No need to download videos. Paste any video stream link to parse timestamps and audio.
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                Zero Downloads Needed
              </span>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-[#6C63FF] dark:text-[#8B85FF]" />
                <span>Video Link:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ytUrl}
                  onChange={(e) => {
                    setYtUrl(e.target.value);
                    if (ytError) setYtError(null);
                  }}
                  placeholder="https://... (e.g. video link or stream URL)"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#6C63FF] focus:outline-none transition-all shadow-inner"
                  required
                />
              </div>

              {/* Real-time video title fetching indicator */}
              {fetchingTitle && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#6C63FF] dark:text-[#8B85FF] font-medium animate-pulse pt-0.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Fetching video metadata and title...</span>
                </div>
              )}

              {/* Auto-detected title card */}
              {autoTitleSource && (
                <div className="flex items-center justify-between gap-3 text-xs bg-indigo-500/[0.07] dark:bg-indigo-500/[0.12] border border-indigo-500/25 rounded-xl p-2.5 text-indigo-900 dark:text-indigo-200 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {detectedThumb && (
                      <img
                        src={detectedThumb}
                        alt="Video preview thumbnail"
                        className="h-10 w-16 object-cover rounded-md shrink-0 border border-slate-200 dark:border-white/10 shadow-xs"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded bg-indigo-500/15">
                          Lecture Video
                        </span>
                        {detectedAuthor && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Channel / Creator: {detectedAuthor}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                        {autoTitleSource}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="h-2.5 w-2.5" /> Title Auto-Detected
                  </span>
                </div>
              )}
            </div>

            {/* Title Override & Submit Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-medium text-slate-600 dark:text-slate-400">
                    Video Title (Auto-detected, editable):
                  </label>
                  {autoTitleSource && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Editable
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={ytTitle}
                  onChange={(e) => setYtTitle(e.target.value)}
                  placeholder={autoTitleSource ? `e.g. ${autoTitleSource}` : "e.g. Deep Learning & Transformer Attention (MIT)"}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={ytLoading || !ytUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 hover:from-[#5850EC] hover:to-indigo-500 text-white font-semibold text-xs py-2.5 px-4 shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {ytLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Ingesting Stream...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Ingest Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Success / Error Feedback */}
            {ytSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                <span>{ytSuccess}</span>
              </div>
            )}

            {ytError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{ytError}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Metadata Configuration Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215]/80 backdrop-blur-sm p-3 text-xs shadow-xs transition-colors">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
          Default Ingestion Metadata:
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
          <label className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Course:</label>
          <input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="e.g. CS101, BIO101"
            className="h-8 flex-1 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#6C63FF] focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs">
          <label className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Subject:</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Molecular Biology"
            className="h-8 flex-1 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#6C63FF] focus:outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}
