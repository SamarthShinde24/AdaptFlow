"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  School,
  BookOpen,
  Users,
  Check,
  Save,
  Loader2,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileText,
  AlertCircle,
  X,
  Search,
  CheckCircle2,
  Clock,
  GraduationCap,
  Download,
  Filter,
  BarChart3,
  ExternalLink,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  enrolledCount?: number;
  materialsCount?: number;
}

interface CohortStudent {
  id: string;
  name: string;
  email: string;
  masteryPct: number;
  quizzesCompleted: number;
  assignmentsSubmitted: number;
  enrolledSubjects: string[];
  lastActive: string;
  status: "active" | "idle";
}

interface KnowledgeUnitPreview {
  id: string;
  citation: string;
  modality: "text" | "slide_content" | "speech_transcript" | "diagram";
  sourceTitle: string;
  excerpt: string;
  confidence: number;
}

const DEFAULT_COHORT_STUDENTS: CohortStudent[] = [
  {
    id: "stu_1",
    name: "Alex Rivera",
    email: "alex.rivera@adaptflow.edu",
    masteryPct: 92,
    quizzesCompleted: 14,
    assignmentsSubmitted: 4,
    enrolledSubjects: ["Computer Science & AI", "Biology & Life Sciences"],
    lastActive: "Active now",
    status: "active",
  },
  {
    id: "stu_2",
    name: "Marcus Chen",
    email: "marcus.chen@adaptflow.edu",
    masteryPct: 88,
    quizzesCompleted: 11,
    assignmentsSubmitted: 4,
    enrolledSubjects: ["Computer Science & AI"],
    lastActive: "15m ago",
    status: "active",
  },
  {
    id: "stu_3",
    name: "Priya Sharma",
    email: "priya.sharma@adaptflow.edu",
    masteryPct: 95,
    quizzesCompleted: 18,
    assignmentsSubmitted: 4,
    enrolledSubjects: ["Biology & Life Sciences", "Computer Science & AI"],
    lastActive: "45m ago",
    status: "active",
  },
  {
    id: "stu_4",
    name: "David Kim",
    email: "david.kim@adaptflow.edu",
    masteryPct: 84,
    quizzesCompleted: 9,
    assignmentsSubmitted: 3,
    enrolledSubjects: ["Computer Science & AI"],
    lastActive: "2h ago",
    status: "idle",
  },
  {
    id: "stu_5",
    name: "Elena Rostova",
    email: "elena.rostova@adaptflow.edu",
    masteryPct: 91,
    quizzesCompleted: 13,
    assignmentsSubmitted: 4,
    enrolledSubjects: ["Biology & Life Sciences"],
    lastActive: "3h ago",
    status: "idle",
  },
  {
    id: "stu_6",
    name: "Sophia Patel",
    email: "sophia.patel@adaptflow.edu",
    masteryPct: 96,
    quizzesCompleted: 20,
    assignmentsSubmitted: 4,
    enrolledSubjects: ["Biology & Life Sciences", "World History & Heritage"],
    lastActive: "Active now",
    status: "active",
  },
  {
    id: "stu_7",
    name: "Liam O'Connor",
    email: "liam.oconnor@adaptflow.edu",
    masteryPct: 78,
    quizzesCompleted: 8,
    assignmentsSubmitted: 3,
    enrolledSubjects: ["Computer Science & AI"],
    lastActive: "5h ago",
    status: "idle",
  },
  {
    id: "stu_8",
    name: "Aisha Khan",
    email: "aisha.khan@adaptflow.edu",
    masteryPct: 89,
    quizzesCompleted: 12,
    assignmentsSubmitted: 4,
    enrolledSubjects: ["Computer Science & AI", "Biology & Life Sciences"],
    lastActive: "Yesterday",
    status: "idle",
  },
  {
    id: "stu_9",
    name: "Lucas Silva",
    email: "lucas.silva@adaptflow.edu",
    masteryPct: 83,
    quizzesCompleted: 10,
    assignmentsSubmitted: 3,
    enrolledSubjects: ["Biology & Life Sciences"],
    lastActive: "Yesterday",
    status: "idle",
  },
  {
    id: "stu_10",
    name: "Noah Miller",
    email: "noah.miller@adaptflow.edu",
    masteryPct: 90,
    quizzesCompleted: 15,
    assignmentsSubmitted: 4,
    enrolledSubjects: ["Computer Science & AI"],
    lastActive: "2d ago",
    status: "idle",
  },
];

