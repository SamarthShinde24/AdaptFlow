"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function DifficultyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(params ? `/quiz?${params}` : "/quiz");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3 text-xs text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span>Redirecting to Adaptive Quiz Configuration...</span>
    </div>
  );
}

export default function DifficultyPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center gap-3 text-xs text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading Adaptive Quiz Configuration...</span>
        </div>
      }
    >
      <DifficultyRedirect />
    </React.Suspense>
  );
}
