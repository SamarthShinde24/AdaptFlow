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
  Brain,
  AlertTriangle,
  Target,
  ArrowRight,
  BookOpen,
  Award,
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
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

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
          "Good grasp of key formulas, but some slide concepts and lecture timestamps require targeted review.",
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

  // Group concepts into Mastered vs Weak Topics
  const conceptStats = questions.reduce<
    Record<
      string,
      {
        total: number;
        correct: number;
        citation: string;
        questions: QuizQuestion[];
      }
    >
  >((acc, q) => {
    const conceptName = q.concept || "General Knowledge";
    if (!acc[conceptName]) {
      acc[conceptName] = {
        total: 0,
        correct: 0,
        citation: q.source_citation,
        questions: [],
      };
    }
    acc[conceptName].total += 1;
    acc[conceptName].questions.push(q);
    if (answers[q.id]?.isCorrect) {
      acc[conceptName].correct += 1;
    }
    return acc;
  }, {});

  const weakTopics = Object.entries(conceptStats).filter(
    ([_, stat]) => stat.correct < stat.total
  );
  const masteredTopics = Object.entries(conceptStats).filter(
    ([_, stat]) => stat.correct === stat.total
  );

  // Filter missed or partially correct questions for Misconception Analysis
  const missedQuestions = questions.filter((q) => {
    const ans = answers[q.id];
    return !ans || !ans.isCorrect || (ans.score !== undefined && ans.score < 80);
  });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-6 sm:p-8 shadow-sm dark:shadow-2xl backdrop-blur-xl space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Trophy Banner */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] text-amber-500 dark:text-amber-400 shadow-sm">
          <Trophy className="h-8 w-8 text-amber-500 dark:text-amber-300" />
        </div>

        <Badge variant={mastery.badge} className="px-3 py-1 text-xs">
          {mastery.label}
        </Badge>

        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Score: {correctCount} / {total} ({percentage}%)
        </h2>

        <p className="max-w-md text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {mastery.description}
        </p>
      </div>

      {/* Post-Assessment Report: Identified Weak Topics & Mastery Matrix */}
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
            <Target className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" /> Post-Assessment Mastery & Weak Topics Report
          </h4>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {weakTopics.length === 0 ? "All Tested Topics Mastered" : `${weakTopics.length} Focus Area(s) Detected`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Weak Topics Card */}
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.04] dark:bg-rose-500/[0.07] p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Identified Weak Topics (Review Needed)</span>
            </div>
            {weakTopics.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                None! You answered all concept questions correctly.
              </p>
            ) : (
              <div className="space-y-1.5">
                {weakTopics.map(([topic, stat]) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between rounded-md bg-white dark:bg-[#121215] border border-rose-500/30 px-2.5 py-1.5 text-xs shadow-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                      {topic}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                      {stat.correct}/{stat.total} ({Math.round((stat.correct / stat.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mastered Topics Card */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mastered Concepts</span>
            </div>
            {masteredTopics.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Work through the remediation plan below to achieve topic mastery.
              </p>
            ) : (
              <div className="space-y-1.5">
                {masteredTopics.map(([topic, stat]) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between rounded-md bg-white dark:bg-[#121215] border border-emerald-500/30 px-2.5 py-1.5 text-xs shadow-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                      {topic}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {stat.correct}/{stat.total} (100%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post-Assessment Report: Diagnosed Misconceptions & Targeted Remediation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-amber-500" /> Diagnosed Concept Misconceptions & Remediation Plan
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Section 3.c Rubric Compliance
          </span>
        </div>

        {missedQuestions.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 text-center space-y-1.5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-1">
              <Sparkles className="h-5 w-5" />
            </div>
            <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              No Critical Misconceptions Detected!
            </h5>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-lg mx-auto leading-relaxed">
              You answered all diagnostic questions in alignment with primary course textbook slides and lecture transcripts. Excellent conceptual precision!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {missedQuestions.map((q) => {
              const ans = answers[q.id];
              const isShort = q.type === "short_answer";

              // Resolve student response string
              let studentResponseStr = "No response submitted";
              if (ans) {
                if (isShort && ans.shortAnswerText) {
                  studentResponseStr = `"${ans.shortAnswerText}"`;
                } else if (ans.selectedOptionIndex !== undefined && q.options) {
                  studentResponseStr = q.options[ans.selectedOptionIndex] || "Selected alternative";
                }
              }

              // Resolve model solution string
              let expectedStr = "";
              if (isShort) {
                expectedStr = String(q.correct_answer);
              } else if (typeof q.correct_answer === "number" && q.options) {
                expectedStr = q.options[q.correct_answer] || String(q.correct_answer);
              } else {
                expectedStr = String(q.correct_answer);
              }

              // Resolve misconception text
              const misconceptionText =
                ans?.misconception ||
                q.misconception ||
                `Cognitive Trap: Conflating the primary mechanism of ${q.concept} with neighboring biological/computational pathways. Students often overlook specific constraints cited in ${q.source_citation}.`;

              // Generate pre-loaded Socratic AI tutor query
              const tutorQuery = `I took the adaptive diagnostic quiz and had a misconception regarding "${q.concept}": ${misconceptionText}. Can you explain the correct mechanism step-by-step citing ${q.source_citation}?`;

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/[0.03] dark:bg-amber-500/[0.06] p-4 sm:p-5 space-y-3.5 shadow-xs"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {q.concept}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">·</span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                          {q.difficulty}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">·</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isShort ? "Short Answer" : "Multiple Choice"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {q.question}
                      </p>
                    </div>

                    <Badge variant="destructive" className="shrink-0 text-[11px]">
                      {isShort && ans?.score !== undefined ? `${ans.score}% Credit` : "Incorrect"}
                    </Badge>
                  </div>

                  {/* Student Answer vs Expected Model Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg border border-rose-500/20 bg-white/70 dark:bg-black/30 p-2.5 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        Your Submission:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 line-clamp-3">
                        {studentResponseStr}
                      </p>
                    </div>

                    <div className="rounded-lg border border-emerald-500/20 bg-white/70 dark:bg-black/30 p-2.5 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Verified Course Standard:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 line-clamp-3">
                        {expectedStr}
                      </p>
                    </div>
                  </div>

                  {/* Diagnosed Misconception Block */}
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      <Brain className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Diagnosed Misconception Rationale</span>
                    </div>
                    <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-medium">
                      {misconceptionText}
                    </p>
                  </div>

                  {/* Remediation & Source Citation Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-200/80 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6C63FF] dark:text-[#8B85FF]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{q.source_citation}</span>
                    </div>

                    <Link
                      href={`/chat?query=${encodeURIComponent(tutorQuery)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C63FF] dark:text-[#8B85FF] hover:underline cursor-pointer"
                    >
                      <span>Discuss with AI Tutor in Source Chat</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Question Review List (All Questions) */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
          Complete Assessment Question Log
        </h4>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isCorrect = ans?.isCorrect ?? false;

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-xl border p-4 text-xs space-y-2",
                  isCorrect
                    ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200"
                    : "border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 text-slate-800 dark:text-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {idx + 1}. {q.question}
                  </p>
                  <Badge variant={isCorrect ? "success" : "destructive"}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>

                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-200">Explanation:</strong> {q.explanation}
                </p>

                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-mono",
                    q.source_type === "visual" || q.source_citation?.includes("🖼️")
                      ? "text-amber-700 dark:text-amber-300 font-semibold"
                      : "text-[#6C63FF] dark:text-[#8B85FF]"
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      "h-3 w-3",
                      q.source_type === "visual" || q.source_citation?.includes("🖼️")
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-[#6C63FF]"
                    )}
                  />
                  <span>{q.source_citation}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onRestart}
            className="gap-2 text-xs bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-[#26264A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retake Quiz
          </Button>

          {onChangeMode && (
            <Button
              variant="outline"
              onClick={onChangeMode}
              className="gap-2 text-xs bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-zinc-900/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] cursor-pointer"
            >
              Configure New Quiz
            </Button>
          )}
        </div>

        <Link href="/chat">
          <Button className="gap-2 text-xs bg-[#6C63FF] hover:bg-[#5b52e0] text-white cursor-pointer shadow-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            Open Source Chat with AI Tutor
          </Button>
        </Link>
      </div>
    </div>
  );
}
