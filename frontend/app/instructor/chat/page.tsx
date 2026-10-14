"use client";

import React from "react";
import { SourceChatView } from "@/components/chat/SourceChatView";
import { ErrorBoundary } from "@/components/error-boundary";

export default function InstructorChatPage() {
  return (
    <ErrorBoundary fallbackTitle="Faculty Source Chat Error">
      <React.Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Faculty Source Chat...</div>}>
        <SourceChatView portal="instructor" />
      </React.Suspense>
    </ErrorBoundary>
  );
}
