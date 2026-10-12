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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors text-slate-800 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#8B85FF] border border-[#6C63FF]/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="settings-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white tracking-tight"
              >
                Settings & Preferences
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Workspace environment and account preferences
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

        <div className="py-4 space-y-3.5 text-xs">
          {/* Appearance Section -- Light & Dark Mode Selector */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#6C63FF] dark:text-[#8B85FF]" />
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Appearance
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

          {/* Account Details */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <UserIcon className="h-3.5 w-3.5" />
              <span>Logged in account</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {user?.name || "Student"}
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              {user?.email || "student@adaptflow.edu"}
            </div>
            <div className="pt-1">
              <span className="inline-block rounded-md bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#8B85FF] border border-[#6C63FF]/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                Role: {user?.role || "Student"}
              </span>
            </div>
          </div>

          {/* Interface Shortcuts */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/70 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold text-xs">
              <Keyboard className="h-3.5 w-3.5 text-[#6C63FF] dark:text-[#8B85FF]" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Toggle Sidebar (Hide / Show)</span>
              <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                Ctrl + B
              </kbd>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>AI Search (Command Palette)</span>
              <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Send Chat Message</span>
              <kbd className="rounded bg-white dark:bg-[#121215] px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/[0.08] shadow-xs">
                Enter
              </kbd>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-[#6C63FF] to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
