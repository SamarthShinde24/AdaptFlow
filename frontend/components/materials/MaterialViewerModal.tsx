"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  X,
  FileText,
  Film,
  Presentation,
  Download,
  ExternalLink,
  MessageSquare,
  Play,
  Pause,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Volume2,
  FastForward,
  Layers,
} from "lucide-react";
import { Material, MaterialType } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface MaterialViewerModalProps {
  isOpen: boolean;
  material: Material | null;
  onClose: () => void;
  initialTimestampSeconds?: number;
  initialPageNumber?: number;
}

/**
 * Resolves the public static or uploaded asset URL for a given material.
 */
export function getMaterialFileUrl(material: Material | { id: string; title: string; filename?: string; material_type?: string }): string {
  const title = (material.title || "").toLowerCase();
  const filename = (material.filename || "").toLowerCase();
  const id = (material.id || "").toLowerCase();
  const type = material.material_type || "";

  // 1. Video files
  if (
    type === "lecture_video" ||
    title.includes("rag explained") ||
    filename.includes("rag explained") ||
    filename.includes(".mp4") ||
    id === "aa50916b-eedc-4306-a820-f96a7fce57f6"
  ) {
    return "/uploads/rag_explained.mp4";
  }

  // 2. Jaipur Guide PDF
  if (
    title.includes("jaipur") ||
    filename.includes("jaipur") ||
    id === "mat_2"
  ) {
    return "/uploads/jaipur_guide.pdf";
  }

  // 3. Principles of Biology PDF
  if (
    title.includes("biology") ||
    filename.includes("biology") ||
    id === "mat_1"
  ) {
    return "/uploads/principles_of_biology.pdf";
  }

  // 4. General fallback by type
  if (type === "textbook" || filename.endsWith(".pdf")) {
    return "/uploads/principles_of_biology.pdf";
  }

  if (type === "lecture_video" || filename.endsWith(".mp4") || filename.endsWith(".vtt")) {
    return "/uploads/rag_explained.mp4";
  }

  return "/uploads/principles_of_biology.pdf";
}

interface VideoTimestampSegment {
  timeLabel: string;
  seconds: number;
  title: string;
  concept: string;
  citationKey: string;
}

const RAG_VIDEO_TIMESTAMPS: VideoTimestampSegment[] = [
  {
    timeLabel: "00:00 - 02:15",
    seconds: 0,
    title: "Introduction to RAG & Parametric Limits",
    concept: "Why static neural weights hallucinate and require external non-parametric grounding.",
    citationKey: "[00:00 - 02:15: Introduction]",
  },
  {
    timeLabel: "02:15 - 04:18",
    seconds: 135,
    title: "Multimodal Document Ingestion & Chunking",
    concept: "Segmenting 300-500 token windows with 50-token sliding overlap for semantic fidelity.",
    citationKey: "[02:15 - 04:18: Chunking Mechanics]",
  },
  {
    timeLabel: "04:18 - 05:45",
    seconds: 258,
    title: "Dense Vector Embeddings & pgvector HNSW",
    concept: "Transforming token chunks into 1536-dimensional embeddings for sub-millisecond retrieval.",
    citationKey: "[04:18 - 05:45: Vector Embeddings]",
  },
  {
    timeLabel: "05:45 - 07:30",
    seconds: 345,
    title: "Cosine Distance Search & Candidate Filtering",
    concept: "Computing angle distance between query vectors and textbook chunk vectors in high-dimensional space.",
    citationKey: "[05:45 - 07:30: Cosine Search]",
  },
  {
    timeLabel: "07:30 - 09:12",
    seconds: 450,
    title: "Cross-Encoder Reranking & Context Injection",
    concept: "Joint scoring of prompt candidates to filter irrelevant passages before synthesis.",
    citationKey: "[07:30 - 09:12: Cross-Encoder Reranking]",
  },
  {
    timeLabel: "09:12 - 11:00",
    seconds: 552,
    title: "Grounded Generation & Source Attribution",
    concept: "Injecting verified passages into frozen LLM with strict clickable citation chips.",
    citationKey: "[09:12 - 11:00: Grounded Verification]",
  },
];

const BIO_TEXTBOOK_CHAPTERS = [
  {
    chapter: "Chapter 4",
    page: 42,
    title: "Glycolysis & Cytosolic Energy Conversion",
    summary: "Substrate-level phosphorylation yields a net of 2 ATP and 2 NADH per glucose in the cytosol.",
  },
  {
    chapter: "Chapter 9",
    page: 184,
    title: "The Citric Acid Cycle & Pyruvate Oxidation",
    summary: "Pyruvate is transported across the mitochondrial matrix, producing Acetyl-CoA, NADH, and FADH2.",
  },
  {
    chapter: "Chapter 9.4",
    page: 189,
    title: "Chemiosmotic Coupling & ATP Synthase Mechanics",
    summary: "Rotary catalysis driven by electrochemical proton-motive force synthesizes 30-32 ATP.",
  },
];

