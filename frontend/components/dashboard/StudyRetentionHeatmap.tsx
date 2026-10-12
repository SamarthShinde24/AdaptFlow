"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Flame, BrainCircuit, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

interface ActivityDay {
  date: string;
  dayLabel: string;
  intensity: 0 | 1 | 2 | 3 | 4;
  queries: number;
  minutes: number;
  topic: string;
}

const PAST_14_DAYS: ActivityDay[] = [
  { date: "Sep 29", dayLabel: "Su", intensity: 1, queries: 4, minutes: 18, topic: "Linear Algebra" },
  { date: "Sep 30", dayLabel: "Mo", intensity: 3, queries: 14, minutes: 45, topic: "Vector Embeddings" },
  { date: "Oct 01", dayLabel: "Tu", intensity: 2, queries: 9, minutes: 30, topic: "HNSW Indexing" },
  { date: "Oct 02", dayLabel: "We", intensity: 4, queries: 22, minutes: 60, topic: "Attention Mechanisms" },
  { date: "Oct 03", dayLabel: "Th", intensity: 2, queries: 8, minutes: 25, topic: "Cosine Similarity" },
  { date: "Oct 04", dayLabel: "Fr", intensity: 3, queries: 16, minutes: 50, topic: "Multimodal CLIP" },
  { date: "Oct 05", dayLabel: "Sa", intensity: 1, queries: 5, minutes: 20, topic: "Video Timestamps" },
  { date: "Oct 06", dayLabel: "Su", intensity: 2, queries: 7, minutes: 28, topic: "Quiz Re-evaluations" },
  { date: "Oct 07", dayLabel: "Mo", intensity: 4, queries: 25, minutes: 70, topic: "Deep Learning Foundations" },
  { date: "Oct 08", dayLabel: "Tu", intensity: 3, queries: 15, minutes: 42, topic: "Transformer Encoders" },
  { date: "Oct 09", dayLabel: "We", intensity: 4, queries: 28, minutes: 85, topic: "RAG Chunking Strategies" },
  { date: "Oct 10", dayLabel: "Th", intensity: 3, queries: 19, minutes: 55, topic: "Flashcard Spaced Repetition" },
  { date: "Oct 11", dayLabel: "Fr", intensity: 4, queries: 31, minutes: 90, topic: "Prompt Decomposition" },
  { date: "Oct 12", dayLabel: "Sa", intensity: 3, queries: 18, minutes: 48, topic: "Interactive Source Citations" },
];

const TOPIC_MASTERY = [
  {
    topic: "Vector Search & Dense Retrieval",
    mastery: 92,
    status: "Mastered",
    color: "emerald",
  },
  {
    topic: "Deep Learning & Transformer Architectures",
    mastery: 86,
    status: "Strong Recall",
    color: "purple",
  },
  {
    topic: "Multimodal Video-Text Grounding",
    mastery: 74,
    status: "Review Recommended",
    color: "amber",
  },
];

