"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Film,
  Presentation,
  HelpCircle,
  Sparkles,
} from "lucide-react";
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
    <div id="upload-zone-section" className="flex flex-col gap-4">
      {/* Glassmorphic Dropzone container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300",
          isDragging
            ? "border-[#6C63FF] bg-purple-50/50 ring-4 ring-purple-300 animate-pulse scale-[1.01] shadow-xl"
            : "border-gray-300/80 bg-white/80 backdrop-blur-md hover:border-[#6C63FF]/50 hover:bg-white hover:shadow-xl"
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

        {/* Floating Upload Icon */}
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6C63FF]/15 to-blue-500/15 text-[#6C63FF] group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-[#6C63FF] group-hover:to-blue-500 group-hover:text-white transition-all duration-300 shadow-md">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#6C63FF] shadow-xs">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>

        <h3 className="mt-5 text-lg font-bold text-gray-900 tracking-tight">
          Drag & Drop Multimodal Study Materials
        </h3>
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-gray-500">
          Upload PDF textbooks, lecture videos with audio/subtitles, or slide decks to automatically build your structured knowledge base.
        </p>

        {/* Accepted Formats Colorful Pill Badges with increased visual weight */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-2 rounded-full border-2 border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-xs hover:scale-105 transition-transform">
            <FileText className="h-4 w-4 text-blue-600" />
            PDF Textbooks
          </span>
          <span className="flex items-center gap-2 rounded-full border-2 border-purple-200 bg-purple-50 px-4 py-1.5 text-xs font-bold text-purple-700 shadow-xs hover:scale-105 transition-transform">
            <Film className="h-4 w-4 text-purple-600" />
            Lecture Videos (.mp4, .vtt)
          </span>
          <span className="flex items-center gap-2 rounded-full border-2 border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-700 shadow-xs hover:scale-105 transition-transform">
            <Presentation className="h-4 w-4 text-amber-600" />
            Slide Decks (.pptx)
          </span>
        </div>
      </div>

      {/* Metadata Configuration Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-3.5 text-xs shadow-xs">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-[#6C63FF]" />
          Default Ingestion Metadata:
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <label className="text-gray-500 font-medium whitespace-nowrap">Course:</label>
          <input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="e.g. CS101, BIO101"
            className="h-8 flex-1 rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <label className="text-gray-500 font-medium whitespace-nowrap">Subject:</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Molecular Biology"
            className="h-8 flex-1 rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white transition-all"
          />
        </div>
      </div>
    </div>
  );
}
