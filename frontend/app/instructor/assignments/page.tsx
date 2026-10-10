"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Eye,
  Plus,
  Sparkles,
  Users,
  Check,
  Save,
  GraduationCap,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatBytes, cn } from "@/lib/utils";
import { CreateAssignmentPanel } from "@/components/CreateAssignmentPanel";

interface ExcelSubmissionRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assignmentId: string;
  assignmentTitle: string;
  course: string;
  fileName: string;
  fileSizeBytes: number;
  fileUrl?: string;
  submittedAt: string;
  isLate: boolean;
  status: "submitted" | "graded" | "pending_review";
  score: number | null; // e.g. 95 out of 100
  feedback?: string;
}

const SEED_SUBMISSIONS: ExcelSubmissionRow[] = [
  {
    id: "sub_seed_1",
    studentId: "stu_1",
    studentName: "Alex Rivera",
    studentEmail: "alex.rivera@adaptflow.edu",
    assignmentId: "asg_1",
    assignmentTitle: "RAG Pipeline Latency & Chunking Analysis",
    course: "Computer Science & AI",
    fileName: "RAG_Chunk_Benchmark_Report_AlexR.pdf",
    fileSizeBytes: 428000,
    submittedAt: "2026-10-10T14:32:00.000Z",
    isLate: false,
    status: "graded",
    score: 96,
    feedback: "Thorough mathematical derivation of cosine re-ranking trade-offs.",
  },
  {
    id: "sub_seed_2",
    studentId: "stu_2",
    studentName: "Marcus Chen",
    studentEmail: "marcus.chen@adaptflow.edu",
    assignmentId: "asg_2",
    assignmentTitle: "Binary Search Tree Rebalancing Proof",
    course: "Computer Science & AI",
    fileName: "AVL_Tree_Proof_MarcusC.pdf",
    fileSizeBytes: 312000,
    submittedAt: "2026-10-10T16:45:00.000Z",
    isLate: false,
    status: "graded",
    score: 92,
    feedback: "Clean balance factor analysis, good edge case coverage.",
  },
  {
    id: "sub_seed_3",
    studentId: "stu_3",
    studentName: "Priya Sharma",
    studentEmail: "priya.sharma@adaptflow.edu",
    assignmentId: "asg_1",
    assignmentTitle: "RAG Pipeline Latency & Chunking Analysis",
    course: "Computer Science & AI",
    fileName: "RAG_Vector_Ingestion_Priya.pdf",
    fileSizeBytes: 512000,
    submittedAt: "2026-10-10T18:10:00.000Z",
    isLate: false,
    status: "pending_review",
    score: null,
    feedback: "",
  },
  {
    id: "sub_seed_4",
    studentId: "stu_4",
    studentName: "David Kim",
    studentEmail: "david.kim@adaptflow.edu",
    assignmentId: "asg_3",
    assignmentTitle: "Thermodynamics & Carnot Cycle Efficiency Analysis",
    course: "Thermodynamics",
    fileName: "Carnot_Cycle_Entropy_DKim.docx",
    fileSizeBytes: 284000,
    submittedAt: "2026-10-09T22:15:00.000Z",
    isLate: true,
    status: "graded",
    score: 84,
    feedback: "Slight late penalty applied (-5%). Derivations are solid.",
  },
  {
    id: "sub_seed_5",
    studentId: "stu_5",
    studentName: "Elena Rostova",
    studentEmail: "elena.rostova@adaptflow.edu",
    assignmentId: "asg_1",
    assignmentTitle: "RAG Pipeline Latency & Chunking Analysis",
    course: "Computer Science & AI",
    fileName: "Semantic_Chunking_Elena.pdf",
    fileSizeBytes: 389000,
    submittedAt: "2026-10-10T20:00:00.000Z",
    isLate: false,
    status: "pending_review",
    score: null,
    feedback: "",
  },
  {
    id: "sub_seed_6",
    studentId: "stu_6",
    studentName: "Sophia Patel",
    studentEmail: "sophia.patel@adaptflow.edu",
    assignmentId: "asg_2",
    assignmentTitle: "Binary Search Tree Rebalancing Proof",
    course: "Computer Science & AI",
    fileName: "RedBlack_vs_AVL_Sophia.pdf",
    fileSizeBytes: 640000,
    submittedAt: "2026-10-10T21:12:00.000Z",
    isLate: false,
    status: "graded",
    score: 98,
    feedback: "Exceptional visual diagrams and asymptotic proofs.",
  },
];

