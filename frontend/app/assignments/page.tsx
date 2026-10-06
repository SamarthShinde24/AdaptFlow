"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  Users,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Trash2,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Assignment, StudentSubmission } from "@/lib/types";
import { AssignmentCard } from "@/components/AssignmentCard";
import { CreateAssignmentPanel } from "@/components/CreateAssignmentPanel";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn, formatBytes } from "@/lib/utils";

function AssignmentsView() {
  const { user } = useAuth();
  const isInstructor = user?.role === "instructor";
  const studentId = user?.id || "student_demo_1";
  const studentName = user?.name || "Alex Rivera";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Fetch task assignments
  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const param = isInstructor
        ? `instructor_id=${user?.id || "inst_mitchell"}`
        : `student_id=${studentId}`;

      const res = await fetch(`/api/assignments?${param}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    window.addEventListener("assignments_updated", fetchAssignments);
    return () => {
      window.removeEventListener("assignments_updated", fetchAssignments);
    };
  }, [user?.id, isInstructor]);

  // Handle student upload callback
  const handleSubmissionSuccess = (assignmentId: string, updatedAssignment: Assignment) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? updatedAssignment : a))
    );
  };

  // Handle instructor delete
  const handleDeleteAssignment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        window.dispatchEvent(new Event("assignments_updated"));
      }
    } catch (err) {
      console.error("Failed to delete assignment", err);
    }
  };

  // Toggle table row expansion
  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  // Filter assignments
  const filtered = assignments.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.course.toLowerCase().includes(q) ||
      a.instructions.toLowerCase().includes(q)
    );
  });

  // Student Kanban categorization: To Do / Submitted / Overdue
  const now = new Date().getTime();

  const todoAssignments = filtered.filter((a) => {
    const hasSubmitted = a.submissions.some((s) => s.studentId === studentId && s.status === "submitted");
    const isOverdue = new Date(a.dueDate).getTime() < now;
    return !hasSubmitted && !isOverdue;
  });

  const submittedAssignments = filtered.filter((a) => {
    return a.submissions.some((s) => s.studentId === studentId && s.status === "submitted");
  });

  const overdueAssignments = filtered.filter((a) => {
    const hasSubmitted = a.submissions.some((s) => s.studentId === studentId && s.status === "submitted");
    const isOverdue = new Date(a.dueDate).getTime() < now;
    return !hasSubmitted && isOverdue;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[#6C63FF] border border-indigo-100">
              <ClipboardList className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold text-[#6C63FF] uppercase tracking-wider">
              {isInstructor ? "Instructor Management" : "Task Board"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {isInstructor ? "Course Assignments & Submissions" : "Assignments & Tasks"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isInstructor
              ? "Create task instructions, enforce submission deadlines, and review student uploads."
              : "Review task requirements, monitor approaching deadlines, and submit your deliverables."}
          </p>
        </div>

        {/* Top Right Action: Instructor New Assignment button */}
        {isInstructor && (
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-blue-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Assignment</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER BAR                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments by title, course, or instructions..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#6C63FF] focus:outline-none transition-all"
          />
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{filtered.length}</span> assignments
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STUDENT VIEW: KANBAN COLUMN LAYOUT (To Do · Submitted · Overdue)       */}
      {/* ========================================================================= */}
      {!isInstructor ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* COLUMN 1: TO DO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-amber-400">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">To Do</h2>
              </div>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                {todoAssignments.length}
              </span>
            </div>

            {todoAssignments.length > 0 ? (
              <div className="space-y-4">
                {todoAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    studentId={studentId}
                    studentName={studentName}
                    onSubmissionSuccess={handleSubmissionSuccess}
                  />
                ))}
              </div>
            ) : (
              /* Empty To Do state: "You're all caught up! 🎉" */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/15 to-teal-500/15 text-emerald-600 mb-3 shadow-xs">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <span>You&apos;re all caught up!</span>
                  <span>🎉</span>
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                  No pending assignments due right now. Enjoy your study session!
                </p>
              </div>
            )}
          </div>

          {/* COLUMN 2: SUBMITTED */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Submitted</h2>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {submittedAssignments.length}
              </span>
            </div>

            {submittedAssignments.length > 0 ? (
              <div className="space-y-4">
                {submittedAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    studentId={studentId}
                    studentName={studentName}
                    onSubmissionSuccess={handleSubmissionSuccess}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center text-xs text-gray-400">
                <CheckCircle2 className="h-8 w-8 text-gray-300 mb-2" />
                <span>No submitted assignments yet.</span>
              </div>
            )}
          </div>

          {/* COLUMN 3: OVERDUE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-red-500">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Overdue</h2>
              </div>
              <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700">
                {overdueAssignments.length}
              </span>
            </div>

            {overdueAssignments.length > 0 ? (
              <div className="space-y-4">
                {overdueAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    studentId={studentId}
                    studentName={studentName}
                    onSubmissionSuccess={handleSubmissionSuccess}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center text-xs text-gray-400">
                <Check className="h-8 w-8 text-emerald-400 mb-2" />
                <span>No overdue assignments! Great job.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 4. INSTRUCTOR VIEW: TABLE VIEW WITH EXPANDABLE STUDENT SUBMISSION ROWS   */
        /* ========================================================================= */
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Title & Course</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Submissions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((assignment) => {
                  const isExpanded = expandedRowId === assignment.id;
                  const total = assignment.assignedStudentIds?.length || 8;
                  const submittedCount = assignment.submissions?.length || 0;
                  const pct = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

                  const isPast = new Date(assignment.dueDate).getTime() < now;
                  const due = new Date(assignment.dueDate);
                  const formattedDue = due.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <React.Fragment key={assignment.id}>
                      {/* Parent Row */}
                      <tr
                        onClick={() => toggleRow(assignment.id)}
                        className={cn(
                          "hover:bg-gray-50/90 transition-colors cursor-pointer",
                          isExpanded && "bg-gray-50/70"
                        )}
                      >
                        {/* Title & Course */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900 text-sm hover:text-[#6C63FF] transition-colors">
                            {assignment.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C63FF]">
                              <BookOpen className="h-3 w-3" />
                              {assignment.course}
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">
                              {assignment.acceptedFileTypes.join(", ")}
                            </span>
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            {assignment.assignedToLabel || `${total} Students`}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
                              isPast
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {formattedDue}
                          </span>
                        </td>

                        {/* Submissions Progress */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="w-32">
                            <div className="flex justify-between text-[11px] font-semibold mb-1 text-gray-800">
                              <span>
                                {submittedCount}/{total}
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-blue-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                              isPast
                                ? "bg-gray-100 text-gray-600"
                                : "bg-emerald-50 text-emerald-700"
                            )}
                          >
                            {isPast ? "Closed" : "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAssignment(assignment.id, e)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Assignment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
                            >
                              <span>{isExpanded ? "Collapse" : "Submissions"}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Child Row: Student Submissions Roster */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50/60 p-4 border-b border-gray-100">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                  <Users className="h-3.5 w-3.5 text-[#6C63FF]" />
                                  <span>Student Submissions Roster ({submittedCount} submitted)</span>
                                </h4>
                                <span className="text-[11px] text-gray-500">
                                  Instructions: {assignment.instructions.slice(0, 80)}...
                                </span>
                              </div>

                              {assignment.submissions && assignment.submissions.length > 0 ? (
                                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                                  {assignment.submissions.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 text-xs hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                          {sub.studentName
                                            .split(" ")
                                            .map((p) => p[0])
                                            .join("")}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-gray-900">
                                            {sub.studentName}
                                          </div>
                                          <div className="text-[10px] text-gray-400">
                                            {sub.studentEmail || "student@adaptflow.edu"}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                                          <FileText className="h-3.5 w-3.5 text-[#6C63FF]" />
                                          <span className="font-medium text-[11px]">
                                            {sub.fileName}
                                          </span>
                                          {sub.fileSizeBytes && (
                                            <span className="text-[10px] text-gray-400">
                                              ({formatBytes(sub.fileSizeBytes)})
                                            </span>
                                          )}
                                        </div>

                                        <span className="text-[11px] text-gray-400">
                                          {new Date(sub.submittedAt || Date.now()).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>

                                        {/* Download button for submitted file */}
                                        <a
                                          href={sub.fileUrl || "#"}
                                          download={sub.fileName || "submission.pdf"}
                                          onClick={(e) => {
                                            if (!sub.fileUrl) {
                                              e.preventDefault();
                                              alert(`Downloading "${sub.fileName}"`);
                                            }
                                          }}
                                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6C63FF] shadow-2xs transition-colors"
                                        >
                                          <Download className="h-3 w-3" />
                                          <span>Download</span>
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-6 text-center text-xs text-gray-400">
                                  No student submissions received yet.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INSTRUCTOR CREATE ASSIGNMENT SLIDE-OVER PANEL                          */}
      {/* ========================================================================= */}
      <CreateAssignmentPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSuccess={(newAssignment) => {
          setAssignments((prev) => [newAssignment, ...prev]);
          window.dispatchEvent(new Event("assignments_updated"));
        }}
        instructorName={user?.name || "Prof. Sarah Mitchell"}
        instructorId={user?.id || "inst_mitchell"}
      />
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <ErrorBoundary fallbackTitle="Assignments View Error">
      <AssignmentsView />
    </ErrorBoundary>
  );
}
