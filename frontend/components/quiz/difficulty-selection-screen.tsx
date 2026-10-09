"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Target,
  Flame,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Layers,
  FileText,
  Film,
  Presentation,
  Check,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Material, MaterialType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type DifficultyLevel = "easy" | "medium" | "hard";

export interface DifficultyOption {
  level: DifficultyLevel;
  title: string;
  badge: string;
  badgeColor: string;
  descriptor: string;
  detailedText: string;
  icon: React.ElementType;
  glowColor: string;
  accentColor: string;
  borderColor: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    level: "easy",
    title: "Easy",
    badge: "Foundational",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    descriptor: "Foundational concepts and definitions",
    detailedText:
      "Core terminology and direct definition recall. Tests foundational understanding with balanced, topic-relevant distractors.",
    icon: Zap,
    glowColor: "hover:border-emerald-400 hover:shadow-emerald-500/10",
    accentColor: "text-emerald-500",
    borderColor: "border-emerald-300",
  },
  {
    level: "medium",
    title: "Medium",
    badge: "Applied",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    descriptor: "Applied understanding and analysis",
    detailedText:
      "Analytical questions requiring cause-and-effect reasoning and concept mapping. Every distractor is structurally equivalent and plausible.",
    icon: Target,
    glowColor: "hover:border-amber-400 hover:shadow-amber-500/10",
    accentColor: "text-amber-500",
    borderColor: "border-amber-300",
  },
  {
    level: "hard",
    title: "Hard",
    badge: "Rigorous",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    descriptor: "Advanced synthesis and edge cases",
    detailedText:
      "Complex multi-source scenarios, edge cases, and synthesis across materials. Grounded directly in exact page numbers and timestamps.",
    icon: Flame,
    glowColor: "hover:border-rose-400 hover:shadow-rose-500/10",
    accentColor: "text-rose-500",
    borderColor: "border-rose-300",
  },
];

const QUIZ_LENGTH_OPTIONS = [
  { value: 5, label: "5 Questions", subtitle: "Quick Sprint (~3 min)" },
  { value: 10, label: "10 Questions", subtitle: "Standard Assessment (~7 min)", recommended: true },
  { value: 15, label: "15 Questions", subtitle: "Comprehensive Diagnostic (~12 min)" },
];

function getMaterialTypeBadge(type: MaterialType) {
  switch (type) {
    case "textbook":
      return { icon: FileText, label: "Textbook", color: "text-blue-600 bg-blue-50 border-blue-200" };
    case "lecture_video":
      return { icon: Film, label: "Lecture Video", color: "text-purple-600 bg-purple-50 border-purple-200" };
    case "slide_deck":
      return { icon: Presentation, label: "Slide Deck", color: "text-amber-600 bg-amber-50 border-amber-200" };
    default:
      return { icon: BookOpen, label: "Material", color: "text-gray-600 bg-gray-50 border-gray-200" };
  }
}

interface DifficultySelectionScreenProps {
  materials: Material[];
  loadingMaterials: boolean;
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string, topicTitle: string) => void;
  selectedDifficulty: DifficultyLevel | null;
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  selectedLength: number;
  onSelectLength: (length: number) => void;
  onStartQuiz: () => void;
  isStarting?: boolean;
  questionCounts?: Record<DifficultyLevel, number>;
}

