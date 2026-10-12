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
    color: "zinc",
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
        return "bg-slate-100 dark:bg-zinc-900/60 border-slate-200 dark:border-white/[0.05] text-slate-500 dark:text-zinc-500";
      case 1:
        return "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300";
      case 2:
        return "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200";
      case 3:
        return "bg-emerald-500 dark:bg-emerald-700 border-emerald-600 dark:border-emerald-600 text-white";
      case 4:
        return "bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-400 text-white dark:text-zinc-950 font-bold shadow-2xs";
      default:
        return "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-white/[0.05]";
    }
  };

  return (
    <section
      aria-label="Study recall and retention velocity"
      className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-xs space-y-6"
    >
      {/* Header with Title and Streak Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-white/[0.06]">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              Study Recall & Retention Velocity
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            Spaced repetition recall frequency tracked across your last 14 active study sessions
          </p>
        </div>

        {/* Quiet Metric Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span className="tabular-nums">6 Day Streak</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="tabular-nums">84% Retention</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 14-Day Activity Heatmap on Left, Topic Mastery on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 14-day Activity Grid */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-medium">
            <span>Daily Session Volume</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Rest</span>
              <span className="h-2 w-2 rounded-xs bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700" />
              <span className="h-2 w-2 rounded-xs bg-emerald-100 dark:bg-emerald-950" />
              <span className="h-2 w-2 rounded-xs bg-emerald-300 dark:bg-emerald-800" />
              <span className="h-2 w-2 rounded-xs bg-emerald-500" />
              <span>Active</span>
            </div>
          </div>

          {/* 14 Cell Interactive Linear-Style Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {PAST_14_DAYS.map((day) => (
              <button
                type="button"
                key={day.date}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => setHoveredDay(day)}
                className={`group relative flex flex-col items-center justify-between rounded-lg py-2 px-1 border transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-2xs cursor-pointer text-center ${getCellColor(
                  day.intensity
                )}`}
              >
                <span className="text-[10px] font-medium opacity-70">
                  {day.dayLabel}
                </span>
                <span className="my-0.5 text-xs font-bold tabular-nums">
                  {day.queries}
                </span>
                <span className="text-[9px] opacity-60 tabular-nums">
                  {day.date.split(" ")[1]}
                </span>
              </button>
            ))}
          </div>

          {/* Context Insight Banner for Hovered / Active Day */}
          <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-zinc-900/30 p-2.5 text-xs text-gray-600 dark:text-zinc-400 flex items-center justify-between">
            {hoveredDay ? (
              <div className="flex items-center gap-2 truncate">
                <Zap className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">
                  <strong className="text-gray-900 dark:text-zinc-200 font-semibold">
                    {hoveredDay.date}
                  </strong>{" "}
                  -- {hoveredDay.queries} queries ({hoveredDay.minutes}m) in{" "}
                  <span className="text-gray-800 dark:text-zinc-200 font-medium">
                    {hoveredDay.topic}
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>Hover over any date cell to inspect study focus and queries.</span>
              </div>
            )}
            <span className="hidden sm:inline text-[11px] text-gray-400 dark:text-zinc-500 tabular-nums shrink-0 ml-2">
              217 Units Tracked
            </span>
          </div>
        </div>

        {/* Right: Topic Mastery Breakdown */}
        <div className="lg:col-span-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-zinc-900/30 p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Retention by Subject
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Verified
            </span>
          </div>

          <div className="space-y-3">
            {TOPIC_MASTERY.map((item) => (
              <div key={item.topic} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-zinc-300 truncate pr-2">
                    {item.topic}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold tabular-nums text-gray-900 dark:text-white">
                      {item.mastery}%
                    </span>
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                        item.status === "Mastered"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : item.status === "Strong Recall"
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Subtle Progress Track */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === "Mastered"
                        ? "bg-emerald-500"
                        : item.status === "Strong Recall"
                        ? "bg-zinc-400 dark:bg-zinc-300"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Trigger Call-to-Action */}
          <div className="pt-1">
            <Link
              href="/flashcards"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-white/[0.08] shadow-2xs hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-150 ease-out"
            >
              <span>Practice Spaced Flashcards</span>
              <ArrowRight className="h-3 w-3 text-gray-500 dark:text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
