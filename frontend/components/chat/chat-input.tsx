"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, CornerDownLeft, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSelectSuggestion?: (text: string) => void;
}

const STARTER_SUGGESTIONS = [
  "Quiz me on my study materials",
  "What is RAG and how does it work?",
  "Explain cellular respiration & glycolysis with citations",
  "Break down Binary Search Trees from Slide 3",
];

export function ChatInput({
  onSendMessage,
  isLoading,
  disabled,
  placeholder = "Ask any question about your textbooks, videos, or slides...",
  onSelectSuggestion,
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

  return (
    <div className="space-y-3">
      {/* Quick starter suggestions */}
      <div className="hidden sm:flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground dark:text-gray-400 mr-1 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary dark:text-purple-400" /> Suggestions:
        </span>
        {STARTER_SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (onSelectSuggestion) onSelectSuggestion(sug);
              else setInput(sug);
            }}
            className="rounded-full border border-border dark:border-gray-750 bg-card/60 dark:bg-gray-850/80 px-2.5 py-1 text-[11px] text-muted-foreground dark:text-gray-300 hover:border-primary/40 dark:hover:border-purple-400/50 hover:text-foreground dark:hover:text-white transition-all hover:scale-102"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl border border-border dark:border-gray-800 bg-card/95 dark:bg-gray-900/95 p-2 shadow-lg dark:shadow-2xl backdrop-blur-xl focus-within:border-primary/70 dark:focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-primary/20 dark:focus-within:ring-purple-500/20 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-3 py-2 text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:outline-none max-h-36"
        />

        <div className="flex items-center justify-between border-t border-border/60 dark:border-gray-800 px-3 pt-2 text-[11px] text-muted-foreground dark:text-gray-400">
          <div className="flex items-center gap-1">
            <kbd className="rounded bg-secondary dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground dark:text-gray-300">
              Enter
            </kbd>
            <span>to send</span>
            <span className="mx-1">·</span>
            <kbd className="rounded bg-secondary dark:bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground dark:text-gray-300">
              Shift + Enter
            </kbd>
            <span>for new line</span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading || disabled}
            className="h-8 gap-1.5 rounded-lg px-3 text-xs"
          >
            {isLoading ? (
              <>
                <StopCircle className="h-3.5 w-3.5 animate-pulse text-rose-300" />
                <span>Streaming...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
