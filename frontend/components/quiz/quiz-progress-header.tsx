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
    <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              {getDifficultyBadge()}
            </div>
            <p className="text-xs text-muted-foreground">Topic: {concept}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Score: <strong className="text-foreground">{currentScore}</strong> / {currentIndex}</span>
          </div>

          {onChangeMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeMode}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Change Mode
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Restart
          </Button>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="space-y-1">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{percentage}% completed</span>
          <span>{totalQuestions - (currentIndex + 1)} remaining</span>
        </div>
      </div>
    </div>
  );
}
