"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";

// Fisher-Yates Shuffle Algorithm (Issue 2)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "fb_q1",
    type: "multiple_choice",
    question: "Where does glycolysis take place within a eukaryotic cell, and what is the net yield of ATP per glucose molecule?",
    options: [
      "Mitochondrial matrix; 4 ATP",
      "Cytosol; 2 ATP",
      "Inner mitochondrial membrane; 32 ATP",
      "Endoplasmic reticulum; 1 ATP",
    ],
    correct_answer: 1,
    explanation: "Glycolysis occurs entirely in the cytosol. While 4 total ATP molecules are produced, 2 ATP are consumed during the initial preparatory phase, resulting in a net yield of 2 ATP per glucose.",
    source_citation: "[Slide 4]",
    difficulty: "medium",
    concept: "Glycolysis & Energy Metabolism",
  },
  {
    id: "fb_q2",
    type: "multiple_choice",
    question: "According to the lecture video discussion on gradient descent convergence, what occurs when the learning rate (alpha) is set excessively high?",
    options: [
      "The algorithm converges monotonically to the global minimum.",
      "The loss function oscillates and may diverge uncontrollably.",
      "The gradient vector automatically resets to zero.",
      "Parameters undergo L2 regularization shrinkage.",
    ],
    correct_answer: 1,
    explanation: "Setting an excessively high learning rate causes parameter updates to overshoot the valley, oscillating wildly and diverging instead of converging.",
    source_citation: "[Lecture 03 @ 12:45]",
    difficulty: "medium",
    concept: "Gradient Descent Optimization",
  },
  {
    id: "fb_q3",
    type: "multiple_choice",
    question: "In Convolutional Neural Networks, what is the primary role of the slide concept 'Stride' during convolution operations?",
    options: [
      "Specifies the number of pixels by which the kernel shifts over the input matrix.",
      "Adds zeros around the border to preserve spatial dimensions.",
      "Applies the ReLU non-linear activation function.",
      "Normalizes the activations across batch dimensions.",
    ],
    correct_answer: 0,
    explanation: "Stride defines the step size (in pixels) by which the convolutional filter slides across the input feature map, directly controlling the spatial downsampling rate.",
    source_citation: "[Slide 7]",
    difficulty: "easy",
    concept: "CNN Architecture & Convolutions",
  },
  {
    id: "fb_q4",
    type: "multiple_choice",
    question: "What electrochemical force directly powers the catalytic rotational head of ATP synthase during oxidative phosphorylation?",
    options: [
      "Proton motive force across the inner mitochondrial membrane.",
      "Direct thermal kinetic diffusion of ADP anions.",
      "Sodium-potassium ATPase antiporter flow.",
      "Active calcium ion efflux through voltage gates.",
    ],
    correct_answer: 0,
    explanation: "Protons accumulated in the intermembrane space flow down their electrochemical gradient through Fo, driving rotational ATP synthesis in F1.",
    source_citation: "[PDF p.48]",
    difficulty: "hard",
    concept: "Oxidative Phosphorylation & Chemiosmosis",
  },
  {
    id: "fb_q5",
    type: "multiple_choice",
    question: "In the speaker notes for the Neural Networks slide deck, what guideline is highlighted regarding weight initialization?",
    options: [
      "Initialize all weights to 1.0 to ensure strong initial gradients.",
      "Break symmetry by using small random numbers drawn from a Gaussian distribution.",
      "Set all biases to negative infinity.",
      "Freeze convolutional filters during the first 10 epochs.",
    ],
    correct_answer: 1,
    explanation: "Zero or constant initialization causes all hidden units to learn identical features; random Gaussian weights break symmetry.",
    source_citation: "[Slide 12]",
    difficulty: "hard",
    concept: "Weight Initialization & Symmetry Breaking",
  },
  {
    id: "fb_q6",
    type: "multiple_choice",
    question: "Which molecule does pyruvate convert into before entering the citric acid cycle?",
    options: [
      "Acetyl-CoA with liberation of CO2 and NADH.",
      "Oxaloacetate via direct ATP carboxylation.",
      "Lactate dehydrogenase intermediate.",
      "Phosphoenolpyruvate via kinase transfer.",
    ],
    correct_answer: 0,
    explanation: "Pyruvate dehydrogenase converts 3-carbon pyruvate into 2-carbon Acetyl-CoA in the mitochondrial matrix.",
    source_citation: "[PDF p.46]",
    difficulty: "medium",
    concept: "Pyruvate Oxidation & Citric Acid Cycle",
  },
  {
    id: "fb_q7",
    type: "multiple_choice",
    question: "Where do the light-dependent reactions of photosynthesis occur inside a plant cell?",
    options: [
      "Thylakoid membranes inside chloroplasts.",
      "Aqueous chloroplast stroma liquid.",
      "Central vacuole storage compartment.",
      "Primary cellulose cell wall matrix.",
    ],
    correct_answer: 0,
    explanation: "Chlorophyll pigments and electron transfer complexes are embedded directly in the thylakoid membrane.",
    source_citation: "[Slide 10]",
    difficulty: "easy",
    concept: "Photosynthesis Light Reactions",
  },
  {
    id: "fb_q8",
    type: "multiple_choice",
    question: "Which enzyme catalyzes the primary carbon fixation reaction in C3 photosynthesis?",
    options: [
      "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase).",
      "PEP carboxylase in mesophyll cells.",
      "Phosphofructokinase rate regulator.",
      "Pyruvate decarboxylase synthetase.",
    ],
    correct_answer: 0,
    explanation: "RuBisCO fixes inorganic CO2 onto the 5-carbon sugar RuBP, generating 3-PGA in the stroma.",
    source_citation: "[PDF p.58]",
    difficulty: "medium",
    concept: "Calvin Cycle & Carbon Fixation",
  },
  {
    id: "fb_q9",
    type: "multiple_choice",
    question: "What is the primary role of DNA topoisomerase (gyrase) ahead of the replication fork?",
    options: [
      "Relieves torsional strain and supercoiling created by helicase unwinding.",
      "Synthesizes short RNA primers required by DNA polymerases.",
      "Seals phosphodiester nicks between adjacent Okazaki fragments.",
      "Maintains single-stranded template stability.",
    ],
    correct_answer: 0,
    explanation: "Topoisomerase cuts and swivels DNA strands to relieve positive supercoils accumulating ahead of the fork.",
    source_citation: "[PDF p.64]",
    difficulty: "medium",
    concept: "DNA Replication & Fork Dynamics",
  },
  {
    id: "fb_q10",
    type: "multiple_choice",
    question: "Which post-transcriptional modification protects mature eukaryotic mRNA from 5' exonuclease degradation?",
    options: [
      "7-methylguanosine (5' cap) linkage.",
      "Poly-adenine tail attached to the 5' end.",
      "Phosphorylation of histone protein tails.",
      "Alternative exon skipping in the 3' UTR.",
    ],
    correct_answer: 0,
    explanation: "A 5'-to-5' triphosphate linkage with 7-methylguanosine protects the transcript and promotes ribosome binding.",
    source_citation: "[PDF p.70]",
    difficulty: "easy",
    concept: "Transcription & RNA Processing",
  },
  {
    id: "fb_q11",
    type: "multiple_choice",
    question: "Into which ribosomal site does an incoming aminoacyl-tRNA first bind during translation elongation?",
    options: [
      "The Aminoacyl (A) site.",
      "The Peptidyl (P) catalytic site.",
      "The Exit (E) discharge site.",
      "The 5' cap binding pocket.",
    ],
    correct_answer: 0,
    explanation: "Charged tRNAs enter the A site guided by elongation factors, where codon matching is verified.",
    source_citation: "[PDF p.75]",
    difficulty: "medium",
    concept: "Translation & Ribosomal Function",
  },
  {
    id: "fb_q12",
    type: "multiple_choice",
    question: "Which ubiquitous second messenger is generated from ATP by adenylyl cyclase upon G-protein stimulation?",
    options: [
      "Cyclic AMP (cAMP).",
      "Inositol 1,4,5-trisphosphate (IP3).",
      "Diacylglycerol (DAG).",
      "Phosphatidylinositol bisphosphate (PIP2).",
    ],
    correct_answer: 0,
    explanation: "Stimulated G-alpha-s activates adenylyl cyclase, converting ATP to cyclic AMP to activate Protein Kinase A.",
    source_citation: "[PDF p.82]",
    difficulty: "easy",
    concept: "Cellular Signal Transduction",
  },
  {
    id: "fb_q13",
    type: "multiple_choice",
    question: "During which phase of the eukaryotic cell cycle is genomic DNA replicated?",
    options: [
      "S Phase (Synthesis).",
      "G1 Phase (First Gap).",
      "G2 Phase (Second Gap).",
      "M Phase (Mitotic division).",
    ],
    correct_answer: 0,
    explanation: "DNA synthesis occurs strictly during the S phase of interphase.",
    source_citation: "[Slide 24]",
    difficulty: "easy",
    concept: "Cell Cycle Checkpoints & Mitosis",
  },
  {
    id: "fb_q14",
    type: "multiple_choice",
    question: "What chromosomal phenomenon during Prophase I allows linked genes on the same chromosome to recombine?",
    options: [
      "Crossing over (chiasma formation) between non-sister chromatids.",
      "Random alignment of bivalents along the metaphase plate.",
      "Sister chromatid separation during Anaphase II.",
      "Nondisjunction of homologous pairs.",
    ],
    correct_answer: 0,
    explanation: "Homologous recombination breaks and reconnects non-sister chromatids, creating recombinant allele combinations.",
    source_citation: "[PDF p.94]",
    difficulty: "medium",
    concept: "Mendelian Genetics & Gene Linkage",
  },
  {
    id: "fb_q15",
    type: "multiple_choice",
    question: "Which RNA component guides Cas9 endonuclease to cut its specific genomic DNA target?",
    options: [
      "Single Guide RNA (sgRNA) containing a 20-nucleotide complementary spacer.",
      "Ribosomal 16S RNA scaffolding arm.",
      "Transfer RNA carrying an initiator methionine.",
      "MicroRNA hairpins targeted for cytoplasmic slicing.",
    ],
    correct_answer: 0,
    explanation: "The guide RNA matches the target sequence adjacent to a Protospacer Adjacent Motif (PAM).",
    source_citation: "[PDF p.102]",
    difficulty: "hard",
    concept: "CRISPR-Cas9 & Biotechnology",
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMaterialId = searchParams.get("materialId");

  const initialDifficulty = searchParams.get("difficulty") as "easy" | "medium" | "advanced" | null;
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "advanced">(initialDifficulty || "medium");

  const [mode, setMode] = useState<QuizMode>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [availablePool, setAvailablePool] = useState<QuizQuestion[]>([]);
  const [shownQuestionIds, setShownQuestionIds] = useState<Set<string>>(new Set());
  const [targetQuizCount, setTargetQuizCount] = useState<number>(10);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generatingFileName, setGeneratingFileName] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerRecord>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Adaptive Quiz Initializer using Fisher-Yates and Set deduplication
  const initializeAdaptiveQuiz = useCallback(
    (
      rawQuestions: QuizQuestion[],
      targetLength: number,
      initialDiff: "easy" | "medium" | "hard" | "advanced" = "medium"
    ) => {
      // 1. Deduplicate questions by question text and ID
      const seenTexts = new Set<string>();
      const uniqueList: QuizQuestion[] = [];

      for (const q of rawQuestions) {
        const textKey = q.question.trim().toLowerCase();
        if (!seenTexts.has(textKey)) {
          seenTexts.add(textKey);
          const mappedDiff: "easy" | "medium" | "hard" =
            (q.difficulty as any) === "advanced" ? "hard" : (q.difficulty as "easy" | "medium" | "hard");
          uniqueList.push({
            ...q,
            difficulty: mappedDiff,
          });
        }
      }

      // Fallback if needed
      const basePool = uniqueList.length > 0 ? uniqueList : FALLBACK_QUESTIONS;

      // 2. Fisher-Yates shuffle of the entire available pool
      const shuffled = shuffle(basePool);

      // 3. Guard: check if unique questions available < requested quiz length
      let effectiveTarget = targetLength;
      if (shuffled.length < targetLength) {
        effectiveTarget = shuffled.length;
        toast.info(`Only ${effectiveTarget} unique questions available for this topic.`);
      }

      // 4. Normalize initial requested difficulty
      const normalizedInitialDiff: "easy" | "medium" | "hard" =
        (initialDiff as any) === "advanced" ? "hard" : (initialDiff as "easy" | "medium" | "hard");

      // Pick first question matching difficulty, or fallback to medium, or first available
      const firstQ =
        shuffled.find((q) => q.difficulty === normalizedInitialDiff) ||
        shuffled.find((q) => q.difficulty === "medium") ||
        shuffled[0];

      const initialShown = new Set<string>([firstQ.id]);

      setAvailablePool(shuffled);
      setTargetQuizCount(effectiveTarget);
      setShownQuestionIds(initialShown);
      setQuestions([firstQ]);
      setCurrentIndex(0);
      setAnswers({});
      setIsCompleted(false);
    },
    []
  );

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
      // If a materialId query parameter was passed
      if (initialMaterialId) {
        // If no difficulty was chosen yet, redirect to difficulty selector
        if (!initialDifficulty) {
          router.push(`/quiz/difficulty?materialId=${initialMaterialId}`);
          return;
        }

        const found = loadedMaterials.find((m) => m.id === initialMaterialId);
        if (found) {
          handleStartMaterialQuiz(found, initialDifficulty);
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
          }, initialDifficulty);
        }
      }
    });
  }, [fetchMaterialsList, initialMaterialId, initialDifficulty, router]);

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
      // Fetch up to 20 questions so adaptive engine has ample variety across difficulty tiers
      const data = await getQuizQuestions(undefined, 20, selectedDifficulty);
      const pool = data && data.length > 0 ? data : FALLBACK_QUESTIONS;
      initializeAdaptiveQuiz(pool, 10, selectedDifficulty);
    } catch (err) {
      console.warn("Using built-in biology questions bank:", err);
      initializeAdaptiveQuiz(FALLBACK_QUESTIONS, 10, selectedDifficulty);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handler: Start "Quiz from My Materials" by selecting a specific file
  const handleStartMaterialQuiz = async (material: Material, diff?: "easy" | "medium" | "advanced") => {
    const activeDiff = diff || selectedDifficulty;
    setSelectedDifficulty(activeDiff);
    setMode("materials");
    setSelectedMaterial(material);
    setGeneratingFileName(material.title || material.filename);
    setGenerationError(null);
    setLoadingQuestions(true);
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);

    try {
      // Fetch up to 20 questions so adaptive engine has ample variety across difficulty tiers
      const generated = await generateQuizQuestions(material.id, 20, activeDiff);
      const pool = generated && generated.length > 0 ? generated : FALLBACK_QUESTIONS;
      initializeAdaptiveQuiz(pool, 10, activeDiff);
    } catch (err: any) {
      console.warn("Material quiz generation fallback to curated bank:", err);
      initializeAdaptiveQuiz(FALLBACK_QUESTIONS, 10, activeDiff);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleReturnToModeSelection = () => {
    setMode(null);
    setSelectedMaterial(null);
    setQuestions([]);
    setAvailablePool([]);
    setShownQuestionIds(new Set());
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setGenerationError(null);
  };

  // Adaptive difficulty selection:
  // Correct answer -> next question picked from difficulty: "hard" pool
  // Wrong answer -> next question picked from difficulty: "easy" pool
  // Use difficulty field on each question object & never show same question twice
  const handleAnswerSubmitted = (record: QuizAnswerRecord) => {
    setAnswers((prev) => ({
      ...prev,
      [record.questionId]: record,
    }));

    // If we haven't reached targetQuizCount, dynamically steer next question
    if (questions.length < targetQuizCount) {
      const desiredDifficulty: "easy" | "hard" = record.isCorrect ? "hard" : "easy";

      // Pick next unshown question from available pool matching desired difficulty
      const nextQ =
        availablePool.find((q) => !shownQuestionIds.has(q.id) && q.difficulty === desiredDifficulty) ||
        availablePool.find((q) => !shownQuestionIds.has(q.id) && q.difficulty === "medium") ||
        availablePool.find((q) => !shownQuestionIds.has(q.id));

      if (nextQ) {
        setShownQuestionIds((prev) => {
          const updated = new Set(prev);
          updated.add(nextQ.id);
          return updated;
        });
        setQuestions((prev) => [...prev, nextQ]);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    if (availablePool.length > 0) {
      initializeAdaptiveQuiz(availablePool, targetQuizCount, selectedDifficulty);
    } else {
      setAnswers({});
      setCurrentIndex(0);
      setIsCompleted(false);
    }
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
              totalQuestions={targetQuizCount}
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
              isLastQuestion={
                currentIndex + 1 >= targetQuizCount ||
                (currentIndex === questions.length - 1 &&
                  !availablePool.some((q) => !shownQuestionIds.has(q.id)))
              }
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
                <span>10 Verified Core Questions (MCQ & Short Answer)</span>
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
    <ErrorBoundary fallbackTitle="Adaptive Quiz Engine Error">
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
    </ErrorBoundary>
  );
}
