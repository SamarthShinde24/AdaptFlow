"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashcardDeck, Flashcard, KnowledgeLevel } from "@/lib/flashcards-data";
import {
  getStoredDecks,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  generateDeckFromMaterials,
  generateDeckFromSingleMaterial,
} from "@/lib/flashcard-store";
import { listMaterials } from "@/lib/api";
import { Material } from "@/lib/types";
import { FlashcardModal } from "@/components/flashcards/FlashcardModal";
import { IngestDeckModal } from "@/components/flashcards/IngestDeckModal";
import { CreateDeckModal } from "@/components/flashcards/CreateDeckModal";

interface DashboardFlashcardsProps {
  materials?: Material[];
}

export function DashboardFlashcards({ materials: initialMaterials }: DashboardFlashcardsProps = {}) {
  const router = useRouter();

  // Decks & Active Card State
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adaptflow_active_deck");
      if (saved) return saved;
    }
    return "biology";
  });
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Materials & Ingestion Modal State
  const [materials, setMaterials] = useState<Material[]>(initialMaterials || []);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);

  // Horizontal scroll state for deck subject tabs
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScrollability = useCallback(() => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability);
    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [checkScrollability, decks]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const offset = direction === "left" ? -220 : 220;
      tabsRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabsRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        tabsRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Sync decks from store
  const refreshDecks = useCallback(() => {
    const stored = getStoredDecks();
    setDecks(stored);
  }, []);

  useEffect(() => {
    refreshDecks();

    const handleStorageSync = () => refreshDecks();
    window.addEventListener("adaptflow:flashcards-updated", handleStorageSync);
    window.addEventListener("storage", handleStorageSync);

    return () => {
      window.removeEventListener("adaptflow:flashcards-updated", handleStorageSync);
      window.removeEventListener("storage", handleStorageSync);
    };
  }, [refreshDecks]);

  // Synchronize initialMaterials prop if updated from DashboardPage
  useEffect(() => {
    if (initialMaterials && initialMaterials.length > 0) {
      setMaterials(initialMaterials);
      setDecks((prevDecks) => {
        const { decks: updated } = generateDeckFromMaterials(initialMaterials, prevDecks);
        return updated;
      });
    }
  }, [initialMaterials]);

  // Load materials to support generation from uploaded PDF / video URL
  const fetchIngestedMaterials = useCallback(async () => {
    try {
      const mats = await listMaterials();
      if (mats && mats.length > 0) {
        setMaterials(mats);
        setDecks((prevDecks) => {
          const { decks: updated } = generateDeckFromMaterials(mats, prevDecks);
          return updated;
        });
      }
    } catch (err) {
      // Backend not running or offline
    }
  }, []);

  useEffect(() => {
    fetchIngestedMaterials();

    const handleMaterialsUpdated = () => fetchIngestedMaterials();
    window.addEventListener("adaptflow:materials-updated", handleMaterialsUpdated);
    window.addEventListener("materials_updated", handleMaterialsUpdated);
    window.addEventListener("adaptflow:material-ingested", handleMaterialsUpdated);
    window.addEventListener("storage", handleMaterialsUpdated);

    return () => {
      window.removeEventListener("adaptflow:materials-updated", handleMaterialsUpdated);
      window.removeEventListener("materials_updated", handleMaterialsUpdated);
      window.removeEventListener("adaptflow:material-ingested", handleMaterialsUpdated);
      window.removeEventListener("storage", handleMaterialsUpdated);
    };
  }, [fetchIngestedMaterials]);

  // Resolve active deck and current card
  const activeDeck: FlashcardDeck =
    decks.find((d) => d.id === activeDeckId) || decks[0] || {
      id: "empty",
      title: "Flashcards Deck",
      subject: "General",
      promptDescription: "",
      sources: [],
      cards: [],
    };

  const totalCards = activeDeck.cards.length;
  const currentCard: Flashcard | undefined = activeDeck.cards[currentCardIndex];

  const handleSelectDeck = (deckId: string) => {
    setActiveDeckId(deckId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("adaptflow_active_deck", deckId);
    }
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalCards === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalCards === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  // Open Modal to choose material
  const handleOpenIngestModal = () => {
    if (materials.length === 0) {
      fetchIngestedMaterials();
    }
    setIsIngestModalOpen(true);
  };

  // Confirm Generation from Modal
  const handleIngestFromModal = (selectedMaterial: Material | null) => {
    if (!selectedMaterial) {
      if (materials.length === 0) {
        showToast("No files uploaded yet. Ingest a PDF or video below to generate cards!");
        return;
      }
      const { decks: updated, newDeck } = generateDeckFromMaterials(materials, decks);
      setDecks(updated);
      if (newDeck) {
        setActiveDeckId(newDeck.id);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        showToast("Generated 10 active recall cards from all materials!");
      }
    } else {
      const { decks: updated, newDeck } = generateDeckFromSingleMaterial(selectedMaterial, decks);
      setDecks(updated);
      setActiveDeckId(newDeck.id);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      showToast(`Generated 10 flashcards for ${selectedMaterial.title.slice(0, 26)}!`);
    }
  };

  // Create Deck Handler (Arrow 1: 10 Cards Deck from scratch)
  const handleOpenCreateDeckModal = () => {
    setIsCreateDeckModalOpen(true);
  };

  const handleDeckCreated = (newDeck: FlashcardDeck) => {
    const updated = getStoredDecks();
    setDecks(updated);
    setActiveDeckId(newDeck.id);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("adaptflow_active_deck", newDeck.id);
    }
    showToast(`Created new deck "${newDeck.title}" with 10 cards!`);
  };

  // Create Single Card Handler (Arrow 2: add card to selected deck)
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Edit Card Handler
  const handleOpenEditModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Modal Save Callback
  const handleSaveModal = (data: {
    title?: string;
    question: string;
    answer: string;
    level: KnowledgeLevel;
    keyTakeaway?: string;
  }) => {
    if (modalMode === "create") {
      const { decks: updatedDecks } = addFlashcard(activeDeck.id, data);
      setDecks(updatedDecks);
      const targetDeck = updatedDecks.find((d) => d.id === activeDeck.id);
      if (targetDeck) {
        setCurrentCardIndex(targetDeck.cards.length - 1);
      }
      setIsFlipped(false);
      showToast("Flashcard created successfully!");
    } else if (modalMode === "edit" && currentCard) {
      const updatedDecks = updateFlashcard(activeDeck.id, currentCard.id, data);
      setDecks(updatedDecks);
      showToast("Flashcard updated!");
    }
  };

  // Delete Card Handler
  const handleConfirmDelete = () => {
    if (!cardToDelete) return;
    const updatedDecks = deleteFlashcard(activeDeck.id, cardToDelete.id);
    setDecks(updatedDecks);
    setCardToDelete(null);

    // Adjust card index safely
    const remainingCards = totalCards - 1;
    if (currentCardIndex >= remainingCards && remainingCards > 0) {
      setCurrentCardIndex(remainingCards - 1);
    } else {
      setCurrentCardIndex(0);
    }
    setIsFlipped(false);
    showToast("Flashcard deleted.");
  };

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
    <section id="flashcards-section" className="space-y-4 scroll-mt-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#0A1222] p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Flashcard?
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  This action removes Card {currentCardIndex + 1} from {activeDeck.title}.
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
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
        deckTitle={activeDeck.title}
        initialCard={modalMode === "edit" ? currentCard : null}
        onSave={handleSaveModal}
      />

      {/* Ingest Deck Modal: select material to generate 10 flashcards */}
      <IngestDeckModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        materials={materials}
        onGenerate={handleIngestFromModal}
      />

      {/* Create New Deck Modal: Title + 10x Questions & 10x Answers */}
      <CreateDeckModal
        isOpen={isCreateDeckModalOpen}
        onClose={() => setIsCreateDeckModalOpen(false)}
        onDeckCreated={handleDeckCreated}
      />

      {/* ===================================================================== */}
      {/* SECTION HEADER: Flashcards Studio                                     */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="border-l-[3px] border-blue-500 pl-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Flashcards Studio
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:border-blue-800/60 dark:text-blue-300">
              <Layers className="h-3 w-3" />
              {totalCards} Cards in Deck
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Active recall study cards with 1-sentence answers, zero fatigue, and instant concept editing.
          </p>
        </div>

        {/* Top Header Controls: 🧠 Click Ingest Deck, Create, and Full Studio */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenIngestModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:hover:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/70 text-xs font-semibold px-3 py-2 transition-all cursor-pointer shadow-2xs active:scale-98"
            title="Choose an ingested PDF, video URL, or slide deck to generate flashcards"
          >
            <span className="text-sm">🧠</span>
            <span>Click Ingest Deck</span>
          </button>

          {/* Arrow 1: + Create Cards (New 10-card deck with custom title and Q&A) */}
          <button
            type="button"
            onClick={handleOpenCreateDeckModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 transition-colors shadow-xs cursor-pointer active:scale-98"
            title="Create a brand new flashcard deck with 10 cards"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Cards</span>
          </button>

          <Link
            href={activeDeck ? `/flashcards?deck=${activeDeck.id}` : "/flashcards"}
            onClick={() => {
              if (typeof window !== "undefined" && activeDeck?.id) {
                localStorage.setItem("adaptflow_active_deck", activeDeck.id);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-white/[0.08] text-xs font-semibold px-3.5 py-2 transition-colors shadow-2xs cursor-pointer"
          >
            <span>Open Full Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FLASHCARDS MAIN GRID (7-col interactive card + 5-col deck browser)    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Flip Card Stage */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-sky-200/90 dark:border-blue-900/40 bg-[#F0F7FF] dark:bg-[#070D18] p-4 sm:p-5 shadow-xs transition-colors">
          {/* Deck Selection Tabs with Arrow Navigation Buttons & Wheel Scroll */}
          <div className="relative mb-2 flex items-center gap-1.5">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-300 dark:border-blue-800 bg-white dark:bg-[#0B1730] text-slate-700 dark:text-blue-200 shadow-xs hover:bg-sky-50 dark:hover:bg-[#122244] transition-all cursor-pointer z-10"
                title="Scroll deck tabs left"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div
              ref={tabsRef}
              onWheel={handleTabsWheel}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1.5 scroll-smooth custom-scrollbar"
            >
              {decks.map((deck) => {
                const isSelected = deck.id === activeDeckId;
                const isIngested = deck.id === "custom_materials" || deck.id.startsWith("deck_");
                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={(e) => {
                      handleSelectDeck(deck.id);
                      e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                    }}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0",
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white/80 hover:bg-white text-slate-700 border border-sky-200 dark:bg-[#0B1730] dark:border-blue-800/50 dark:text-blue-200 dark:hover:bg-[#122244]"
                    )}
                  >
                    {isIngested && <Sparkles className="h-3 w-3 text-cyan-400" />}
                    <span>{deck.subject}</span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-sky-300 dark:border-blue-800 bg-white dark:bg-[#0B1730] text-slate-700 dark:text-blue-200 shadow-xs hover:bg-sky-50 dark:hover:bg-[#122244] transition-all cursor-pointer z-10"
                title="Scroll deck tabs right"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 3D Flip Card Container or Empty State */}
          {totalCards === 0 || !currentCard ? (
            <div
              className="my-3 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky-300 dark:border-blue-800/60 p-8 text-center"
              style={{ minHeight: "260px" }}
            >
              <Layers className="h-8 w-8 text-sky-500 mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No flashcards in this deck
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs">
                Write a question and 1-sentence answer to start active recall practice.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Card</span>
              </button>
            </div>
          ) : (
            <div
              onClick={handleFlip}
              className="perspective-1000 my-3 w-full cursor-pointer select-none"
              style={{ minHeight: "260px" }}
            >
              <div
                className="transform-style-preserve-3d relative w-full min-h-[260px] rounded-2xl transition-transform duration-500 ease-out"
                style={{
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* ---------------- CARD FRONT ---------------- */}
                <div
                  className={cn(
                    "backface-hidden absolute inset-0 flex flex-col justify-between rounded-2xl p-5 sm:p-6 border-2 transition-all duration-200",
                    "bg-gradient-to-br from-[#EBF5FF] via-[#F4F9FF] to-[#E2EFFF] border-sky-300 hover:border-sky-400 text-slate-900 shadow-sky-500/10",
                    "dark:bg-gradient-to-br dark:from-[#0B1730] dark:via-[#0F1E3D] dark:to-[#081326] dark:border-blue-600/40 hover:dark:border-blue-500/70 dark:text-white"
                  )}
                >
                  {/* Front Top Row */}
                  <div className="flex items-center justify-between text-xs text-sky-800 dark:text-blue-300 font-mono">
                    <span className="font-semibold tracking-wider">
                      Card {currentCardIndex + 1} / {totalCards}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold font-sans",
                        getCardLevelBadge(currentCard.level)
                      )}
                    >
                      {currentCard.level}
                    </span>
                  </div>

                  {/* Front Question */}
                  <div className="my-auto py-3">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {currentCard.question}
                    </h3>
                  </div>

                  {/* Front Hint */}
                  <div className="text-center pt-1 border-t border-sky-200/60 dark:border-blue-800/40">
                    <span className="text-[11px] font-medium text-sky-700 dark:text-blue-300 hover:text-sky-900 inline-flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Click card to see answer
                    </span>
                  </div>
                </div>

                {/* ---------------- CARD BACK ---------------- */}
                <div
                  className={cn(
                    "backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-2xl p-5 sm:p-6 border-2 transition-all duration-200",
                    "bg-gradient-to-br from-[#EBF5FF] via-[#F0F7FF] to-[#E5F0FF] border-sky-300 hover:border-sky-400 text-slate-900 shadow-sky-500/10",
                    "dark:bg-gradient-to-br dark:from-[#091326] dark:via-[#0D1A33] dark:to-[#060D1A] dark:border-blue-600/40 hover:dark:border-blue-500/70 dark:text-white"
                  )}
                >
                  {/* Back Top Row */}
                  <div className="flex items-center justify-between text-xs text-sky-800 dark:text-blue-300 font-mono border-b border-sky-200/80 dark:border-blue-800/50 pb-2">
                    <span className="font-semibold tracking-wider">
                      Answer · {currentCardIndex + 1} / {totalCards}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold font-sans",
                        getCardLevelBadge(currentCard.level)
                      )}
                    >
                      {currentCard.level}
                    </span>
                  </div>

                  {/* Back Answer Body */}
                  <div className="my-auto py-3 space-y-3">
                    <p className="text-base sm:text-lg text-slate-900 dark:text-blue-50 font-medium leading-relaxed">
                      {currentCard.answer}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-blue-900 dark:text-blue-300">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {currentCard.citation.label}
                      </span>
                    </div>
                  </div>

                  {/* Back Hint */}
                  <div className="text-center pt-1 border-t border-sky-200/60 dark:border-blue-800/40">
                    <span className="text-[11px] font-medium text-sky-700 dark:text-blue-300 hover:text-sky-900 inline-flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Click card to see question
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar: Navigation + Working Edit & Delete Buttons */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-sky-200/70 dark:border-blue-900/40 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={totalCards === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 dark:bg-[#0B1730] dark:hover:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 transition-colors cursor-pointer disabled:opacity-40"
                title="Previous card"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleFlip}
                disabled={totalCards === 0}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-xs font-semibold text-sky-900 dark:bg-[#0B1730] dark:hover:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 transition-colors cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3 text-sky-600 dark:text-blue-400" />
                <span>{isFlipped ? "Show Question" : "Show Answer"}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={totalCards === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 dark:bg-[#0B1730] dark:hover:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 transition-colors cursor-pointer disabled:opacity-40"
                title="Next card"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Working Edit and Delete Option Buttons */}
              {currentCard && (
                <>
                  <div className="h-4 w-[1px] bg-sky-300 dark:bg-blue-800 mx-1 hidden sm:block" />

                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-xs font-semibold text-slate-700 dark:bg-[#0B1730] dark:hover:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 transition-colors cursor-pointer"
                    title="Edit card (question & answer)"
                  >
                    <Edit3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardToDelete(currentCard);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 border border-sky-300 hover:border-red-300 text-xs font-semibold text-slate-700 hover:text-red-600 dark:bg-[#0B1730] dark:hover:bg-red-950/40 dark:border-blue-800/60 dark:hover:border-red-800/60 dark:text-blue-200 dark:hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete this card"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>

            <Link
              href={activeDeck ? `/flashcards?deck=${activeDeck.id}` : "/flashcards"}
              onClick={() => {
                if (typeof window !== "undefined" && activeDeck?.id) {
                  localStorage.setItem("adaptflow_active_deck", activeDeck.id);
                }
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Practice full deck</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Right Column: Deck Overview & Knowledge Diagnostic Highlights */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          {/* Deck List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Course Decks ({decks.length})
              </span>
              {/* Arrow 2: + Add Card (Add single card to selected deck) */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                title={`Add a new flashcard to ${activeDeck.title}`}
              >
                <Plus className="h-3 w-3" />
                <span>Add Card</span>
              </button>
            </div>

            <div className="space-y-2">
              {decks.map((deck) => {
                const isSelected = deck.id === activeDeckId;
                return (
                  <div
                    key={deck.id}
                    onClick={() => handleSelectDeck(deck.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                      isSelected
                        ? "bg-sky-100/90 border-blue-400 shadow-xs dark:bg-blue-900/30 dark:border-blue-500"
                        : "bg-white hover:bg-sky-50/70 border-slate-200 dark:bg-[#121215] dark:border-white/[0.08] dark:hover:bg-zinc-900"
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {deck.title}
                        </h4>
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {deck.subject} · {deck.cards.length} cards
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof window !== "undefined") {
                          localStorage.setItem("adaptflow_active_deck", deck.id);
                        }
                        router.push(`/flashcards?deck=${deck.id}`);
                      }}
                      className={cn(
                        "shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer",
                        isSelected
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      )}
                    >
                      Study
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Methodology Card */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Diagnostic Knowledge Engine</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-blue-200/80 leading-relaxed">
              Every card scores your concept readiness across Level 1 (Foundational), Level 2 (Intermediate), and Level 3 (Advanced). Complete 10 cards in ~2 mins to unlock a comprehensive topic diagnostic.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
