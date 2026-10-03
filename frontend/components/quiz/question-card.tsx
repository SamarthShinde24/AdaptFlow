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
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
          <span>{question.type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}</span>
          <span>·</span>
          <span>Adaptive Evaluation</span>
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
            "rounded-xl border p-5 space-y-3 animate-in fade-in zoom-in-95 duration-300",
            answerResult.isCorrect
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
              : "border-destructive/40 bg-destructive/10 text-rose-100"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {answerResult.isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-emerald-300 text-sm">
                    Correct! Outstanding mastery.
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-400" />
                  <span className="font-bold text-rose-300 text-sm">
                    Incorrect. Let's review the rationale:
                  </span>
                </>
              )}
            </div>

            <span className="text-[11px] font-medium opacity-80">
              Immediate Evaluation
            </span>
          </div>

          {/* Explanation */}
          <p className="text-xs leading-relaxed opacity-95">
            {question.explanation}
          </p>

          {/* Grounded Source Citation */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs">
            <span className="font-semibold flex items-center gap-1 opacity-90 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified Source:
            </span>
            <span className="rounded bg-black/30 px-2 py-0.5 font-mono text-[11px] text-primary-200 border border-primary/20">
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
