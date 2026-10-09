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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent shadow-glow text-white">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* Message Body */}
      {isAssistant ? (
        /* Upgraded AI Structured Response Card */
        <div className="w-full max-w-[85%] sm:max-w-[80%] min-w-0">
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
        <div className="group relative flex w-fit max-w-[75%] flex-col rounded-2xl p-4 text-sm shadow-sm bg-primary text-white shadow-glow">
          <div className="leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Copy Button on Hover */}
          <div className="absolute -top-3 right-3 hidden rounded-md border border-border bg-card p-1 shadow-md group-hover:flex items-center gap-1 text-primary-200">
            <button
              onClick={handleCopyUserMessage}
              className="hover:text-foreground text-xs flex items-center gap-1 p-1 rounded"
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
