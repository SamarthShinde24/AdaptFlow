"use client";

import React from "react";
import {
  FileText,
  Film,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadProgressItem } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface UploadProgressListProps {
  items: UploadProgressItem[];
  onDismiss: (id: string) => void;
}

export function UploadProgressList({ items, onDismiss }: UploadProgressListProps) {
  if (items.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "textbook":
        return <FileText className="h-4 w-4 text-blue-400" />;
      case "lecture_video":
        return <Film className="h-4 w-4 text-purple-400" />;
      case "slide_deck":
        return <Presentation className="h-4 w-4 text-amber-400" />;
      default:
        return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: UploadProgressItem["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="warning" className="flex items-center gap-1 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Extracting Provenance
          </Badge>
        );
      case "ready":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Ready & Indexed
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Active Ingestion Queue ({items.length})</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-3.5 shadow-sm transition-all hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/80 border border-border">
                  {getIcon(item.materialType)}
                </div>
                <div className="truncate">
                  <p className="truncate text-xs font-medium text-foreground">
                    {item.fileName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(item.fileSize)} · {item.materialType.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(item.status)}
                {item.status === "ready" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onDismiss(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress
                value={item.progress}
                className="h-1.5"
                indicatorClassName={
                  item.status === "ready"
                    ? "bg-emerald-400"
                    : item.status === "error"
                    ? "bg-destructive"
                    : "bg-primary"
                }
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>
                  {item.status === "uploading" && `Uploading file (${item.progress}%)...`}
                  {item.status === "processing" && "FastAPI background parser slicing content..."}
                  {item.status === "ready" && "Knowledge base chunks generated with citations."}
                  {item.status === "error" && (item.errorMessage || "Processing failed.")}
                </span>
                <span>{item.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