export default function InstructorAssignmentsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ExcelSubmissionRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Grade Modal State
  const [activeGradeRow, setActiveGradeRow] = useState<ExcelSubmissionRow | null>(null);
  const [scoreInput, setScoreInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");

  // Load real student uploads from localStorage and merge with seed submissions
  useEffect(() => {
    let combined = [...SEED_SUBMISSIONS];

    if (typeof window !== "undefined") {
      try {
        const storedSubs = JSON.parse(localStorage.getItem("adaptflow_submissions") || "[]");
        if (Array.isArray(storedSubs) && storedSubs.length > 0) {
          storedSubs.forEach((sub: any, idx: number) => {
            combined.unshift({
              id: sub.id || `sub_user_${Date.now()}_${idx}`,
              studentId: sub.studentId || "student_user",
              studentName: sub.studentName || user?.name || "Student User",
              studentEmail: sub.studentEmail || user?.email || "student@adaptflow.edu",
              assignmentId: sub.assignmentId || "asg_user",
              assignmentTitle: sub.assignmentTitle || "Binary Search Tree Rebalancing Proof",
              course: sub.course || "Computer Science & AI",
              fileName: sub.fileName || "ADAPTFLOW Architecture.pdf",
              fileSizeBytes: sub.fileSizeBytes || 398800,
              fileUrl: sub.fileUrl || "/uploads/principles_of_biology.pdf",
              submittedAt: sub.submittedAt || new Date().toISOString(),
              isLate: false,
              status: "submitted",
              score: 95,
              feedback: "Verified student delivery.",
            });
          });
        }
      } catch (e) {
        console.warn("Notice loading local submissions:", e);
      }
    }

    setSubmissions(combined);
  }, [user?.name, user?.email]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return submissions.filter((row) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        row.studentName.toLowerCase().includes(q) ||
        row.studentEmail.toLowerCase().includes(q) ||
        row.assignmentTitle.toLowerCase().includes(q) ||
        row.fileName.toLowerCase().includes(q) ||
        row.course.toLowerCase().includes(q);

      const matchesCourse = selectedCourse === "all" || row.course === selectedCourse;
      const matchesStatus = selectedStatus === "all" || row.status === selectedStatus;

      return matchesQuery && matchesCourse && matchesStatus;
    });
  }, [submissions, searchQuery, selectedCourse, selectedStatus]);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      "Row",
      "Student Name",
      "Student Email",
      "Student ID",
      "Assignment Title",
      "Course",
      "Uploaded File",
      "File Size",
      "Submission Date",
      "Status",
      "Score",
      "Feedback",
    ];

    const rows = filteredRows.map((r, i) => [
      i + 1,
      `"${r.studentName}"`,
      `"${r.studentEmail}"`,
      `"${r.studentId}"`,
      `"${r.assignmentTitle}"`,
      `"${r.course}"`,
      `"${r.fileName}"`,
      `"${formatBytes(r.fileSizeBytes)}"`,
      `"${new Date(r.submittedAt).toLocaleString()}"`,
      `"${r.status}"`,
      r.score !== null ? r.score : "N/A",
      `"${r.feedback || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AdaptFlow_Cohort_Submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenGradeModal = (row: ExcelSubmissionRow) => {
    setActiveGradeRow(row);
    setScoreInput(row.score !== null ? String(row.score) : "");
    setFeedbackInput(row.feedback || "");
  };

  const handleSaveGrade = () => {
    if (!activeGradeRow) return;
    const numScore = scoreInput.trim() ? Math.min(100, Math.max(0, Number(scoreInput))) : null;

    setSubmissions((prev) =>
      prev.map((row) =>
        row.id === activeGradeRow.id
          ? {
              ...row,
              score: numScore,
              feedback: feedbackInput,
              status: numScore !== null ? "graded" : "pending_review",
            }
          : row
      )
    );

    setActiveGradeRow(null);
  };

  const coursesList = useMemo(() => {
    const s = new Set(submissions.map((r) => r.course));
    return Array.from(s);
  }, [submissions]);

  const gradedCount = submissions.filter((r) => r.status === "graded").length;
  const pendingCount = submissions.filter((r) => r.status !== "graded").length;
  const scoresWithValues = submissions.filter((r) => r.score !== null).map((r) => r.score as number);
  const avgScore =
    scoresWithValues.length > 0
      ? (scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length).toFixed(1)
      : "91.2";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header with Export Excel Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
              <ClipboardList className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Faculty Gradebook Ledger
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 font-medium">Excel View</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Student Assignment Submissions
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time ledger of students who uploaded assignment deliverables. Review files, assign grades, and export reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Export to Excel / CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title="Download CSV spreadsheet file"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export to Excel / CSV</span>
          </button>

          {/* New Assignment */}
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Ledger Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 mb-1">Total Uploads</div>
          <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">+100% verified files</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 mb-1">Graded Submissions</div>
          <div className="text-2xl font-bold text-indigo-600">{gradedCount}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{pendingCount} pending evaluation</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 mb-1">Class Average</div>
          <div className="text-2xl font-bold text-emerald-600">{avgScore}%</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Cohort benchmark: A-</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 mb-1">On-Time Submissions</div>
          <div className="text-2xl font-bold text-gray-900">95.4%</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Fall 2026 Cohort</div>
        </div>
      </div>

      {/* 3. Excel Spreadsheet Toolbar (Filters & Search) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by student name, assignment, or file..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-purple-600 focus:outline-none transition-all"
            />
          </div>

          {/* Course Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/70 px-2.5 py-1.5 text-xs text-gray-700 focus:bg-white focus:border-purple-600 focus:outline-none"
            >
              <option value="all">All Courses</option>
              {coursesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50/70 px-2.5 py-1.5 text-xs text-gray-700 focus:bg-white focus:border-purple-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="pending_review">Pending Review</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{filteredRows.length}</span> student submissions
        </div>
      </div>

      {/* 4. EXCEL-LIKE SPREADSHEET TABLE (Image 3) */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100/90 text-gray-700 font-bold uppercase text-[11px] tracking-wider border-b border-gray-300 select-none">
                <th className="py-3 px-3 w-12 text-center border-r border-gray-200 bg-gray-200/60 font-mono text-gray-500">
                  #
                </th>
                <th className="py-3 px-4 border-r border-gray-200">Student Name & ID</th>
                <th className="py-3 px-4 border-r border-gray-200">Assignment Title</th>
                <th className="py-3 px-4 border-r border-gray-200">Course / Subject</th>
                <th className="py-3 px-4 border-r border-gray-200">Uploaded File</th>
                <th className="py-3 px-4 border-r border-gray-200">Submission Time</th>
                <th className="py-3 px-4 border-r border-gray-200">Grade / Score</th>
                <th className="py-3 px-4 border-r border-gray-200">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono text-[11px]">
              {filteredRows.map((row, idx) => {
                const submissionDate = new Date(row.submittedAt);
                const formattedDate = submissionDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-purple-50/40 transition-colors font-sans"
                  >
                    {/* Row Index (Excel style) */}
                    <td className="py-3.5 px-3 text-center border-r border-gray-200 bg-gray-50/50 font-mono text-gray-400 font-semibold">
                      {idx + 1}
                    </td>

                    {/* Student Name & ID */}
                    <td className="py-3.5 px-4 border-r border-gray-200">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {row.studentName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-xs truncate">
                            {row.studentName}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono truncate">
                            {row.studentEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assignment Title */}
                    <td className="py-3.5 px-4 border-r border-gray-200 max-w-[200px]">
                      <div className="font-semibold text-gray-900 text-xs truncate" title={row.assignmentTitle}>
                        {row.assignmentTitle}
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100">
                        <BookOpen className="h-3 w-3" />
                        <span>{row.course}</span>
                      </span>
                    </td>

                    {/* Uploaded File */}
                    <td className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-800">
                        <FileText className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span className="font-semibold text-xs truncate max-w-[150px]" title={row.fileName}>
                          {row.fileName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ({formatBytes(row.fileSizeBytes)})
                        </span>
                      </div>
                    </td>

                    {/* Submission Time */}
                    <td className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-gray-700 font-medium text-xs">
                          {formattedDate}
                        </span>
                        {row.isLate ? (
                          <span className="text-[9px] font-bold text-red-600 uppercase">
                            Late Submission
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-emerald-600 uppercase">
                            On-Time
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Grade / Score */}
                    <td className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap text-center">
                      {row.score !== null ? (
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span>{row.score}</span>
                          <span className="text-[10px] text-emerald-500">/ 100</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Ungraded</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 border-r border-gray-200 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          row.status === "graded"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : row.status === "pending_review"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        )}
                      >
                        {row.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Download File */}
                        <a
                          href={row.fileUrl || "/uploads/principles_of_biology.pdf"}
                          download={row.fileName}
                          className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Download Student File"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>

                        {/* Grade / Feedback Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenGradeModal(row)}
                          className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                        >
                          Grade / Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400">
            No submissions matched your search filters.
          </div>
        )}
      </div>

      {/* 5. Quick Grade & Feedback Modal */}
      {activeGradeRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Grade Submission</h3>
              </div>
              <button
                onClick={() => setActiveGradeRow(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3 space-y-1">
                <div className="font-bold text-gray-900 text-sm">{activeGradeRow.studentName}</div>
                <div className="text-gray-500">{activeGradeRow.assignmentTitle}</div>
                <div className="flex items-center gap-1.5 text-purple-700 pt-1 font-mono">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{activeGradeRow.fileName}</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Score (Out of 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="e.g. 95"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Instructor Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide constructive feedback for the student..."
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveGradeRow(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrade}
                className="rounded-xl bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Save Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Instructor Create Assignment Slide-over Panel */}
      <CreateAssignmentPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSuccess={() => {
          setIsPanelOpen(false);
        }}
      />
    </div>
  );
}
