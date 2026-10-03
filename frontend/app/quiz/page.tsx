"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QuizProgressHeader } from "@/components/quiz/quiz-progress-header";
import { QuestionCard } from "@/components/quiz/question-card";
import { ScoreSummaryCard } from "@/components/quiz/score-summary-card";
import {
  QuizQuestion,
  QuizAnswerRecord,
  Material,
  MaterialType,
} from "@/lib/types";
import {
  getQuizQuestions,
  listMaterials,
  generateQuizQuestions,
} from "@/lib/api";
import {
  Sparkles,
  GraduationCap,
  Loader2,
  FileText,
  Film,
  Presentation,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    type: "multiple_choice",
    question:
      "Where does glycolysis take place within a eukaryotic cell, and what is the net yield of ATP per glucose molecule?",
    options: [
      "Mitochondrial matrix; 4 ATP",
      "Cytosol; 2 ATP",
      "Inner mitochondrial membrane; 32 ATP",
      "Endoplasmic reticulum; 1 ATP",
    ],
    correct_answer: 1,
    explanation:
      "Glycolysis occurs entirely in the cytosol. While 4 total ATP molecules are produced, 2 ATP are consumed during the initial preparatory phase, resulting in a net yield of 2 ATP per glucose.",
    source_citation:
      "[Principles of Biology | Chapter 4: Energy & Cellular Respiration, p. 42]",
    difficulty: "medium",
    concept: "Glycolysis & Energy Metabolism",
  },
  {
    id: "q2",
    type: "multiple_choice",
    question:
      "According to the lecture video discussion on gradient descent convergence, what occurs when the learning rate (alpha) is set excessively high?",
    options: [
      "The algorithm converges monotonically to the global minimum.",
      "The loss function oscillates and may diverge uncontrollably.",
      "The gradient vector automatically resets to zero.",
      "Parameters undergo L2 regularization shrinkage.",
    ],
    correct_answer: 1,
    explanation:
      "As explained by the instructor in the lecture recording, setting an excessively high learning rate causes parameter updates to overshoot the valley, oscillating wildly and diverging instead of converging.",
    source_citation:
      "[Optimization Lecture 03 @ 12:45 - 14:10, Speaker: Prof. Adams]",
    difficulty: "medium",
    concept: "Gradient Descent Optimization",
  },
  {
    id: "q3",
    type: "multiple_choice",
    question:
      "In Convolutional Neural Networks, what is the primary role of the slide concept 'Stride' during convolution operations?",
    options: [
      "Specifies the number of pixels by which the kernel shifts over the input matrix.",
      "Adds zeros around the border to preserve spatial dimensions.",
      "Applies the ReLU non-linear activation function.",
      "Normalizes the activations across batch dimensions.",
    ],
    correct_answer: 0,
    explanation:
      "Slide #7 defines Stride as the step size (in pixels) by which the convolutional filter slides across the input feature map, directly controlling the spatial downsampling rate.",
    source_citation:
      "[CS231N Slides | Slide #7: 'Convolutional Arithmetic' (Slide Content)]",
    difficulty: "easy",
    concept: "CNN Architecture & Convolutions",
  },
  {
    id: "q4",
    type: "short_answer",
    question:
      "What multi-subunit enzyme complex harnesses the proton motive force to synthesize ATP during oxidative phosphorylation?",
    correct_answer: "ATP synthase",
    explanation:
      "ATP synthase utilizes the electrochemical proton gradient across the inner mitochondrial membrane to drive the rotary synthesis of ATP from ADP and inorganic phosphate.",
    source_citation:
      "[Principles of Biology | Chapter 4, p. 48 (Section 4.4 ATP Synthase)]",
    difficulty: "hard",
    concept: "Oxidative Phosphorylation",
  },
  {
    id: "q5",
    type: "multiple_choice",
    question:
      "In the speaker notes for the Neural Networks slide deck, what guideline is highlighted regarding weight initialization?",
    options: [
      "Initialize all weights to 1.0 to ensure strong initial gradients.",
      "Break symmetry by using small random numbers drawn from a Gaussian distribution.",
      "Set all biases to negative infinity.",
      "Freeze convolutional filters during the first 10 epochs.",
    ],
    correct_answer: 1,
    explanation:
      "The instructor's speaker notes on Slide #12 specifically emphasize that zero or constant initialization causes all hidden units to learn identical features; random Gaussian weights break symmetry.",
    source_citation:
      "[Lecture Slides | Slide #12: 'Weight Initialization' (Speaker Notes)]",
    difficulty: "hard",
    concept: "Weight Initialization & Symmetry Breaking",
  },
];

type QuizMode = "preset" | "materials" | null;

