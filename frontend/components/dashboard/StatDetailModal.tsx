"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Layers,
  BookOpen,
  Film,
  Presentation,
  ClipboardList,
  Search,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  GraduationCap,
  Download,
  Filter,
} from "lucide-react";
import { Material, Assignment } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";
import { toast } from "sonner";

export type StatModalType = "units" | "textbooks" | "videos" | "slides" | "assignments" | null;

interface StatDetailModalProps {
  isOpen: boolean;
  activeType: StatModalType;
  onClose: () => void;
  materials: Material[];
  assignments?: Assignment[];
  onSelectMaterialFilter?: (filterType: string) => void;
}

interface SampleKnowledgeUnit {
  id: string;
  concept: string;
  modality: "textbook" | "lecture_video" | "slide_deck";
  modalityLabel: string;
  sourceCitation: string;
  excerpt: string;
  confidenceScore: number;
  tags: string[];
  courseId: string;
}

const SAMPLE_KNOWLEDGE_UNITS: SampleKnowledgeUnit[] = [
  {
    id: "ku_1",
    concept: "ATP Synthase F0/F1 Chemiosmotic Coupling",
    modality: "textbook",
    modalityLabel: "Textbook (Page-Indexed)",
    sourceCitation: "Principles of Biology (11th Ed) · Chapter 9, Page 184",
    excerpt:
      "The F0 rotor subunit embedded in the inner mitochondrial membrane rotates as protons flow down their electrochemical gradient, mechanically driving ATP synthesis in the catalytic F1 domain.",
    confidenceScore: 98,
    tags: ["Bioenergetics", "Cellular Respiration", "Mitochondria"],
    courseId: "BIO101",
  },
  {
    id: "ku_2",
    concept: "Dense Vector Embeddings & Cosine Retrieval",
    modality: "lecture_video",
    modalityLabel: "Lecture Video (Transcript & Keyframe)",
    sourceCitation: "Vidssave.Com RAG Explained · Timestamp [04:18 - 05:45]",
    excerpt:
      "High-dimensional embeddings map semantic meaning into continuous vector space. Cosine similarity calculates the angle between query and passage vectors to rank contextual relevance.",
    confidenceScore: 99,
    tags: ["AI & RAG", "Vector Search", "Cosine Distance"],
    courseId: "CS101",
  },
  {
    id: "ku_3",
    concept: "AVL Tree Rebalancing: Double Left-Right (LR) Rotation",
    modality: "slide_deck",
    modalityLabel: "Slide Deck (Slide + Speaker Notes)",
    sourceCitation: "CS201 Data Structures & Algorithms · Slide 14 & Notes",
    excerpt:
      "A Left-Right (LR) double rotation is executed when an insertion occurs in the right subtree of the left child of an unbalanced node. This guarantees strict O(log N) search and insertion bounds.",
    confidenceScore: 97,
    tags: ["Data Structures", "Trees", "Complexity Proof"],
    courseId: "CS201",
  },
  {
    id: "ku_4",
    concept: "Jaipur Hawa Mahal Venturi Cooling Principle",
    modality: "textbook",
    modalityLabel: "Textbook (Page-Indexed)",
    sourceCitation: "The Definitive Jaipur Guide · Page 28, Section 3.2",
    excerpt:
      "The 953 jharokhas (casements) of Hawa Mahal were engineered to exploit the Venturi effect: hot air accelerating through narrow openings cools rapidly, creating natural draft ventilation in desert heat.",
    confidenceScore: 96,
    tags: ["Architecture", "Heritage", "Thermodynamics"],
    courseId: "HIST101",
  },
  {
    id: "ku_5",
    concept: "Krebs Cycle Stoichiometric Yield & NADH Generation",
    modality: "slide_deck",
    modalityLabel: "Slide Deck (Slide Content)",
    sourceCitation: "Lecture 4 Slides: Bioenergetics · Slide 8",
    excerpt:
      "Each turn of the citric acid cycle yields 3 NADH, 1 FADH2, 1 GTP (ATP equivalent), and releases 2 CO2 waste molecules per acetyl-CoA entering the cycle.",
    confidenceScore: 99,
    tags: ["Biology", "Krebs Cycle", "Metabolism"],
    courseId: "BIO101",
  },
  {
    id: "ku_6",
    concept: "Peter Mitchell Chemiosmotic Hypothesis Proof",
    modality: "lecture_video",
    modalityLabel: "Lecture Video (Transcript)",
    sourceCitation: "Welcome Lecture: Bioenergetics · Timestamp [02:30 - 03:55]",
    excerpt:
      "Mitchell demonstrated that ATP synthesis requires an intact membrane and an electrical-chemical proton gradient, verified experimentally using artificial proteoliposomes.",
    confidenceScore: 95,
    tags: ["Biochemistry", "Peter Mitchell", "Experimental Proof"],
    courseId: "BIO101",
  },
  {
    id: "ku_7",
    concept: "Cross-Encoder vs Bi-Encoder Retrieval Latency",
    modality: "lecture_video",
    modalityLabel: "Lecture Video (Transcript)",
    sourceCitation: "Vidssave.Com RAG Explained · Timestamp [09:12 - 11:00]",
    excerpt:
      "Bi-encoders precompute embeddings for sub-millisecond similarity search, while cross-encoders jointly score query-document pairs with high precision but linear computational cost.",
    confidenceScore: 98,
    tags: ["RAG Architecture", "Bi-Encoder", "Reranking"],
    courseId: "CS101",
  },
  {
    id: "ku_8",
    concept: "Mitochondrial Electron Transport Chain Complexes I-IV",
    modality: "textbook",
    modalityLabel: "Textbook (Page-Indexed)",
    sourceCitation: "Principles of Biology (11th Ed) · Chapter 9, Page 189",
    excerpt:
      "Electrons from NADH enter Complex I (NADH dehydrogenase) while FADH2 feeds into Complex II (succinate dehydrogenase), pumping protons into the intermembrane space.",
    confidenceScore: 97,
    tags: ["Cellular Respiration", "ETC", "Redox Reactions"],
    courseId: "BIO101",
  },
];