const SAMPLE_KNOWLEDGE_UNITS: KnowledgeUnitPreview[] = [
  {
    id: "ku_1",
    citation: "[CS201 | Slide #3: Transformer Architecture]",
    modality: "slide_content",
    sourceTitle: "CS201: Deep Learning & Large Language Models",
    excerpt: "Transformers replace recurrence with multi-head self-attention, allowing token representations to attend to all positions simultaneously with O(1) sequential computation path.",
    confidence: 0.98,
  },
  {
    id: "ku_2",
    citation: "[LLM Foundations | Chapter 2, p. 14]",
    modality: "text",
    sourceTitle: "Foundations of Large Language Models (2024 Ed)",
    excerpt: "Large Language Models operate as probabilistic autoregressive models: given prompt sequence (x_1, ..., x_t), they compute softmax probabilities over vocabulary V to iteratively predict token x_{t+1}.",
    confidence: 0.97,
  },
  {
    id: "ku_3",
    citation: "[Lecture 6 @ 14:20: Pretraining to RLHF]",
    modality: "speech_transcript",
    sourceTitle: "Lecture 6: LLM Training Dynamics & RLHF",
    excerpt: "Pretraining imparts broad world knowledge via self-supervised next-token loss on trillions of tokens. Instruction tuning and RLHF align model outputs to follow user intent safely.",
    confidence: 0.99,
  },
  {
    id: "ku_4",
    citation: "[Enterprise RAG | Slide #7: Retrieval Pipeline]",
    modality: "slide_content",
    sourceTitle: "CS205: Enterprise RAG & Vector Systems",
    excerpt: "RAG connects frozen parametric neural weights to dynamic non-parametric vector databases using dense cosine similarity search and cross-encoder re-ranking.",
    confidence: 0.96,
  },
  {
    id: "ku_5",
    citation: "[Bio 101 Lecture @ 12:30: ATP Synthase Mechanics]",
    modality: "speech_transcript",
    sourceTitle: "Bio 101 Lecture: Cellular Energy Pathways",
    excerpt: "ATP synthase functions as a molecular rotary motor: protons flowing down their electrochemical gradient rotate the catalytic head to phosphorylate ADP into ATP.",
    confidence: 0.98,
  },
  {
    id: "ku_6",
    citation: "[Cellular Bio | Chapter 4, p. 76: Glycolysis Phases]",
    modality: "text",
    sourceTitle: "Principles of Biology (11th Ed)",
    excerpt: "Glycolysis splits one 6-carbon glucose molecule into two 3-carbon pyruvates through energy investment and payoff phases, generating net 2 ATP and 2 NADH.",
    confidence: 0.99,
  },
  {
    id: "ku_7",
    citation: "[Data Structures | Binary Search Tree Invariants]",
    modality: "diagram",
    sourceTitle: "CS201 Data Structures & Algorithms",
    excerpt: "For any node N in a BST, all keys in left subtree are strictly less than key(N), and all keys in right subtree are strictly greater, guaranteeing O(log n) lookups when balanced.",
    confidence: 0.97,
  },
  {
    id: "ku_8",
    citation: "[Jaipur Architecture | City Palace Spatial Design]",
    modality: "text",
    sourceTitle: "The Definitive Jaipur Guide: Architecture & History",
    excerpt: "Vastu Shastra and Shilpa Shastra grid planning established the 9-square grid foundation of Jaipur in 1727, creating symmetric commercial avenues and fortified gateways.",
    confidence: 0.95,
  },
];

