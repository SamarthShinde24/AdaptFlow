"use client";

import React, { useEffect, useRef } from "react";
import { Settings, X, Moon, Sun, User as UserIcon, Keyboard, Palette } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/10 text-[#6C63FF] dark:bg-[#6C63FF]/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
                Settings & Preferences
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Customize appearance and workspace preferences
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Appearance Section */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#6C63FF]" />
                <span className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                  Appearance
                </span>
              </div>
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/80 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">
                Live Theme
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Moon className="h-4 w-4 text-[#6C63FF] hidden dark:inline-block" />
                  <Sun className="h-4 w-4 text-amber-500 inline-block dark:hidden" />
                  <span>Dark Mode</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Switch between pure light and dark workspace themes
                </p>
              </div>

              {/* Smooth Animated Toggle Switch */}
              <ThemeToggle showLabel={true} />
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/70 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
              <UserIcon className="h-3.5 w-3.5" />
              <span>Logged in account</span>
            </div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">
              {user?.name || "Student"}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {user?.email || "student@adaptflow.edu"}
            </div>
            <div className="pt-1">
              <span className="inline-block rounded-md bg-[#6C63FF]/10 dark:bg-[#6C63FF]/20 text-[#6C63FF] px-2 py-0.5 text-[10px] font-bold uppercase">
                Role: {user?.role || "Student"}
              </span>
            </div>
          </div>

          {/* Interface Shortcuts */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/70 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-semibold text-xs">
              <Keyboard className="h-3.5 w-3.5 text-[#6C63FF]" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>Toggle Sidebar (Hide / Show)</span>
              <kbd className="rounded bg-white dark:bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-700 dark:text-gray-200 font-mono border border-gray-200 dark:border-gray-600 shadow-xs">
                Ctrl + B
              </kbd>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>Global Search (Command Palette)</span>
              <kbd className="rounded bg-white dark:bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-700 dark:text-gray-200 font-mono border border-gray-200 dark:border-gray-600 shadow-xs">
                Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>Send Chat Message</span>
              <kbd className="rounded bg-white dark:bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-700 dark:text-gray-200 font-mono border border-gray-200 dark:border-gray-600 shadow-xs">
                Enter
              </kbd>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
