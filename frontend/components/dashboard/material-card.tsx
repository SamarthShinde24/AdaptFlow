"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Film,
  Presentation,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Material } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MaterialCardProps {
  material: Material;
  onDelete: (id: string) => Promise<void>;
  onInspectUnits?: (material: Material) => void;
}

export function MaterialCard({
  material,
  onDelete,
  onInspectUnits,
}: MaterialCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getModalityMeta = () => {
    switch (material.material_type) {
      case "textbook":
        return {
          icon: FileText,
          color: "text-blue-400",
          bgColor: "bg-blue-500/10 border-blue-500/20",
          label: "PDF Textbook",
          locatorDesc: "Tracked by Page & Chapter",
        };
      case "lecture_video":
        return {
          icon: Film,
          color: "text-purple-400",
          bgColor: "bg-purple-500/10 border-purple-500/20",
          label: "Lecture Video",
          locatorDesc: "Tracked by MM:SS Timestamps",
        };
      case "slide_deck":
        return {
          icon: Presentation,
          color: "text-amber-400",
          bgColor: "bg-amber-500/10 border-amber-500/20",
          label: "Slide Deck",
          locatorDesc: "Tracked by Slide Number & Notes",
        };
    }
  };

  const meta = getModalityMeta();
  const Icon = meta.icon;

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to remove "${material.title}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(material.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:bg-card-hover hover:shadow-lg">
      <div>
        {/* Top bar with icon and status */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.bgColor} ${meta.color} shadow-sm`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {material.status === "indexed" ? (
              <Badge variant="success">Ready</Badge>
            ) : material.status === "parsing" ? (
              <Badge variant="warning">Parsing</Badge>
            ) : material.status === "failed" ? (
              <Badge variant="destructive">Error</Badge>
            ) : (
              <Badge variant="secondary">Queued</Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-rose-400 transition-colors"
              title="Delete material"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Title and filename */}
        <div className="mt-3.5">
          <h4 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary-300 transition-colors">
            {material.title}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
            {material.filename}
          </p>
        </div>

        {/* Course and Metadata Tags */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {material.course_id && (
            <span className="rounded-md bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
              {material.course_id}
            </span>
          )}
          <span className="rounded-md border border-border/80 bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {meta.label}
          </span>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-4 pt-3.5 border-t border-border/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            <strong className="text-foreground font-semibold">
              {material.total_units_extracted}
            </strong>{" "}
            knowledge units
          </span>
          <span>{formatBytes(material.file_size_bytes)}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(material.created_at)}
          </span>
          <span className="text-[10px] text-primary-400/80">{meta.locatorDesc}</span>
        </div>

        {/* Quick Launch Buttons */}
        <div className="mt-1 flex items-center gap-2">
          <Link
            href={`/chat?materialId=${material.id}`}
            className="flex-1"
          >
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs gap-1.5 hover:border-primary/40 hover:text-white"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              Ask AI
            </Button>
          </Link>

          <Link
            href={`/quiz?materialId=${material.id}`}
            className="flex-1"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 hover:border-accent hover:text-accent"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Quiz Me
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
