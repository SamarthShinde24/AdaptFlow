"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export default function InstructorDashboard() {
  const { user, assignSubjects } = useAuth();
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    user?.teachingSubjects || ["Biology & Life Sciences", "Computer Science & AI"]
  );
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        text: result.message || "Subjects successfully updated and assigned to cohort.",
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Faculty Portal
            </span>
            <span className="text-xs text-gray-500 font-medium">Cohort Curriculum Control</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.name || "Instructor"}
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Manage course materials, assign curriculum subjects to students, and track automated assessment results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-gray-900">Current Cohort</div>
            <div className="text-xs text-purple-600 font-medium">Fall 2026 Academic Term</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "IN"}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Active Students</span>
            <Users className="h-4 w-4 text-[#6C63FF]" />
          </div>
          <div className="text-2xl font-bold text-gray-900">42</div>
          <div className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" />
            <span>+12% cohort engagement</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Curriculum Subjects</span>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{selectedSubjects.length}</div>
          <div className="mt-1 text-[11px] text-gray-500">Assigned default courses</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Verified Knowledge Units</span>
            <Layers className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">128</div>
          <div className="mt-1 text-[11px] text-gray-500">From uploaded PDFs and slides</div>
        </div>
      </div>

      {/* Curriculum Subject Assignment Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <span>Assign & Reassign Default Subjects</span>
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Select the subjects taught by you. Any student registered or assigned to your cohort will inherit these subjects for source-grounded AI tutors and adaptive quizzes.
            </p>
          </div>

          <button
            onClick={handleSaveSubjects}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 shrink-0"
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

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
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
                    ? "border-purple-600 bg-purple-50/70 shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{sub.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{sub.code}</span>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      isAssigned
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isAssigned && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                {sub.description && (
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
