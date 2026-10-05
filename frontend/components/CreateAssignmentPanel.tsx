"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ClipboardList,
  Calendar,
  Users,
  FileCheck,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";
import { AcceptedFileType, EnrolledStudent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CreateAssignmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAssignment: any) => void;
  instructorName?: string;
  instructorId?: string;
}

const FILE_TYPE_OPTIONS: Array<{ type: AcceptedFileType; label: string; desc: string }> = [
  { type: "PDF", label: "PDF Document", desc: ".pdf format" },
  { type: "DOCX", label: "Word Document", desc: ".docx, .doc" },
  { type: "PPT", label: "Slide Deck", desc: ".pptx, .ppt" },
  { type: "TXT", label: "Plain Text / Code", desc: ".txt, .md" },
];

const PRESET_COURSES = [
  "Computer Science & AI",
  "Biology & Life Sciences",
  "Organic Chemistry",
  "Data Structures & Algorithms",
  "Bioenergetics",
];

export function CreateAssignmentPanel({
  isOpen,
  onClose,
  onSuccess,
  instructorName = "Prof. Sarah Mitchell",
  instructorId = "inst_mitchell",
}: CreateAssignmentPanelProps) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [course, setCourse] = useState(PRESET_COURSES[0]);
  const [customCourse, setCustomCourse] = useState("");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [acceptedFileTypes, setAcceptedFileTypes] = useState<AcceptedFileType[]>(["PDF", "DOCX"]);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load students for assignment multi-select
  useEffect(() => {
    if (!isOpen) return;

    // Set default due date to 3 days from now at 23:59
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 3);
    defaultDue.setHours(23, 59, 0, 0);
    // Format to YYYY-MM-DDTHH:mm
    const tzOffset = defaultDue.getTimezoneOffset() * 60000;
    const localISOTime = new Date(defaultDue.getTime() - tzOffset).toISOString().slice(0, 16);
    setDueDate(localISOTime);

    const loadStudents = async () => {
      try {
        const res = await fetch("/api/instructor/students");
        if (res.ok) {
          const data = await res.json();
          const list: EnrolledStudent[] = data.students || [];
          setStudents(list);
          setSelectedStudentIds(list.map((s) => s.id));
        }
      } catch (err) {
        console.warn("Failed to load students:", err);
      }
    };

    loadStudents();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFileType = (type: AcceptedFileType) => {
    setAcceptedFileTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide an assignment title.");
      return;
    }
    if (!instructions.trim()) {
      setError("Please provide instructions for your students.");
      return;
    }
    if (!dueDate) {
      setError("Please specify a submission deadline.");
      return;
    }
    if (acceptedFileTypes.length === 0) {
      setError("Please select at least one accepted file type.");
      return;
    }
    if (selectedStudentIds.length === 0) {
      setError("Please assign this task to at least one student.");
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenCourse = isCustomCourse && customCourse.trim() ? customCourse.trim() : course;

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim(),
          course: chosenCourse,
          assignedStudentIds: selectedStudentIds,
          acceptedFileTypes,
          dueDate: new Date(dueDate).toISOString(),
          instructorId,
          instructorName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create assignment");
      }

      const data = await res.json();
      onSuccess(data.assignment);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white shadow-md">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  New Course Assignment
                </h3>
                <p className="text-xs text-gray-500">
                  Assign tasks with deadline enforcement and file uploads
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors shadow-2xs cursor-pointer"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Assignment Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. RAG Pipeline Latency & Chunking Analysis"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
                required
              />
            </div>

            {/* 2. Course / Subject */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Course / Subject *
              </label>
              {!isCustomCourse ? (
                <div className="space-y-1.5">
                  <select
                    value={course}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomCourse(true);
                      } else {
                        setCourse(e.target.value);
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    {PRESET_COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="custom">+ Enter Custom Course...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    placeholder="Enter custom course name..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2 text-xs text-gray-900 focus:bg-white focus:border-[#6C63FF] focus:outline-none transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCourse(false)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* 3. Instructions (Textarea) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Task Instructions & Deliverables *
              </label>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Detail what the student must prepare, required analysis sections, empirical benchmarks, and evaluation criteria..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-indigo-100 transition-all resize-none"
                required
              />
            </div>

            {/* 4. Due Date (Date + Time picker) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Submission Deadline *
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
                  required
                />
              </div>
            </div>

            {/* 5. Accepted File Types */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Accepted File Types (pick at least one) *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {FILE_TYPE_OPTIONS.map((opt) => {
                  const isChecked = acceptedFileTypes.includes(opt.type);
                  return (
                    <div
                      key={opt.type}
                      onClick={() => toggleFileType(opt.type)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all",
                        isChecked
                          ? "border-[#6C63FF] bg-[#6C63FF]/5 shadow-2xs"
                          : "border-gray-200 bg-gray-50/60 hover:bg-white hover:border-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border text-white transition-colors",
                          isChecked
                            ? "bg-[#6C63FF] border-[#6C63FF]"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-gray-900">
                          {opt.type}
                        </span>
                        <span className="block text-[10px] text-gray-400 truncate">
                          {opt.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Assign to Students (Multi-select) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Assign To ({selectedStudentIds.length}/{students.length} students) *
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="text-xs font-semibold text-[#6C63FF] hover:underline cursor-pointer"
                >
                  {selectedStudentIds.length === students.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/60 p-2 space-y-1 scrollbar-thin">
                {students.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-colors",
                        isChecked
                          ? "bg-white text-gray-900 shadow-2xs font-medium"
                          : "hover:bg-white/80 text-gray-600"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border text-white shrink-0",
                            isChecked
                              ? "bg-[#6C63FF] border-[#6C63FF]"
                              : "border-gray-300 bg-white"
                          )}
                        >
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{student.name}</span>
                        <span className="text-[10px] text-gray-400 truncate">({student.course})</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        {student.grade || "Enrolled"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <span>Create Assignment</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