export function DifficultySelectionScreen({
  materials,
  loadingMaterials,
  selectedTopicId,
  onSelectTopic,
  selectedDifficulty,
  onSelectDifficulty,
  selectedLength,
  onSelectLength,
  onStartQuiz,
  isStarting = false,
  questionCounts = { easy: 10, medium: 15, hard: 10 },
}: DifficultySelectionScreenProps) {
  // Built-in default materials if none uploaded yet
  const displayMaterials =
    materials.length > 0
      ? materials
      : [
          {
            id: "mat_1",
            title: "Principles of Biology (11th Ed)",
            filename: "principles_of_biology.pdf",
            material_type: "textbook" as MaterialType,
            file_size_bytes: 14500000,
            course_id: "BIO101",
            subject: "Biology",
            status: "indexed" as any,
            total_units_extracted: 120,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "mat_2",
            title: "The Definitive Jaipur Guide: Architecture & Landmarks",
            filename: "jaipur_heritage_guide.pdf",
            material_type: "textbook" as MaterialType,
            file_size_bytes: 8200000,
            course_id: "HIST101",
            subject: "Heritage",
            status: "indexed" as any,
            total_units_extracted: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "mat_5",
            title: "CS201 Data Structures & Algorithms: Binary Search Trees",
            filename: "cs201_trees.pptx",
            material_type: "slide_deck" as MaterialType,
            file_size_bytes: 3800000,
            course_id: "CS201",
            subject: "Computer Science",
            status: "indexed" as any,
            total_units_extracted: 16,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "aa50916b-eedc-4306-a820-f96a7fce57f6",
            title: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
            filename: "rag_explained.mp4",
            material_type: "lecture_video" as MaterialType,
            file_size_bytes: 25771596,
            course_id: "CS101",
            subject: "AI & LLMs",
            status: "indexed" as any,
            total_units_extracted: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

  const isReadyToStart = Boolean(selectedTopicId && selectedDifficulty && !isStarting);

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4 px-2 sm:px-4">
      {/* View Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-3.5 py-1 text-xs font-semibold text-[#6C63FF]">
          <Sparkles className="h-3.5 w-3.5 text-[#6C63FF]" />
          <span>Adaptive Assessment Calibration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          Configure Your Adaptive Quiz
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
          Select your study material, pick your initial challenge level, and choose assessment length.
          The AI engine dynamically adjusts difficulty mid-quiz based on your live performance.
        </p>
      </div>

      {/* Step 1: Study Material / Topic Selector */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C63FF] text-[11px] font-bold text-white">
              1
            </span>
            <h2 className="text-sm font-bold text-gray-900">
              Select Assessment Topic
            </h2>
            <span className="text-xs text-rose-500 font-medium">*required</span>
          </div>
          <span className="text-xs text-gray-400">
            {displayMaterials.length} materials available
          </span>
        </div>

        {loadingMaterials ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {displayMaterials.map((mat) => {
              const isSelected = selectedTopicId === mat.id;
              const typeCfg = getMaterialTypeBadge(mat.material_type);
              const TypeIcon = typeCfg.icon;

              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => onSelectTopic(mat.id, mat.title)}
                  className={`group relative flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#6C63FF] bg-[#6C63FF]/5 ring-2 ring-[#6C63FF]/20 shadow-xs"
                      : "border-gray-200 bg-white hover:border-[#6C63FF]/50 hover:bg-gray-50/80"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${typeCfg.color}`}
                  >
                    <TypeIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {mat.course_id || "COURSE"}
                      </span>
                      <span className="text-[10px] text-gray-300">•</span>
                      <span className={`rounded px-1.5 py-0.2 text-[9px] font-medium border ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#6C63FF] transition-colors" title={mat.title}>
                      {mat.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {mat.total_units_extracted} knowledge units · {mat.filename}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#6C63FF] text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Difficulty Selection Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C63FF] text-[11px] font-bold text-white">
            2
          </span>
          <h2 className="text-sm font-bold text-gray-900">
            Choose Initial Difficulty Tier
          </h2>
          <span className="text-xs text-rose-500 font-medium">*required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isSelected = selectedDifficulty === opt.level;
            const Icon = opt.icon;
            const count = questionCounts[opt.level] || 10;

            return (
              <div
                key={opt.level}
                onClick={() => onSelectDifficulty(opt.level)}
                className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 bg-white shadow-xs hover:shadow-md ${opt.glowColor} ${
                  isSelected
                    ? "border-[#6C63FF] ring-4 ring-[#6C63FF]/15 shadow-md scale-[1.01]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div>
                  {/* Top row: Icon + Question Count Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${opt.badgeColor} shadow-2xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${opt.badgeColor}`}
                    >
                      {count} Questions Available
                    </span>
                  </div>

                  {/* Title & Descriptor */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {opt.title}
                      </h3>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-[#6C63FF] shrink-0" />
                      )}
                    </div>

                    <p className="mt-1 text-xs font-semibold text-[#6C63FF]">
                      "{opt.descriptor}"
                    </p>
                  </div>

                  {/* Detailed Pedagogy Text */}
                  <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                    {opt.detailedText}
                  </p>
                </div>

                {/* Bottom Selection Pill */}
                <div className="mt-5 pt-3 border-t border-gray-100">
                  <div
                    className={`w-full text-center py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#6C63FF] text-white shadow-xs"
                        : "bg-gray-50 text-gray-600 group-hover:bg-gray-100"
                    }`}
                  >
                    {isSelected ? `Selected: ${opt.title}` : `Select ${opt.title}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Quiz Length Selector */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C63FF] text-[11px] font-bold text-white">
              3
            </span>
            <h2 className="text-sm font-bold text-gray-900">
              Quiz Length & Question Count
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            Selected: <strong className="text-gray-900">{selectedLength} Questions</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUIZ_LENGTH_OPTIONS.map((len) => {
            const isSelected = selectedLength === len.value;

            return (
              <button
                key={len.value}
                type="button"
                onClick={() => onSelectLength(len.value)}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#6C63FF] bg-[#6C63FF]/5 ring-2 ring-[#6C63FF]/15 text-[#6C63FF]"
                    : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                }`}
              >
                {len.recommended && (
                  <span className="absolute -top-2.5 rounded-full bg-[#6C63FF] px-2 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider shadow-2xs">
                    Recommended
                  </span>
                )}
                <span className="text-sm font-bold">{len.label}</span>
                <span className="text-[11px] text-gray-400 mt-0.5">{len.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer & Launch Button */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-gray-700">
            <ShieldCheck className="h-4 w-4 text-[#6C63FF]" />
            <span>Zero Repeated Questions · Dynamic Mid-Quiz Adaptation</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {!selectedTopicId && !selectedDifficulty
              ? "Please select a topic and difficulty tier to enable the quiz"
              : !selectedTopicId
              ? "Please select a topic to start"
              : !selectedDifficulty
              ? "Please select a difficulty level to start"
              : "Ready to launch adaptive evaluation grounded in your materials"}
          </p>
        </div>

        <Button
          size="lg"
          disabled={!isReadyToStart}
          onClick={onStartQuiz}
          className={`w-full sm:w-auto h-12 px-8 text-xs font-bold gap-2 shadow-sm transition-all ${
            isReadyToStart
              ? "bg-gradient-to-r from-[#6C63FF] to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          }`}
        >
          <span>
            {isStarting
              ? "Synthesizing Questions..."
              : `Start Adaptive Quiz (${selectedLength} Questions)`}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