function getMaterialTypeConfig(type: MaterialType) {
  switch (type) {
    case "textbook":
      return {
        icon: FileText,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10 border-blue-500/20",
        label: "PDF Textbook",
      };
    case "lecture_video":
      return {
        icon: Film,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10 border-purple-500/20",
        label: "Lecture Video",
      };
    case "slide_deck":
      return {
        icon: Presentation,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10 border-amber-500/20",
        label: "Slide Deck",
      };
    default:
      return {
        icon: FileText,
        color: "text-primary-400",
        bgColor: "bg-primary/10 border-primary/20",
        label: "Course Material",
      };
  }
}

function QuizView() {
  const searchParams = useSearchParams();
  const initialMaterialId = searchParams.get("materialId");

  const [mode, setMode] = useState<QuizMode>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generatingFileName, setGeneratingFileName] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerRecord>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch materials library (same as Dashboard state)
  const fetchMaterialsList = useCallback(async () => {
    try {
      setLoadingMaterials(true);
      const data = await listMaterials();
      setMaterials(data);
      return data;
    } catch (err) {
      console.warn("Could not fetch materials list for quiz:", err);
      return [];
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterialsList().then((loadedMaterials) => {
      // If a materialId query parameter was passed, immediately generate quiz for it
      if (initialMaterialId) {
        const found = loadedMaterials.find((m) => m.id === initialMaterialId);
        if (found) {
          handleStartMaterialQuiz(found);
        } else {
          // If not in cache, start with minimal stub
          handleStartMaterialQuiz({
            id: initialMaterialId,
            title: "Selected Study Material",
            material_type: "textbook",
            filename: "study_material.pdf",
            file_size_bytes: 0,
            status: "indexed",
            total_units_extracted: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    });
  }, [fetchMaterialsList, initialMaterialId]);

  // Handler: Start preset "Principles of Biology" quiz
  const handleStartPresetQuiz = async () => {
    setMode("preset");
    setSelectedMaterial(null);
    setGenerationError(null);
    setLoadingQuestions(true);
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);

    try {
      const data = await getQuizQuestions(undefined, 5);
      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        setQuestions(FALLBACK_QUESTIONS);
      }
    } catch (err) {
      console.warn("Using built-in biology questions bank:", err);
      setQuestions(FALLBACK_QUESTIONS);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handler: Start "Quiz from My Materials" by selecting a specific file
  const handleStartMaterialQuiz = async (material: Material) => {
    setMode("materials");
    setSelectedMaterial(material);
    setGeneratingFileName(material.title || material.filename);
    setGenerationError(null);
    setLoadingQuestions(true);
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);

    try {
      // Call POST /api/quiz/generate with { file_id, question_count: 10 }
      const generated = await generateQuizQuestions(material.id, 10);
      if (generated && generated.length > 0) {
        setQuestions(generated);
      } else {
        throw new Error("No questions were generated for this material.");
      }
    } catch (err: any) {
      console.error("Failed to generate quiz from material:", err);
      setGenerationError(
        err.message || "Failed to generate questions from selected file. Please try again."
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleReturnToModeSelection = () => {
    setMode(null);
    setSelectedMaterial(null);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setGenerationError(null);
  };

  const handleAnswerSubmitted = (record: QuizAnswerRecord) => {
    setAnswers((prev) => ({
      ...prev,
      [record.questionId]: record,
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
  };

  // 1. Loading skeleton during question generation
  if (loadingQuestions) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Skeleton Progress Header */}
        <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-44 rounded-md bg-secondary/80 animate-pulse" />
                <div className="h-3 w-28 rounded-md bg-secondary/60 animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-lg bg-secondary/60 animate-pulse" />
          </div>
          <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
            <div className="h-full w-2/5 bg-primary/60 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Loading Message Banner */}
        <div className="flex items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary-300">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>
            Synthesizing 10 adaptive questions from{" "}
            <strong className="text-foreground">{generatingFileName || "material"}</strong>...
            analyzing knowledge units and formulating citations.
          </span>
        </div>

        {/* Skeleton Question Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-md space-y-6">
          <div className="space-y-3">
            <div className="h-3.5 w-32 rounded-full bg-primary/20 animate-pulse" />
            <div className="h-6 w-5/6 rounded-lg bg-secondary/80 animate-pulse" />
            <div className="h-6 w-3/4 rounded-lg bg-secondary/60 animate-pulse" />
          </div>

          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/30 p-4"
              >
                <div className="h-7 w-7 rounded-lg bg-secondary/80 shrink-0 animate-pulse" />
                <div
                  className="h-4 rounded bg-secondary/70 animate-pulse"
                  style={{ width: `${60 + (i % 3) * 15}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <div className="h-10 w-32 rounded-xl bg-secondary/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Generation Error View
  if (generationError) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Quiz Generation Failed
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {generationError}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          {selectedMaterial && (
            <Button
              size="sm"
              onClick={() => handleStartMaterialQuiz(selectedMaterial)}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry Generation
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToModeSelection}
            className="text-xs gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Mode Selection
          </Button>
        </div>
      </div>
    );
  }

  // 3. Active Quiz or Completed Score Summary View
  if (mode !== null && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const currentScore = Object.values(answers).filter((a) => a.isCorrect).length;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Mode context bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <button
            onClick={handleReturnToModeSelection}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Switch Quiz Mode</span>
          </button>
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-0.5 text-[11px]">
            {mode === "preset" ? (
              <>
                <BookOpen className="h-3 w-3 text-emerald-400" />
                <span>Preset: Principles of Biology</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 text-primary-400" />
                <span>Material: {selectedMaterial?.title || "Custom Quiz"}</span>
              </>
            )}
          </span>
        </div>

        {!isCompleted ? (
          <>
            {/* Progress Header */}
            <QuizProgressHeader
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              currentScore={currentScore}
              concept={currentQuestion.concept}
              difficulty={currentQuestion.difficulty}
              onRestart={handleRestart}
              onChangeMode={handleReturnToModeSelection}
            />

            {/* Active Question Card */}
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              onAnswerSubmitted={handleAnswerSubmitted}
              onNextQuestion={handleNextQuestion}
              isLastQuestion={currentIndex === questions.length - 1}
            />
          </>
        ) : (
          /* Score Summary View */
          <ScoreSummaryCard
            questions={questions}
            answers={answers}
            onRestart={handleRestart}
            onChangeMode={handleReturnToModeSelection}
          />
        )}
      </div>
    );
  }

  // 4. Default: Mode Selection Screen with 2 Cards
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* View Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-300">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
          <span>Adaptive Knowledge Assessments</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Choose Your Quiz Mode
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Test your mastery with standardized curriculum questions or dynamically generate
          custom assessments grounded in your uploaded study materials.
        </p>
      </div>

      {/* Mode Selection Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card 1: Principles of Biology (Preset Quiz) */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                Standard Benchmark
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-emerald-300 transition-colors">
                Principles of Biology
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Test foundational knowledge of glycolysis, cellular respiration energetics,
                enzyme mechanics, and oxidative phosphorylation.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/70 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>5 Verified Core Questions (MCQ & Short Answer)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Page-indexed textbook citations & detailed explanations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Instant diagnostic feedback & mastery rating</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border/80">
            <Button
              onClick={handleStartPresetQuiz}
              className="w-full gap-2 text-xs h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              <span>Start Principles of Biology Quiz</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Card 2: Quiz from My Materials */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary-400 shadow-glow">
                <Sparkles className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary-300 bg-primary/10">
                AI Generated · 10 Questions
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary-300 transition-colors">
                Quiz from My Materials
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Generate 10 tailored multiple-choice questions grounded in files you uploaded
                to your AdaptFlow Multimodal Library.
              </p>
            </div>

            {/* Dynamic File Selector Section */}
            <div className="pt-2 border-t border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Select an uploaded file:
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {materials.length} available
                </span>
              </div>

              {loadingMaterials ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-xl border border-border/70 bg-secondary/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : materials.length === 0 ? (
                /* Empty state when no materials are uploaded */
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-secondary/20 p-6 text-center space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">
                      No study materials uploaded yet
                    </h4>
                    <p className="text-[11px] text-muted-foreground max-w-xs">
                      Upload textbooks, lecture recordings, or slides in the Dashboard to generate questions.
                    </p>
                  </div>
                  <Link href="/dashboard" className="pt-1">
                    <Button size="sm" variant="secondary" className="gap-1.5 text-xs h-8">
                      <Upload className="h-3.5 w-3.5 text-primary" />
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                /* Scrollable list of selectable uploaded files */
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {materials.map((item) => {
                    const cfg = getMaterialTypeConfig(item.material_type);
                    const ItemIcon = cfg.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleStartMaterialQuiz(item)}
                        className="group/item flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-left transition-all duration-200 hover:border-primary/60 hover:bg-secondary/70 hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${cfg.bgColor} ${cfg.color}`}
                          >
                            <ItemIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 truncate">
                            <h5 className="text-xs font-semibold text-foreground truncate group-hover/item:text-primary-300 transition-colors">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {item.filename}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-block rounded-md border border-border/80 bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                            {item.total_units_extracted} units
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover/item:text-primary group-hover/item:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border/80">
            {materials.length > 0 ? (
              <p className="text-[11px] text-muted-foreground text-center">
                Click any uploaded material above to synthesize 10 adaptive questions.
              </p>
            ) : (
              <Link href="/dashboard" className="block">
                <Button className="w-full gap-2 text-xs h-11 shadow-glow">
                  <Upload className="h-4 w-4" />
                  <span>Upload Materials in Dashboard</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading Quiz Engine...</span>
        </div>
      }
    >
      <QuizView />
    </React.Suspense>
  );
}