export default function InstructorDashboard() {
  const { user, assignSubjects } = useAuth();
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("adaptflow_assigned_subjects");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return user?.teachingSubjects || ["Biology & Life Sciences", "Computer Science & AI"];
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Interactive Modal State (Image 2)
  const [activeModal, setActiveModal] = useState<"students" | "subjects" | "knowledge" | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [selectedModality, setSelectedModality] = useState<string>("all");

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects) setAllSubjects(data.subjects);
      })
      .catch((err) => console.warn("Failed loading subjects:", err));
  }, []);

  const toggleSubject = (name: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleSaveSubjects = async () => {
    if (selectedSubjects.length === 0) {
      setStatusMessage({ type: "error", text: "Please select at least one curriculum subject." });
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      const result = await assignSubjects(selectedSubjects);
      setStatusMessage({
        type: "success",
        text: result?.message || `Successfully assigned ${selectedSubjects.length} subjects to Fall 2026 cohort!`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      setStatusMessage({
        type: "error",
        text: "Failed to update assigned subjects. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtered lists for modals
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return DEFAULT_COHORT_STUDENTS;
    return DEFAULT_COHORT_STUDENTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.enrolledSubjects.some((sub) => sub.toLowerCase().includes(q))
    );
  }, [studentSearch]);

  const filteredKnowledgeUnits = useMemo(() => {
    const q = knowledgeSearch.toLowerCase().trim();
    return SAMPLE_KNOWLEDGE_UNITS.filter((u) => {
      const matchesModality =
        selectedModality === "all" || u.modality === selectedModality;
      const matchesQuery =
        !q ||
        u.citation.toLowerCase().includes(q) ||
        u.sourceTitle.toLowerCase().includes(q) ||
        u.excerpt.toLowerCase().includes(q);
      return matchesModality && matchesQuery;
    });
  }, [knowledgeSearch, selectedModality]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Faculty Portal
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cohort Curriculum Control</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome back, {user?.name || "Instructor"}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Manage course materials, assign curriculum subjects to students, and track automated assessment results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-gray-900 dark:text-white">Current Cohort</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Fall 2026 Academic Term</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "IN"}
          </div>
        </div>
      </div>

      {/* Metrics Grid (Image 2: Made completely Clickable and Interactive!) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Active Students */}
        <div
          onClick={() => setActiveModal("students")}
          className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 select-none relative overflow-hidden"
          title="Click to view all enrolled students in the cohort"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Active Students
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#6C63FF] dark:text-indigo-400 flex items-center justify-center group-hover:bg-[#6C63FF] group-hover:text-white transition-colors">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">42</div>
            <span className="text-[11px] font-semibold text-[#6C63FF] dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <span>View Roster</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" />
            <span>+12% cohort engagement</span>
          </div>
        </div>

        {/* Card 2: Curriculum Subjects */}
        <div
          onClick={() => setActiveModal("subjects")}
          className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 select-none relative overflow-hidden"
          title="Click to inspect all curriculum courses"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Curriculum Subjects
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSubjects.length}</div>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <span>Manage</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Assigned default courses
          </div>
        </div>

        {/* Card 3: Verified Knowledge Units */}
        <div
          onClick={() => setActiveModal("knowledge")}
          className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 select-none relative overflow-hidden"
          title="Click to inspect verified knowledge units and citations"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Verified Knowledge Units
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">128</div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <span>Inspect Units</span>
              <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            From uploaded PDFs and slides
          </div>
        </div>
      </div>

      {/* Curriculum Subject Assignment Card (Image 1: Fixed Save & Assign) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span>Assign & Reassign Default Subjects</span>
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Select the subjects taught by you. Any student registered or assigned to your cohort will inherit these subjects for source-grounded AI tutors and adaptive quizzes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/instructor/assignments"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3.5 py-2.5 text-xs font-semibold shadow-2xs transition-all"
            >
              <ClipboardList className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Submissions Ledger</span>
            </Link>

            <button
              onClick={handleSaveSubjects}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer shrink-0"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save & Assign to Cohort</span>
                </>
              )}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 border transition-all animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allSubjects.map((sub) => {
            const isAssigned = selectedSubjects.includes(sub.name);
            return (
              <div
                key={sub.id}
                onClick={() => toggleSubject(sub.name)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isAssigned
                    ? "border-purple-600 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-xs"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">{sub.name}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{sub.code}</span>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      isAssigned
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    }`}
                  >
                    {isAssigned && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                {sub.description && (
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ACTIVE STUDENTS MODAL (Image 2)                                  */}
      {/* ========================================================================= */}
      {activeModal === "students" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6C63FF] dark:text-indigo-400 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Enrolled Students Cohort (42 Active)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fall 2026 Academic Term · Real-time mastery and engagement metrics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student by name, email, or enrolled subject..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50/80 dark:bg-gray-800 pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-750 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Students List Table */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 pr-1 scrollbar-thin">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                          {student.name}
                        </span>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            student.status === "active" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                          )}
                          title={student.status}
                        />
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{student.email}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.enrolledSubjects.map((sub, i) => (
                          <span
                            key={i}
                            className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.2 rounded font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-right">
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {student.masteryPct}% Mastery
                      </div>
                      <div className="w-20 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${student.masteryPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 text-left min-w-[100px]">
                      <div>{student.quizzesCompleted} Quizzes Taken</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{student.lastActive}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Showing {filteredStudents.length} of 42 students in cohort
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CURRICULUM SUBJECTS MODAL (Image 2)                              */}
      {/* ========================================================================= */}
      {activeModal === "subjects" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Curriculum Subjects Overview ({selectedSubjects.length} Assigned)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active academic courses configured for cohort Fall 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {allSubjects.map((sub) => {
                const isAssigned = selectedSubjects.includes(sub.name);
                return (
                  <div
                    key={sub.id}
                    onClick={() => toggleSubject(sub.name)}
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                      isAssigned
                        ? "bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-600"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{sub.name}</span>
                        <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                          {sub.code}
                        </span>
                        {isAssigned && (
                          <span className="bg-purple-600 text-white text-[10px] px-2 py-0.2 rounded-full font-bold">
                            Assigned to Cohort
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                        {sub.description || "Course materials & quizzes mapped to syllabus standards."}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center shrink-0 border transition-colors",
                        isAssigned
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      )}
                    >
                      {isAssigned && <Check className="h-4 w-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                {selectedSubjects.length} of {allSubjects.length} subjects active
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSaveSubjects();
                    setActiveModal(null);
                  }}
                  className="rounded-xl bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  Save & Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VERIFIED KNOWLEDGE UNITS MODAL (Image 2)                         */}
      {/* ========================================================================= */}
      {activeModal === "knowledge" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Verified Knowledge Units Catalog (128 Units)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Multimodal source-grounded excerpts extracted from PDFs, video transcripts, and slides
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Modality Pills */}
            <div className="py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {[
                  { id: "all", label: "All Units (128)" },
                  { id: "text", label: "Textbooks (52)" },
                  { id: "slide_content", label: "Slides (44)" },
                  { id: "speech_transcript", label: "Transcripts (24)" },
                  { id: "diagram", label: "Diagrams (8)" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedModality(pill.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                      selectedModality === pill.id
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  placeholder="Search citation or concept..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-8 pr-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-750 focus:border-emerald-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Knowledge Units List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 py-2 pr-1 scrollbar-thin space-y-2">
              {filteredKnowledgeUnits.map((ku) => (
                <div key={ku.id} className="pt-3 pb-3 px-2 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 rounded-xl transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
                      {ku.citation}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-bold uppercase">
                        {Math.round(ku.confidence * 100)}% Grounded
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-mono">
                        {ku.modality.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
                    &ldquo;{ku.excerpt}&rdquo;
                  </p>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>Source: {ku.sourceTitle}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Displaying verified source citations mapped into the RAG vector index.
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
