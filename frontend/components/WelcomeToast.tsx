"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, MessageSquare, ClipboardList, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function WelcomeToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // Only show on main app pages, skip auth pages
    if (!pathname || pathname.startsWith("/auth")) return;

    // Check sessionStorage flag
    try {
      if (typeof window !== "undefined") {
        const alreadyWelcomed = sessionStorage.getItem("welcomed");
        if (alreadyWelcomed) return;
      }
    } catch {
      // ignore storage access errors
    }

    // Appears 3 seconds after dashboard/page mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("welcomed", "true");
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Auto-dismiss countdown after 6 seconds with progress bar running along the bottom
  useEffect(() => {
    if (!isVisible) return;

    const totalDurationMs = 6000;
    const intervalMs = 50;
    const decrement = (intervalMs / totalDurationMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setIsVisible(false);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isVisible]);

  const userName = user?.name ? user.name.split(" ")[0].toUpperCase() : "SAM";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 backdrop-blur-md p-4 shadow-2xl shadow-indigo-500/15"
          role="status"
          aria-live="polite"
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white shadow-xs shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                  <span>Welcome back, {userName}!</span>
                  <span>👋</span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  You have 2 new assignments and 3 materials ready to study
                </p>
              </div>
            </div>

            {/* Manual close button top-right */}
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Inline CTA links */}
          <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-gray-100 text-xs">
            <Link
              href="/assignments"
              onClick={() => setIsVisible(false)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-50/90 px-2.5 py-1 text-[11px] font-semibold text-[#6C63FF] hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <ClipboardList className="h-3 w-3" />
              <span>View Assignments</span>
            </Link>
            <span className="text-gray-300">·</span>
            <Link
              href="/chat"
              onClick={() => setIsVisible(false)}
              className="flex items-center gap-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer"
            >
              <MessageSquare className="h-3 w-3 text-gray-400" />
              <span>Go to Chat</span>
            </Link>
          </div>

          {/* Progress bar running along the bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-[#6C63FF] to-blue-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