export function StudyRetentionHeatmap() {
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);

  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return "bg-slate-100 dark:bg-[#1C1C36] border-slate-200 dark:border-[#262642]";
      case 1:
        return "bg-purple-100 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300";
      case 2:
        return "bg-purple-200 dark:bg-purple-900/60 border-purple-300 dark:border-purple-700/50 text-purple-800 dark:text-purple-200";
      case 3:
        return "bg-[#6C63FF]/70 border-[#6C63FF] text-white";
      case 4:
        return "bg-[#5850EC] border-[#4338CA] text-white shadow-xs";
      default:
        return "bg-slate-100 dark:bg-[#1C1C36] border-slate-200 dark:border-[#262642]";
    }
  };

  return (
    <section
      aria-label="Study recall and retention velocity"
      className="rounded-3xl border border-gray-200/80 dark:border-[#262642] bg-white dark:bg-[#141426] p-5 sm:p-7 shadow-xs space-y-6"
    >
      {/* Header with Title and Streak Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-[#202038] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-[#1C1C36] text-[#6C63FF] border border-purple-200/60 dark:border-[#262642]">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Study Recall & Retention Velocity
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Adaptive spaced repetition index tracked across your last 14 active study sessions
          </p>
        </div>

        {/* Live Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span className="tabular-nums">6 Day Streak</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="tabular-nums">84% Retention</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 14-Day Activity Heatmap on Left (7 cols / 2 rows), Topic Mastery on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 14-day Activity Grid (8 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span>Last 14 Days Activity Frequency</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Low</span>
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-100 dark:bg-[#1C1C36] border border-slate-300 dark:border-[#262642]" />
              <span className="h-2.5 w-2.5 rounded-xs bg-purple-200 dark:bg-purple-900/60" />
              <span className="h-2.5 w-2.5 rounded-xs bg-[#6C63FF]/70" />
              <span className="h-2.5 w-2.5 rounded-xs bg-[#5850EC]" />
              <span>High</span>
            </div>
          </div>

          {/* 14 Cell Interactive Grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {PAST_14_DAYS.map((day, idx) => (
              <button
                type="button"
                key={day.date}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => setHoveredDay(day)}
                className={`group relative flex flex-col items-center justify-between rounded-xl p-2 sm:p-2.5 border transition-all duration-150 ease-out hover:scale-105 active:scale-95 cursor-pointer text-center ${getCellColor(
                  day.intensity
                )}`}
              >
                <span className="text-[10px] font-semibold opacity-75">
                  {day.dayLabel}
                </span>
                <span className="my-1 text-xs sm:text-sm font-bold tabular-nums">
                  {day.queries}
                </span>
                <span className="text-[9px] opacity-70 tabular-nums">
                  {day.date.split(" ")[1]}
                </span>
              </button>
            ))}
          </div>

          {/* Dynamic Insight Banner for Hovered / Active Day */}
          <div className="rounded-xl border border-gray-100 dark:border-[#202038] bg-gray-50/70 dark:bg-[#101024] p-3 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
            {hoveredDay ? (
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-[#6C63FF] shrink-0" />
                <span>
                  <strong className="text-gray-900 dark:text-white font-semibold">
                    {hoveredDay.date}
                  </strong>{" "}
                  -- {hoveredDay.queries} queries ({hoveredDay.minutes} mins) in{" "}
                  <span className="text-[#6C63FF] dark:text-[#a78bfa] font-medium">
                    {hoveredDay.topic}
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-[#6C63FF] shrink-0" />
                <span>Hover over any session box to preview concept focus and queries logged.</span>
              </div>
            )}
            <span className="hidden sm:inline text-[11px] text-gray-400 tabular-nums">
              Total 217 Units Reviewed
            </span>
          </div>
        </div>

        {/* Right: Topic Mastery Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-100 dark:border-[#202038] bg-gray-50/60 dark:bg-[#101024] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Retention by Topic
            </h3>
            <span className="text-[11px] font-semibold text-[#6C63FF] dark:text-[#a78bfa]">
              Spaced Curve
            </span>
          </div>

          <div className="space-y-3.5">
            {TOPIC_MASTERY.map((item) => (
              <div key={item.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">
                    {item.topic}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold tabular-nums text-gray-900 dark:text-white">
                      {item.mastery}%
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        item.status === "Mastered"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          : item.status === "Strong Recall"
                          ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-[#1C1C36]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === "Mastered"
                        ? "bg-emerald-500"
                        : item.status === "Strong Recall"
                        ? "bg-[#6C63FF]"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Trigger Call-to-Action */}
          <div className="pt-2">
            <Link
              href="/flashcards"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#1A1A36] px-4 py-2 text-xs font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-[#262642] shadow-2xs hover:border-[#6C63FF]/50 hover:bg-purple-50/50 dark:hover:bg-[#202042] transition-all duration-150 ease-out"
            >
              <span>Practice Flashcards & Spaced Recall</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#6C63FF]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
