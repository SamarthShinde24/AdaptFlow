"use client";

import React from "react";
import Link from "next/link";
import {
  Trophy,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { QuizQuestion, QuizAnswerRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreSummaryCardProps {
  questions: QuizQuestion[];
  answers: Record<string, QuizAnswerRecord>;
  onRestart: () => void;
  onChangeMode?: () => void;
}

export function ScoreSummaryCard({
  questions,
  answers,
  onRestart,
  onChangeMode,
}: ScoreSummaryCardProps) {
  const total = questions.length;
  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const percentage = Math.round((correctCount / total) * 100);

  const getMasteryLevel = () => {
    if (percentage >= 80) {
      return {
        label: "Mastery Achieved",
        badge: "success" as const,
        description:
          "You demonstrated comprehensive understanding of the multimodal course materials.",
      };
    }
    if (percentage >= 60) {
      return {
        label: "Proficient · Needs Fine-Tuning",
        badge: "warning" as const,
        description:
          "Good grasp of key formulas, but some slide concepts and lecture timestamps require review.",
      };
    }
    return {
      label: "Foundational Review Needed",
      badge: "destructive" as const,
      description:
        "Consider asking the AdaptFlow AI Tutor to clarify core concepts before retaking.",
    };
  };

  const mastery = getMasteryLevel();

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl backdrop-blur-xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Trophy Banner */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent shadow-glow text-white">
          <Trophy className="h-8 w-8 text-amber-300 animate-bounce" />
        </div>

        <Badge variant={mastery.badge} className="px-3 py-1 text-xs">
          {mastery.label}
        </Badge>

        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Score: {correctCount} / {total} ({percentage}%)
        </h2>

        <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
          {mastery.description}
        </p>
      </div>

      {/* Concept Breakdown & Recommendations */}
      <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-primary" /> Adaptive Performance Breakdown
        </h4>

        <div className="space-y-2">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isCorrect = ans?.isCorrect ?? false;

            return (
              <div
                key={q.id}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-card/60 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-semibold text-foreground">
                      Q{idx + 1}:
                    </span>{" "}
                    <span className="text-muted-foreground">{q.concept}</span>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-primary-300 shrink-0 ml-2">
                  {q.source_citation ? q.source_citation.replace(/[\[\]]/g, "").split("|")[0].trim() : `Slide ${idx + 1}`}
                </span>

              </div>
            );
          })}
        </div>
      </div>

      {/* Question Review List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Detailed Question Review
        </h4>

        <div className="space-y-3">
          {questions.map((q, index) => {
            const ans = answers[q.id];
            const isCorrect = ans?.isCorrect ?? false;

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border p-4 text-xs space-y-2",
                  isCorrect
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-destructive/20 bg-destructive/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {index + 1}. {q.question}
                  </p>
                  <Badge variant={isCorrect ? "success" : "destructive"}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  <strong>Explanation:</strong> {q.explanation}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-primary-300 font-mono">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{q.source_citation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onRestart}
            className="gap-2 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retake Assessment
          </Button>

          {onChangeMode && (
            <Button
              variant="outline"
              onClick={onChangeMode}
              className="gap-2 text-xs"
            >
              Choose Another Quiz Mode
            </Button>
          )}
        </div>

        <Link href="/chat">
          <Button className="gap-2 text-xs shadow-glow">
            <MessageSquare className="h-3.5 w-3.5" />
            Discuss Missed Concepts with AI Tutor
          </Button>
        </Link>
      </div>
    </div>
  );
}
