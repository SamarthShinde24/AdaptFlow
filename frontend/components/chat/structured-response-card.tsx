"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Lightbulb,
  BarChart3,
  Search,
  BookOpen,
  Globe2,
  ChevronDown,
  ChevronUp,
  FileText,
  Film,
  Presentation,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  GraduationCap,
} from "lucide-react";
import { CitationReference } from "@/lib/types";
import { MermaidRenderer } from "@/components/chat/mermaid-renderer";
import { CitationChip } from "@/components/chat/citation-chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StructuredResponseCardProps {
  content: string;
  citations?: CitationReference[];
  isStreaming?: boolean;
  onSelectCitation: (citation: CitationReference | null, label: string) => void;
  onFollowUpClick?: (questionText: string) => void;
}

interface ParsedSections {
  explanation: string;
  mermaidCode: string | null;
  breakdown: string;
  sources: string[];
  realWorld: string;
  extractedConcept: string;
}

/**
 * Intelligent parser that extracts:
 * 1. 💡 2-line plain English explanation
 * 2. 📊 Mermaid diagram code
 * 3. 🔍 Breakdown / numbered walkthrough
 * 4. 📖 Source citations
 * 5. 🌍 Real-world example / practical application
 */
function parseResponseContent(rawText: string, isStreaming = false): ParsedSections {
  let text = rawText || "";
  let mermaidCode: string | null = null;
  let explanation = "";
  let breakdown = "";
  let realWorld = "";
  let extractedConcept = "Course Subject";

  // 1. Extract closed ```mermaid ... ``` code block
  const mermaidRegex = /```mermaid\s*([\s\S]*?)```/i;
  const mermaidMatch = text.match(mermaidRegex);

  if (mermaidMatch) {
    mermaidCode = mermaidMatch[1].trim();
  }

  // Detect concept title from text
  const titleMatch =
    text.match(/###\s*(?:\*\*)?([^#*\n\r]+)(?:\*\*)?/i) ||
    text.match(/\*\*([^*]+)\*\*/i);
  if (titleMatch && titleMatch[1]) {
    const rawFound = titleMatch[1].replace(/[0-9.]/g, "").trim();
    if (rawFound.length > 3 && rawFound.length < 50) {
      extractedConcept = rawFound;
    }
  }

  // 2. Identify sections based on structured keywords or markdown headers
  const textWithoutMermaid = text.replace(mermaidRegex, "___MERMAID_PLACEHOLDER___");

  // Check for explicit structured markers (e.g., Explanation, Breakdown, Real-World)
  const lower = textWithoutMermaid.toLowerCase();

  // If formatted with headers
  const parts = textWithoutMermaid.split(/---|\n(?=###|\*\*💡|\*\*1\.|\*\*2\.|\*\*3\.|\*\*4\.|\*\*5\.)/g);

  if (parts.length >= 2) {
    // Sectional approach
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;

      const pLower = p.toLowerCase();
      if (pLower.includes("explanation") || pLower.includes("conceptual foundation") || (!explanation && !p.includes("___MERMAID_PLACEHOLDER___"))) {
        if (!explanation) {
          explanation = p.replace(/###\s*.*explanation.*|###\s*.*foundation.*/gi, "").trim();
          continue;
        }
      }

      if (p.includes("___MERMAID_PLACEHOLDER___") || pLower.includes("breakdown") || pLower.includes("diagram walkthrough") || pLower.includes("mechanics") || pLower.includes("walkthrough")) {
        const cleaned = p.replace("___MERMAID_PLACEHOLDER___", "").replace(/###\s*.*breakdown.*|###\s*.*walkthrough.*|###\s*.*mechanics.*/gi, "").trim();
        if (cleaned) {
          breakdown = breakdown ? `${breakdown}\n\n${cleaned}` : cleaned;
          continue;
        }
      }

      if (pLower.includes("real-world") || pLower.includes("real world") || pLower.includes("example") || pLower.includes("check-for-understanding") || pLower.includes("socratic")) {
        realWorld = p.replace(/###\s*.*real-world.*|###\s*.*check-for-understanding.*/gi, "").trim();
        continue;
      }

      // Default append to breakdown if not categorized
      if (!breakdown) {
        breakdown = p.replace("___MERMAID_PLACEHOLDER___", "").trim();
      } else {
        breakdown = `${breakdown}\n\n${p.replace("___MERMAID_PLACEHOLDER___", "").trim()}`;
      }
    }
  } else {
    // Unstructured text fallback: split before and after mermaid placeholder
    if (textWithoutMermaid.includes("___MERMAID_PLACEHOLDER___")) {
      const [pre, post] = textWithoutMermaid.split("___MERMAID_PLACEHOLDER___");
      explanation = pre.trim();
      breakdown = post ? post.trim() : "";
    } else {
      explanation = text.trim();
    }
  }

  // Clean remaining placeholders
  explanation = explanation.replace("___MERMAID_PLACEHOLDER___", "").trim();
  breakdown = breakdown.replace("___MERMAID_PLACEHOLDER___", "").trim();

  // Extract real-world if buried at end of breakdown
  if (!realWorld && breakdown) {
    const rwMatch = breakdown.match(/(?:real-world(?:\s+use\s+case|\s+example)?|in\s+practice|company\s+use|for\s+example)[\s\S]*$/i);
    if (rwMatch) {
      realWorld = rwMatch[0].trim();
      breakdown = breakdown.replace(rwMatch[0], "").trim();
    }
  }

  // Extract source tags from text
  const sourceMatches = Array.from(text.matchAll(/\[(?:Slide|PDF|Lecture|Video|p\.|Chapter|Ch\.)[^\]]*\]/gi)).map((m) => m[0]);
  const uniqueSources = Array.from(new Set(sourceMatches));

  return {
    explanation: explanation || (isStreaming ? text : "Analyzing topic..."),
    mermaidCode,
    breakdown,
    sources: uniqueSources,
    realWorld,
    extractedConcept,
  };
}

export function StructuredResponseCard({
  content,
  citations = [],
  isStreaming = false,
  onSelectCitation,
  onFollowUpClick,
}: StructuredResponseCardProps) {
  const router = useRouter();

  // Collapsible section toggles: default ALL expanded
  const [openExplanation, setOpenExplanation] = useState(true);
  const [openDiagram, setOpenDiagram] = useState(true);
  const [openBreakdown, setOpenBreakdown] = useState(true);
  const [openSources, setOpenSources] = useState(true);
  const [openRealWorld, setOpenRealWorld] = useState(true);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  const parsed = useMemo(() => parseResponseContent(content), [content, isStreaming]);

  const handleCopyWholeAnswer = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    } catch {}
  };

  const handleLaunchQuiz = () => {
    const topic = parsed.extractedConcept || "Adaptive Assessment";
    router.push(`/quiz?topic=${encodeURIComponent(topic)}`);
  };

  // Generate dynamic follow-up suggestions
  const followUpSuggestions = useMemo(() => {
    const concept = parsed.extractedConcept || "this concept";
    return [
      {
        icon: "🔄",
        label: `Compare with related mechanisms`,
        prompt: `How does ${concept} compare with alternative approaches, edge cases, and trade-offs?`,
      },
      {
        icon: "⚡",
        label: `Show step-by-step execution`,
        prompt: `Can you walk me through a concrete step-by-step example of ${concept} in action?`,
      },
      {
        icon: "📝",
        label: `Quiz me on ${concept}`,
        isQuiz: true,
      },
    ];
  }, [parsed.extractedConcept]);

  /**
   * Helper that finds citation patterns like [Slide 4], [PDF p.12], etc.
   * and renders them as clickable interactive chips.
   */
  const renderTextWithCitationChips = (textSegment: string) => {
    if (!textSegment) return null;

    const citationPattern = /(\[(?:Slide|PDF|Lecture|Video|p\.|Chapter|Ch\.|Sec\.|@|\d{1,2}:\d{2}|Source)[^\]]*\])/gi;
    const parts = textSegment.split(citationPattern);

    return parts.map((part, index) => {
      if (citationPattern.test(part)) {
        const matchedCitation = citations.find(
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

      // Format bold text
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <React.Fragment key={`part-${index}`}>
          {boldParts.map((sub, i) => {
            if (sub.startsWith("**") && sub.endsWith("**") && sub.length > 4) {
              return (
                <strong key={`b-${i}`} className="font-semibold text-foreground">
                  {sub.slice(2, -2)}
                </strong>
              );
            }
            return sub;
          })}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* Main Structured Card Container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm transition-all duration-200">
        {/* Top Card Action Bar */}
        <div className="flex items-center justify-between border-b border-border/80 bg-secondary/30 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-tr from-[#6C63FF] to-indigo-600 text-white shadow-2xs">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="font-bold tracking-tight text-foreground">
              {parsed.extractedConcept}
            </span>
            <span className="hidden sm:inline-block rounded-full border border-border bg-secondary/60 px-2 py-0.2 text-[10px] text-muted-foreground">
              Structured Pedagogical Synthesis
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyWholeAnswer}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              title="Copy Complete Answer"
            >
              {copiedAnswer ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Answer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 1: 💡 Explanation */}
        {parsed.explanation && (
          <div className="border-b border-border/70 last:border-b-0">
            <button
              onClick={() => setOpenExplanation((prev) => !prev)}
              className="flex w-full items-center justify-between bg-primary/5 px-4 py-2.5 text-left text-xs font-bold text-primary transition-colors hover:bg-primary/10 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                <span>💡 Explanation (Core Mental Model)</span>
              </div>
              {openExplanation ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {openExplanation && (
              <div className="p-4 text-sm leading-relaxed text-foreground/95 bg-card/60">
                {renderTextWithCitationChips(parsed.explanation)}
                {isStreaming && (
                  <span className="inline-block h-3.5 w-1.5 ml-1 bg-[#6C63FF] animate-pulse align-middle" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 2: 📊 Visual Diagram */}
        {parsed.mermaidCode && (
          <div className="border-b border-border/70 last:border-b-0">
            <button
              onClick={() => setOpenDiagram((prev) => !prev)}
              className="flex w-full items-center justify-between bg-secondary/30 px-4 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-secondary/50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#6C63FF] shrink-0" />
                <span>📊 Interactive Visual Diagram</span>
              </div>
              {openDiagram ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {openDiagram && (
              <div className="p-3 bg-secondary/15">
                <MermaidRenderer
                  code={parsed.mermaidCode}
                  title={`${parsed.extractedConcept} · Process Architecture`}
                />
              </div>
            )}
          </div>
        )}

        {/* Section 3: 🔍 Breakdown */}
        {parsed.breakdown && (
          <div className="border-b border-border/70 last:border-b-0">
            <button
              onClick={() => setOpenBreakdown((prev) => !prev)}
              className="flex w-full items-center justify-between bg-secondary/20 px-4 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-secondary/40 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500 shrink-0" />
                <span>🔍 Step-by-Step Breakdown</span>
              </div>
              {openBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {openBreakdown && (
              <div className="p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap space-y-2 bg-card/60">
                {renderTextWithCitationChips(parsed.breakdown)}
              </div>
            )}
          </div>
        )}

        {/* Section 4: 📖 Source Citations */}
        {(citations.length > 0 || parsed.sources.length > 0) && (
          <div className="border-b border-border/70 last:border-b-0">
            <button
              onClick={() => setOpenSources((prev) => !prev)}
              className="flex w-full items-center justify-between bg-secondary/10 px-4 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-secondary/30 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>📖 Grounded Source Citations (Click to Inspect)</span>
              </div>
              {openSources ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {openSources && (
              <div className="p-4 bg-card/40 flex flex-wrap items-center gap-2">
                {citations.map((c, i) => (
                  <CitationChip
                    key={`cit-footer-${i}`}
                    label={c.key}
                    citation={c}
                    onClick={(cit, lbl) => onSelectCitation(cit, lbl)}
                  />
                ))}

                {/* Unmatched inline sources */}
                {parsed.sources
                  .filter((s) => !citations.some((c) => c.key.toLowerCase() === s.toLowerCase()))
                  .map((s, idx) => (
                    <button
                      key={`parsed-src-${idx}`}
                      type="button"
                      onClick={() => onSelectCitation(null, s)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <FileText className="h-3 w-3 text-primary" />
                      <span>{s}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Section 5: 🌍 Real-world Example / Check */}
        {parsed.realWorld && (
          <div>
            <button
              onClick={() => setOpenRealWorld((prev) => !prev)}
              className="flex w-full items-center justify-between bg-secondary/15 px-4 py-2.5 text-left text-xs font-bold text-foreground transition-colors hover:bg-secondary/30 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-purple-500 shrink-0" />
                <span>🌍 Real-World Application & Socratic Insight</span>
              </div>
              {openRealWorld ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {openRealWorld && (
              <div className="p-4 text-sm leading-relaxed text-foreground/95 bg-purple-500/5 whitespace-pre-wrap">
                {renderTextWithCitationChips(parsed.realWorld)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Follow-up Suggestions Chips */}
      {!isStreaming && (
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground px-1">
            <Sparkles className="h-3 w-3 text-[#6C63FF]" />
            <span>Suggested Next Steps:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {followUpSuggestions.map((item, idx) => {
              if (item.isQuiz) {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={handleLaunchQuiz}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-3 py-1 text-xs font-bold text-[#6C63FF] hover:bg-[#6C63FF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onFollowUpClick && item.prompt && onFollowUpClick(item.prompt)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-[#6C63FF]/50 hover:bg-secondary/80 hover:text-primary transition-all cursor-pointer shadow-2xs"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
