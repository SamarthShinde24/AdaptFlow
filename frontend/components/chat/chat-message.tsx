"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, User, Copy, Check } from "lucide-react";
import { ChatMessage as ChatMessageType, CitationReference } from "@/lib/types";
import { CitationChip } from "@/components/chat/citation-chip";
import { normalizeChatProse } from "@/lib/stream-utils";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectCitation: (citation: CitationReference | null, label: string) => void;
}

export function ChatMessage({ message, onSelectCitation }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  // Normalize assistant content into clean continuous prose paragraphs,
  // healing single-word-per-line wrapping while preserving lists and intentional breaks.
  const normalizedContent = useMemo(() => {
    return isAssistant ? normalizeChatProse(message.content) : message.content;
  }, [message.content, isAssistant]);

  const handleCopy = () => {
    navigator.clipboard.writeText(normalizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Helper that finds citation patterns like [Slide 4], [PDF p.12], [05:20], [Ch. 3]
   * and replaces them with interactive CitationChip components inline.
   */
  const renderContentWithCitations = (text: string) => {
    // Collect known citation keys from the message for robust exact matching
    const knownKeys = (message.citations || [])
      .map((c) => c.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .filter(Boolean);

    const baseCitationPattern =
      "\\[(?:Slide|PDF|Lecture|Video|p\\.|Chapter|Ch\\.|Sec\\.|@|\\d{1,2}:\\d{2}|Source)[^\\]]*\\]";
    const combinedPattern =
      knownKeys.length > 0
        ? `(${[...knownKeys, baseCitationPattern].join("|")})`
        : `(${baseCitationPattern})`;

    const citationRegex = new RegExp(combinedPattern, "gi");
    const parts = text.split(citationRegex);

    return parts.map((part, index) => {
      if (citationRegex.test(part)) {
        // Look up corresponding CitationReference if available in message
        const matchedCitation = message.citations?.find(
          (c) =>
            c.key.toLowerCase() === part.toLowerCase() ||
            part.toLowerCase().includes(c.key.toLowerCase()) ||
            c.key.toLowerCase().includes(part.toLowerCase())
        );

        return (
          <CitationChip
            key={`cit-${index}`}
            label={part}
            citation={matchedCitation}
            onClick={(c, l) => onSelectCitation(c, l)}
          />
        );
      }

      // Render bold markdown inline within text segments
      return renderFormattedInlineText(part, index);
    });
  };

  /**
   * Parses basic inline markdown formatting like **bold** into semantic HTML elements.
   */
  const renderFormattedInlineText = (rawText: string, keyPrefix: string | number) => {
    const boldParts = rawText.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((sub, i) => {
      if (sub.startsWith("**") && sub.endsWith("**") && sub.length > 4) {
        return (
          <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-foreground">
            {sub.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={`${keyPrefix}-t-${i}`}>{sub}</React.Fragment>;
    });
  };

  return (
    <div
      className={cn(
        "flex w-full gap-3 py-4",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {/* AI Avatar - Left Aligned */}
      {isAssistant && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent shadow-glow text-white">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* Message Bubble Container - Max Width ~75% of Chat Container */}
      <div
        className={cn(
          "group relative flex w-fit max-w-[75%] flex-col rounded-2xl p-4 text-sm shadow-sm transition-all",
          isAssistant
            ? "border border-border bg-card/90 text-foreground"
            : "bg-primary text-white shadow-glow"
        )}
      >
        {/* Message Content: uses whitespace-pre-wrap and break-words for continuous prose */}
        <div className="leading-relaxed whitespace-pre-wrap break-words">
          {isAssistant ? (
            <>
              {renderContentWithCitations(normalizedContent)}
              {message.isStreaming && (
                <span className="inline-block h-3.5 w-1.5 ml-1 bg-primary animate-pulse align-middle" />
              )}
            </>
          ) : (
            message.content
          )}
        </div>

        {/* Citations Footer summary for assistant message */}
        {isAssistant && message.citations && message.citations.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-border/70 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-[11px] font-medium mr-1">Cited sources:</span>
            {message.citations.map((c, i) => (
              <CitationChip
                key={i}
                label={c.key}
                citation={c}
                onClick={(cit, lbl) => onSelectCitation(cit, lbl)}
              />
            ))}
          </div>
        )}

        {/* Copy Button on Hover */}
        <div
          className={cn(
            "absolute -top-3 right-3 hidden rounded-md border border-border bg-card p-1 shadow-md group-hover:flex items-center gap-1",
            isAssistant ? "text-muted-foreground" : "text-primary-200"
          )}
        >
          <button
            onClick={handleCopy}
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

      {/* User Avatar - Right Aligned */}
      {!isAssistant && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground border border-border">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
