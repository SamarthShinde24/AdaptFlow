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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Question Header */}
      <div>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold mb-2">
          <div className="flex items-center gap-2 text-primary uppercase tracking-wider">
            <span>{question.type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}</span>
            <span>·</span>
            <span>Adaptive Evaluation</span>
          </div>

          {/* Current Difficulty Badge */}
          <div className="flex items-center gap-1.5">
            {question.difficulty === "easy" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Easy
              </span>
            )}
            {question.difficulty === "medium" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Medium
              </span>
            )}
            {(question.difficulty === "hard" || (question.difficulty as any) === "advanced") && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Hard
              </span>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Multiple Choice Options */}
      {question.type === "multiple_choice" && question.options && (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = Number(question.correct_answer) === index;

            let borderStyle = "border-border hover:border-primary/50 hover:bg-secondary/60";
            if (submitted) {
              if (isCorrectOption) {
                borderStyle = "border-emerald-500/70 bg-emerald-500/10 text-emerald-200 shadow-glow-emerald";
              } else if (isSelected && !isCorrectOption) {
                borderStyle = "border-destructive/70 bg-destructive/10 text-rose-200";
              } else {
                borderStyle = "border-border opacity-50";
              }
            } else if (isSelected) {
              borderStyle = "border-primary bg-primary/10 shadow-sm";
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
                  "flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition-all duration-200",
                  borderStyle
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                      submitted && isCorrectOption
                        ? "bg-emerald-500 text-white"
                        : submitted && isSelected && !isCorrectOption
                        ? "bg-destructive text-white"
                        : isSelected
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {getOptionLetter(index)}
                  </div>
                  <span className="font-medium text-foreground">{option}</span>
                </div>

                {submitted && isCorrectOption && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                )}
                {submitted && isSelected && !isCorrectOption && (
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Short Answer Input Field */}
      {question.type === "short_answer" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={shortAnswerInput}
              onChange={(e) => setShortAnswerInput(e.target.value)}
              disabled={submitted}
              placeholder="Type your answer based on course materials..."
              className="text-sm h-11"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {!submitted && (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!shortAnswerInput.trim()}
                className="h-11 px-4 gap-1.5"
              >
                <span>Submit</span>
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
            "rounded-xl border p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-300 shadow-sm",
            answerResult.isCorrect
              ? "border-emerald-500/40 bg-emerald-50/90 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-100"
              : "border-rose-400/50 bg-rose-50/90 text-rose-950 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-100"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {answerResult.isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm tracking-tight">
                    Correct! Outstanding mastery.
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-900 dark:text-rose-300 text-sm tracking-tight">
                    Incorrect. Let's review the rationale:
                  </span>
                </>
              )}
            </div>

            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-current/20 opacity-80">
              Diagnostic Rationale
            </span>
          </div>

          {/* Explanation Box with Guaranteed High Contrast */}
          <div
            className={cn(
              "rounded-lg p-4 text-xs sm:text-sm leading-relaxed border shadow-xs",
              answerResult.isCorrect
                ? "bg-white/95 dark:bg-black/40 border-emerald-500/20 text-slate-900 dark:text-slate-100"
                : "bg-white/95 dark:bg-black/40 border-rose-400/25 text-slate-900 dark:text-slate-100"
            )}
          >
            <p className="font-medium text-slate-900 dark:text-slate-100 leading-normal">
              {question.explanation}
            </p>
          </div>

          {/* Grounded Source Citation */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-semibold flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified Source:
            </span>
            <span className="rounded-md bg-secondary/80 dark:bg-secondary/40 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary border border-primary/25 shadow-xs">
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
            className="gap-2 text-xs h-10 px-5 shadow-glow"
          >
            <span>{isLastQuestion ? "View Final Summary" : "Next Question"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