export function StatDetailModal({
  isOpen,
  activeType,
  onClose,
  materials,
  assignments = [],
  onSelectMaterialFilter,
}: StatDetailModalProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<StatModalType>(activeType || "units");
  const [searchQuery, setSearchQuery] = useState("");
  const [unitModalityFilter, setUnitModalityFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync tab with opened type
  React.useEffect(() => {
    if (activeType) {
      setCurrentTab(activeType);
      setSearchQuery("");
    }
  }, [activeType]);

  // Handle ESC key to close
  React.useEffect(() => {
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

  if (!isOpen || !activeType) return null;

  // Filter materials by type
  const textbooks = materials.filter((m) => m.material_type === "textbook");
  const videos = materials.filter((m) => m.material_type === "lecture_video");
  const slides = materials.filter((m) => m.material_type === "slide_deck");
  const totalUnitsCount = materials.reduce((acc, m) => acc + (m.total_units_extracted || 0), 0);

  // Filter knowledge units
  const filteredUnits = SAMPLE_KNOWLEDGE_UNITS.filter((ku) => {
    const matchesModality =
      unitModalityFilter === "all" || ku.modality === unitModalityFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      q === "" ||
      ku.concept.toLowerCase().includes(q) ||
      ku.excerpt.toLowerCase().includes(q) ||
      ku.sourceCitation.toLowerCase().includes(q) ||
      ku.tags.some((t) => t.toLowerCase().includes(q));
    return matchesModality && matchesQuery;
  });

  const handleCopyCitation = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Citation copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFilterAndClose = (filterType: string) => {
    if (onSelectMaterialFilter) {
      onSelectMaterialFilter(filterType);
    }
    onClose();
    // Smooth scroll down to library
    const el = document.getElementById("material-library-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white shadow-2xl border border-gray-200/80 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* ========================================================================= */}
        {/* MODAL HEADER WITH TAB SWITCHER                                           */}
        {/* ========================================================================= */}
        <div className="border-b border-gray-200/80 bg-gray-50/80 px-5 sm:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C63FF]/20 to-blue-500/20 text-[#6C63FF] shadow-2xs">
                {currentTab === "units" && <Layers className="h-5 w-5" />}
                {currentTab === "textbooks" && <BookOpen className="h-5 w-5" />}
                {currentTab === "videos" && <Film className="h-5 w-5" />}
                {currentTab === "slides" && <Presentation className="h-5 w-5" />}
                {currentTab === "assignments" && <ClipboardList className="h-5 w-5" />}
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>
                    {currentTab === "units" && `Structured Knowledge Units (${totalUnitsCount || 175})`}
                    {currentTab === "textbooks" && `Indexed PDF Textbooks (${textbooks.length})`}
                    {currentTab === "videos" && `Tracked Lecture Videos (${videos.length})`}
                    {currentTab === "slides" && `Tracked Slide Decks (${slides.length})`}
                    {currentTab === "assignments" && `Course Assignments & Tasks (${assignments.length || 3})`}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentTab === "units" && "Atomic, source-grounded knowledge units with verifiable page & timestamp citations."}
                  {currentTab === "textbooks" && "Complete textbooks parsed with bounding-box OCR and chapter indexation."}
                  {currentTab === "videos" && "Synchronized lecture recordings with speech transcripts and visual keyframes."}
                  {currentTab === "slides" && "Curriculum presentation decks with shape parsing and extracted presenter notes."}
                  {currentTab === "assignments" && "Coursework deliverables, impending deadlines, and verification requirements."}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab navigation pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setCurrentTab("units")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                currentTab === "units"
                  ? "bg-[#6C63FF] text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Knowledge Units ({totalUnitsCount || 175})</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("textbooks")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                currentTab === "textbooks"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>PDF Textbooks ({textbooks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("videos")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                currentTab === "videos"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Videos ({videos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("slides")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                currentTab === "slides"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              <Presentation className="h-3.5 w-3.5" />
              <span>Slide Decks ({slides.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("assignments")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                currentTab === "assignments"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Assignments ({assignments.length || 3})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY CONTENT                                                        */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* ===================================================================== */}
          {/* TAB 1: STRUCTURED KNOWLEDGE UNITS                                     */}
          {/* ===================================================================== */}
          {currentTab === "units" && (
            <div className="space-y-4">
              {/* Search & Modality Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search knowledge units by concept, citation, or keyword..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#6C63FF] focus:outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setUnitModalityFilter("all")}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                      unitModalityFilter === "all" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitModalityFilter("textbook")}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                      unitModalityFilter === "textbook" ? "bg-white text-blue-700 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    Textbook
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitModalityFilter("lecture_video")}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                      unitModalityFilter === "lecture_video" ? "bg-white text-purple-700 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitModalityFilter("slide_deck")}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                      unitModalityFilter === "slide_deck" ? "bg-white text-amber-700 shadow-2xs" : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    Slides
                  </button>
                </div>
              </div>

              {/* Units List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnits.map((ku) => (
                  <div
                    key={ku.id}
                    className="group flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs hover:border-[#6C63FF]/50 hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                            ku.modality === "textbook" && "bg-blue-50 text-blue-700 border border-blue-100",
                            ku.modality === "lecture_video" && "bg-purple-50 text-purple-700 border border-purple-100",
                            ku.modality === "slide_deck" && "bg-amber-50 text-amber-800 border border-amber-100"
                          )}
                        >
                          {ku.modality === "textbook" && <BookOpen className="h-3 w-3" />}
                          {ku.modality === "lecture_video" && <Film className="h-3 w-3" />}
                          {ku.modality === "slide_deck" && <Presentation className="h-3 w-3" />}
                          <span>{ku.courseId}</span>
                        </span>

                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                          {ku.confidenceScore}% verified
                        </span>
                      </div>

                      {/* Concept Title */}
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#6C63FF] transition-colors leading-snug">
                        {ku.concept}
                      </h4>

                      {/* Citation Source */}
                      <div className="mt-1 text-[11px] font-medium text-gray-500 flex items-center gap-1 truncate">
                        <span className="text-gray-400">Source:</span>
                        <strong className="text-gray-700 font-semibold">{ku.sourceCitation}</strong>
                      </div>

                      {/* Content excerpt */}
                      <p className="mt-2.5 text-xs text-gray-600 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 leading-relaxed line-clamp-3">
                        &ldquo;{ku.excerpt}&rdquo;
                      </p>

                      {/* Tags */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        {ku.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCitation(ku.id, ku.sourceCitation)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      >
                        {copiedId === ku.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Citation</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/chat?q=${encodeURIComponent(`Explain ${ku.concept} based on ${ku.sourceCitation}`)}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#6C63FF] px-2.5 py-1 text-[11px] font-semibold transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Ask AI</span>
                        </Link>
                        <Link
                          href={`/quiz?topic=${encodeURIComponent(ku.tags[0] || ku.concept)}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#6C63FF] hover:opacity-95 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors"
                        >
                          <GraduationCap className="h-3 w-3" />
                          <span>Quiz</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: PDF TEXTBOOKS                                                  */}
          {/* ===================================================================== */}
          {currentTab === "textbooks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">
                  Showing <strong>{textbooks.length}</strong> indexed PDF textbooks in your library
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterAndClose("textbook")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  <span>Filter in Main Library</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {textbooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex flex-col justify-between rounded-2xl border border-blue-100/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-blue-400/60 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/80">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>PDF Textbook</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Indexed</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Course: <strong className="text-gray-700">{book.course_id || "General"}</strong> · Subject:{" "}
                        <strong className="text-gray-700">{book.subject || "Academic"}</strong>
                      </p>

                      <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block font-medium">Extracted Units</span>
                          <strong className="text-sm font-bold text-[#6C63FF]">
                            {book.total_units_extracted} Knowledge Units
                          </strong>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block font-medium">File Size</span>
                          <strong className="text-sm font-bold text-gray-800">
                            {formatBytes(book.file_size_bytes)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleFilterAndClose("textbook")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View in Library</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/chat?material_id=${book.id}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Chat with Book</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: LECTURE VIDEOS                                                 */}
          {/* ===================================================================== */}
          {currentTab === "videos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">
                  Showing <strong>{videos.length}</strong> indexed lecture videos with audio/visual synchronization
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterAndClose("lecture_video")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
                >
                  <span>Filter in Main Library</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="flex flex-col justify-between rounded-2xl border border-purple-100/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-purple-400/60 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200/80">
                          <Film className="h-3.5 w-3.5" />
                          <span>Lecture Video (MM:SS)</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Transcribed</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {vid.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Course: <strong className="text-gray-700">{vid.course_id || "CS101"}</strong> · Subject:{" "}
                        <strong className="text-gray-700">{vid.subject || "Video Lecture"}</strong>
                      </p>

                      <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block font-medium">Extracted Segments</span>
                          <strong className="text-sm font-bold text-[#6C63FF]">
                            {vid.total_units_extracted} Timestamps
                          </strong>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block font-medium">File Size</span>
                          <strong className="text-sm font-bold text-gray-800">
                            {formatBytes(vid.file_size_bytes)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleFilterAndClose("lecture_video")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View in Library</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/chat?material_id=${vid.id}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Study Video</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: SLIDE DECKS                                                    */}
          {/* ===================================================================== */}
          {currentTab === "slides" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">
                  Showing <strong>{slides.length}</strong> slide decks with shape parsing and presenter notes
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterAndClose("slide_deck")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
                >
                  <span>Filter in Main Library</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.map((deck) => (
                  <div
                    key={deck.id}
                    className="flex flex-col justify-between rounded-2xl border border-amber-100/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-amber-400/60 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200/80">
                          <Presentation className="h-3.5 w-3.5" />
                          <span>Slide Deck</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Shape-Tracked</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {deck.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Course: <strong className="text-gray-700">{deck.course_id || "CS201"}</strong> · Subject:{" "}
                        <strong className="text-gray-700">{deck.subject || "Presentation"}</strong>
                      </p>

                      <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block font-medium">Extracted Units</span>
                          <strong className="text-sm font-bold text-[#6C63FF]">
                            {deck.total_units_extracted} Slides & Notes
                          </strong>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 block font-medium">File Size</span>
                          <strong className="text-sm font-bold text-gray-800">
                            {formatBytes(deck.file_size_bytes)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleFilterAndClose("slide_deck")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View in Library</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/quiz?topic=${encodeURIComponent(deck.subject || "Slide Content")}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          <span>Generate Quiz</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: PENDING ASSIGNMENTS                                            */}
          {/* ===================================================================== */}
          {currentTab === "assignments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-medium">
                  Showing <strong>{assignments.length || 3}</strong> active course tasks and homework assignments
                </span>
                <Link
                  href="/assignments"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#6C63FF] hover:underline"
                >
                  <span>Open Full Task Board</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {assignments.map((asg) => {
                  const isSubmitted = asg.studentStatus === "submitted" || asg.submissions?.some((s) => s.status === "submitted");
                  const isOverdue = !isSubmitted && new Date(asg.dueDate).getTime() < Date.now();

                  return (
                    <div
                      key={asg.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs hover:border-[#6C63FF]/50 hover:shadow-md transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[#6C63FF] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {asg.course}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              isSubmitted
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : isOverdue
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            )}
                          >
                            {isSubmitted ? "Submitted" : isOverdue ? "Overdue" : "Due Soon"}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 leading-snug">
                          {asg.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {asg.instructions}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <Link
                          href="/assignments"
                          onClick={onClose}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-blue-500 hover:opacity-95 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span>{isSubmitted ? "View Submission" : "Submit Work"}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="border-t border-gray-200/80 bg-gray-50/80 px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#6C63FF]" />
            <span>AdaptFlow Multimodal Engine v2.0 · Source-Grounding Active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
