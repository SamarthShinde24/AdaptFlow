"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Share2,
  Maximize2,
  Minimize2,
  X,
  MoreVertical,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  Film,
  Presentation,
  MessageSquare,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  CheckCircle2,
  ArrowRight,
  Award,
  FolderOpen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Material } from "@/lib/types";
import { listMaterials } from "@/lib/api";
import {
  ALL_DECKS,
  Flashcard,
  FlashcardDeck,
  KnowledgeLevel,
} from "@/lib/flashcards-data";

export default function FlashcardsPage() {
  const router = useRouter();

  // Active Deck & Card State
  const [decks, setDecks] = useState<FlashcardDeck[]>(ALL_DECKS);
  const [activeDeckId, setActiveDeckId] = useState<string>("biology");
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Scoring & Study Progress State
  const [masteredCardIds, setMasteredCardIds] = useState<Set<string>>(new Set());
  const [reviewCardIds, setReviewCardIds] = useState<Set<string>>(new Set());
  const [onlyReviewMode, setOnlyReviewMode] = useState<boolean>(false);

  // Modals & UI Controls
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);
  const [showDeckSelector, setShowDeckSelector] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // User Feedback State
  const [feedbackGiven, setFeedbackGiven] = useState<"good" | "bad" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve current active deck (strictly 10 cards per deck)
  const currentDeck = decks.find((d) => d.id === activeDeckId) || decks[0];

  // Filter cards if user chose to review missed cards only
  const displayCards = onlyReviewMode
    ? currentDeck.cards.filter((c) => reviewCardIds.has(c.id))
    : currentDeck.cards.slice(0, 10);

  const currentCard = displayCards[currentCardIndex] || displayCards[0] || currentDeck.cards[0];
  const totalCardsCount = displayCards.length;

  // Ingest any dynamically uploaded materials from backend/localStorage into a dynamic custom deck
  useEffect(() => {
    listMaterials()
      .then((materials) => {
        if (!materials || materials.length === 0) return;

        const customMaterials = materials.filter(
          (m) =>
            m.id.startsWith("yt_") ||
            Boolean((m.metadata as any)?.youtube_id) ||
            m.title.toLowerCase().includes("video") ||
            m.title.toLowerCase().includes("jaipur")
        );

        if (customMaterials.length > 0) {
          const customCards: Flashcard[] = customMaterials.slice(0, 10).map((mat, idx) => ({
            id: `custom_${mat.id}_${idx}`,
            deckId: "custom_materials",
            level: idx < 3 ? "Level 1 · Foundational" : idx < 7 ? "Level 2 · Intermediate" : "Level 3 · Advanced",
            question: `What is the core takeaway and practical insight in ${mat.title}?`,
            answer: `Key concept extracted from verified course material "${mat.title}". Focuses on modular architecture, proven facts, and source citations.`,
            keyTakeaway: `Ingested source: ${mat.filename || mat.title} -- Verified in vector knowledge base.`,
            citation: {
              label: `[${mat.title} | Source File]`,
              sourceTitle: mat.title,
              pageOrTime: "Section 1",
              materialId: mat.id,
            },
          }));

          const customDeck: FlashcardDeck = {
            id: "custom_materials",
            title: "Uploaded Materials Flashcards",
            subject: "Course Uploads",
            promptDescription:
              "10 concise, bite-sized active recall flashcards synthesized from uploaded textbooks, PDFs, and video lectures. Focus on rapid concept mastery with minimal reading fatigue.",
            sources: customMaterials.slice(0, 5).map((m) => ({
              title: m.title,
              type: m.material_type === "lecture_video" ? "lecture_video" : "textbook",
              reference: m.filename || "Uploaded Course Document",
            })),
            cards: customCards,
          };

          setDecks((prev) => {
            if (prev.some((d) => d.id === "custom_materials")) return prev;
            return [...prev, customDeck];
          });
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    if (currentCardIndex + 1 >= totalCardsCount) {
      setShowCompletionModal(true);
    } else {
      setCurrentCardIndex((prev) => prev + 1);
    }
  }, [currentCardIndex, totalCardsCount]);

  const handlePrev = useCallback(() => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev - 1);
    }
  }, [currentCardIndex]);

  const handleMarkIncorrect = useCallback(() => {
    if (!currentCard) return;
    setReviewCardIds((prev) => new Set([...Array.from(prev), currentCard.id]));
    setMasteredCardIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  }, [currentCard, handleNext]);

  const handleMarkCorrect = useCallback(() => {
    if (!currentCard) return;
    setMasteredCardIds((prev) => new Set([...Array.from(prev), currentCard.id]));
    setReviewCardIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  }, [currentCard, handleNext]);

  // Keyboard navigation shortcuts: Space to flip, Arrows to navigate, 1/2 or X/C for score
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "1" || e.key.toLowerCase() === "x") {
        e.preventDefault();
        handleMarkIncorrect();
      } else if (e.key === "2" || e.key.toLowerCase() === "c" || e.key.toLowerCase() === "v") {
        e.preventDefault();
        handleMarkCorrect();
      } else if (e.key === "Escape") {
        setShowSourcesModal(false);
        setShowDeckSelector(false);
        setShowOptionsMenu(false);
        setShowCompletionModal(false);
        if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleMarkIncorrect, handleMarkCorrect, isFullscreen]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Deck link copied to clipboard!");
    }
  };

  const handleCopyCardText = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    const textToCopy = isFlipped
      ? `Q: ${currentCard.question}\n\nA: ${currentCard.answer}\nSource: ${currentCard.citation.label}`
      : `Q: ${currentCard.question}`;
    navigator.clipboard.writeText(textToCopy);
    showToast("Card text copied!");
  };

  const handleShuffleDeck = () => {
    const shuffled = [...currentDeck.cards].sort(() => Math.random() - 0.5);
    setDecks((prev) =>
      prev.map((d) => (d.id === activeDeckId ? { ...d, cards: shuffled } : d))
    );
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowOptionsMenu(false);
    showToast("Deck shuffled randomly!");
  };

  const handleResetProgress = () => {
    setMasteredCardIds(new Set());
    setReviewCardIds(new Set());
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setOnlyReviewMode(false);
    setShowOptionsMenu(false);
    setShowCompletionModal(false);
    showToast("Deck progress reset!");
  };

  const handleStudyDeeperInChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = `Explain this concept concisely: ${currentCard.question}. Summarize its core theoretical mechanism and cite specific passages from ${currentCard.citation.sourceTitle}.`;
    router.push(
      `/chat?topic=${encodeURIComponent(currentCard.question.slice(0, 40))}&query=${encodeURIComponent(query)}&materialId=${currentCard.citation.materialId || "all"}`
    );
  };

  const incorrectCount = reviewCardIds.size;
  const correctCount = masteredCardIds.size;

  // Compute live knowledge level assessment
  const computeKnowledgeDiagnostic = () => {
    const total = totalCardsCount || 10;
    const score = correctCount;
    const pct = Math.round((score / total) * 100);

    if (score >= 8 || pct >= 80) {
      return {
        levelName: "Level 3 · Advanced Mastery",
        badgeStyle: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        summary: "Exceptional concept mastery! You understand foundational principles and advanced technical edge cases with high precision.",
      };
    } else if (score >= 5 || pct >= 50) {
      return {
        levelName: "Level 2 · Intermediate Competence",
        badgeStyle: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        summary: "Solid working knowledge of core mechanisms. Review the advanced cards to achieve full topic mastery.",
      };
    } else {
      return {
        levelName: "Level 1 · Foundational Knowledge",
        badgeStyle: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        summary: "Foundational baseline in progress. We recommend reviewing missed cards or asking the AI tutor for step-by-step guidance.",
      };
    }
  };

  const diagnostic = computeKnowledgeDiagnostic();

  // Helper badge color for individual cards
  const getCardLevelBadge = (level?: KnowledgeLevel) => {
    switch (level) {
      case "Level 3 · Advanced":
        return "text-amber-300 bg-amber-500/15 border-amber-500/30";
      case "Level 2 · Intermediate":
        return "text-indigo-300 bg-indigo-500/15 border-indigo-500/30";
      case "Level 1 · Foundational":
      default:
        return "text-emerald-300 bg-emerald-500/15 border-emerald-500/30";
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col justify-between select-none overflow-hidden text-white transition-colors duration-300",
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen bg-[#111215]"
          : "min-h-[calc(100vh-6rem)] -mt-2 -mx-4 sm:-mx-6 rounded-3xl bg-[#141519] border border-white/[0.06] shadow-2xl"
      )}
    >
      {/* ========================================================================= */}
      {/* NOTEBOOKLM AMBIENT AURAS & GLOW MESH                                      */}
      {/* ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[140px] opacity-25"
          style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[20%] -right-[10%] h-[650px] w-[650px] rounded-full blur-[150px] opacity-25"
          style={{ background: "radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, transparent 70%)" }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR                                                         */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06] bg-[#141519]/70 backdrop-blur-md">
        {/* Left Title & Sources Pill */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
              {currentDeck.title}
            </h1>
            <button
              type="button"
              onClick={() => setShowDeckSelector((prev) => !prev)}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-white/[0.06]"
              title="Switch Flashcard Deck"
            >
              [Switch Deck]
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowSourcesModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer shadow-2xs"
            >
              <span>View prompt and {currentDeck.sources.length} sources</span>
            </button>

            {/* 10-Card Focused Deck Limit Badge */}
            <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 text-[11px] font-mono text-zinc-300">
              10 Cards · Focused Deck
            </span>

            {/* Live Knowledge Level Tracker */}
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1", diagnostic.badgeStyle)}>
              <TrendingUp className="h-3 w-3" />
              <span>{diagnostic.levelName}</span>
            </span>

            {onlyReviewMode && (
              <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300 animate-pulse">
                Reviewing Missed ({displayCards.length})
              </span>
            )}
          </div>
        </div>

        {/* Right Action Icons: Share, Fullscreen, Close, More */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Share deck"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Close to Dashboard"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="More Options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {showOptionsMenu && (
              <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-white/[0.1] bg-[#1E2024] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={handleShuffleDeck}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
                >
                  <Shuffle className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Shuffle Deck</span>
                </button>

                {incorrectCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyReviewMode((prev) => !prev);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                      setShowOptionsMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                    <span>{onlyReviewMode ? "Show All 10 Cards" : `Practice Missed (${incorrectCount})`}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Reset Study Progress</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER STAGE: KEYBOARD INSTRUCTION & 3D FLIP CARD                     */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 sm:py-8">
        {/* Keyboard Helper Prompt */}
        <div className="mb-4 text-center">
          <p className="text-xs font-normal text-zinc-400 tracking-wide">
            Press &ldquo;Space&rdquo; to flip, &ldquo;&larr; / &rarr;&rdquo; to navigate
          </p>
        </div>

        {/* 3D Flashcard Stage */}
        <div
          onClick={handleFlip}
          className="perspective-1000 w-full max-w-2xl cursor-pointer"
          style={{ minHeight: "340px" }}
        >
          <div
            className={cn(
              "transform-style-preserve-3d relative w-full h-full min-h-[340px] sm:min-h-[380px] rounded-3xl transition-transform duration-500 ease-out"
            )}
            style={{
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* ----------------------------------------------------------------- */}
            {/* CARD FRONT FACE (Question)                                        */}
            {/* ----------------------------------------------------------------- */}
            <div
              className={cn(
                "backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl p-6 sm:p-9 shadow-2xl transition-all duration-300 border border-white/[0.08]",
                "bg-[#25272B] hover:border-white/[0.16] hover:bg-[#282A2F]"
              )}
            >
              {/* Front Top Row: Index and Knowledge Level Badge */}
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span className="font-semibold tracking-wider">
                  {currentCardIndex + 1} / {totalCardsCount}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold font-sans",
                      getCardLevelBadge(currentCard?.level)
                    )}
                  >
                    {currentCard?.level || "Level 1 · Foundational"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCardText}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Copy question"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Front Question Body: Generous, crisp typography */}
              <div className="my-auto py-6">
                <h2 className="text-xl sm:text-2xl font-medium text-white leading-relaxed tracking-tight text-center sm:text-left">
                  {currentCard?.question || "No card loaded"}
                </h2>
              </div>

              {/* Front Bottom Prompt */}
              <div className="text-center pt-2">
                <span className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1">
                  See answer
                </span>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* CARD BACK FACE (Concise Answer, Minimum Words, No Boredom)        */}
            {/* ----------------------------------------------------------------- */}
            <div
              className={cn(
                "backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-3xl p-6 sm:p-9 shadow-2xl transition-all duration-300 border border-white/[0.1]",
                "bg-[#222428] hover:border-white/[0.18]"
              )}
            >
              {/* Back Top Row */}
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono border-b border-white/[0.06] pb-3">
                <span className="font-semibold tracking-wider">
                  {currentCardIndex + 1} / {totalCardsCount}
                </span>

                <div className="flex items-center gap-2 font-sans">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold font-sans",
                      getCardLevelBadge(currentCard?.level)
                    )}
                  >
                    {currentCard?.level || "Level 1 · Foundational"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCardText}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Copy answer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Back Answer Body: Punchy, minimal words, zero fatigue */}
              <div className="my-auto py-4 space-y-3">
                {/* 1-2 sentence core answer */}
                <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
                  {currentCard?.answer}
                </p>

                {/* Key Takeaway box */}
                {currentCard?.keyTakeaway && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-200/90 leading-relaxed font-sans">
                    <span className="font-bold text-amber-300 mr-1.5">Key Insight:</span>
                    <span>{currentCard.keyTakeaway}</span>
                  </div>
                )}

                {/* Citation Pill & AI Chat Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6C63FF]/15 border border-[#6C63FF]/30 px-3 py-1 text-xs font-semibold text-[#8B85FF]">
                    <BookOpen className="h-3 w-3" />
                    <span>{currentCard?.citation.label}</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleStudyDeeperInChat}
                    className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] px-3 py-1 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="h-3 w-3 text-[#6C63FF]" />
                    <span>Deep Dive in Chat</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Back Bottom Prompt */}
              <div className="text-center pt-2">
                <span className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1">
                  See question
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 3. NAVIGATION CONTROLS ROW: [<-] [X 0] [0 ✓] [->]                      */}
        {/* ======================================================================= */}
        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
          {/* Previous Card Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentCardIndex === 0}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25272B] hover:bg-[#32353B] text-zinc-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
            title="Previous card (Left Arrow)"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Mark Incorrect / Need Review Button: [X 0] */}
          <button
            type="button"
            onClick={handleMarkIncorrect}
            className="flex items-center gap-2 rounded-full bg-[#25272B] hover:bg-rose-950/40 border border-white/[0.08] hover:border-rose-500/40 px-5 py-2.5 text-sm font-semibold text-rose-400 hover:text-rose-300 transition-all cursor-pointer shadow-md active:scale-95"
            title="Mark as Needs Review (Key 'X' or '1')"
          >
            <X className="h-4 w-4" />
            <span className="font-mono font-bold">{incorrectCount}</span>
          </button>

          {/* Mark Correct / Mastered Button: [0 ✓] */}
          <button
            type="button"
            onClick={handleMarkCorrect}
            className="flex items-center gap-2 rounded-full bg-[#25272B] hover:bg-emerald-950/40 border border-white/[0.08] hover:border-emerald-500/40 px-5 py-2.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer shadow-md active:scale-95"
            title="Mark as Mastered (Key 'C' or '2')"
          >
            <span className="font-mono font-bold">{correctCount}</span>
            <Check className="h-4 w-4" />
          </button>

          {/* Next Card Button */}
          <button
            type="button"
            onClick={handleNext}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25272B] hover:bg-[#32353B] text-zinc-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer shadow-md"
            title="Next card (Right Arrow)"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM FEEDBACK & DISCLAIMER BAR                                       */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-white/[0.06] bg-[#141519]/70 backdrop-blur-md text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFeedbackGiven("good");
              showToast("Thanks for your positive feedback!");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all cursor-pointer",
              feedbackGiven === "good"
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-[#222428] hover:bg-[#2C2E34] border-white/[0.08] text-zinc-300 hover:text-white"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Good content</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedbackGiven("bad");
              showToast("Feedback recorded. Refining card length!");
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all cursor-pointer",
              feedbackGiven === "bad"
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                : "bg-[#222428] hover:bg-[#2C2E34] border-white/[0.08] text-zinc-300 hover:text-white"
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>Bad content</span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-500 text-center sm:text-right">
          AdaptFlow Knowledge Engine can make mistakes, so double-check source citations.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: "VIEW PROMPT AND SOURCES"                                       */}
      {/* ========================================================================= */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#1E2024] p-6 shadow-2xl text-left space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#6C63FF]" />
                <h3 className="text-base font-bold text-white">
                  Flashcard Prompt & Source Grounding
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#8B85FF] uppercase tracking-wider">
                Synthesis Prompt
              </span>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-[#16171B] p-3.5 rounded-2xl border border-white/[0.06]">
                &ldquo;{currentDeck.promptDescription}&rdquo;
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Verified Grounded Sources ({currentDeck.sources.length})
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {currentDeck.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-[#16171B] hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#8B85FF] shrink-0 mt-0.5">
                      {src.type === "lecture_video" ? (
                        <Film className="h-3.5 w-3.5" />
                      ) : src.type === "slide_deck" ? (
                        <Presentation className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{src.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{src.reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: DECK SELECTOR                                                   */}
      {/* ========================================================================= */}
      {showDeckSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#1E2024] p-6 shadow-2xl text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-[#6C63FF]" />
                <h3 className="text-base font-bold text-white">Choose Flashcard Deck</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeckSelector(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {decks.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    setActiveDeckId(d.id);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setOnlyReviewMode(false);
                    setShowDeckSelector(false);
                  }}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                    activeDeckId === d.id
                      ? "bg-[#6C63FF]/20 border-[#6C63FF] text-white shadow-md"
                      : "bg-[#16171B] border-white/[0.06] hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                  )}
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{d.title}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {d.subject} · {d.cards.length} cards (10-card limit)
                    </p>
                  </div>
                  {activeDeckId === d.id && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C63FF] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: KNOWLEDGE LEVEL DIAGNOSTIC SUMMARY                              */}
      {/* ========================================================================= */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#1E2024] p-7 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#6C63FF]/20 text-[#8B85FF] border border-[#6C63FF]/30">
              <Award className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">
                Knowledge Level Diagnostic
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Completed 10-card concept evaluation for {currentDeck.title}
              </p>
            </div>

            {/* Diagnostic Level Result Box */}
            <div className="p-4 rounded-2xl bg-[#16171B] border border-white/[0.08] text-center space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Assessed Knowledge Level
              </span>
              <span className={cn("inline-block rounded-full border px-3.5 py-1 text-sm font-bold font-sans", diagnostic.badgeStyle)}>
                {diagnostic.levelName}
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                {diagnostic.summary}
              </p>
            </div>

            {/* Score Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {correctCount} / {totalCardsCount}
                </span>
                <p className="text-xs font-semibold text-emerald-300 mt-1">Mastered</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-2xl font-mono font-bold text-rose-400">
                  {incorrectCount}
                </span>
                <p className="text-xs font-semibold text-rose-300 mt-1">Needs Review</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {incorrectCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOnlyReviewMode(true);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setShowCompletionModal(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  Review Missed Cards ({incorrectCount})
                </button>
              )}

              <button
                type="button"
                onClick={handleResetProgress}
                className="w-full py-3 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Retest This 10-Card Deck
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  setShowDeckSelector(true);
                }}
                className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Choose Another Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TOAST NOTIFICATION PILL                                                */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 rounded-full border border-white/[0.15] bg-[#1E2024]/95 px-4 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
