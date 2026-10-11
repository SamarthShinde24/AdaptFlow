"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, User, Copy, Check } from "lucide-react";
import { ChatMessage as ChatMessageType, CitationReference } from "@/lib/types";
import { CitationChip } from "@/components/chat/citation-chip";
import { StructuredResponseCard } from "@/components/chat/structured-response-card";
import { normalizeChatProse } from "@/lib/stream-utils";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectCitation: (citation: CitationReference | null, label: string) => void;
  onFollowUpClick?: (questionText: string) => void;
}

export function ChatMessage({
  message,
  onSelectCitation,
  onFollowUpClick,
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
        "flex w-full gap-3 py-3",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {/* AI Avatar - Left Aligned */}
      {isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#141426] border border-[#262642] text-[#6C63FF] shadow-xs mt-1">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* Message Body */}
      {isAssistant ? (
        /* Upgraded AI Structured Response Card */
        <div className="w-full max-w-[92%] sm:max-w-[88%] min-w-0">
          <StructuredResponseCard
            content={normalizedContent}
            citations={message.citations}
            isStreaming={message.isStreaming}
            onSelectCitation={onSelectCitation}
            onFollowUpClick={onFollowUpClick}
          />
        </div>
      ) : (
        /* User Message Bubble */
        <div className="group relative flex w-fit max-w-[80%] flex-col rounded-2xl rounded-tr-xs px-4 py-3 text-sm shadow-xs bg-[#1A1A35] border border-[#2E2E5A] text-slate-100 transition-all duration-200">
          <div className="leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Copy Button on Hover */}
          <div className="absolute -top-3 right-3 hidden rounded-md border border-[#262642] bg-[#141426] p-1 shadow-md group-hover:flex items-center gap-1 text-slate-400">
            <button
              onClick={handleCopyUserMessage}
              className="hover:text-white text-xs flex items-center gap-1 p-1 rounded transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* User Avatar - Right Aligned */}
      {!isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#141426] text-slate-300 border border-[#262642] shadow-xs mt-1">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
