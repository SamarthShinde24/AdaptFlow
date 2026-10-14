"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSelectSuggestion?: (text: string) => void;
  selectedSourcesCount?: number;
  onToggleSourcesPanel?: () => void;
  suggestions?: string[];
}

export function ChatInput({
  onSendMessage,
  isLoading,
  disabled,
  placeholder = "Ask a question or create something...",
  selectedSourcesCount,
  onToggleSourcesPanel,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = Boolean(input.trim()) && !isLoading && !disabled;

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 space-y-1.5">
      {/* Floating NotebookLM Capsule */}
      <div className="relative flex items-center gap-2 rounded-[30px] sm:rounded-[34px] bg-[#f0f4f9] dark:bg-[#1e1f20] border border-slate-200/70 dark:border-white/10 px-4 py-2 sm:py-2.5 shadow-xs hover:shadow-md focus-within:shadow-md focus-within:border-slate-300 dark:focus-within:border-white/20 transition-all duration-200">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent py-1 px-1.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none max-h-36 leading-relaxed font-normal"
        />

        {/* Right Controls inside Capsule */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedSourcesCount !== undefined && (
            <button
              type="button"
              onClick={onToggleSourcesPanel}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none"
              title="Toggle sources dock"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                {selectedSourcesCount} {selectedSourcesCount === 1 ? "source" : "sources"}
              </span>
            </button>
          )}

          {/* Upward Arrow Circular Send Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!canSend}
            className={cn(
              "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all duration-200 cursor-pointer shrink-0",
              canSend
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 active:scale-95 shadow-sm"
                : "bg-slate-200/80 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed opacity-50"
            )}
            title={isLoading ? "Generating response..." : "Send message"}
          >
            {isLoading ? (
              <StopCircle className="h-4 w-4 animate-spin text-[#6C63FF]" />
            ) : (
              <ArrowUp className="h-4 w-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* NotebookLM Disclaimer Footer */}
      <div className="text-center select-none pt-0.5">
        <p className="text-[11px] text-slate-500 dark:text-zinc-500 font-normal">
          AdaptFlow Notebook can make mistakes, so double-check it.
        </p>
      </div>
    </div>
  );
}
