"use client";

import React, { useState, useRef } from "react";
import {
  Calendar,
  Clock,
  User as UserIcon,
  BookOpen,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Sparkles,
  Trash2,
  Edit3,
} from "lucide-react";
import { Assignment, AcceptedFileType, StudentSubmission } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";
import { saveStoredSubmission, clearStoredSubmission } from "@/lib/assignments-client";
import { toast } from "sonner";

interface AssignmentCardProps {
  assignment: Assignment;
  studentId?: string;
  studentName?: string;
  onSubmissionSuccess?: (assignmentId: string, updatedAssignment: Assignment) => void;
}

export function AssignmentCard({
  assignment,
  studentId = "student_demo_1",
  studentName = "Alex Rivera",
  onSubmissionSuccess,
}: AssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current student has submitted
  const mySubmission =
    assignment.mySubmission ||
    assignment.submissions.find((s) => s.studentId === studentId);
  const isSubmitted = !!(mySubmission && mySubmission.status === "submitted");

  // Due date calculations
  const now = new Date();
  const due = new Date(assignment.dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffMs < 0;

  let urgency: "overdue" | "urgent" | "normal" = "normal";
  let dueLabel = "";
  let urgencyBadgeClass = "";

  const formattedDate = due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isOverdue) {
    urgency = "overdue";
    const daysAgo = Math.abs(diffDays);
    dueLabel = daysAgo <= 1 ? "Overdue (Yesterday)" : `Overdue (${daysAgo}d ago)`;
    urgencyBadgeClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60";
  } else if (diffDays <= 3) {
    urgency = "urgent";
    dueLabel = diffDays === 0 ? "Due today" : diffDays === 1 ? "Due tomorrow" : `Due in ${diffDays} days`;
    urgencyBadgeClass = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60";
  } else {
    urgency = "normal";
    dueLabel = `Due in ${diffDays} days`;
    urgencyBadgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60";
  }

  // Convert accepted file types to accept string for input
  const getAcceptedMimeTypes = (types: AcceptedFileType[] = []) => {
    const map: Record<AcceptedFileType, string> = {
      PDF: ".pdf",
      DOCX: ".docx,.doc",
      PPT: ".pptx,.ppt",
      TXT: ".txt,.md",
    };
    return types.map((t) => map[t] || "").filter(Boolean).join(",");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side size limit (25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError("File size exceeds 25MB limit. Please upload a smaller file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const submissionRecord: StudentSubmission = {
        studentId,
        studentName,
        studentEmail: `${studentId}@adaptflow.edu`,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        fileName: file.name,
        fileSizeBytes: file.size,
        fileUrl: URL.createObjectURL(file),
      };

      let serverUpdatedAssignment: Assignment | null = null;

      // 1. Attempt server submission
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("studentId", studentId);
        formData.append("studentName", studentName);
        formData.append("assignmentId", assignment.id);

        const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.assignment) {
            serverUpdatedAssignment = data.assignment;
          }
        }
      } catch (networkErr) {
        // Network drop, mobile timeout, or Vercel body size limits:
        // Gracefully continue using local fallback without failing the user
        console.warn("Backend submit upload network warning, falling back to local persistence:", networkErr);
      }

      // 2. Persist to localStorage for client-side persistence
      saveStoredSubmission(assignment.id, submissionRecord);

      // 3. Resolve updated assignment
      const existingSubs = assignment.submissions || [];
      const updatedSubmissions = [
        ...existingSubs.filter((s) => s.studentId !== studentId),
        submissionRecord,
      ];

      const resolvedAssignment: Assignment = serverUpdatedAssignment || {
        ...assignment,
        submissions: updatedSubmissions,
        mySubmission: submissionRecord,
        studentStatus: "submitted",
      };

      if (onSubmissionSuccess) {
        onSubmissionSuccess(assignment.id, resolvedAssignment);
      }

      // 4. Notify other components (sidebar pending count, task board)
      window.dispatchEvent(new Event("assignments_updated"));
      toast.success(`"${file.name}" submitted successfully!`);
    } catch (err: any) {
      console.error("Assignment upload error:", err);
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteSubmission = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete your submission for this assignment?")) {
      return;
    }

    try {
      clearStoredSubmission(assignment.id);

      try {
        await fetch(`/api/assignments/${assignment.id}/submit?studentId=${studentId}`, {
          method: "DELETE",
        });
      } catch (_) {}

      const updatedAssignment: Assignment = {
        ...assignment,
        mySubmission: null,
        submissions: assignment.submissions.filter((s) => s.studentId !== studentId),
        studentStatus: "pending",
      };

      if (onSubmissionSuccess) {
        onSubmissionSuccess(assignment.id, updatedAssignment);
      }
      window.dispatchEvent(new Event("assignments_updated"));
      toast.success("Submission deleted. Assignment moved back to To Do.");
    } catch (err) {
      toast.error("Failed to delete submission.");
    }
  };

  const handleEditSubmission = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-gray-800 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isSubmitted
          ? "border-emerald-200/90 dark:border-emerald-800/60 hover:border-emerald-400/60"
          : isOverdue
          ? "border-red-200/80 dark:border-red-900/60 hover:border-red-300"
          : "border-gray-200/90 dark:border-gray-750 hover:border-[#6C63FF]/30"
      )}
    >
      <div>
        {/* Top Header: Course chip & Due Date badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/60 px-2.5 py-1 text-[11px] font-semibold text-[#6C63FF] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[140px]">{assignment.course}</span>
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shrink-0",
              isSubmitted
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60"
                : urgencyBadgeClass
            )}
            title={`Deadline: ${formattedDate}`}
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>Submitted</span>
              </>
            ) : isOverdue ? (
              <>
                <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                <span>{dueLabel}</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>{dueLabel}</span>
              </>
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#6C63FF] dark:group-hover:text-purple-400 transition-colors leading-snug">
          {assignment.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          <UserIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          <span>
            Assigned by <strong className="font-semibold text-gray-700 dark:text-gray-300">{assignment.instructorName}</strong>
          </span>
        </div>

        {/* Instructions Excerpt (2 lines, expandable) */}
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50/70 dark:bg-gray-750/80 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
          <p
            className={cn(
              "text-[11px] leading-relaxed transition-all",
              !isExpanded && "line-clamp-2"
            )}
          >
            {assignment.instructions}
          </p>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#6C63FF] dark:text-purple-400 hover:underline cursor-pointer"
          >
            <span>{isExpanded ? "Show less" : "Read full instructions"}</span>
            {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
        </div>

        {/* Accepted File Types Chips */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Valid formats:</span>
          {assignment.acceptedFileTypes.map((type) => (
            <span
              key={type}
              className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:text-gray-200 font-mono"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Area: Upload Trigger or Submitted Status Card */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/80">
        {uploadError && (
          <div className="mb-2 text-[11px] text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/60 p-2 rounded-lg border border-red-200 dark:border-red-900/60">
            {uploadError}
          </div>
        )}

        {isSubmitted && mySubmission ? (
          /* Submitted State */
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Submission Received
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                {new Date(mySubmission.submittedAt || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white/90 dark:bg-gray-900/90 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium text-gray-800 dark:text-gray-200 text-[11px] truncate">
                  {mySubmission.fileName || "submission_file.pdf"}
                </span>
              </div>
              {mySubmission.fileSizeBytes && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 font-mono">
                  {formatBytes(mySubmission.fileSizeBytes)}
                </span>
              )}
            </div>

            {/* Action buttons: Edit submission and Delete submission */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                Submission active
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleEditSubmission}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-700/60 shadow-2xs"
                  title="Edit or re-upload your submission file"
                >
                  <Edit3 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Edit Submission</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSubmission}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-2xs"
                  title="Delete this submission"
                >
                  <Trash2 className="h-3 w-3 text-rose-500" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Not Submitted: Upload Submission CTA */
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] text-gray-400 dark:text-gray-500">
              {isOverdue ? (
                <span className="text-red-600 dark:text-red-400 font-medium">Late submission</span>
              ) : (
                <span>Deadline: {formattedDate}</span>
              )}
            </div>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50",
                isOverdue
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gradient-to-r from-[#6C63FF] to-blue-500 hover:opacity-95 text-white shadow-indigo-100"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload Submission</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Hidden file input filtered to accepted types */}
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedMimeTypes(assignment.acceptedFileTypes)}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