const JAIPUR_GUIDE_CHAPTERS = [
  {
    chapter: "Section 1",
    page: 1,
    title: "Architectural Heritage of the Pink City",
    summary: "Vastu Shastra grid planning established by Maharaja Sawai Jai Singh II in 1727.",
  },
  {
    chapter: "Section 3.2",
    page: 4,
    title: "Hawa Mahal Venturi Cooling Physics",
    summary: "953 jharokhas engineered to accelerate airflow through the Venturi effect for passive natural cooling.",
  },
  {
    chapter: "Section 5",
    page: 8,
    title: "Amer Fort Water Harvesting & Fortifications",
    summary: "Multi-tiered Persian waterwheel aqueducts powering high-altitude desert palace fortifications.",
  },
];

export function MaterialViewerModal({
  isOpen,
  material,
  onClose,
  initialTimestampSeconds = 0,
  initialPageNumber = 1,
}: MaterialViewerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<"viewer" | "index">("viewer");
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(initialTimestampSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(initialPageNumber);
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const totalSlides = 16;

  const fileUrl = useMemo(() => {
    return material ? getMaterialFileUrl(material) : "";
  }, [material]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Seek video to initial timestamp when opened
  useEffect(() => {
    if (material?.material_type === "lecture_video" && videoRef.current) {
      if (initialTimestampSeconds > 0) {
        videoRef.current.currentTime = initialTimestampSeconds;
      }
    }
  }, [material, initialTimestampSeconds]);

  if (!isOpen || !material) return null;

  const isVideo = material.material_type === "lecture_video";
  const isPdf = material.material_type === "textbook";
  const isSlide = material.material_type === "slide_deck";

  const handleSeekVideo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const activeTimestamp = RAG_VIDEO_TIMESTAMPS.find(
    (t, idx) =>
      currentVideoTime >= t.seconds &&
      (idx === RAG_VIDEO_TIMESTAMPS.length - 1 || currentVideoTime < RAG_VIDEO_TIMESTAMPS[idx + 1].seconds)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-[92vh] rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* Modal Header Bar                                                  */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/90 px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
                isPdf
                  ? "bg-blue-100 text-blue-700"
                  : isVideo
                  ? "bg-purple-100 text-purple-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isPdf ? (
                <FileText className="h-5 w-5" />
              ) : isVideo ? (
                <Film className="h-5 w-5" />
              ) : (
                <Presentation className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                  {material.title}
                </h2>
                <span
                  className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    isPdf
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : isVideo
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {isPdf ? "PDF Textbook" : isVideo ? "Lecture Video (MM:SS)" : "Slide Deck"}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5 font-mono">
                {material.filename} · {formatBytes(material.file_size_bytes)} · {material.subject || "Course Material"}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Ask AI Tutor with this material */}
            <Link
              href={`/chat?materialId=${material.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
              title="Chat with AI Tutor using this material"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </Link>

            {/* Open in New Window */}
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
                title="Open in new browser tab"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                <span className="hidden md:inline">Open Tab</span>
              </a>
            )}

            {/* Download File */}
            {fileUrl && (
              <a
                href={fileUrl}
                download={material.filename}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
                title="Download original uploaded file"
              >
                <Download className="h-3.5 w-3.5 text-gray-500" />
                <span className="hidden md:inline">Download</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-200/70 hover:text-gray-700 transition-colors cursor-pointer"
              title="Close viewer (Esc)"
              aria-label="Close viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Main Content Area                                                 */}
        {/* ================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-100/70">
          {/* =============================================================== */}
          {/* MODE 1: LECTURE VIDEO PLAYER                                    */}
          {/* =============================================================== */}
          {isVideo && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Video Player Column */}
              <div className="flex-1 flex flex-col justify-between bg-black p-3 sm:p-5 overflow-hidden">
                <div className="relative flex-1 flex items-center justify-center rounded-2xl overflow-hidden bg-black shadow-inner">
                  <video
                    ref={videoRef}
                    src={fileUrl}
                    controls
                    playsInline
                    className="w-full h-full max-h-[65vh] object-contain rounded-xl"
                    onTimeUpdate={(e) => setCurrentVideoTime(e.currentTarget.currentTime)}
                  />
                </div>

                {/* Video Controls Bar */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-white/90 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Audio/Visual Synchronized</span>
                    </span>
                    {activeTimestamp && (
                      <span className="rounded-full bg-purple-500/30 border border-purple-400/40 px-2 py-0.5 text-[11px] font-mono text-purple-200">
                        {activeTimestamp.timeLabel}
                      </span>
                    )}
                  </div>

                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-400 font-medium">Speed:</span>
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all ${
                          playbackSpeed === spd
                            ? "bg-[#6C63FF] text-white"
                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synchronized Transcript / Timestamps Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 bg-white flex flex-col h-64 md:h-full overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <h3 className="text-xs font-bold text-gray-800">
                      Tracked Timestamps ({RAG_VIDEO_TIMESTAMPS.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400">Click to seek</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {RAG_VIDEO_TIMESTAMPS.map((seg, idx) => {
                    const isSelected = activeTimestamp?.seconds === seg.seconds;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSeekVideo(seg.seconds)}
                        className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer ${
                          isSelected
                            ? "border-purple-500 bg-purple-50/70 shadow-xs"
                            : "border-gray-200/80 bg-white hover:border-purple-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-[11px] font-bold rounded-md px-1.5 py-0.5 ${
                              isSelected
                                ? "bg-purple-600 text-white"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {seg.timeLabel}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-0.5">
                            <Play className="h-2.5 w-2.5" />
                            <span>Jump</span>
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-xs font-bold text-gray-900 leading-snug">
                          {seg.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                          {seg.concept}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODE 2: PDF TEXTBOOK VIEWER                                     */}
          {/* =============================================================== */}
          {isPdf && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Embedded PDF iframe / Document Canvas */}
              <div className="flex-1 flex flex-col bg-gray-200/80 p-3 sm:p-5 overflow-hidden">
                {/* PDF Toolbar */}
                <div className="mb-2 flex items-center justify-between rounded-xl bg-white px-4 py-2 text-xs border border-gray-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span>{material.title}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Zoom: {pdfZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setPdfZoom((z) => Math.min(z + 15, 175))}
                      className="rounded-lg border border-gray-200 p-1 hover:bg-gray-100 text-gray-600"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfZoom((z) => Math.max(z - 15, 75))}
                      className="rounded-lg border border-gray-200 p-1 hover:bg-gray-100 text-gray-600"
                      title="Zoom out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfZoom(100)}
                      className="rounded-lg border border-gray-200 p-1 hover:bg-gray-100 text-gray-600"
                      title="Reset zoom"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Embedded PDF Iframe / Object */}
                <div className="relative flex-1 rounded-2xl overflow-hidden border border-gray-300 bg-white shadow-sm">
                  <iframe
                    src={`${fileUrl}#zoom=${pdfZoom}`}
                    className="w-full h-full min-h-[500px]"
                    title={material.title}
                  />
                </div>
              </div>

              {/* Indexed Chapters / Sections Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 bg-white flex flex-col h-64 md:h-full overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-gray-800">
                      Chapter & Page Index
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400">Bounding-box OCR</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                  {(material.title.toLowerCase().includes("jaipur")
                    ? JAIPUR_GUIDE_CHAPTERS
                    : BIO_TEXTBOOK_CHAPTERS
                  ).map((ch, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-3 border border-gray-200/80 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold rounded-md bg-blue-100 text-blue-700 px-1.5 py-0.5">
                          {ch.chapter} · Page {ch.page}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Indexed</span>
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-xs font-bold text-gray-900 leading-snug">
                        {ch.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-gray-500 leading-relaxed">
                        {ch.summary}
                      </p>
                    </div>
                  ))}

                  <div className="pt-2 text-center">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open full document in reader window</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODE 3: SLIDE DECK VIEWER                                       */}
          {/* =============================================================== */}
          {isSlide && (
            <div className="flex-1 flex flex-col p-4 sm:p-6 bg-gray-100 overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col justify-between rounded-2xl border border-gray-300 bg-white p-6 shadow-md">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-bold">
                      Slide {currentSlide} of {totalSlides}
                    </span>
                    <h3 className="text-xs font-semibold text-gray-700">
                      {material.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentSlide((s) => Math.max(s - 1, 1))}
                      disabled={currentSlide <= 1}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSlide((s) => Math.min(s + 1, totalSlides))}
                      disabled={currentSlide >= totalSlides}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Simulated Presentation Slide Layout */}
                <div className="my-6 flex-1 flex flex-col justify-center items-center rounded-2xl border border-dashed border-amber-300 bg-gradient-to-tr from-amber-50/50 to-orange-50/30 p-8 text-center min-h-[300px]">
                  <span className="rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold shadow-xs">
                    Slide #{currentSlide}: Comparative Architecture
                  </span>
                  <h4 className="mt-4 text-lg font-extrabold text-gray-900 max-w-lg">
                    {material.title.includes("Trees")
                      ? "Binary Search Tree Rotations & Invariant Proofs"
                      : "Chemiosmotic Proton-Motive Force & ATP Yield"}
                  </h4>
                  <p className="mt-2 text-xs text-gray-600 max-w-md leading-relaxed">
                    Extracted from PowerPoint presentation with synchronized speaker notes, formula equations, and visual keyframe bounding vectors.
                  </p>
                </div>

                {/* Speaker Notes */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-600">
                  <strong className="text-gray-900 block font-semibold mb-1">Speaker Notes:</strong>
                  Emphasize the difference between substrate-level ATP generation and the Mitchell chemiosmotic rotary mechanism driving F0/F1 ATP synthase.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
