"use client";

import React, { useMemo, useState } from "react";
import { User, Copy, Check } from "lucide-react";
import { ChatMessage as ChatMessageType, CitationReference } from "@/lib/types";
import { StructuredResponseCard } from "@/components/chat/structured-response-card";
import { normalizeChatProse } from "@/lib/stream-utils";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectCitation: (citation: CitationReference | null, label: string) => void;
  onFollowUpClick?: (questionText: string) => void;
  sourcesCount?: number;
}

export function ChatMessage({
  message,
  onSelectCitation,
  onFollowUpClick,
  sourcesCount,
}: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  // Normalize assistant content into clean continuous prose paragraphs
  const normalizedContent = useMemo(() => {
    return isAssistant ? normalizeChatProse(message.content) : message.content;
  }, [message.content, isAssistant]);

  const handleCopyUserMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex w-full py-2.5",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant ? (
        /* NotebookLM Assistant Flow */
        <div className="w-full min-w-0">
          <StructuredResponseCard
            content={normalizedContent}
            citations={message.citations}
            isStreaming={message.isStreaming}
            onSelectCitation={onSelectCitation}
            onFollowUpClick={onFollowUpClick}
            sourcesCount={sourcesCount}
          />
        </div>
      ) : (
        /* NotebookLM User Message Bubble */
        <div className="group relative flex max-w-[85%] sm:max-w-[75%] items-end gap-2">
          <div className="rounded-[22px] rounded-br-sm bg-[#f0f4f9] dark:bg-[#282a2c] text-slate-900 dark:text-zinc-100 px-4 py-2.5 text-sm shadow-2xs border border-slate-200/50 dark:border-white/5 transition-all">
            <div className="leading-relaxed whitespace-pre-wrap break-words font-medium">
              {message.content}
            </div>

            {/* Quick Copy Button on Hover */}
            <div className="absolute -top-3 right-2 hidden rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 shadow-sm group-hover:flex items-center gap-1 text-slate-500 dark:text-zinc-400">
              <button
                type="button"
                onClick={handleCopyUserMessage}
                className="hover:text-slate-900 dark:hover:text-white text-xs flex items-center p-1 rounded transition-colors"
                title="Copy prompt"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs shadow-2xs">
            <User className="h-3.5 w-3.5" />
          </div>
        </div>
      )}
    </div>
  );
}
