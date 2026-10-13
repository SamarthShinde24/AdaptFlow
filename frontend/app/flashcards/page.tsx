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
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
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
import {
  getStoredDecks,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  generateDeckFromMaterials,
} from "@/lib/flashcard-store";
import { FlashcardModal } from "@/components/flashcards/FlashcardModal";

export default function FlashcardsPage() {
  const router = useRouter();

  // Active Deck & Card State
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => getStoredDecks());
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

  // Create / Edit & Delete Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);

  // User Feedback State
  const [feedbackGiven, setFeedbackGiven] = useState<"good" | "bad" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync decks across tabs and components
  useEffect(() => {
    setDecks(getStoredDecks());

    const handleSync = () => {
      setDecks(getStoredDecks());
    };
    window.addEventListener("adaptflow:flashcards-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("adaptflow:flashcards-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Ingest dynamically uploaded materials into dynamic custom deck on 1-click
  useEffect(() => {
    listMaterials()
      .then((materials) => {
        if (!materials || materials.length === 0) return;
        setDecks((prev) => {
          const { decks: updated } = generateDeckFromMaterials(materials, prev);
          return updated;
        });
      })
      .catch(() => {});
  }, []);

  // Resolve current active deck
  const currentDeck = decks.find((d) => d.id === activeDeckId) || decks[0] || ALL_DECKS[0];

  // Filter cards if user chose to review missed cards only
  const displayCards = onlyReviewMode
    ? currentDeck.cards.filter((c) => reviewCardIds.has(c.id))
    : currentDeck.cards.slice(0, 10);

  const currentCard = displayCards[currentCardIndex] || displayCards[0] || currentDeck.cards[0];
  const totalCardsCount = displayCards.length;

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setIsModalOpen(true);
    setShowOptionsMenu(false);
  };

  const handleOpenEditModal = () => {
    setModalMode("edit");
    setIsModalOpen(true);
    setShowOptionsMenu(false);
  };

  const handleSaveModal = (data: {
    question: string;
    answer: string;
    level: KnowledgeLevel;
    keyTakeaway?: string;
  }) => {
    if (modalMode === "create") {
      const { decks: updatedDecks } = addFlashcard(activeDeckId, data);
      setDecks(updatedDecks);
      const targetDeck = updatedDecks.find((d) => d.id === activeDeckId);
      if (targetDeck) {
        setCurrentCardIndex(targetDeck.cards.length - 1);
      }
      setIsFlipped(false);
      showToast("Flashcard created successfully!");
    } else if (modalMode === "edit" && currentCard) {
      const updatedDecks = updateFlashcard(activeDeckId, currentCard.id, data);
      setDecks(updatedDecks);
      showToast("Flashcard updated!");
    }
  };

  const handleConfirmDelete = () => {
    if (!cardToDelete) return;
    const updatedDecks = deleteFlashcard(activeDeckId, cardToDelete.id);
    setDecks(updatedDecks);
    setCardToDelete(null);

    const remainingCards = totalCardsCount - 1;
    if (currentCardIndex >= remainingCards && remainingCards > 0) {
      setCurrentCardIndex(remainingCards - 1);
    } else {
      setCurrentCardIndex(0);
    }
    setIsFlipped(false);
    showToast("Flashcard deleted.");
  };

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
        badgeStyle: "text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-700/60",
        summary: "Exceptional concept mastery! You understand foundational principles and advanced technical edge cases with high precision.",
      };
    } else if (score >= 5 || pct >= 50) {
      return {
        levelName: "Level 2 · Intermediate Competence",
        badgeStyle: "text-blue-800 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-700/60",
        summary: "Solid working knowledge of core mechanisms. Review the advanced cards to achieve full topic mastery.",
      };
    } else {
      return {
        levelName: "Level 1 · Foundational Knowledge",
        badgeStyle: "text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700/60",
        summary: "Foundational baseline in progress. We recommend reviewing missed cards or asking the AI tutor for step-by-step guidance.",
      };
    }
  };

  const diagnostic = computeKnowledgeDiagnostic();

  // Helper badge color for individual cards
  const getCardLevelBadge = (level?: KnowledgeLevel) => {
    switch (level) {
      case "Level 3 · Advanced":
        return "text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-700/60";
      case "Level 2 · Intermediate":
        return "text-blue-800 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-700/60";
      case "Level 1 · Foundational":
      default:
        return "text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700/60";
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col justify-between select-none overflow-hidden transition-colors duration-300",
        "text-slate-900 bg-[#F0F7FF] border border-sky-200/90 shadow-2xl",
        "dark:text-white dark:bg-[#070D18] dark:border-blue-900/40",
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none"
          : "min-h-[calc(100vh-6rem)] -mt-2 -mx-4 sm:-mx-6 rounded-3xl"
      )}
    >
      {/* ========================================================================= */}
      {/* AMBIENT AURAS & GLOW MESH (Light Blue in Light, Dark Blue in Dark)        */}
      {/* ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Light appearance: Soft sky / cyan auras */}
        <div
          className="dark:hidden absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[140px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(186, 230, 253, 0.8) 0%, transparent 70%)" }}
        />
        <div
          className="dark:hidden absolute top-[20%] -right-[10%] h-[650px] w-[650px] rounded-full blur-[150px] opacity-45"
          style={{ background: "radial-gradient(circle, rgba(191, 219, 254, 0.8) 0%, transparent 70%)" }}
        />
        {/* Dark appearance: Deep navy / royal blue auras */}
        <div
          className="hidden dark:block absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full blur-[140px] opacity-35"
          style={{ background: "radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, transparent 70%)" }}
        />
        <div
          className="hidden dark:block absolute top-[20%] -right-[10%] h-[650px] w-[650px] rounded-full blur-[150px] opacity-35"
          style={{ background: "radial-gradient(circle, rgba(29, 78, 216, 0.4) 0%, transparent 70%)" }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR                                                         */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-sky-200/80 bg-[#F0F7FF]/90 dark:border-blue-900/40 dark:bg-[#070D18]/90 backdrop-blur-md">
        {/* Left Title & Sources Pill */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {currentDeck.title}
            </h1>
            <button
              type="button"
              onClick={() => setShowDeckSelector((prev) => !prev)}
              className="text-xs text-sky-700 hover:text-sky-950 dark:text-blue-300 dark:hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-sky-100/70 dark:hover:bg-blue-900/40"
              title="Switch Flashcard Deck"
            >
              [Switch Deck]
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowSourcesModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-white/90 hover:bg-sky-50 dark:border-blue-800/60 dark:bg-blue-950/60 hover:dark:bg-blue-900/50 px-3 py-1 text-xs font-medium text-sky-900 dark:text-blue-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>View prompt and {currentDeck.sources.length} sources</span>
            </button>

            {/* 10-Card Focused Deck Limit Badge */}
            <span className="rounded-full bg-sky-100/90 border border-sky-200 dark:bg-blue-950/60 dark:border-blue-800/50 px-2.5 py-0.5 text-[11px] font-mono text-sky-800 dark:text-blue-300">
              10 Cards · Focused Deck
            </span>

            {/* Live Knowledge Level Tracker */}
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1", diagnostic.badgeStyle)}>
              <TrendingUp className="h-3 w-3" />
              <span>{diagnostic.levelName}</span>
            </span>

            {onlyReviewMode && (
              <span className="rounded-full bg-rose-100 border border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700/60 dark:text-rose-300 px-2.5 py-0.5 text-[11px] font-semibold animate-pulse">
                Reviewing Missed ({displayCards.length})
              </span>
            )}
          </div>
        </div>

        {/* Right Action Icons: Create, Share, Fullscreen, Close, More */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 transition-colors cursor-pointer shadow-xs mr-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Card</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sky-700 hover:text-sky-950 hover:bg-sky-100/80 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
            title="Share deck"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sky-700 hover:text-sky-950 hover:bg-sky-100/80 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-sky-700 hover:text-sky-950 hover:bg-sky-100/80 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
            title="Close to Dashboard"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sky-700 hover:text-sky-950 hover:bg-sky-100/80 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title="More Options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {showOptionsMenu && (
              <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-sky-200 bg-white/95 text-slate-800 dark:border-blue-800/60 dark:bg-[#0B1730]/95 dark:text-blue-100 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sky-100/70 dark:text-blue-200 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors text-left cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Edit This Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCardToDelete(currentCard);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  <span>Delete This Card</span>
                </button>

                <div className="my-1 border-t border-sky-100 dark:border-blue-900/40" />

                <button
                  type="button"
                  onClick={handleShuffleDeck}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sky-100/70 dark:text-blue-200 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors text-left cursor-pointer"
                >
                  <Shuffle className="h-3.5 w-3.5 text-sky-600 dark:text-blue-400" />
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
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:text-rose-200 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                    <span>{onlyReviewMode ? "Show All 10 Cards" : `Practice Missed (${incorrectCount})`}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sky-100/70 dark:text-blue-200 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors text-left cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-sky-600 dark:text-blue-400" />
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
          <p className="text-xs font-medium text-sky-700/80 dark:text-blue-300/80 tracking-wide">
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
            {/* CARD FRONT FACE (Question) - Light Blue in Light, Dark Blue in Dark*/}
            {/* ----------------------------------------------------------------- */}
            <div
              className={cn(
                "backface-hidden absolute inset-0 flex flex-col justify-between rounded-3xl p-6 sm:p-9 shadow-2xl transition-all duration-300 border-2",
                "bg-gradient-to-br from-[#EBF5FF] via-[#F4F9FF] to-[#E2EFFF] border-sky-300 hover:border-sky-400 text-slate-900 shadow-sky-500/10",
                "dark:bg-gradient-to-br dark:from-[#0B1730] dark:via-[#0F1E3D] dark:to-[#081326] dark:border-blue-600/40 hover:dark:border-blue-500/70 dark:text-white dark:shadow-blue-950/80"
              )}
            >
              {/* Front Top Row: Index and Knowledge Level Badge */}
              <div className="flex items-center justify-between text-xs text-sky-800 dark:text-blue-300 font-mono">
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
                    className="p-1 rounded-lg text-sky-600 hover:text-sky-900 hover:bg-sky-200/50 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors"
                    title="Copy question"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal();
                    }}
                    className="p-1 rounded-lg text-sky-600 hover:text-sky-900 hover:bg-sky-200/50 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors"
                    title="Edit card"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardToDelete(currentCard);
                    }}
                    className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Front Question Body: Generous, crisp typography */}
              <div className="my-auto py-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white leading-relaxed tracking-tight text-center sm:text-left">
                  {currentCard?.question || "No card loaded"}
                </h2>
              </div>

              {/* Front Bottom Prompt */}
              <div className="text-center pt-2">
                <span className="text-xs font-medium text-sky-700 hover:text-sky-900 dark:text-blue-300 dark:hover:text-blue-100 transition-colors inline-flex items-center gap-1">
                  See answer
                </span>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* CARD BACK FACE (Answer) - Light Blue in Light, Dark Blue in Dark  */}
            {/* ----------------------------------------------------------------- */}
            <div
              className={cn(
                "backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-3xl p-6 sm:p-9 shadow-2xl transition-all duration-300 border-2",
                "bg-gradient-to-br from-[#EBF5FF] via-[#F0F7FF] to-[#E5F0FF] border-sky-300 hover:border-sky-400 text-slate-900 shadow-sky-500/10",
                "dark:bg-gradient-to-br dark:from-[#091326] dark:via-[#0D1A33] dark:to-[#060D1A] dark:border-blue-600/40 hover:dark:border-blue-500/70 dark:text-white dark:shadow-blue-950/80"
              )}
            >
              {/* Back Top Row */}
              <div className="flex items-center justify-between text-xs text-sky-800 dark:text-blue-300 font-mono border-b border-sky-200/80 dark:border-blue-800/50 pb-3">
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
                    className="p-1 rounded-lg text-sky-600 hover:text-sky-900 hover:bg-sky-200/50 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors"
                    title="Copy answer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal();
                    }}
                    className="p-1 rounded-lg text-sky-600 hover:text-sky-900 hover:bg-sky-200/50 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors"
                    title="Edit card"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardToDelete(currentCard);
                    }}
                    className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Back Answer Body: Punchy, minimal words, zero fatigue */}
              <div className="my-auto py-4 space-y-3">
                {/* 1-2 sentence core answer */}
                <p className="text-base sm:text-lg text-slate-900 dark:text-blue-50 font-medium leading-relaxed">
                  {currentCard?.answer}
                </p>

                {/* Key Takeaway box */}
                {currentCard?.keyTakeaway && (
                  <div className="rounded-xl bg-sky-100 border border-sky-300/80 text-sky-950 dark:bg-blue-950/70 dark:border-blue-700/60 dark:text-blue-200 p-2.5 text-xs leading-relaxed font-sans">
                    <span className="font-bold text-sky-900 dark:text-blue-300 mr-1.5">Key Insight:</span>
                    <span>{currentCard.keyTakeaway}</span>
                  </div>
                )}

                {/* Citation Pill & AI Chat Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-200/80 dark:border-blue-800/50">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 border border-blue-300 text-blue-900 dark:bg-blue-900/50 dark:border-blue-700/70 dark:text-blue-300 px-3 py-1 text-xs font-semibold">
                    <BookOpen className="h-3 w-3" />
                    <span>{currentCard?.citation.label}</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleStudyDeeperInChat}
                    className="inline-flex items-center gap-1 rounded-full bg-white hover:bg-sky-100/80 border border-sky-300 text-sky-900 dark:bg-blue-950/70 hover:dark:bg-blue-900/80 dark:border-blue-700/50 dark:text-blue-200 hover:dark:text-white px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="h-3 w-3 text-sky-600 dark:text-blue-400" />
                    <span>Deep Dive in Chat</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Back Bottom Prompt */}
              <div className="text-center pt-2">
                <span className="text-xs font-medium text-sky-700 hover:text-sky-900 dark:text-blue-300 dark:hover:text-blue-100 transition-colors inline-flex items-center gap-1">
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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white hover:bg-sky-100/90 text-sky-800 border border-sky-300/80 dark:bg-[#0B1730] hover:dark:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 hover:dark:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
            title="Previous card (Left Arrow)"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Mark Incorrect / Need Review Button: [X 0] */}
          <button
            type="button"
            onClick={handleMarkIncorrect}
            className="flex items-center gap-2 rounded-full bg-white hover:bg-rose-50 border border-rose-300/80 text-rose-600 hover:text-rose-700 dark:bg-[#0B1730] hover:dark:bg-rose-950/40 dark:border-blue-800/60 hover:dark:border-rose-500/50 dark:text-rose-400 hover:dark:text-rose-300 px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
            title="Mark as Needs Review (Key 'X' or '1')"
          >
            <X className="h-4 w-4" />
            <span className="font-mono font-bold">{incorrectCount}</span>
          </button>

          {/* Mark Correct / Mastered Button: [0 ✓] */}
          <button
            type="button"
            onClick={handleMarkCorrect}
            className="flex items-center gap-2 rounded-full bg-white hover:bg-emerald-50 border border-emerald-300/80 text-emerald-600 hover:text-emerald-700 dark:bg-[#0B1730] hover:dark:bg-emerald-950/40 dark:border-blue-800/60 hover:dark:border-emerald-500/50 dark:text-emerald-400 hover:dark:text-emerald-300 px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
            title="Mark as Mastered (Key 'C' or '2')"
          >
            <span className="font-mono font-bold">{correctCount}</span>
            <Check className="h-4 w-4" />
          </button>

          {/* Next Card Button */}
          <button
            type="button"
            onClick={handleNext}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white hover:bg-sky-100/90 text-sky-800 border border-sky-300/80 dark:bg-[#0B1730] hover:dark:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 hover:dark:text-white transition-all cursor-pointer shadow-md"
            title="Next card (Right Arrow)"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM FEEDBACK & DISCLAIMER BAR                                       */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-sky-200/80 bg-[#F0F7FF]/90 dark:border-blue-900/40 dark:bg-[#070D18]/90 backdrop-blur-md text-xs text-sky-800 dark:text-blue-300">
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
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                : "bg-white hover:bg-sky-100/80 border-sky-200 text-sky-800 dark:bg-[#0B1730] hover:dark:bg-[#122244] dark:border-blue-800/50 dark:text-blue-200 hover:dark:text-white"
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
                ? "bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300"
                : "bg-white hover:bg-sky-100/80 border-sky-200 text-sky-800 dark:bg-[#0B1730] hover:dark:bg-[#122244] dark:border-blue-800/50 dark:text-blue-200 hover:dark:text-white"
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>Bad content</span>
          </button>
        </div>

        <div className="text-[11px] text-sky-700/70 dark:text-blue-400/60 text-center sm:text-right">
          AdaptFlow Knowledge Engine can make mistakes, so double-check source citations.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: "VIEW PROMPT AND SOURCES"                                       */}
      {/* ========================================================================= */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl border border-sky-300 bg-[#F0F7FF] text-slate-900 dark:border-blue-800/70 dark:bg-[#0B1730] dark:text-white p-6 shadow-2xl text-left space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-sky-200 dark:border-blue-800/50 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Flashcard Prompt & Source Grounding
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="p-1 rounded-lg text-sky-700 hover:text-sky-950 dark:text-blue-300 dark:hover:text-white hover:bg-sky-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Synthesis Prompt
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-blue-100 leading-relaxed bg-white dark:bg-[#070D18] p-3.5 rounded-2xl border border-sky-200 dark:border-blue-900/60">
                &ldquo;{currentDeck.promptDescription}&rdquo;
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Verified Grounded Sources ({currentDeck.sources.length})
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {currentDeck.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-sky-200 bg-white hover:border-sky-300 dark:border-blue-900/60 dark:bg-[#070D18] dark:hover:border-blue-700/60 transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shrink-0 mt-0.5">
                      {src.type === "lecture_video" ? (
                        <Film className="h-3.5 w-3.5" />
                      ) : src.type === "slide_deck" ? (
                        <Presentation className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{src.title}</p>
                      <p className="text-[11px] text-sky-700 dark:text-blue-300 mt-0.5">{src.reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-sky-300 bg-[#F0F7FF] text-slate-900 dark:border-blue-800/70 dark:bg-[#0B1730] dark:text-white p-6 shadow-2xl text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-sky-200 dark:border-blue-800/50 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Choose Flashcard Deck</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeckSelector(false)}
                className="p-1 rounded-lg text-sky-700 hover:text-sky-950 dark:text-blue-300 dark:hover:text-white hover:bg-sky-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
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
                      ? "bg-sky-200/80 border-blue-500 text-slate-900 dark:bg-blue-900/50 dark:border-blue-500 dark:text-white shadow-md"
                      : "bg-white border-sky-200 hover:bg-sky-100/60 text-slate-800 dark:bg-[#070D18] dark:border-blue-900/60 dark:hover:bg-blue-950/50 dark:text-blue-200"
                  )}
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{d.title}</h4>
                    <p className="text-xs text-sky-800/80 dark:text-blue-300/80 mt-0.5">
                      {d.subject} · {d.cards.length} cards (10-card limit)
                    </p>
                  </div>
                  {activeDeckId === d.id && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-sky-300 bg-[#F0F7FF] text-slate-900 dark:border-blue-800/70 dark:bg-[#0B1730] dark:text-white p-7 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            {/* Top-Right Close Button (Cross Mark) */}
            <button
              type="button"
              onClick={() => setShowCompletionModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-sky-700 hover:text-sky-950 hover:bg-sky-100 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              aria-label="Close diagnostic modal"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50">
              <Award className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Knowledge Level Diagnostic
              </h3>
              <p className="text-xs text-sky-800/80 dark:text-blue-300/80 mt-1">
                Completed 10-card concept evaluation for {currentDeck.title}
              </p>
            </div>

            {/* Diagnostic Level Result Box */}
            <div className="p-4 rounded-2xl bg-white border border-sky-200 dark:bg-[#070D18] dark:border-blue-900/60 text-center space-y-2">
              <span className="text-[11px] font-bold text-sky-800/70 dark:text-blue-400 uppercase tracking-wider block">
                Assessed Knowledge Level
              </span>
              <span className={cn("inline-block rounded-full border px-3.5 py-1 text-sm font-bold font-sans", diagnostic.badgeStyle)}>
                {diagnostic.levelName}
              </span>
              <p className="text-xs text-slate-700 dark:text-blue-200 leading-relaxed pt-1">
                {diagnostic.summary}
              </p>
            </div>

            {/* Score Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {correctCount} / {totalCardsCount}
                </span>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-1">Mastered</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-2xl font-mono font-bold text-rose-700 dark:text-rose-400">
                  {incorrectCount}
                </span>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 mt-1">Needs Review</p>
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
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Retest This 10-Card Deck
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  setShowDeckSelector(true);
                }}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-sky-100 border border-sky-200 text-slate-800 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] dark:border-transparent dark:text-zinc-300 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer"
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
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 rounded-full border border-sky-300/80 bg-sky-900/95 text-white dark:border-blue-700/50 dark:bg-[#0B1730]/95 px-4 py-2 text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#0A1222] p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Flashcard?
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  This action removes Card {currentCardIndex + 1} from {currentDeck.title}.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <FlashcardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        deckTitle={currentDeck.title}
        initialCard={modalMode === "edit" ? currentCard : null}
        onSave={handleSaveModal}
      />
    </div>
  );
}
