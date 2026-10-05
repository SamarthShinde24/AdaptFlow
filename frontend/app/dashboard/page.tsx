"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";
import { UploadProgressList } from "@/components/dashboard/upload-progress-card";
import { MaterialCard } from "@/components/dashboard/material-card";
import {
  Material,
  MaterialType,
  UploadProgressItem,
  Assignment,
} from "@/lib/types";
import {
  listMaterials,
  uploadMaterial,
  getTaskStatus,
  deleteMaterial,
} from "@/lib/api";
import {
  BookOpen,
  Film,
  Presentation,
  Layers,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  FolderOpen,
  Plus,
  ClipboardList,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pending assignments stats
  const [pendingStats, setPendingStats] = useState<{ count: number; overdue: number }>({
    count: 2,
    overdue: 1,
  });

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.name ? user.name.split(" ")[0].toUpperCase() : "SAM";

  const fetchMaterials = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await listMaterials();
      setMaterials(data);
    } catch (err: any) {
      console.warn("Could not fetch materials from FastAPI:", err);
      setErrorMessage(
        "Could not connect to FastAPI backend server. Ensure python run_server.py is running on port 8000."
      );
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  const fetchAssignmentsStats = useCallback(async () => {
    try {
      const studentId = user?.id || "student_demo_1";
      const res = await fetch(`/api/assignments?student_id=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        const list: Assignment[] = data.assignments || [];
        const nowMs = Date.now();
        const unsubmitted = list.filter(
          (a) => !a.submissions?.some((s) => s.studentId === studentId && s.status === "submitted")
        );
        const overdue = unsubmitted.filter((a) => new Date(a.dueDate).getTime() < nowMs).length;
        setPendingStats({ count: unsubmitted.length, overdue });
      }
    } catch {
      // Keep defaults
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMaterials();
    fetchAssignmentsStats();

    window.addEventListener("assignments_updated", fetchAssignmentsStats);
    return () => {
      window.removeEventListener("assignments_updated", fetchAssignmentsStats);
    };
  }, [fetchMaterials, fetchAssignmentsStats]);

  const handleRetryConnection = () => {
    setIsRetrying(true);
    fetchMaterials();
  };

  // Handle new file drops
  const handleFilesSelected = async (
    files: Array<{
      file: File;
      materialType: MaterialType;
      title: string;
      courseId: string;
      subject: string;
    }>
  ) => {
    for (const item of files) {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const queueItem: UploadProgressItem = {
        id: uploadId,
        file: item.file,
        fileName: item.file.name,
        fileSize: item.file.size,
        materialType: item.materialType,
        status: "uploading",
        progress: 25,
      };

      setUploadQueue((prev) => [queueItem, ...prev]);

      try {
        const res = await uploadMaterial(
          item.file,
          item.materialType,
          item.title,
          item.courseId,
          item.subject
        );

        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === uploadId
              ? {
                  ...q,
                  status: "processing",
                  progress: 60,
                  materialId: res.material.id,
                  taskId: res.task_id,
                }
              : q
          )
        );

        const pollInterval = setInterval(async () => {
          try {
            const taskData = await getTaskStatus(res.task_id);
            if (taskData.status === "indexed") {
              clearInterval(pollInterval);
              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.id === uploadId ? { ...q, status: "ready", progress: 100 } : q
                )
              );
              fetchMaterials();
            } else if (taskData.status === "failed") {
              clearInterval(pollInterval);
              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.id === uploadId
                    ? {
                        ...q,
                        status: "error",
                        progress: 100,
                        errorMessage: taskData.message || "Parsing failed",
                      }
                    : q
                )
              );
            } else {
              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.id === uploadId
                    ? {
                        ...q,
                        progress: Math.min(95, taskData.progress_percentage || 70),
                      }
                    : q
                )
              );
            }
          } catch {
            clearInterval(pollInterval);
          }
        }, 1500);
      } catch (err: any) {
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === uploadId
              ? {
                  ...q,
                  status: "error",
                  errorMessage: err.message || "Upload failed",
                  progress: 100,
                }
              : q
          )
        );
      }
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    await deleteMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRenameMaterial = (id: string, newTitle: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title: newTitle } : m))
    );
  };

  const handleDismissUpload = (id: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const scrollToUpload = () => {
    const el = document.getElementById("upload-zone-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchesType = filterType === "all" || m.material_type === filterType;
    const matchesQuery =
      searchQuery.trim() === "" ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject && m.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.course_id && m.course_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesQuery;
  });

  // Calculate statistics
  const totalUnits = materials.reduce((acc, m) => acc + (m.total_units_extracted || 0), 0);
  const textbooksCount = materials.filter((m) => m.material_type === "textbook").length;
  const videosCount = materials.filter((m) => m.material_type === "lecture_video").length;
  const slidesCount = materials.filter((m) => m.material_type === "slide_deck").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: FULL-WIDTH GREETING BANNER WITH KNOWLEDGE GRAPH SVG     */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-100/90 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50 p-6 sm:p-8 backdrop-blur-md shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-[#6C63FF] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Adaptive AI Learning Workspace</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
              {getGreeting()}, {userName} <span className="inline-block animate-bounce">👋</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              You have <strong className="text-[#6C63FF] font-bold">{pendingStats.count} pending assignments</strong> and{" "}
              <strong className="text-blue-600 font-bold">{materials.length} study materials</strong> ready to study.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/assignments"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-[#6C63FF] border border-purple-200/80 shadow-2xs hover:bg-[#6C63FF] hover:text-white transition-all"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span>View Assignments</span>
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6C63FF] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-all"
              >
                <span>Ask AI Tutor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Abstract SVG Illustration of Books / Knowledge Graph */}
          <div className="relative hidden md:flex items-center justify-center w-72 h-40 shrink-0">
            <svg
              viewBox="0 0 240 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-md select-none pointer-events-none"
            >
              {/* Connecting Vector Lines with pulse effect */}
              <path
                d="M40 70 L90 40 L150 48 L200 32"
                stroke="#6C63FF"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse opacity-40"
              />
              <path
                d="M90 40 L130 92 L180 82 L200 32"
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-40"
              />
              <path
                d="M40 70 L70 110 L130 92"
                stroke="#8B5CF6"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-35"
              />
              <path
                d="M130 92 L150 48"
                stroke="#6366F1"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                className="opacity-30"
              />

              {/* Glowing Knowledge Graph Nodes */}
              <circle cx="40" cy="70" r="14" fill="url(#hero-grad-purple)" filter="drop-shadow(0 2px 4px rgba(108,99,255,0.2))" />
              <circle cx="90" cy="40" r="16" fill="url(#hero-grad-blue)" filter="drop-shadow(0 2px 4px rgba(59,130,246,0.2))" />
              <circle cx="150" cy="48" r="13" fill="url(#hero-grad-cyan)" filter="drop-shadow(0 2px 4px rgba(6,182,212,0.2))" />
              <circle cx="200" cy="32" r="15" fill="url(#hero-grad-purple)" filter="drop-shadow(0 2px 4px rgba(108,99,255,0.2))" />
              <circle cx="130" cy="92" r="18" fill="url(#hero-grad-indigo)" filter="drop-shadow(0 2px 4px rgba(99,102,241,0.2))" />
              <circle cx="70" cy="110" r="12" fill="url(#hero-grad-blue)" />
              <circle cx="180" cy="82" r="13" fill="url(#hero-grad-teal)" />

              {/* Book Symbol inside center node */}
              <g transform="translate(118, 80)">
                <path
                  d="M2 3 C6 1 12 1 16 3 C20 1 26 1 30 3 L30 19 C26 17 20 17 16 19 C12 17 6 17 2 19 Z"
                  fill="white"
                  stroke="#6C63FF"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <path d="M16 3 L16 19" stroke="#6C63FF" strokeWidth="1.75" />
              </g>

              {/* Core Node Inner Highlights */}
              <circle cx="40" cy="70" r="4" fill="white" />
              <circle cx="90" cy="40" r="5" fill="white" />
              <circle cx="150" cy="48" r="4" fill="white" />
              <circle cx="200" cy="32" r="4" fill="white" />
              <circle cx="70" cy="110" r="3.5" fill="white" />
              <circle cx="180" cy="82" r="3.5" fill="white" />

              {/* Color Gradients */}
              <defs>
                <linearGradient id="hero-grad-purple" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6C63FF" />
                </linearGradient>
                <linearGradient id="hero-grad-blue" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <linearGradient id="hero-grad-cyan" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="hero-grad-indigo" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
                <linearGradient id="hero-grad-teal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STAT CARDS: 5 GLASSMORPHISM CARDS WITH BORDER GLOW & TRENDS           */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Structured Knowledge Units */}
        <div className="group relative rounded-2xl border border-purple-100/90 bg-white/80 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#6C63FF]/50 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500/15 to-indigo-500/15 text-[#6C63FF] shadow-xs group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              <span>+18 this week</span>
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {totalUnits}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 font-medium">
              Knowledge Units
            </p>
          </div>
          <div className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Card 2: PDF Textbooks */}
        <div className="group relative rounded-2xl border border-blue-100/90 bg-white/80 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 text-blue-600 shadow-xs group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              <ArrowUpRight className="h-3 w-3" />
              <span>2 new this week</span>
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {textbooksCount}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 font-medium">
              PDF Textbooks (Indexed)
            </p>
          </div>
          <div className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Card 3: Lecture Videos */}
        <div className="group relative rounded-2xl border border-purple-100/90 bg-white/80 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500/15 to-pink-500/15 text-purple-600 shadow-xs group-hover:scale-105 transition-transform">
              <Film className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              <ArrowUpRight className="h-3 w-3" />
              <span>1 new this week</span>
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {videosCount}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 font-medium">
              Lecture Videos (MM:SS)
            </p>
          </div>
          <div className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Card 4: Slide Decks */}
        <div className="group relative rounded-2xl border border-amber-100/90 bg-white/80 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/15 to-orange-500/15 text-amber-600 shadow-xs group-hover:scale-105 transition-transform">
              <Presentation className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <TrendingUp className="h-3 w-3" />
              <span>Verified</span>
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {slidesCount}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 font-medium">
              Slide Decks (Tracked)
            </p>
          </div>
          <div className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Card 5: Pending Assignments (New 5th card) */}
        <Link
          href="/assignments"
          className="group relative rounded-2xl border border-indigo-100/90 bg-white/80 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#6C63FF]/50 hover:shadow-xl cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/15 to-rose-500/15 text-[#6C63FF] shadow-xs group-hover:scale-105 transition-transform">
              <ClipboardList className="h-5 w-5" />
            </div>
            {pendingStats.overdue > 0 ? (
              <div className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span>{pendingStats.overdue} overdue</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                <span>Due soon</span>
              </div>
            )}
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {pendingStats.count}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 font-medium">
              Pending Assignments
            </p>
          </div>
          <div className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </section>

      {/* ========================================================================= */}
      {/* 3. ERROR / CONNECTION BANNER                                              */}
      {/* ========================================================================= */}
      {errorMessage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200/80 border-l-[3px] border-l-amber-500 bg-amber-50/90 p-4 shadow-md text-amber-900">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Backend Connection Notice
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                {errorMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetryConnection}
            disabled={isRetrying}
            className="flex items-center justify-center gap-2 rounded-full bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Connecting..." : "Retry Connection"}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. INGESTION & DROPZONE AREA                                              */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="border-l-[3px] border-[#6C63FF] pl-3.5">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Ingest Study Materials
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Files are automatically parsed into timestamped, page-indexed, and slide-tracked knowledge units.
          </p>
        </div>

        <UploadDropzone onFilesSelected={handleFilesSelected} />

        {/* Live Upload Progress Queue */}
        <UploadProgressList items={uploadQueue} onDismiss={handleDismissUpload} />
      </section>

      {/* ========================================================================= */}
      {/* 5. KNOWLEDGE BASE LIBRARY SECTION (RESPONSIVE GRID 3/2/1)                */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-l-[3px] border-[#6C63FF] pl-3.5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
              <span>Knowledge Base Library</span>
              <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {filteredMaterials.length}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Browse study materials currently active in your adaptive learning model.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..."
                className="h-9 w-48 rounded-xl border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white shadow-xs transition-all"
              />
            </div>

            {/* Filter pills with active fill */}
            <div className="flex rounded-xl border border-gray-200 bg-gray-100/90 p-1 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={cn(
                  "rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer",
                  filterType === "all"
                    ? "bg-[#6C63FF] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType("textbook")}
                className={cn(
                  "rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer",
                  filterType === "textbook"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Textbooks
              </button>
              <button
                type="button"
                onClick={() => setFilterType("lecture_video")}
                className={cn(
                  "rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer",
                  filterType === "lecture_video"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Videos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("slide_deck")}
                className={cn(
                  "rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer",
                  filterType === "slide_deck"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Slides
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMaterials}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 shadow-xs transition-all cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content State: Skeleton vs Illustrated Empty State vs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl border border-gray-200 bg-white/60 p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-10 w-10 rounded-xl bg-gray-200" />
                  <div className="h-5 w-16 rounded-full bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                </div>
                <div className="h-10 w-full rounded-xl bg-gray-100 mt-6" />
              </div>
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          /* Illustrated Modern Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300/90 bg-white/70 backdrop-blur-md p-14 text-center shadow-xs">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-500/15 to-blue-500/15 text-[#6C63FF] shadow-md">
                <FolderOpen className="h-10 w-10" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#6C63FF] text-white shadow-xs">
                <Plus className="h-3.5 w-3.5" />
              </div>
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900 tracking-tight">
              No materials yet
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-gray-500">
              {searchQuery || filterType !== "all"
                ? "No materials match your active search filters. Try clearing or expanding your search."
                : "Drop a textbook PDF, lecture video, or presentation slide deck above to automatically build your grounded AI knowledge base."}
            </p>

            <button
              type="button"
              onClick={scrollToUpload}
              className="mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Upload your first material</span>
            </button>
          </div>
        ) : (
          /* Responsive Grid of Material Cards (3 desktop, 2 tablet, 1 mobile) */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDelete={handleDeleteMaterial}
                onRename={handleRenameMaterial}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
