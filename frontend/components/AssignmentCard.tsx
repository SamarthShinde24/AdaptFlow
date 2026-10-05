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
} from "lucide-react";
import { Assignment, AcceptedFileType } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

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
    urgencyBadgeClass = "bg-red-50 text-red-700 border-red-200";
  } else if (diffDays <= 3) {
    urgency = "urgent";
    dueLabel = diffDays === 0 ? "Due today" : diffDays === 1 ? "Due tomorrow" : `Due in ${diffDays} days`;
    urgencyBadgeClass = "bg-amber-50 text-amber-800 border-amber-200";
  } else {
    urgency = "normal";
    dueLabel = `Due in ${diffDays} days`;
    urgencyBadgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
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

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentId);
      formData.append("studentName", studentName);
      formData.append("assignmentId", assignment.id);

      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to upload file");
      }

      const data = await res.json();
      if (onSubmissionSuccess && data.assignment) {
        onSubmissionSuccess(assignment.id, data.assignment);
      }
      window.dispatchEvent(new Event("assignments_updated"));
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isSubmitted
          ? "border-emerald-200/90 hover:border-emerald-400/60"
          : isOverdue
          ? "border-red-200/80 hover:border-red-300"
          : "border-gray-200/90 hover:border-[#6C63FF]/30"
      )}
    >
      <div>
        {/* Top Header: Course chip & Due Date badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/90 px-2.5 py-1 text-[11px] font-semibold text-[#6C63FF] border border-indigo-100">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[140px]">{assignment.course}</span>
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shrink-0",
              isSubmitted
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : urgencyBadgeClass
            )}
            title={`Deadline: ${formattedDate}`}
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Submitted</span>
              </>
            ) : isOverdue ? (
              <>
                <AlertCircle className="h-3 w-3 text-red-500" />
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
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#6C63FF] transition-colors leading-snug">
          {assignment.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
          <UserIcon className="h-3 w-3 text-gray-400" />
          <span>
            Assigned by <strong className="font-semibold text-gray-700">{assignment.instructorName}</strong>
          </span>
        </div>

        {/* Instructions Excerpt (2 lines, expandable) */}
        <div className="mt-3 text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
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
            className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-[#6C63FF] hover:underline cursor-pointer"
          >
            <span>{isExpanded ? "Show less" : "Read full instructions"}</span>
            {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
        </div>

        {/* Accepted File Types Chips */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium">Valid formats:</span>
          {assignment.acceptedFileTypes.map((type) => (
            <span
              key={type}
              className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 font-mono"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Area: Upload Trigger or Submitted Status Card */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {uploadError && (
          <div className="mb-2 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
            {uploadError}
          </div>
        )}

        {isSubmitted && mySubmission ? (
          /* Submitted State */
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Submission Received
              </span>
              <span className="text-[10px] text-emerald-700">
                {new Date(mySubmission.submittedAt || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white/90 p-2 rounded-lg border border-emerald-100 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium text-gray-800 text-[11px] truncate">
                  {mySubmission.fileName || "submission_file.pdf"}
                </span>
              </div>
              {mySubmission.fileSizeBytes && (
                <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                  {formatBytes(mySubmission.fileSizeBytes)}
                </span>
              )}
            </div>

            {/* Re-upload option */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-[10px] font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                {isUploading ? "Uploading..." : "Re-upload file"}
              </button>
            </div>
          </div>
        ) : (
          /* Not Submitted: Upload Submission CTA */
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] text-gray-400">
              {isOverdue ? (
                <span className="text-red-600 font-medium">Late submission</span>
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
