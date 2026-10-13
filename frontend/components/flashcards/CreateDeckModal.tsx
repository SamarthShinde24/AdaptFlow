"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  AlertCircle,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  List,
  CreditCard,
  Wand2,
} from "lucide-react";
import { FlashcardDeck, KnowledgeLevel } from "@/lib/flashcards-data";
import { countSentences, createCustomManualDeck } from "@/lib/flashcard-store";
import { cn } from "@/lib/utils";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckCreated: (deck: FlashcardDeck) => void;
}

interface CardDraft {
  question: string;
  answer: string;
  level: KnowledgeLevel;
}

const DEFAULT_LEVELS: KnowledgeLevel[] = [
  "Level 1 · Foundational",
  "Level 1 · Foundational",
  "Level 1 · Foundational",
  "Level 2 · Intermediate",
  "Level 2 · Intermediate",
  "Level 2 · Intermediate",
  "Level 2 · Intermediate",
  "Level 3 · Advanced",
  "Level 3 · Advanced",
  "Level 3 · Advanced",
];

const SAMPLE_TEMPLATES = [
  {
    title: "Neuroscience Essentials",
    subject: "Biology",
    cards: [
      { question: "What is the primary role of a neuron in the human nervous system?", answer: "Neurons transmit electrical and chemical signals throughout the brain and body.", level: "Level 1 · Foundational" as KnowledgeLevel },
      { question: "What is an action potential?", answer: "A rapid, temporary electrical impulse that travels down an axon to communicate signals.", level: "Level 1 · Foundational" as KnowledgeLevel },
      { question: "What covers the axon to accelerate neural impulse transmission?", answer: "The myelin sheath insulates the axon and drastically increases transmission speed.", level: "Level 1 · Foundational" as KnowledgeLevel },
      { question: "What is a synaptic cleft?", answer: "The microscopic gap across which neurotransmitters diffuse between adjacent neurons.", level: "Level 2 · Intermediate" as KnowledgeLevel },
      { question: "How does dopamine function as a neurotransmitter?", answer: "Dopamine regulates motivation, motor control, and reward reinforcement pathways.", level: "Level 2 · Intermediate" as KnowledgeLevel },
      { question: "What is neuroplasticity?", answer: "The brain's lifelong ability to reorganize synaptic connections in response to learning.", level: "Level 2 · Intermediate" as KnowledgeLevel },
      { question: "What role does the hippocampus play in memory formation?", answer: "The hippocampus is essential for consolidating short-term memory into long-term storage.", level: "Level 2 · Intermediate" as KnowledgeLevel },
      { question: "How do inhibitory neurotransmitters affect postsynaptic neurons?", answer: "They hyperpolarize the postsynaptic membrane to reduce the probability of firing.", level: "Level 3 · Advanced" as KnowledgeLevel },
      { question: "What is long-term potentiation in synaptic plasticity?", answer: "A persistent strengthening of synapses based on recent patterns of repeated activity.", level: "Level 3 · Advanced" as KnowledgeLevel },
      { question: "Why is the blood-brain barrier vital for central nervous system homeostasis?", answer: "It selectively filters blood to protect neural tissue from circulating toxins and pathogens.", level: "Level 3 · Advanced" as KnowledgeLevel },
    ],
  },
];

