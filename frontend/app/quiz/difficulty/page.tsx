"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Target,
  Flame,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { listMaterials } from "@/lib/api";
import { Material } from "@/lib/types";

type DifficultyLevel = "easy" | "medium" | "advanced";

interface DifficultyOption {
  level: DifficultyLevel;
  title: string;
  badge: string;
  badgeColor: string;
  descriptor: string;
  detailedText: string;
  icon: React.ElementType;
  glowColor: string;
  borderColor: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    level: "easy",
    title: "Easy",
    badge: "Foundational",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    descriptor: "Core concepts, straightforward recall",
    detailedText:
      "Direct definitions and foundational facts. Evaluates primary terminology comprehension with length-balanced, topic-relevant distractors.",
    icon: Zap,
    glowColor: "hover:border-emerald-400 hover:shadow-emerald-500/10",
    borderColor: "border-emerald-200",
  },
  {
    level: "medium",
    title: "Medium",
    badge: "Balanced",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    descriptor: "Applied understanding, multi-step reasoning",
    detailedText:
      "Analytical questions requiring cause-and-effect understanding and process tracing. Every distractor is plausible and structurally equivalent.",
    icon: Target,
    glowColor: "hover:border-amber-400 hover:shadow-amber-500/10",
    borderColor: "border-amber-200",
  },
  {
    level: "advanced",
    title: "Advanced",
    badge: "Rigorous",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    descriptor: "Edge cases, synthesis across topics, no length bias",
    detailedText:
      "Complex scenarios and cross-topic synthesis. All four options cite real source timestamps and page ranges, completely eliminating length bias.",
    icon: Flame,
    glowColor: "hover:border-[#6C63FF] hover:shadow-purple-500/15",
    borderColor: "border-purple-200",
  },
];

function DifficultySelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get("materialId") || searchParams.get("file_id");
  const assignmentId = searchParams.get("assignment_id");

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("medium");
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMaterials()
      .then((materials) => {
        if (materialId) {
          const found = materials.find((m) => m.id === materialId);
          if (found) setMaterial(found);
        } else if (materials.length > 0) {
          setMaterial(materials[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [materialId]);

  const handleStartQuiz = (difficultyToUse?: DifficultyLevel) => {
    const diff = difficultyToUse || selectedDifficulty;
    const targetMatId = materialId || material?.id || "default";
    const assignmentParam = assignmentId ? `&assignment_id=${assignmentId}` : "";
    router.push(`/quiz?materialId=${targetMatId}&difficulty=${diff}${assignmentParam}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/quiz"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quiz Selection</span>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#6C63FF]" />
          <span>Balanced Distractors & Zero Length Bias</span>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-[#6C63FF]/20 px-3.5 py-1 text-xs font-semibold text-[#6C63FF]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Step 2 of 2: Calibrate Difficulty</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Select Assessment Challenge Level
        </h1>
        <p className="text-xs text-gray-500 italic">
          Choose a difficulty level calibrated to your mastery. All options are length-balanced so answers cannot be guessed by length alone.
        </p>

        {material && (
          <div className="inline-flex items-center gap-2 mt-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-xs">
            <BookOpen className="h-3.5 w-3.5 text-[#6C63FF]" />
            <span className="font-medium text-gray-500">Material:</span>
            <span className="font-semibold text-gray-900 truncate max-w-xs">
              {material.title}
            </span>
          </div>
        )}
      </div>

      {/* Difficulty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        {DIFFICULTY_OPTIONS.map((opt) => {
          const isSelected = selectedDifficulty === opt.level;
          const Icon = opt.icon;

          return (
            <div
              key={opt.level}
              onClick={() => setSelectedDifficulty(opt.level)}
              className={`group relative flex flex-col justify-between rounded-3xl border-2 p-6 cursor-pointer transition-all duration-200 bg-white shadow-md hover:shadow-xl ${opt.glowColor} ${
                isSelected
                  ? "border-[#6C63FF] ring-4 ring-[#6C63FF]/10 shadow-lg scale-[1.02]"
                  : "border-gray-200/90"
              }`}
            >
              <div>
                {/* Header row with Icon and Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${opt.badgeColor} shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${opt.badgeColor}`}
                  >
                    {opt.badge}
                  </span>
                </div>

                {/* Level Title & Descriptor */}
                <div className="mt-5">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {opt.title}
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-[#6C63FF] shrink-0" />
                    )}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#6C63FF]">
                    "{opt.descriptor}"
                  </p>
                </div>

                {/* Detailed Explanation */}
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  {opt.detailedText}
                </p>
              </div>

              {/* Action Button inside Card */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartQuiz(opt.level);
                  }}
                  className={`w-full flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      : "border border-gray-200 bg-gray-50/80 text-gray-700 hover:bg-white hover:border-gray-300"
                  }`}
                >
                  <span>Start {opt.title} Quiz</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Launch Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <Link
          href="/quiz"
          className="rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
        >
          Cancel
        </Link>

        <button
          type="button"
          onClick={() => handleStartQuiz()}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-7 py-2.5 text-xs font-semibold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Launch Quiz with {selectedDifficulty.toUpperCase()} Difficulty</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function DifficultySelectionPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Difficulty Selection...</div>}>
      <DifficultySelectionContent />
    </React.Suspense>
  );
}
