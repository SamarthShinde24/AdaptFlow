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
  Maximize2,
  Image as ImageIcon,
  Brain,
  AlertTriangle,
  Check,
  Award,
} from "lucide-react";
import { QuizQuestion, QuizAnswerRecord, CitationReference } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getVisualImageUrl } from "@/lib/api";
import { ImageLightboxModal } from "@/components/chat/image-lightbox-modal";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ShortAnswerEvaluation {
  isCorrect: boolean;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  misconceptionDiagnosis: string;
}

function evaluateShortAnswer(
  userText: string,
  question: QuizQuestion
): ShortAnswerEvaluation {
  const cleanInput = userText.trim().toLowerCase();
  const correctAnswerStr = String(question.correct_answer).trim().toLowerCase();

  // 1. Determine target rubric concepts
  let rubricPoints: string[] = [];
  if (question.key_rubric_points && question.key_rubric_points.length > 0) {
    rubricPoints = question.key_rubric_points;
  } else {
    const stopWords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "by", "for",
      "with", "about", "against", "between", "into", "through", "during", "before",
      "after", "above", "below", "to", "from", "up", "down", "in", "out", "over",
      "under", "again", "further", "then", "once", "that", "this", "these", "those",
      "what", "which", "who", "whom", "am", "be", "been", "being", "have", "has",
      "had", "having", "do", "does", "did", "doing", "and", "but", "if", "or",
      "because", "as", "until", "while", "of", "it", "its"
    ]);

    const words = correctAnswerStr
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    rubricPoints = Array.from(new Set(words));
    if (rubricPoints.length === 0) {
      rubricPoints = [correctAnswerStr];
    }
  }

  // 2. Direct string containment
  if (cleanInput === correctAnswerStr || cleanInput.includes(correctAnswerStr)) {
    return {
      isCorrect: true,
      score: 100,
      matchedKeywords: rubricPoints,
      missingKeywords: [],
      misconceptionDiagnosis: "",
    };
  }

  // 3. Keyword / Rubric coverage checks
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const point of rubricPoints) {
    const cleanPoint = point.trim().toLowerCase();
    const root = cleanPoint.length > 5 ? cleanPoint.slice(0, -2) : cleanPoint;
    if (cleanInput.includes(cleanPoint) || cleanInput.includes(root)) {
      matchedKeywords.push(point);
    } else {
      missingKeywords.push(point);
    }
  }

  const totalPoints = rubricPoints.length;
  const matchRatio = totalPoints > 0 ? matchedKeywords.length / totalPoints : 0;
  const score = Math.round(matchRatio * 100);
  const isCorrect = score >= 60;

  // 4. Formulate Misconception Diagnosis
  let misconceptionDiagnosis = "";
  if (!isCorrect || score < 100) {
    if (question.misconception) {
      misconceptionDiagnosis = question.misconception;
    } else if (missingKeywords.length > 0) {
      misconceptionDiagnosis = `Identified Conceptual Gap: Your response omitted key elements (${missingKeywords.slice(0, 3).join(", ")}). Students frequently confuse this mechanism by overlooking how ${question.concept} specifically relies on these verified components.`;
    } else {
      misconceptionDiagnosis = `Incomplete Formulation: Your explanation was missing essential mechanistic steps cited in ${question.source_citation}.`;
    }
  }

  return {
    isCorrect,
    score,
    matchedKeywords,
    missingKeywords,
    misconceptionDiagnosis,
  };
}

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
  const { t } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState<QuizAnswerRecord | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const isVisual =
    question.source_type === "visual" ||
    (question as any).source === "visual" ||
    Boolean(question.image_stored_path) ||
    Boolean(question.source_citation?.includes("🖼️"));

  const visualImageUrl = question.image_stored_path
    ? getVisualImageUrl(question.image_stored_path)
    : question.source_citation?.toLowerCase().includes("chemiosmosis") ||
      question.question?.toLowerCase().includes("chemiosmosis") ||
      question.concept?.toLowerCase().includes("chemiosmosis")
    ? "/uploads/visuals/sample_chemiosmosis.png"
    : isVisual
    ? "/uploads/visuals/sample_glycolysis_pathway.png"
    : null;

  const visualCitation: CitationReference | null = isVisual
    ? {
        key: question.source_citation || `[🖼️ Visual Diagram]`,
        unit: {
          id: question.id,
          material_id: question.material_id || "visual-quiz-mat",
          content: question.explanation || question.concept || "",
          modality: "visual" as any,
          tags: ["visual", "quiz"],
          created_at: new Date().toISOString(),
          source_tracking: {
            material_id: question.material_id || "visual-quiz-mat",
            material_title: question.concept || "Course Lecture Materials",
            material_type: "pdf_textbook" as any,
            chunk_index: 0,
            is_speaker_notes: false,
            token_count: 0,
            confidence_score: 1.0,
            content_hash: "",
            page_number: question.page_number ?? undefined,
            slide_number: question.slide_number ?? undefined,
            figure_index: question.figure_index ?? undefined,
            image_stored_path: question.image_stored_path || visualImageUrl || undefined,
            citation_label: question.source_citation,
            caption: question.concept,
            visual_type: (question.visual_type || "diagram") as any,
            is_visual: true,
          },
        } as unknown as any,
      }
    : null;

  const handleSubmit = (optionIndex?: number) => {
    if (submitted) return;

    let isCorrect = false;
    let chosenOption = optionIndex ?? selectedOption;
    let score = 0;
    let diagnosedMisconception = "";
    let matchedKeywords: string[] | undefined = undefined;
    let missingKeywords: string[] | undefined = undefined;

    if (question.type === "multiple_choice") {
      if (chosenOption === null || chosenOption === undefined) return;
      isCorrect = chosenOption === Number(question.correct_answer);
      score = isCorrect ? 100 : 0;
      if (!isCorrect) {
        if (question.misconception) {
          diagnosedMisconception = question.misconception;
        } else {
          const chosenText = question.options?.[chosenOption] || "this choice";
          diagnosedMisconception = `Common Conceptual Pitfall: Selecting "${chosenText.length > 60 ? chosenText.slice(0, 57) + "..." : chosenText}" is a frequent distractor error. It conflates ${question.concept} with adjacent mechanisms. Review the exact relationship verified in ${question.source_citation}.`;
        }
      }
    } else {
      // Short answer evaluation
      if (!shortAnswerInput.trim()) return;
      const evalResult = evaluateShortAnswer(shortAnswerInput, question);
      isCorrect = evalResult.isCorrect;
      score = evalResult.score;
      matchedKeywords = evalResult.matchedKeywords;
      missingKeywords = evalResult.missingKeywords;
      diagnosedMisconception = evalResult.misconceptionDiagnosis;
    }

    const record: QuizAnswerRecord = {
      questionId: question.id,
      selectedOptionIndex: chosenOption ?? undefined,
      shortAnswerText: shortAnswerInput,
      isCorrect,
      score,
      explanation: question.explanation,
      sourceCitation: question.source_citation,
      concept: question.concept,
      questionText: question.question,
      misconception: diagnosedMisconception,
      matchedKeywords,
      missingKeywords,
    };

    setAnswerResult(record);
    setSubmitted(true);
    onAnswerSubmitted(record);
  };

  const getOptionLetter = (idx: number) => ["A", "B", "C", "D"][idx] || String(idx + 1);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-6 sm:p-8 shadow-sm dark:shadow-xl backdrop-blur-md space-y-6">
      {/* Question Header */}
      <div>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold mb-3 flex-wrap">
          <div className="flex items-center gap-2 text-[#6C63FF] dark:text-[#8B85FF] uppercase tracking-wider text-[11px] font-mono">
            <span>{question.type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span>Adaptive Diagnostic</span>
          </div>

          {/* Badges container */}
          <div className="flex items-center gap-2">
            {isVisual && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                🖼️ {t("Diagram Question")}
              </span>
            )}

            {/* Current Difficulty Badge */}
            <div className="flex items-center gap-1.5">
              {question.difficulty === "easy" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  {t("Easy")}
                </span>
              )}
              {question.difficulty === "medium" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                  {t("Medium")}
                </span>
              )}
              {(question.difficulty === "hard" || (question.difficulty as any) === "advanced") && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  <span className="h-2 w-2 rounded-full bg-rose-500 dark:bg-rose-400" />
                  {t("Hard")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Visual Diagram Inspection Card */}
        {isVisual && visualImageUrl && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsLightboxOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsLightboxOpen(true);
            }}
            className="group relative mb-4 cursor-pointer overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.08] p-3.5 transition-all hover:border-amber-500/60 hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.14] hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative h-28 w-full sm:w-44 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-900 shadow-xs">
                <img
                  src={visualImageUrl}
                  alt={question.concept || "Diagram Reference"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                  <Maximize2 className="h-4 w-4" />
                  <span>Full Resolution</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 text-center sm:text-left min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {question.source_citation || "Grounded Visual Diagram"}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                    {question.visual_type || "Diagram"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {question.concept
                    ? `Visual diagram for ${question.concept}`
                    : "Reference visual extracted from uploaded course material."}
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 group-hover:text-amber-800 dark:group-hover:text-amber-200">
                    <Maximize2 className="h-3 w-3" />
                    Click to inspect diagram in high-resolution Lightbox viewer
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Multiple Choice Options */}
      {question.type === "multiple_choice" && question.options && (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = Number(question.correct_answer) === index;

            let borderStyle = "border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#121215] hover:border-[#6C63FF]/50 hover:bg-slate-100/70 dark:hover:bg-zinc-900 text-slate-800 dark:text-slate-200";
            if (submitted) {
              if (isCorrectOption) {
                borderStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 shadow-xs";
              } else if (isSelected && !isCorrectOption) {
                borderStyle = "border-rose-500 bg-rose-50 dark:bg-rose-500/15 text-rose-900 dark:text-rose-100";
              } else {
                borderStyle = "border-slate-200 dark:border-white/[0.08] bg-slate-50/20 dark:bg-[#121215]/50 opacity-40 text-slate-400";
              }
            } else if (isSelected) {
              borderStyle = "border-[#6C63FF] bg-purple-50/80 dark:bg-[#1E1B4B] ring-2 ring-[#6C63FF]/30 text-slate-900 dark:text-white shadow-xs";
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
                  "flex w-full items-center justify-between rounded-xl border p-4 sm:py-4.5 sm:px-5 min-h-[52px] text-left text-sm transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]",
                  borderStyle
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200",
                      submitted && isCorrectOption
                        ? "bg-emerald-500 text-white"
                        : submitted && isSelected && !isCorrectOption
                        ? "bg-rose-500 text-white"
                        : isSelected
                        ? "bg-[#6C63FF] text-white"
                        : "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]"
                    )}
                  >
                    {getOptionLetter(index)}
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-100 leading-relaxed">{option}</span>
                </div>

                {submitted && isCorrectOption && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0 ml-2" />
                )}
                {submitted && isSelected && !isCorrectOption && (
                  <XCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Short Answer Input Field */}
      {question.type === "short_answer" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              value={shortAnswerInput}
              onChange={(e) => setShortAnswerInput(e.target.value)}
              disabled={submitted}
              placeholder={t("Type your answer based on course materials...")}
              className="text-sm h-12 bg-slate-50 dark:bg-zinc-900/70 border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#6C63FF]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {!submitted && (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!shortAnswerInput.trim()}
                className="h-12 px-6 gap-2 bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
              >
                <span>{t("Check My Answer")}</span>
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
            "rounded-xl border p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 shadow-sm",
            answerResult.isCorrect
              ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100"
              : "border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {question.type === "short_answer" ? (
                answerResult.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm tracking-tight">
                      {answerResult.score === 100 ? t("Full Credit (100%) - Concept Mastered") : `Substantial Credit (${answerResult.score}%) - Key Concepts Captured`}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span className="font-bold text-rose-800 dark:text-rose-300 text-sm tracking-tight">
                      {(answerResult.score ?? 0) > 0 ? `Partial Credit (${answerResult.score}%) - Review Recommended` : "Needs Review (0%) - Key Concepts Missed"}
                    </span>
                  </>
                )
              ) : answerResult.isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm tracking-tight">
                    {t("Correct! Mastered concept.")}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span className="font-bold text-rose-800 dark:text-rose-300 text-sm tracking-tight">
                    {t("Incorrect. Conceptual review:")}
                  </span>
                </>
              )}
            </div>

            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-current/20 opacity-80">
              {question.type === "short_answer" ? t("Rubric Evaluation") : t("Diagnostic Rationale")}
            </span>
          </div>

          {/* Short Answer Rubric Breakdown */}
          {question.type === "short_answer" && (
            <div className="space-y-2 rounded-lg border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-black/30 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[#6C63FF]" /> {t("Semantic Rubric Breakdown")}
                </span>
                <span className={cn(
                  "font-mono font-bold text-xs px-2 py-0.5 rounded-full",
                  answerResult.isCorrect
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : (answerResult.score ?? 0) >= 40
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                )}>
                  Rubric Match: {answerResult.score ?? 0}%
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {answerResult.matchedKeywords && answerResult.matchedKeywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{t("Captured Concepts:")}</span>
                    {answerResult.matchedKeywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 text-[11px]">
                        <Check className="h-3 w-3" />
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {answerResult.missingKeywords && answerResult.missingKeywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">{t("Missing Concepts:")}</span>
                    {answerResult.missingKeywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800/60 px-2 py-0.5 text-[11px]">
                        <AlertTriangle className="h-3 w-3" />
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-200">{t("Model Solution:")}</strong> {String(question.correct_answer)}
                </div>
              </div>
            </div>
          )}

          {/* Diagnosed Misconception Callout (if incorrect or partial credit) */}
          {answerResult.misconception && (!answerResult.isCorrect || (answerResult.score !== undefined && answerResult.score < 100)) && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] dark:bg-amber-500/[0.12] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{t("Diagnosed Concept Misconception")}</span>
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-100/90 leading-relaxed font-medium">
                {answerResult.misconception}
              </p>
            </div>
          )}

          {/* Explanation Box */}
          <div
            className={cn(
              "rounded-lg p-4 text-xs sm:text-sm leading-relaxed border shadow-xs",
              answerResult.isCorrect
                ? "bg-white dark:bg-[#121215] border-emerald-500/20 text-slate-800 dark:text-slate-200"
                : "bg-white dark:bg-[#121215] border-rose-500/20 text-slate-800 dark:text-slate-200"
            )}
          >
            <p className="font-medium leading-relaxed">
              {question.explanation}
            </p>
          </div>

          {/* Grounded Source Citation */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-semibold flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-[#6C63FF]" /> {t("Verified Course Source:")}
            </span>
            {isVisual ? (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 transition-all cursor-pointer shadow-xs"
                title="Click to view diagram in Lightbox viewer"
              >
                <span>{question.source_citation}</span>
                <Maximize2 className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              </button>
            ) : (
              <span className="rounded-full bg-slate-100 dark:bg-zinc-900 px-3 py-0.5 font-mono text-[11px] font-semibold text-[#6C63FF] dark:text-[#8B85FF] border border-slate-200 dark:border-white/[0.08] shadow-xs">
                {question.source_citation}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Next Question Navigation */}
      {submitted && (
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={onNextQuestion}
            className="gap-2 text-xs h-11 px-6 bg-[#6C63FF] hover:bg-[#5b52e0] text-white cursor-pointer transition-all duration-200 shadow-sm"
          >
            <span>{isLastQuestion ? t("View Performance Summary") : t("Next Question")}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Visual Diagram Lightbox Viewer */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        citation={visualCitation}
        rawLabel={question.source_citation}
      />
    </div>
  );
}
