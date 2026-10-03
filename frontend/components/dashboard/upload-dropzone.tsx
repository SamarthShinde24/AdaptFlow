"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Film,
  Presentation,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFilesSelected: (
    files: Array<{
      file: File;
      materialType: MaterialType;
      title: string;
      courseId: string;
      subject: string;
    }>
  ) => void;
}

export function UploadDropzone({ onFilesSelected }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [courseId, setCourseId] = useState("BIO101");
  const [subject, setSubject] = useState("Biology");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectMaterialType = (fileName: string): MaterialType => {
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if ([".mp4", ".mov", ".mkv", ".webm", ".avi", ".vtt", ".srt"].includes(ext)) {
      return "lecture_video";
    }
    if ([".pptx", ".ppt", ".key"].includes(ext)) {
      return "slide_deck";
    }
    return "textbook"; // default .pdf, .epub, etc.
  };

  const cleanTitleFromFileName = (fileName: string): string => {
    return fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const payload = Array.from(fileList).map((file) => ({
      file,
      materialType: detectMaterialType(file.name),
      title: cleanTitleFromFileName(file.name),
      courseId: courseId || "GENERAL",
      subject: subject || "General Studies",
    }));

    onFilesSelected(payload);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Dropzone container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/10 shadow-glow scale-[1.01]"
            : "border-border bg-card/60 hover:border-primary/50 hover:bg-card/90"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.epub,.mp4,.mov,.webm,.mkv,.pptx,.ppt,.vtt,.srt"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary-400 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-glow">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-foreground">
          Drag & Drop Multimodal Study Materials
        </h3>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
          Upload PDF textbooks, lecture videos with audio/subtitles, or slide decks to automatically build your structured knowledge base.
        </p>

        {/* Accepted Formats Tags */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            PDF Textbooks
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">
            <Film className="h-3.5 w-3.5 text-purple-400" />
            Lecture Videos (.mp4, .vtt)
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
            <Presentation className="h-3.5 w-3.5 text-amber-400" />
            Slide Decks (.pptx)
          </span>
        </div>
      </div>

      {/* Metadata Configuration Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/40 p-3 text-xs">
        <span className="font-medium text-muted-foreground flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          Default Ingestion Metadata:
        </span>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <label className="text-muted-foreground whitespace-nowrap">Course:</label>
          <Input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="e.g. CS101, BIO101"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <label className="text-muted-foreground whitespace-nowrap">Subject:</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Molecular Biology"
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
