"use client";

import React, { useState } from "react";
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
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_DECKS, FlashcardDeck, Flashcard, KnowledgeLevel } from "@/lib/flashcards-data";

export function DashboardFlashcards() {
  const router = useRouter();
  const [activeDeckId, setActiveDeckId] = useState<string>("biology");
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const activeDeck: FlashcardDeck =
    ALL_DECKS.find((d) => d.id === activeDeckId) || ALL_DECKS[0];

  const currentCard: Flashcard =
    activeDeck.cards[currentCardIndex] || activeDeck.cards[0];

  const totalCards = activeDeck.cards.length;

  const handleSelectDeck = (deckId: string) => {
    setActiveDeckId(deckId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + totalCards) % totalCards);
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
    <section id="flashcards-section" className="space-y-4">
      {/* ===================================================================== */}
      {/* SECTION HEADER                                                        */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="border-l-[3px] border-blue-500 pl-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Concept Flashcards
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:border-blue-800/60 dark:text-blue-300">
              <Layers className="h-3 w-3" />
              10 Cards / Deck
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Punchy active recall flashcards with minimum words, zero fatigue, and knowledge diagnostics.
          </p>
        </div>

        <Link
          href="/flashcards"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 transition-colors shadow-xs cursor-pointer w-fit"
        >
          <span>Open Full Flashcards Studio</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ===================================================================== */}
      {/* FLASHCARDS MAIN GRID (7-col interactive card + 5-col deck browser)    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Flip Card Stage */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-sky-200/90 dark:border-blue-900/40 bg-[#F0F7FF] dark:bg-[#070D18] p-4 sm:p-5 shadow-xs transition-colors">
          {/* Deck Selection Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {ALL_DECKS.map((deck) => {
              const isSelected = deck.id === activeDeckId;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => handleSelectDeck(deck.id)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white/80 hover:bg-white text-slate-700 border border-sky-200 dark:bg-[#0B1730] dark:border-blue-800/50 dark:text-blue-200 dark:hover:bg-[#122244]"
                  )}
                >
                  {deck.subject}
                </button>
              );
            })}
          </div>

          {/* 3D Flip Card Container */}
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
                <div className="my-auto py-2 space-y-2">
                  <p className="text-sm sm:text-base text-slate-900 dark:text-blue-50 font-medium leading-relaxed">
                    {currentCard.answer}
                  </p>

                  {currentCard.keyTakeaway && (
                    <div className="rounded-lg bg-sky-100 border border-sky-300/80 text-sky-950 dark:bg-blue-950/70 dark:border-blue-700/60 dark:text-blue-200 p-2 text-xs font-sans">
                      <span className="font-bold text-sky-900 dark:text-blue-300 mr-1">Key Insight:</span>
                      <span>{currentCard.keyTakeaway}</span>
                    </div>
                  )}

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

          {/* Quick Controls Bar */}
          <div className="mt-2 flex items-center justify-between border-t border-sky-200/70 dark:border-blue-900/40 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 dark:bg-[#0B1730] dark:hover:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 transition-colors cursor-pointer"
                title="Previous card"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleFlip}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-xs font-semibold text-sky-900 dark:bg-[#0B1730] dark:hover:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 text-sky-600 dark:text-blue-400" />
                <span>{isFlipped ? "Show Question" : "Show Answer"}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 dark:bg-[#0B1730] dark:hover:bg-[#122244] dark:border-blue-800/60 dark:text-blue-200 transition-colors cursor-pointer"
                title="Next card"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Link
              href="/flashcards"
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verified Course Decks ({ALL_DECKS.length})
            </span>

            <div className="space-y-2">
              {ALL_DECKS.map((deck) => {
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
                        {deck.subject} · {deck.cards.length} bite-sized cards
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/flashcards");
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
