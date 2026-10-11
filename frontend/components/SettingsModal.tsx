"use client";

import React, { useEffect, useRef } from "react";
import { Settings, X, Moon, User as UserIcon, Keyboard, Palette, CheckCircle2 } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-[#262642] bg-[#141426] p-6 shadow-2xl animate-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262642]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#8B85FF] border border-[#6C63FF]/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-base font-bold text-white tracking-tight">
                Settings & Preferences
              </h3>
              <p className="text-[11px] text-slate-400">
                Workspace environment and account preferences
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1C1C36] hover:text-white transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-xs">
          {/* Appearance Section -- Strictly Obsidian Dark */}
          <div className="rounded-xl border border-[#262642] bg-[#1C1C36]/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#8B85FF]" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Appearance
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Always Dark
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                  <Moon className="h-4 w-4 text-[#8B85FF]" />
                  <span>Obsidian Dark</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Locked to high-contrast Intelligent Minimal Obsidian Dark
                </p>
              </div>

              {/* Active status pill */}
              <div className="flex items-center gap-1.5 rounded-full bg-[#141426] border border-[#262642] px-3 py-1.5 text-[11px] font-semibold text-emerald-300 shadow-inner">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-xl border border-[#262642] bg-[#1C1C36]/70 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <UserIcon className="h-3.5 w-3.5" />
              <span>Logged in account</span>
            </div>
            <div className="font-bold text-white text-sm">
              {user?.name || "Student"}
            </div>
            <div className="text-slate-400">
              {user?.email || "student@adaptflow.edu"}
            </div>
            <div className="pt-1">
              <span className="inline-block rounded-md bg-[#6C63FF]/20 text-[#8B85FF] border border-[#6C63FF]/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                Role: {user?.role || "Student"}
              </span>
            </div>
          </div>

          {/* Interface Shortcuts */}
          <div className="rounded-xl border border-[#262642] bg-[#1C1C36]/70 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
              <Keyboard className="h-3.5 w-3.5 text-[#8B85FF]" />
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Toggle Sidebar (Hide / Show)</span>
              <kbd className="rounded bg-[#141426] px-1.5 py-0.5 text-[10px] text-slate-300 font-mono border border-[#262642] shadow-xs">
                Ctrl + B
              </kbd>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>AI Search (Command Palette)</span>
              <kbd className="rounded bg-[#141426] px-1.5 py-0.5 text-[10px] text-slate-300 font-mono border border-[#262642] shadow-xs">
                Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Send Chat Message</span>
              <kbd className="rounded bg-[#141426] px-1.5 py-0.5 text-[10px] text-slate-300 font-mono border border-[#262642] shadow-xs">
                Enter
              </kbd>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#262642] flex justify-end">
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
