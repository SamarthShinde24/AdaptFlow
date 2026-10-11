"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Film,
  Presentation,
  ExternalLink,
  MessageSquare,
  Award,
  Flame,
  Check,
  X,
  Play,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Material } from "@/lib/types";
import { listMaterials } from "@/lib/api";

interface FlashcardTopic {
  id: string;
  title: string;
  subject: string;
  courseId: string;
  modality: "lecture_video" | "textbook" | "slide_deck";
  sourceLabel: string;
  sourceMaterialId?: string;
  shortQuestion: string;
  summary: string;
  mechanism: string[];
  keyFormulaOrInsight: string;
  realWorldApplication: string;
}

const DEFAULT_FLASHCARDS: FlashcardTopic[] = [
  {
    id: "fc_1",
    title: "Retrieval-Augmented Generation (RAG) Architecture",
    subject: "Computer Science / AI",
    courseId: "CS101",
    modality: "lecture_video",
    sourceLabel: "Vidssave.Com RAG Explained [02:15 - 05:45]",
    sourceMaterialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    shortQuestion: "How does dense vector search prevent parametric neural hallucination?",
    summary:
      "RAG combines frozen parametric neural model weights with an external non-parametric vector database (pgvector). Instead of generating answers from memory alone, the system chunks source documents into 300-500 token windows, computes dense embeddings, retrieves high-similarity passages via cosine distance, and re-ranks them before injecting them into the generation prompt.",
    mechanism: [
      "1. Semantic Ingestion: Segmenting files into 300-500 token windows with 50-token sliding overlap",
      "2. Dense Vector Indexing: Computing 1536-dimensional embeddings indexed via HNSW",
      "3. Cosine Similarity Search: Finding top candidate passages matching query vector",
      "4. Cross-Encoder Reranking: Joint scoring to filter irrelevant passages",
      "5. Context Injection: Grounding the generation prompt with verified citations",
    ],
    keyFormulaOrInsight:
      "Cosine Similarity: cos(theta) = (A · B) / (||A|| ||B||). A value close to 1.0 indicates high semantic alignment.",
    realWorldApplication:
      "Enterprise financial assistants at Morgan Stanley use RAG to query hundreds of thousands of research PDFs with zero hallucinations.",
  },
  {
    id: "fc_2",
    title: "Glycolysis & Net ATP Energy Yield",
    subject: "Biology",
    courseId: "BIO101",
    modality: "textbook",
    sourceLabel: "Principles of Biology (11th Ed) p. 42",
    sourceMaterialId: "mat_1",
    shortQuestion: "What is the net energetic yield per molecule of glucose in the cytosol?",
    summary:
      "Glycolysis is a ten-step enzymatic anaerobic pathway occurring in the cell cytosol. It breaks down one six-carbon glucose molecule into two three-carbon pyruvate molecules. An initial investment of 2 ATP is required, but 4 ATP molecules are synthesized through substrate-level phosphorylation, resulting in a net yield of 2 ATP and 2 NADH molecules.",
    mechanism: [
      "1. Energy Investment Phase: Hexokinase and Phosphofructokinase consume 2 ATP",
      "2. Cleavage Phase: Fructose-1,6-bisphosphate splits into G3P and DHAP",
      "3. Oxidation Phase: G3P dehydrogenase produces 2 NADH",
      "4. Substrate-Level Phosphorylation: Phosphoglycerate kinase and Pyruvate kinase produce 4 ATP",
    ],
    keyFormulaOrInsight:
      "Net Reaction: Glucose + 2 NAD+ + 2 ADP + 2 Pi -> 2 Pyruvate + 2 NADH + 2 H+ + 2 ATP",
    realWorldApplication:
      "Tumor cells rely predominantly on aerobic glycolysis for rapid ATP production (Warburg effect), which is visualized clinically with FDG-PET imaging.",
  },
  {
    id: "fc_3",
    title: "pgvector & HNSW Dense Indexing",
    subject: "Computer Science",
    courseId: "CS201",
    modality: "slide_deck",
    sourceLabel: "CS201 Lecture 7 Slides: Binary Search Trees & Vector Indexes",
    sourceMaterialId: "mat_5",
    shortQuestion: "Why is HNSW indexing superior to Flat IVF for sub-millisecond similarity search?",
    summary:
      "Hierarchical Navigable Small World (HNSW) graphs construct a multi-layer geometric graph where upper layers have long-range skip connections and bottom layers contain fine-grained nearest neighbors. This provides logarithmic O(log N) search complexity, enabling sub-millisecond cosine distance lookups across millions of document chunk vectors.",
    mechanism: [
      "1. Multi-Layer Skip-List Graph Structure",
      "2. Greedy Routing at Coarse Top Layers for Fast Region Discovery",
      "3. Local Neighbor Exploration at Dense Bottom Layers for High Precision",
      "4. Dynamic Edge Rebalancing with Configurable M and efSearch Parameters",
    ],
    keyFormulaOrInsight:
      "Search Complexity: O(log N) graph traversal compared to O(N) brute-force cosine distance scans.",
    realWorldApplication:
      "Spotify uses multi-layer graph indexing to recommend personalized audio tracks out of 100M+ songs in under 15 milliseconds.",
  },
  {
    id: "fc_4",
    title: "Hawa Mahal Venturi Cooling Physics",
    subject: "Heritage & History",
    courseId: "HIST101",
    modality: "textbook",
    sourceLabel: "The Definitive Jaipur Guide: Itineraries & Architecture p. 4",
    sourceMaterialId: "mat_2",
    shortQuestion: "How did 18th-century Rajput engineers achieve natural air conditioning?",
    summary:
      "Built in 1729 by Maharaja Sawai Pratap Singh, Hawa Mahal (Palace of Winds) incorporates 953 intricately carved jharokha casements. The micro-orifices act as physical Venturi nozzles: when desert wind enters the constricted openings, static fluid pressure decreases while velocity increases, producing adiabatic expansion that lowers incoming ambient temperature naturally by 5 to 8 degrees Celsius.",
    mechanism: [
      "1. High-Density Micro-Casement Grid: 953 jharokhas positioned toward prevailing winds",
      "2. Venturi Effect Acceleration: Constriction of airflow increases velocity",
      "3. Pressure Drop & Thermal Expansion: Cools ambient desert air passively",
      "4. Internal Fountain Convection: Additional evaporative cooling across courtyards",
    ],
    keyFormulaOrInsight:
      "Continuity Equation & Bernoulli's Principle: A1 * V1 = A2 * V2. As cross-sectional area A decreases, velocity V increases and fluid pressure drops.",
    realWorldApplication:
      "Modern sustainable architecture firms replicate Hawa Mahal's terracotta jali facades to reduce air-conditioning energy consumption by 40% in arid climates.",
  },
  {
    id: "fc_5",
    title: "Binary Search Tree Balancing (AVL & Red-Black)",
    subject: "Computer Science",
    courseId: "CS201",
    modality: "slide_deck",
    sourceLabel: "CS201 Lecture 7 Slides: Binary Search Trees #4",
    sourceMaterialId: "mat_5",
    shortQuestion: "How do tree rotations prevent worst-case O(N) degradation into linked lists?",
    summary:
      "Unbalanced Binary Search Trees (BST) degrade to O(N) linear performance when elements are inserted in sorted order. Self-balancing trees (AVL and Red-Black) maintain strict balance invariant factors (-1, 0, +1). Upon unbalanced insertion or deletion, single or double tree rotations (LL, RR, LR, RL) rebalance the subtrees in O(1) time, preserving guaranteed O(log N) lookup.",
    mechanism: [
      "1. Height Invariant Check: Balance Factor = height(left) - height(right)",
      "2. Left Rotation (RR Imbalance): Elevates right child and demotes root",
      "3. Right Rotation (LL Imbalance): Elevates left child and demotes root",
      "4. Compound Double Rotations (LR and RL Imbalances): Realigns inner zig-zag nodes",
    ],
    keyFormulaOrInsight:
      "Height Bound: h <= 1.44 * log2(N + 2). Lookup, insertion, and deletion are guaranteed O(log N).",
    realWorldApplication:
      "Linux kernel virtual memory management utilizes Red-Black Trees (rbtree) to track process memory addresses with logarithmic lookup guarantees.",
  },
];

