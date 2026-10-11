"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const percentage = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const getDifficultyBadge = () => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="success">Easy</Badge>;
      case "medium":
        return <Badge variant="warning">Medium</Badge>;
      case "hard":
        return <Badge variant="destructive">Advanced</Badge>;
    }
  };

  return (
    <div className="rounded-2xl border border-[#262642] bg-[#141426] p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1C1C36] border border-[#262642] text-[#8B85FF]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              {getDifficultyBadge()}
            </div>
            <p className="text-xs text-slate-400">Topic: {concept}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#262642] bg-[#1A1A35] px-3 py-1 text-xs text-slate-300">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Score: <strong className="text-white">{currentScore}</strong> / {currentIndex}</span>
          </div>

          {onChangeMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeMode}
              className="h-8 text-xs text-slate-300 hover:text-white border-[#262642] bg-[#1A1A35] hover:bg-[#262642]"
            >
              Change Topic
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            className="h-8 text-xs text-slate-400 hover:text-white hover:bg-[#1A1A35] gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Restart
          </Button>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="space-y-1.5">
        <Progress value={percentage} className="h-2 bg-[#1C1C36]" />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{percentage}% completed</span>
          <span>{totalQuestions - (currentIndex + 1)} remaining</span>
        </div>
      </div>
    </div>
  );
}
