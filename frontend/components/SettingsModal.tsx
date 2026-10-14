"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Settings,
  X,
  Moon,
  Sun,
  User as UserIcon,
  Keyboard,
  Palette,
  Check,
  Brain,
  Volume2,
  VolumeX,
  Database,
  Download,
  Trash2,
  Sparkles,
  ShieldCheck,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserPreferences {
  dailyGoal: number; // 10, 20, 30, 50 cards
  soundEnabled: boolean;
  adaptiveSpacing: boolean;
  strictGrounding: boolean;
  bktTracking: boolean;
  autoRenderDiagrams: boolean;
  highContrast: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  dailyGoal: 20,
  soundEnabled: true,
  adaptiveSpacing: true,
  strictGrounding: true,
  bktTracking: true,
  autoRenderDiagrams: true,
  highContrast: false,
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("adaptflow_user_preferences");
      if (saved) {
        setPrefs((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const updatePref = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem("adaptflow_user_preferences", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleClearCache = () => {
    try {
      // Clear volatile study items while preserving user profile
      const keysToClear = [
        "adaptflow_quiz_draft",
        "adaptflow_recent_searches",
        "adaptflow_study_timer",
        "adaptflow_scratchpad",
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleExportData = () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          name: user?.name || "Student",
          email: user?.email || "student@adaptflow.edu",
          role: user?.role || "Student",
        },
        preferences: prefs,
        bktMasterySnapshot: {
          confidenceScore: 0.88,
          activeKnowledgeState: "Proficient",
          conceptsTracked: 14,
        },
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `adaptflow-study-profile-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => setExportDone(false), 2500);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const isDark = mounted
    ? theme === "dark" || (theme === "system" && resolvedTheme === "dark")
    : true;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-2xl animate-in zoom-in-95 duration-150 transition-colors text-slate-800 dark:text-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#8B85FF] border border-[#6C63FF]/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="settings-modal-title"
                  className="text-base font-bold text-slate-900 dark:text-white tracking-tight"
                >
                  Settings & Preferences
                </h3>
                <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Workspace environment, study goals, AI grounding, and shortcuts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700">
          {/* Section 1: Appearance -- Light & Dark Mode */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Appearance & Theme
                </span>
              </div>
              <ThemeToggle showLabel={true} />
            </div>

            {/* Interactive Theme Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Obsidian Dark Card */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isDark
                    ? "border-[#6C63FF] bg-[#6C63FF]/10 shadow-xs ring-1 ring-[#6C63FF]"
                    : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#09090B] text-indigo-400 border border-[#262642]">
                    <Moon className="h-4 w-4" />
                  </div>
                  {isDark && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  Obsidian Dark
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Deep focus palette with #09090B base
                </p>
              </button>

              {/* Clean Light Card */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !isDark
                    ? "border-[#6C63FF] bg-[#6C63FF]/10 shadow-xs ring-1 ring-[#6C63FF]"
                    : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500 border border-amber-200">
                    <Sun className="h-4 w-4" />
                  </div>
                  {!isDark && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  Clean Light
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Crisp daylight studio palette
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Study Goals & Pacing */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
              <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Study Goals & Pacing
              </span>
            </div>

            {/* Daily Flashcard Goal Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium">Daily Flashcard Goal</span>
                <span className="font-mono text-xs text-[#6C63FF] dark:text-[#8B85FF] font-semibold">
                  {prefs.dailyGoal} Cards / day
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => updatePref("dailyGoal", goal)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      prefs.dailyGoal === goal
                        ? "border-[#6C63FF] bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#8B85FF] shadow-xs"
                        : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {goal} Cards
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Effects Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {prefs.soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                )}
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Audio & Sound Effects
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Subtle chime on card flip, correct answer, and quiz completion
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updatePref("soundEnabled", !prefs.soundEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  prefs.soundEnabled ? "bg-[#6C63FF]" : "bg-slate-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.soundEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Adaptive Spacing Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  Adaptive Spaced Repetition (SRS)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Resurface missed concepts more frequently until mastered
                </div>
              </div>
              <button
                type="button"
                onClick={() => updatePref("adaptiveSpacing", !prefs.adaptiveSpacing)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  prefs.adaptiveSpacing ? "bg-[#6C63FF]" : "bg-slate-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.adaptiveSpacing ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: AI Engine & RAG Grounding */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
              <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                AI Engine & RAG Grounding
              </span>
            </div>

            {/* Bayesian Knowledge Tracing Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Bayesian Knowledge Tracing (BKT)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Compute latent mastery probability P(L) in real-time across topics
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updatePref("bktTracking", !prefs.bktTracking)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  prefs.bktTracking ? "bg-[#6C63FF]" : "bg-slate-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.bktTracking ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Strict Textbook Grounding Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Strict Course Grounding
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Restrict citations and quiz answers strictly to uploaded course sources
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updatePref("strictGrounding", !prefs.strictGrounding)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  prefs.strictGrounding ? "bg-[#6C63FF]" : "bg-slate-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.strictGrounding ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Auto-render Flowcharts Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Auto-Render Topic Flowcharts
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Automatically convert procedural explanations into interactive visual diagrams
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updatePref("autoRenderDiagrams", !prefs.autoRenderDiagrams)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  prefs.autoRenderDiagrams ? "bg-[#6C63FF]" : "bg-slate-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.autoRenderDiagrams ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 4: Account Details */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Logged in account</span>
              </div>
              <span className="inline-block rounded-md bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#8B85FF] border border-[#6C63FF]/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                {user?.role || "Student"}
              </span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {user?.name || "Student"}
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              {user?.email || "student@adaptflow.edu"}
            </div>
          </div>

          {/* Section 5: Data & Cache Management */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
              <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Data & Storage Management
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Clear Cache Button */}
              <button
                type="button"
                onClick={handleClearCache}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer font-medium text-xs"
              >
                {cacheCleared ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Cache Cleared!
                    </span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Clear Local Cache</span>
                  </>
                )}
              </button>

              {/* Export Data Button */}
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer font-medium text-xs"
              >
                {exportDone ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Exported!
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Export Study JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 6: Comprehensive Keyboard Shortcuts */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold text-xs">
              <Keyboard className="h-3.5 w-3.5 text-[#6C63FF] dark:text-[#8B85FF]" />
              <span>Keyboard Shortcuts Reference</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Toggle Sidebar</span>
                <kbd className="rounded bg-white dark:bg-[#121215] px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                  Ctrl + B
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <span>Command Palette / Search</span>
                <kbd className="rounded bg-white dark:bg-[#121215] px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                  Ctrl + K
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <span>Send Chat Message</span>
                <kbd className="rounded bg-white dark:bg-[#121215] px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                  Enter
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <span>Flip Flashcard</span>
                <kbd className="rounded bg-white dark:bg-[#121215] px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                  Space
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <span>Next / Previous Flashcard</span>
                <div className="flex items-center gap-1">
                  <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                    ←
                  </kbd>
                  <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                    →
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Score Card (Mastered / Review)</span>
                <div className="flex items-center gap-1">
                  <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                    C
                  </kbd>
                  <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                    X
                  </kbd>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Toggle Fullscreen Focus Mode</span>
                <div className="flex items-center gap-1">
                  <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                    F
                  </kbd>
                  <span className="text-[10px] text-slate-400">or</span>
                  <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/40">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Preferences save automatically
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-[#6C63FF] to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