export default function FlashcardsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<FlashcardTopic[]>(DEFAULT_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Interaction State for Active Card
  // 'prompt': User sees "Topic studied? Yes or No"
  // 'revealed': User sees overview, mental model, formulas, and "Study Deeper in Source Chat"
  const [cardState, setCardState] = useState<"prompt" | "revealed">("prompt");
  const [userStudiedResponse, setUserStudiedResponse] = useState<boolean | null>(null);

  // Track completed/studied topics in local state
  const [studiedTopicIds, setStudiedTopicIds] = useState<Set<string>>(new Set());

  // Load client materials to add any YouTube/new materials to flashcards
  useEffect(() => {
    listMaterials()
      .then((materials) => {
        const customYouTube = materials.filter(
          (m) => m.id.startsWith("yt_") || Boolean((m.metadata as any)?.youtube_id)
        );
        if (customYouTube.length > 0) {
          const generatedFromYt: FlashcardTopic[] = customYouTube.map((yt) => ({
            id: `fc_${yt.id}`,
            title: yt.title,
            subject: yt.subject || "Computer Science / AI",
            courseId: yt.course_id || "CS101",
            modality: "lecture_video",
            sourceLabel: `${yt.title} [YouTube Stream]`,
            sourceMaterialId: yt.id,
            shortQuestion: "What are the core engineering takeaways from this lecture?",
            summary: `Verified multimodal lecture on ${yt.title}. Concepts are extracted from timestamped speech transcripts and indexed into vector memory for semantic retrieval.`,
            mechanism: [
              "1. Audio Track Extraction and Speech-to-Text Transcription",
              "2. Chapter Segmentation across 15-minute lecture blocks",
              "3. Knowledge Unit Embedding into 1536-dimensional space",
              "4. Clickable timestamp locators anchored to verified evidence",
            ],
            keyFormulaOrInsight:
              "Timestamped Provenance: Click any citation to jump to the exact second in the video stream.",
            realWorldApplication:
              "Continuous automated knowledge synthesis from university video archives without manual note-taking.",
          }));

          setTopics((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const unique = generatedFromYt.filter((g) => !existingIds.has(g.id));
            return [...prev, ...unique];
          });
        }
      })
      .catch(() => {});
  }, []);

  const categories = ["All", ...Array.from(new Set(topics.map((t) => t.subject)))];

  const filteredTopics = topics.filter(
    (t) => selectedCategory === "All" || t.subject === selectedCategory
  );

  const activeTopic = filteredTopics[currentIndex] || filteredTopics[0] || topics[0];

  const handleResponse = (studied: boolean) => {
    setUserStudiedResponse(studied);
    setCardState("revealed");
    if (studied) {
      setStudiedTopicIds((prev) => new Set([...Array.from(prev), activeTopic.id]));
    }
  };

  const handleResetCard = () => {
    setCardState("prompt");
    setUserStudiedResponse(null);
  };

  const handleNext = () => {
    handleResetCard();
    setCurrentIndex((prev) => (prev + 1) % filteredTopics.length);
  };

  const handlePrev = () => {
    handleResetCard();
    setCurrentIndex((prev) => (prev - 1 + filteredTopics.length) % filteredTopics.length);
  };

  const handleStudyDeeperInChat = () => {
    const query = `Explain ${activeTopic.title} in detail. What are its core theoretical mechanisms, and cite specific passages from ${activeTopic.sourceLabel}?`;
    router.push(
      `/chat?topic=${encodeURIComponent(activeTopic.title)}&query=${encodeURIComponent(query)}&materialId=${activeTopic.sourceMaterialId || "all"}`
    );
  };

  const getModalityBadge = (modality: string) => {
    switch (modality) {
      case "lecture_video":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
            <Film className="h-3 w-3 text-purple-400" />
            Lecture Video
          </span>
        );
      case "slide_deck":
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <Presentation className="h-3 w-3 text-amber-400" />
            Slide Deck
          </span>
        );
      case "textbook":
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
            <BookOpen className="h-3 w-3 text-blue-400" />
            PDF Textbook
          </span>
        );
    }
  };

  const progressPercent = Math.round(
    (studiedTopicIds.size / (topics.length || 1)) * 100
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 select-none">
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION WITH MASTERY METRICS                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-l-[3px] border-[#6C63FF] pl-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6C63FF]/20 text-[#8B85FF] border border-[#6C63FF]/30">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Adaptive Flashcards
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Active recall engine grounded by your ingested textbooks, lecture videos, and slide decks.
          </p>
        </div>

        {/* Mastery Rate Progress Pill */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#262642] bg-[#141426] p-3 shadow-xs shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-white">Mastery Progress</span>
              <span className="font-mono text-emerald-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-32 rounded-full bg-[#1C1C36] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6C63FF] to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {studiedTopicIds.size} of {topics.length} topics mastered
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUBJECT CATEGORY PILLS FILTER                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1">Filter Subject:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
              handleResetCard();
            }}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer border",
              selectedCategory === cat
                ? "bg-[#6C63FF] border-[#6C63FF] text-white shadow-xs"
                : "bg-[#141426] border-[#262642] text-slate-400 hover:text-white hover:bg-[#1C1C36]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN INTERACTIVE FLASHCARD CONTAINER                                   */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#262642] bg-[#141426] p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
        {/* Card Header: Topic Count & Modality Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-[#262642]">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#1C1C36] border border-[#262642] px-3 py-1 text-xs font-mono font-bold text-[#8B85FF]">
              Card {currentIndex + 1} of {filteredTopics.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {activeTopic.courseId} · {activeTopic.subject}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {getModalityBadge(activeTopic.modality)}
            {studiedTopicIds.has(activeTopic.id) && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <Check className="h-3 w-3 text-emerald-400" />
                Studied
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="py-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {activeTopic.title}
          </h2>

          {/* ======================================================================= */}
          {/* STEP 1: PROMPT QUESTION STATE ("Topic studied? Yes or No")              */}
          {/* ======================================================================= */}
          {cardState === "prompt" ? (
            <div className="mt-8 space-y-6 text-center max-w-xl mx-auto py-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#6C63FF]/20 to-blue-500/20 border border-[#6C63FF]/30 flex items-center justify-center text-[#8B85FF] shadow-inner">
                  <HelpCircle className="h-8 w-8" />
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Topic studied?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  {activeTopic.shortQuestion}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click below to confirm your recall and reveal the verified concept overview.
                </p>
              </div>

              {/* Two Prominent Action Buttons: YES vs NO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleResponse(true)}
                  className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-6 py-4 text-sm font-bold text-emerald-300 hover:text-emerald-200 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Yes, I Studied This</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResponse(false)}
                  className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-6 py-4 text-sm font-bold text-amber-300 hover:text-amber-200 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  <span>No, Need To Learn</span>
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================================= */
            /* STEP 2: REVEALED CONCEPT OVERVIEW & DEEP DIVE                           */
            /* ======================================================================= */
            <div className="mt-6 space-y-6 animate-in fade-in duration-200">
              {/* Status Banner */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-2xl p-3.5 border text-xs font-semibold",
                  userStudiedResponse
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                )}
              >
                <div className="flex items-center gap-2">
                  {userStudiedResponse ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-amber-400" />
                  )}
                  <span>
                    {userStudiedResponse
                      ? "Marked as Studied -- Verify your mental model against source citations below"
                      : "Learning Mode -- Review the mechanical breakdown and master this concept"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetCard}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] hover:bg-white/10 transition-colors cursor-pointer"
                  title="Flip back to question"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Flip</span>
                </button>
              </div>

              {/* Core Concept Overview */}
              <div className="space-y-2 rounded-2xl border border-[#262642] bg-[#181830] p-4 sm:p-5">
                <span className="text-[11px] font-bold text-[#8B85FF] uppercase tracking-wider">
                  Conceptual Mental Model
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {activeTopic.summary}
                </p>
              </div>

              {/* Operational Mechanism Breakdown */}
              <div className="space-y-2 rounded-2xl border border-[#262642] bg-[#181830] p-4 sm:p-5">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Operational Mechanics & Pipeline
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeTopic.mechanism.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Formula / Provenance Insight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-[#262642] bg-[#181830] p-4">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Core Formula / Invariant
                  </span>
                  <p className="mt-1 text-xs text-slate-200 font-mono leading-relaxed">
                    {activeTopic.keyFormulaOrInsight}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#262642] bg-[#181830] p-4">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    Verified Grounded Citation
                  </span>
                  <p className="mt-1 text-xs text-blue-300 font-semibold leading-relaxed flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>{activeTopic.sourceLabel}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {activeTopic.realWorldApplication}
                  </p>
                </div>
              </div>

              {/* Deep Dive Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#262642]">
                <div className="text-xs text-slate-400">
                  Want to practice questions or clarify nuances on this topic?
                </div>

                {/* STEP 3 ACTION: STUDY DEEPER IN SOURCE CHAT */}
                <button
                  type="button"
                  onClick={handleStudyDeeperInChat}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 hover:from-[#5b52e0] hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Study Deeper in Source Chat</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Navigation Controls */}
        <div className="flex items-center justify-between pt-5 border-t border-[#262642]">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1.5 rounded-xl border border-[#262642] bg-[#1C1C36] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#222240] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous Card</span>
          </button>

          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Use arrow buttons to browse the topic deck
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-xl border border-[#262642] bg-[#1C1C36] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#222240] transition-colors cursor-pointer"
          >
            <span>Next Card</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOPIC DECK THUMBNAIL GRID                                              */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-white tracking-tight">
          All Topics in this Deck ({filteredTopics.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredTopics.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            const isStudied = studiedTopicIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  handleResetCard();
                }}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none",
                  isCurrent
                    ? "bg-[#1C1C36] border-[#6C63FF] shadow-md ring-1 ring-[#6C63FF]/30"
                    : "bg-[#141426] border-[#262642] hover:bg-[#1A1A32] hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">#{idx + 1}</span>
                  {isStudied && (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[10px]">
                      <Check className="h-3 w-3" /> Studied
                    </span>
                  )}
                </div>
                <h4 className="mt-1 text-xs font-bold text-white truncate" title={item.title}>
                  {item.title}
                </h4>
                <p className="mt-1 text-[11px] text-slate-400 truncate">
                  {item.sourceLabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