export function CreateDeckModal({
  isOpen,
  onClose,
  onDeckCreated,
}: CreateDeckModalProps) {
  const [deckTitle, setDeckTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [cards, setCards] = useState<CardDraft[]>(() =>
    DEFAULT_LEVELS.map((level) => ({
      question: "",
      answer: "",
      level,
    }))
  );
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setDeckTitle("");
      setSubject("");
      setCards(
        DEFAULT_LEVELS.map((level) => ({
          question: "",
          answer: "",
          level,
        }))
      );
      setActiveCardIdx(0);
      setViewMode("card");
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Validation helpers
  const isCardComplete = (card: CardDraft) => {
    const qCount = countSentences(card.question);
    const aCount = countSentences(card.answer);
    return qCount === 1 && aCount === 1;
  };

  const completedCount = cards.filter(isCardComplete).length;
  const isAllComplete = completedCount === 10 && deckTitle.trim().length > 0;

  const handleUpdateCard = (idx: number, field: "question" | "answer" | "level", val: string) => {
    setCards((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: val,
      };
      return next;
    });
    if (errorMessage) setErrorMessage(null);
  };

  const handleApplySample = () => {
    const sample = SAMPLE_TEMPLATES[0];
    setDeckTitle(sample.title);
    setSubject(sample.subject);
    setCards(sample.cards);
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    setDeckTitle("");
    setSubject("");
    setCards(
      DEFAULT_LEVELS.map((level) => ({
        question: "",
        answer: "",
        level,
      }))
    );
    setErrorMessage(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!deckTitle.trim()) {
      setErrorMessage("Please enter a title for your new flashcard deck.");
      return;
    }

    // Find first incomplete card
    const firstIncompleteIdx = cards.findIndex((c) => !isCardComplete(c));
    if (firstIncompleteIdx !== -1) {
      setActiveCardIdx(firstIncompleteIdx);
      setViewMode("card");
      const c = cards[firstIncompleteIdx];
      const qCount = countSentences(c.question);
      const aCount = countSentences(c.answer);

      if (qCount === 0 || aCount === 0) {
        setErrorMessage(
          `Card ${firstIncompleteIdx + 1} is incomplete. Both question and answer are required (1 sentence max each).`
        );
      } else {
        setErrorMessage(
          `Card ${firstIncompleteIdx + 1} exceeds 1 sentence limit (Question: ${qCount}, Answer: ${aCount}). Please write max 1 sentence.`
        );
      }
      return;
    }

    // All 10 cards valid, persist deck
    const { newDeck } = createCustomManualDeck(
      deckTitle.trim(),
      subject.trim() || "Course Concept",
      cards
    );

    onDeckCreated(newDeck);
    onClose();
  };

  const currentCard = cards[activeCardIdx];
  const qSentences = countSentences(currentCard.question);
  const aSentences = countSentences(currentCard.answer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-deck-modal-title"
        className="w-full max-w-2xl rounded-2xl border border-sky-200 dark:border-blue-900/60 bg-white dark:bg-[#0A1222] p-4 sm:p-6 shadow-2xl transition-all my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="create-deck-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
              >
                Create Flashcards Deck (10 Cards)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Type your deck title and 10 active recall question-and-answer cards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 py-3">
          {/* Deck Metadata: Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Deck Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={deckTitle}
                onChange={(e) => {
                  setDeckTitle(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g., Cellular Respiration & ATP Synthesis"
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Biology"
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 10-Card Selector Bar with completion indicators */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-zinc-900/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  Cards Progress:
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full border",
                    completedCount === 10
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                  )}
                >
                  {completedCount} / 10 Completed
                </span>
              </div>

              {/* View toggle & sample filler */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleApplySample}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C63FF] hover:underline cursor-pointer px-2 py-1"
                  title="Prefill sample 10 cards"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>Fill Sample</span>
                </button>
                <span className="text-slate-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "card" ? "list" : "card")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                >
                  {viewMode === "card" ? (
                    <>
                      <List className="h-3 w-3" />
                      <span>List All 10</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3 w-3" />
                      <span>Card View</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 10 Card Pills */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {cards.map((c, idx) => {
                const complete = isCardComplete(c);
                const isActive = activeCardIdx === idx && viewMode === "card";
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveCardIdx(idx);
                      setViewMode("card");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-bold transition-all cursor-pointer relative",
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40"
                        : complete
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                        : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                    )}
                  >
                    <span>#{idx + 1}</span>
                    <span className="text-[9px] font-normal mt-0.5">
                      {complete ? (
                        <Check className={cn("h-3 w-3 inline", isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400")} />
                      ) : (
                        <span className="text-slate-400">Q&A</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW MODE: Single Card Tab */}
          {viewMode === "card" ? (
            <div className="rounded-xl border border-sky-100 dark:border-blue-900/40 bg-sky-50/40 dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Card {activeCardIdx + 1} of 10
                  </span>
                  <select
                    value={currentCard.level}
                    onChange={(e) =>
                      handleUpdateCard(activeCardIdx, "level", e.target.value)
                    }
                    className="text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-slate-700 dark:text-zinc-300"
                  >
                    <option value="Level 1 · Foundational">Level 1 · Foundational</option>
                    <option value="Level 2 · Intermediate">Level 2 · Intermediate</option>
                    <option value="Level 3 · Advanced">Level 3 · Advanced</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activeCardIdx === 0}
                    onClick={() => setActiveCardIdx((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded-md text-slate-500 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Previous Card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={activeCardIdx === 9}
                    onClick={() => setActiveCardIdx((prev) => Math.min(9, prev + 1))}
                    className="p-1 rounded-md text-slate-500 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Next Card"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Question Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      qSentences === 1
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        : qSentences === 0
                        ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                    )}
                  >
                    {qSentences === 1
                      ? "1 sentence (valid)"
                      : qSentences === 0
                      ? "Max 1 sentence"
                      : `${qSentences} sentences (reduce to 1)`}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={currentCard.question}
                  onChange={(e) =>
                    handleUpdateCard(activeCardIdx, "question", e.target.value)
                  }
                  placeholder="e.g., What is the primary function of ATP synthase during cellular respiration?"
                  className={cn(
                    "w-full rounded-xl border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2",
                    qSentences > 1
                      ? "border-amber-400 focus:ring-amber-500"
                      : "border-slate-300 dark:border-zinc-700 focus:ring-blue-500"
                  )}
                />
              </div>

              {/* Answer Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Answer <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      aSentences === 1
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        : aSentences === 0
                        ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400"
                        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                    )}
                  >
                    {aSentences === 1
                      ? "1 sentence (valid)"
                      : aSentences === 0
                      ? "Max 1 sentence"
                      : `${aSentences} sentences (reduce to 1)`}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={currentCard.answer}
                  onChange={(e) =>
                    handleUpdateCard(activeCardIdx, "answer", e.target.value)
                  }
                  placeholder="e.g., It utilizes proton gradients to synthesize ATP from ADP and inorganic phosphate."
                  className={cn(
                    "w-full rounded-xl border bg-white dark:bg-zinc-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2",
                    aSentences > 1
                      ? "border-amber-400 focus:ring-amber-500"
                      : "border-slate-300 dark:border-zinc-700 focus:ring-blue-500"
                  )}
                />
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                  Keep answers concise and punchy for fast active recall. Maximum 1 sentence.
                </p>
              </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={activeCardIdx === 0}
                  onClick={() => setActiveCardIdx((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                >
                  Back
                </button>
                {activeCardIdx < 9 ? (
                  <button
                    type="button"
                    onClick={() => setActiveCardIdx((prev) => Math.min(9, prev + 1))}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Next Card (#{activeCardIdx + 2})
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    Card 10 of 10 reached
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* VIEW MODE: List of all 10 cards */
            <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
              {cards.map((card, idx) => {
                const qCount = countSentences(card.question);
                const aCount = countSentences(card.answer);
                const complete = qCount === 1 && aCount === 1;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-xl border transition-all",
                      complete
                        ? "bg-white dark:bg-zinc-900 border-emerald-300/60 dark:border-emerald-800/60"
                        : "bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          #{idx + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            complete
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400"
                          )}
                        >
                          {complete ? "Ready" : "Incomplete"}
                        </span>
                      </div>
                      <select
                        value={card.level}
                        onChange={(e) =>
                          handleUpdateCard(idx, "level", e.target.value)
                        }
                        className="text-[11px] rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-0.5 text-slate-700 dark:text-zinc-300"
                      >
                        <option value="Level 1 · Foundational">Foundational</option>
                        <option value="Level 2 · Intermediate">Intermediate</option>
                        <option value="Level 3 · Advanced">Advanced</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={card.question}
                        onChange={(e) =>
                          handleUpdateCard(idx, "question", e.target.value)
                        }
                        placeholder={`Question #${idx + 1} (max 1 sentence)`}
                        className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={card.answer}
                        onChange={(e) =>
                          handleUpdateCard(idx, "answer", e.target.value)
                        }
                        placeholder={`Answer #${idx + 1} (max 1 sentence)`}
                        className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5",
                isAllComplete
                  ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400/30"
                  : "bg-blue-600 hover:bg-blue-700 opacity-90"
              )}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Create Deck (10 Cards)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
