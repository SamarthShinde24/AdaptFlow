"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface QuizProgressHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  currentScore: number;
  concept: string;
  difficulty: "easy" | "medium" | "hard";
  onRestart: () => void;
  onChangeMode?: () => void;
}

export function QuizProgressHeader({
  currentIndex,
  totalQuestions,
  currentScore,
  concept,
  difficulty,
  onRestart,
  onChangeMode,
}: QuizProgressHeaderProps) {
  const { t } = useLanguage();
  const percentage = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const getDifficultyBadge = () => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="success">{t("Easy")}</Badge>;
      case "medium":
        return <Badge variant="warning">{t("Medium")}</Badge>;
      case "hard":
        return <Badge variant="destructive">{t("Hard")}</Badge>;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] text-[#6C63FF] dark:text-[#8B85FF]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {t("Question")} {currentIndex + 1} / {totalQuestions}
              </span>
              {getDifficultyBadge()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("Topic:")} {concept}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-zinc-900/70 px-3 py-1 text-xs text-slate-700 dark:text-slate-300">
            <Trophy className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            <span>{t("Score:")} <strong className="text-slate-900 dark:text-white">{currentScore}</strong> / {currentIndex}</span>
          </div>

          {onChangeMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeMode}
              className="h-8 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-zinc-900/70 hover:bg-slate-200 dark:hover:bg-zinc-800"
            >
              {t("Change Topic")}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            className="h-8 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900/70 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            {t("Restart")}
          </Button>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="space-y-1.5">
        <Progress value={percentage} className="h-2 bg-slate-100 dark:bg-zinc-900" />
        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{percentage}% {t("completed")}</span>
          <span>{totalQuestions - (currentIndex + 1)} {t("remaining")}</span>
        </div>
      </div>
    </div>
  );
}
