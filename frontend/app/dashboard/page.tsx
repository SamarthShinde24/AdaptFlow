"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UploadDropzone,
} from "@/components/dashboard/upload-dropzone";
import { UploadProgressList } from "@/components/dashboard/upload-progress-card";
import { MaterialCard } from "@/components/dashboard/material-card";
import {
  Material,
  MaterialType,
  UploadProgressItem,
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
  Sparkles,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await listMaterials();
      setMaterials(data);
    } catch (err: any) {
      console.warn("Could not fetch materials from FastAPI:", err);
      setErrorMessage(
        "Could not connect to FastAPI backend. Ensure python run_server.py is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

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
        // Send file upload to FastAPI
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

        // Poll task status until indexed or failed
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
          } catch (e) {
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

  const handleDismissUpload = (id: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchesType = filterType === "all" || m.material_type === filterType;
    const matchesQuery =
      searchQuery.trim() === "" ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.course_id && m.course_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesQuery;
  });

  // Calculate statistics
  const totalUnits = materials.reduce((acc, m) => acc + (m.total_units_extracted || 0), 0);
  const textbooksCount = materials.filter((m) => m.material_type === "textbook").length;
  const videosCount = materials.filter((m) => m.material_type === "lecture_video").length;
  const slidesCount = materials.filter((m) => m.material_type === "slide_deck").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Structured Knowledge Units</p>
            <h3 className="text-2xl font-bold text-foreground">{totalUnits}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">PDF Textbooks</p>
            <h3 className="text-2xl font-bold text-foreground">{textbooksCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
            <Film className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Lecture Videos</p>
            <h3 className="text-2xl font-bold text-foreground">{videosCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Presentation className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Slide Decks</p>
            <h3 className="text-2xl font-bold text-foreground">{slidesCount}</h3>
          </div>
        </div>
      </div>

      {/* Backend Connection Warning if offline */}
      {errorMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button variant="secondary" size="sm" onClick={fetchMaterials} className="text-xs gap-1">
            <RefreshCw className="h-3 w-3" /> Retry Connection
          </Button>
        </div>
      )}

      {/* Ingestion & Dropzone Area */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Ingest Study Materials
            </h2>
            <p className="text-xs text-muted-foreground">
              Files are automatically parsed into timestamped, page-indexed, and slide-tracked knowledge units.
            </p>
          </div>
        </div>

        <UploadDropzone onFilesSelected={handleFilesSelected} />

        {/* Live Upload Progress Queue */}
        <UploadProgressList items={uploadQueue} onDismiss={handleDismissUpload} />
      </section>

      {/* Uploaded Materials Library */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Knowledge Base Library ({filteredMaterials.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Browse study materials currently active in your adaptive learning model.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..."
                className="h-9 w-44 rounded-lg border border-border bg-secondary/60 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5 text-xs">
              <button
                onClick={() => setFilterType("all")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  filterType === "all" ? "bg-primary text-white font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("textbook")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  filterType === "textbook" ? "bg-primary text-white font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Textbooks
              </button>
              <button
                onClick={() => setFilterType("lecture_video")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  filterType === "lecture_video" ? "bg-primary text-white font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType("slide_deck")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  filterType === "slide_deck" ? "bg-primary text-white font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Slides
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchMaterials}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Refresh list"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Grid of Materials */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-border bg-card/40 animate-pulse"
              />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/30 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              No study materials uploaded yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Drop a textbook PDF, lecture video, or presentation slide deck above to get started with AdaptFlow.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDelete={handleDeleteMaterial}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
