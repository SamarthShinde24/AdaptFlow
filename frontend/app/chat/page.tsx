"use client";

import React from "react";
import { SourceChatView } from "@/components/chat/SourceChatView";
import { ErrorBoundary } from "@/components/error-boundary";

export default function StudentChatPage() {
  return (
    <ErrorBoundary fallbackTitle="Source Chat Tutor Error">
      <React.Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Chat Tutor...</div>}>
        <SourceChatView portal="student" />
      </React.Suspense>
    </ErrorBoundary>
  );
}
