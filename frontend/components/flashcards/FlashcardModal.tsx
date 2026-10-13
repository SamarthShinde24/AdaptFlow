"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Check, AlertCircle } from "lucide-react";
import { Flashcard, KnowledgeLevel } from "@/lib/flashcards-data";
import { countSentences } from "@/lib/flashcard-store";
import { cn } from "@/lib/utils";

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  deckTitle: string;
  initialCard?: Flashcard | null;
  onSave: (data: {
    question: string;
    answer: string;
    level: KnowledgeLevel;
    keyTakeaway?: string;
  }) => void;
}

export function FlashcardModal({
  isOpen,
  onClose,
  mode,
  deckTitle,
  initialCard,
  onSave,
}: FlashcardModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [level, setLevel] = useState<KnowledgeLevel>("Level 1 · Foundational");
  const [keyTakeaway, setKeyTakeaway] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialCard) {
        setQuestion(initialCard.question);
        setAnswer(initialCard.answer);
        setLevel(initialCard.level);
        setKeyTakeaway(initialCard.keyTakeaway || "");
      } else {
        setQuestion("");
        setAnswer("");
        setLevel("Level 1 · Foundational");
        setKeyTakeaway("");
      }
    }
  }, [isOpen, mode, initialCard]);

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

  const qSentenceCount = countSentences(question);
  const aSentenceCount = countSentences(answer);

  const isQuestionValid = qSentenceCount === 1;
  const isAnswerValid = aSentenceCount === 1;

  const canSave = isQuestionValid && isAnswerValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      question: question.trim(),
      answer: answer.trim(),
      level,
      keyTakeaway: keyTakeaway.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flashcard-modal-title"
        className="w-full max-w-lg rounded-2xl border border-sky-200 dark:border-blue-900/60 bg-white dark:bg-[#0A1222] p-5 sm:p-6 shadow-2xl transition-all"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-blue-900/40">
          <div>
            <h3
              id="flashcard-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
            >
              {mode === "create" ? "Create New Flashcard" : "Edit Flashcard"}
            </h3>
            <p className="text-xs text-sky-700 dark:text-blue-300 font-medium mt-0.5">
              Deck: {deckTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Question Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="fc-question"
                className="text-xs font-bold text-slate-700 dark:text-zinc-200"
              >
                Question
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                {qSentenceCount === 0 && (
                  <span className="text-slate-400 dark:text-zinc-500 font-medium">
                    Max 1 sentence
                  </span>
                )}
                {qSentenceCount === 1 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    1 sentence
                  </span>
                )}
                {qSentenceCount > 1 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    {qSentenceCount} sentences (limit 1)
                  </span>
                )}
              </div>
            </div>
            <textarea
              id="fc-question"
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the fundamental unit of inheritance in molecular genetics?"
              className={cn(
                "w-full rounded-xl border p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#070D18] focus:outline-hidden transition-all resize-none",
                qSentenceCount > 1
                  ? "border-amber-400 dark:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  : "border-sky-200 dark:border-blue-900 focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Keep question to exactly 1 sentence for active recall speed.
            </p>
          </div>

          {/* Answer Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="fc-answer"
                className="text-xs font-bold text-slate-700 dark:text-zinc-200"
              >
                Answer
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                {aSentenceCount === 0 && (
                  <span className="text-slate-400 dark:text-zinc-500 font-medium">
                    Max 1 sentence
                  </span>
                )}
                {aSentenceCount === 1 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    1 sentence
                  </span>
                )}
                {aSentenceCount > 1 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    {aSentenceCount} sentences (limit 1)
                  </span>
                )}
              </div>
            </div>
            <textarea
              id="fc-answer"
              rows={2}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. Genes are DNA sequences that encode functional RNA or protein molecules."
              className={cn(
                "w-full rounded-xl border p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#070D18] focus:outline-hidden transition-all resize-none",
                aSentenceCount > 1
                  ? "border-amber-400 dark:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  : "border-sky-200 dark:border-blue-900 focus:ring-2 focus:ring-blue-500"
              )}
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Answers must be at most 1 sentence for bite-sized learning with zero fatigue.
            </p>
          </div>

          {/* Knowledge Level Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1">
              Knowledge Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  "Level 1 · Foundational",
                  "Level 2 · Intermediate",
                  "Level 3 · Advanced",
                ] as KnowledgeLevel[]
              ).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-[11px] font-semibold border transition-all cursor-pointer text-center",
                    level === lvl
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#0B1730] dark:border-blue-900/60 dark:text-blue-200 dark:hover:bg-[#122244]"
                  )}
                >
                  {lvl.split("·")[1]?.trim() || lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Key Insight / Takeaway */}
          <div>
            <label
              htmlFor="fc-takeaway"
              className="block text-xs font-bold text-slate-700 dark:text-zinc-200 mb-1"
            >
              Key Insight (Optional)
            </label>
            <input
              id="fc-takeaway"
              type="text"
              value={keyTakeaway}
              onChange={(e) => setKeyTakeaway(e.target.value)}
              placeholder="e.g. Passing threshold is 33% independently."
              className="w-full rounded-xl border border-sky-200 dark:border-blue-900 p-2 text-xs text-slate-900 dark:text-white bg-slate-50/50 dark:bg-[#070D18] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-sky-100 dark:border-blue-900/40 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer",
                canSave
                  ? "bg-blue-600 hover:bg-blue-700 active:scale-95"
                  : "bg-slate-300 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 cursor-not-allowed opacity-60"
              )}
            >
              {mode === "create" ? "Save Flashcard" : "Update Flashcard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
