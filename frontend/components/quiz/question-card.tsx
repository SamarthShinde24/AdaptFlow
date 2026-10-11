"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  Send,
} from "lucide-react";
import { QuizQuestion, QuizAnswerRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: QuizQuestion;
  onAnswerSubmitted: (record: QuizAnswerRecord) => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

export function QuestionCard({
  question,
  onAnswerSubmitted,
  onNextQuestion,
  isLastQuestion,
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState<QuizAnswerRecord | null>(null);

  const handleSubmit = (optionIndex?: number) => {
    if (submitted) return;

    let isCorrect = false;
    let chosenOption = optionIndex ?? selectedOption;

    if (question.type === "multiple_choice") {
      if (chosenOption === null || chosenOption === undefined) return;
      isCorrect = chosenOption === Number(question.correct_answer);
    } else {
      // Short answer evaluation
      if (!shortAnswerInput.trim()) return;
      const cleanUser = shortAnswerInput.trim().toLowerCase();
      const cleanCorrect = String(question.correct_answer).trim().toLowerCase();
      isCorrect =
        cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    }

    const record: QuizAnswerRecord = {
      questionId: question.id,
      selectedOptionIndex: chosenOption ?? undefined,
      shortAnswerText: shortAnswerInput,
      isCorrect,
      explanation: question.explanation,
      sourceCitation: question.source_citation,
    };

    setAnswerResult(record);
    setSubmitted(true);
    onAnswerSubmitted(record);
  };

  const getOptionLetter = (idx: number) => ["A", "B", "C", "D"][idx] || String(idx + 1);

  return (
    <div className="rounded-2xl border border-[#262642] bg-[#141426] p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      {/* Question Header */}
      <div>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold mb-3">
          <div className="flex items-center gap-2 text-[#8B85FF] uppercase tracking-wider text-[11px] font-mono">
            <span>{question.type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}</span>
            <span className="text-slate-600">·</span>
            <span>Adaptive Diagnostic</span>
          </div>

          {/* Current Difficulty Badge */}
          <div className="flex items-center gap-1.5">
            {question.difficulty === "easy" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Easy
              </span>
            )}
            {question.difficulty === "medium" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Medium
              </span>
            )}
            {(question.difficulty === "hard" || (question.difficulty as any) === "advanced") && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Hard
              </span>
            )}
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Multiple Choice Options */}
      {question.type === "multiple_choice" && question.options && (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = Number(question.correct_answer) === index;

            let borderStyle = "border-[#262642] bg-[#141426] hover:border-[#6C63FF]/50 hover:bg-[#1C1C36] text-slate-200";
            if (submitted) {
              if (isCorrectOption) {
                borderStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-100 shadow-xs";
              } else if (isSelected && !isCorrectOption) {
                borderStyle = "border-rose-500 bg-rose-500/15 text-rose-100";
              } else {
                borderStyle = "border-[#262642] bg-[#141426]/50 opacity-40 text-slate-400";
              }
            } else if (isSelected) {
              borderStyle = "border-[#6C63FF] bg-[#1E1B4B] ring-2 ring-[#6C63FF]/30 text-white shadow-xs";
            }

            return (
              <button
                key={index}
                type="button"
                disabled={submitted}
                onClick={() => {
                  setSelectedOption(index);
                  handleSubmit(index);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-4 sm:py-4.5 sm:px-5 min-h-[52px] text-left text-sm transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]",
                  borderStyle
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200",
                      submitted && isCorrectOption
                        ? "bg-emerald-500 text-white"
                        : submitted && isSelected && !isCorrectOption
                        ? "bg-rose-500 text-white"
                        : isSelected
                        ? "bg-[#6C63FF] text-white"
                        : "bg-[#1C1C36] text-slate-300 border border-[#262642]"
                    )}
                  >
                    {getOptionLetter(index)}
                  </div>
                  <span className="font-medium text-slate-100 leading-relaxed">{option}</span>
                </div>

                {submitted && isCorrectOption && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 ml-2" />
                )}
                {submitted && isSelected && !isCorrectOption && (
                  <XCircle className="h-5 w-5 text-rose-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Short Answer Input Field */}
      {question.type === "short_answer" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              value={shortAnswerInput}
              onChange={(e) => setShortAnswerInput(e.target.value)}
              disabled={submitted}
              placeholder="Type your answer based on course materials..."
              className="text-sm h-12 bg-[#1A1A35] border-[#262642] text-white placeholder-slate-500 focus:border-[#6C63FF]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {!submitted && (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!shortAnswerInput.trim()}
                className="h-12 px-6 gap-2 bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
              >
                <span>Check My Answer</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Immediate Feedback Card */}
      {submitted && answerResult && (
        <div
          className={cn(
            "rounded-xl border p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 shadow-sm",
            answerResult.isCorrect
              ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
              : "border-rose-500/40 bg-rose-950/30 text-rose-100"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {answerResult.isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300 text-sm tracking-tight">
                    Correct! Mastered concept.
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-300 text-sm tracking-tight">
                    Incorrect. Conceptual review:
                  </span>
                </>
              )}
            </div>

            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-current/20 opacity-80">
              Diagnostic Rationale
            </span>
          </div>

          {/* Explanation Box */}
          <div
            className={cn(
              "rounded-lg p-4 text-xs sm:text-sm leading-relaxed border shadow-xs",
              answerResult.isCorrect
                ? "bg-[#141426] border-emerald-500/20 text-slate-200"
                : "bg-[#141426] border-rose-500/20 text-slate-200"
            )}
          >
            <p className="font-medium leading-relaxed">
              {question.explanation}
            </p>
          </div>

          {/* Grounded Source Citation */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-semibold flex items-center gap-1.5 text-[11px] text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-[#6C63FF]" /> Verified Course Source:
            </span>
            <span className="rounded-full bg-[#1C1C36] px-3 py-0.5 font-mono text-[11px] font-semibold text-[#8B85FF] border border-[#262642] shadow-xs">
              {question.source_citation}
            </span>
          </div>
        </div>
      )}

      {/* Next Question Navigation */}
      {submitted && (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={onNextQuestion}
            className="gap-2 text-xs h-11 px-6 bg-[#6C63FF] hover:bg-[#5b52e0] text-white cursor-pointer transition-all duration-200 shadow-sm"
          >
            <span>{isLastQuestion ? "View Performance Summary" : "Next Question"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
