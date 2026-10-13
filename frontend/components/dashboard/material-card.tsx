"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Film,
  Presentation,
  Trash2,
  Edit2,
  MoreVertical,
  MessageSquare,
  Sparkles,
  Layers,
  Calendar,
  Eye,
  BookOpen,
} from "lucide-react";
import { Material } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface MaterialCardProps {
  material: Material;
  onDelete: (id: string) => Promise<void>;
  onRename?: (id: string, newTitle: string) => void;
  onView?: (material: Material) => void;
}

export function MaterialCard({
  material,
  onDelete,
  onRename,
  onView,
}: MaterialCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(material.title);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const getModalityMeta = () => {
    switch (material.material_type) {
      case "textbook":
        return {
          icon: FileText,
          color: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
          label: "PDF Textbook",
          badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
          locatorDesc: "Tracked by Page & Chapter",
        };
      case "lecture_video":
        return {
          icon: Film,
          color: "text-purple-600",
          bgColor: "bg-purple-50 border-purple-200",
          label: "Lecture Video",
          badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
          locatorDesc: "Tracked by MM:SS Timestamps",
        };
      case "slide_deck":
        return {
          icon: Presentation,
          color: "text-amber-600",
          bgColor: "bg-amber-50 border-amber-200",
          label: "Slide Deck",
          badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
          locatorDesc: "Tracked by Slide Number & Notes",
        };
      default:
        return {
          icon: FileText,
          color: "text-[#6C63FF]",
          bgColor: "bg-indigo-50 border-indigo-200",
          label: "Document",
          badgeBg: "bg-indigo-50 text-[#6C63FF] border-indigo-200",
          locatorDesc: "Tracked units",
        };
    }
  };

  const meta = getModalityMeta();
  const Icon = meta.icon;

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setIsMenuOpen(false);
    setIsDeleting(true);
    try {
      await onDelete(material.id);
    } catch (err) {
      console.error("Error deleting material:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== material.title) {
      if (onRename) {
        onRename(material.id, editedTitle.trim());
      }
    }
    setIsEditingTitle(false);
    setIsMenuOpen(false);
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-5 shadow-xs hover:border-[#6C63FF]/60 dark:hover:border-[#6C63FF]/60 hover:shadow-md transition-all duration-200 ease-out">
      <div>
        {/* Top bar with icon, status badge, and kebab menu */}
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onView && onView(material)}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${meta.bgColor} ${meta.color} shadow-xs transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer`}
            title={`Click to open ${meta.label}`}
          >
            <Icon className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-1.5">
            {material.status === "indexed" ? (
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                Ready
              </span>
            ) : material.status === "parsing" ? (
              <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 animate-pulse">
                Parsing
              </span>
            ) : material.status === "failed" ? (
              <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                Error
              </span>
            ) : (
              <span className="rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                Queued
              </span>
            )}

            {/* Kebab Menu (⋮) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                title="Options"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onView) onView(material);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    <span>
                      {material.material_type === "lecture_video"
                        ? "Watch Video"
                        : material.material_type === "textbook"
                        ? "Read PDF"
                        : "View Slides"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingTitle(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title and filename */}
        <div className="mt-3.5">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                className="h-7 flex-1 rounded-lg border border-[#6C63FF] bg-white dark:bg-gray-700 px-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="rounded-lg bg-[#6C63FF] px-2 py-1 text-[11px] font-semibold text-white"
              >
                Save
              </button>
            </div>
          ) : (
            <h4
              onClick={() => onView && onView(material)}
              className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 hover:text-[#6C63FF] dark:hover:text-[#a78bfa] transition-colors cursor-pointer"
              title={`${material.title} (Click to open)`}
            >
              {material.title}
            </h4>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1 font-mono">
            {material.filename}
          </p>
        </div>

        {/* Subject & Course Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {material.subject && (
            <span className="rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#6C63FF]">
              {material.subject}
            </span>
          )}
          {material.course_id && (
            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
              {material.course_id}
            </span>
          )}
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeBg}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 font-medium">
            <Layers className="h-3.5 w-3.5 text-[#6C63FF]" />
            <strong className="text-gray-900 dark:text-white font-semibold">
              {material.total_units_extracted}
            </strong>{" "}
            knowledge units
          </span>
          <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{formatBytes(material.file_size_bytes)}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            {formatDate(material.created_at)}
          </span>
          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">{meta.locatorDesc}</span>
        </div>

        {/* Quick Launch Buttons - Pill shaped with hover scale */}
        <div className="mt-1 flex items-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={() => onView(material)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-700/70 hover:bg-gray-100 dark:hover:bg-gray-700 py-1.5 px-2.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xs cursor-pointer"
              title={
                material.material_type === "lecture_video"
                  ? "Watch uploaded lecture video"
                  : material.material_type === "textbook"
                  ? "Read uploaded PDF textbook"
                  : "View presentation slides"
              }
            >
              {material.material_type === "lecture_video" ? (
                <>
                  <Film className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Watch</span>
                </>
              ) : material.material_type === "textbook" ? (
                <>
                  <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Read PDF</span>
                </>
              ) : (
                <>
                  <Presentation className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Slides</span>
                </>
              )}
            </button>
          )}

          <Link href={`/chat?materialId=${material.id}`} className="flex-1">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 py-1.5 px-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#6C63FF] hover:text-[#6C63FF] dark:hover:border-[#6C63FF] dark:hover:text-[#a78bfa] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out shadow-2xs cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#6C63FF] shrink-0" />
              <span className="truncate">Ask AI</span>
            </button>
          </Link>

          <Link href={`/quiz?materialId=${material.id}&title=${encodeURIComponent(material.title)}`} className="flex-1">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#5850EC] py-1.5 px-2.5 text-xs font-semibold text-white shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Quiz</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
