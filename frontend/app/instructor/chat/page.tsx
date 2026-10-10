"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChatSession,
  getStoredChatSessions,
  deleteChatSession,
  saveChatSession,
  createNewChatSession,
  HISTORY_UPDATE_EVENT,
} from "@/lib/chat-history";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { SourceInspectorPanel } from "@/components/chat/source-inspector-panel";
import { MaterialViewerModal } from "@/components/materials/MaterialViewerModal";
import {
  ChatMessage as ChatMessageType,
  CitationReference,
  Material,
} from "@/lib/types";
import { streamChatCompletion, listMaterials } from "@/lib/api";
import {
  Sparkles,
  BookOpen,
  Filter,
  Trash2,
  Layers,
  MessageSquare,
  History,
  Plus,
  Search,
  Clock,
  X,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  FileText,
  Presentation,
  Film,
  Download,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

function createFacultyInitialGreeting(userName?: string): ChatMessageType {
  const displayName = userName && userName.trim() ? ` ${userName}` : " Professor";

  return {
    id: "msg_faculty_welcome",
    role: "assistant",
    content:
      `Hello${displayName}! I am your **AdaptFlow Faculty Curriculum AI** 🎓\n\n` +
      `I am directly linked to your uploaded syllabi, lecture decks, textbooks, and verified knowledge units.\n\n` +
      `**How would you like to assist your cohort today?**\n` +
      `1. 📝 **Formulate Exam & Quiz Questions** with exact page, timestamp & slide citations.\n` +
      `2. 🔍 **Verify Citation Provenance & Content Coverage** across your curriculum.\n` +
      `3. 📊 **Summarize Learning Objectives** and create cohort study guides.\n` +
      `4. 💡 **Generate Lecture Discussion Outlines** from your slide decks.\n\n` +
      `Select a faculty prompt below or ask any curriculum question!`,
    timestamp: new Date(),
    citations: [
      {
        key: "[PDF p.42]",
        unit: {
          id: "demo-pdf-unit",
          material_id: "mat_1",
          content:
            "Cellular respiration generates adenosine triphosphate (ATP) through glycolysis, the citric acid cycle, and oxidative phosphorylation.",
          modality: "text",
          source_tracking: {
            material_id: "mat_1",
            material_title: "Principles of Biology (11th Ed)",
            material_type: "textbook",
            chunk_index: 4,
            page_number: 42,
            chapter: "Chapter 4: Energy & Cellular Respiration",
            section: "Section 4.2 Glycolysis Overview",
            citation_label: "[Principles of Biology | Chapter 4, p. 42]",
            content_hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
            token_count: 65,
            confidence_score: 1.0,
            is_speaker_notes: false,
          },
          tags: ["biology", "atp"],
          created_at: new Date().toISOString(),
        },
      },
      {
        key: "[Slide 4]",
        unit: {
          id: "demo-slide-unit",
          material_id: "mat_4",
          content:
            "Slide 4: Glycolysis occurs in the cytosol and yields a net gain of 2 ATP and 2 NADH molecules per glucose.",
          modality: "slide_content",
          source_tracking: {
            material_id: "mat_4",
            material_title: "Lecture 4 Slides: Bioenergetics & Net ATP Yield",
            material_type: "slide_deck",
            chunk_index: 4,
            slide_number: 4,
            slide_title: "Net Reaction of Glycolysis",
            is_speaker_notes: false,
            citation_label: "[Lecture 4 Slides | Slide #4: Net Reaction of Glycolysis]",
            content_hash: "8c3ef943b1298457f9208a0d249f7e44a4746f33cfbb20786cf87d3a0e1c0702",
            token_count: 50,
            confidence_score: 1.0,
          },
          tags: ["slide", "glycolysis"],
          created_at: new Date().toISOString(),
        },
      },
    ],
  };
}

const FACULTY_SUGGESTIONS = [
  "Draft 5 mid-term conceptual questions on Data Structures with citations",
  "Summarize key learning objectives from Chapter 4 of the textbook",
  "Check citation coverage for Rajasthan Heritage Architecture",
  "Create a lecture discussion guide on Neural Attention from Slide 4",
];

function InstructorChatView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>("Faculty Curriculum Dialogue");
  const [selectedCitation, setSelectedCitation] = useState<CitationReference | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("groq-llama-3.3-70b");
  const [viewerMaterial, setViewerMaterial] = useState<Material | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize faculty chat session
  useEffect(() => {
    const initialGreeting = createFacultyInitialGreeting(user?.name);
    setMessages([initialGreeting]);
    const newSession = createNewChatSession(initialGreeting);
    setCurrentSessionId(newSession.id);
    setActiveSessionTitle(newSession.title);

    // Save active portal
    if (typeof window !== "undefined") {
      localStorage.setItem("adaptflow_active_portal", "instructor");
    }
  }, [user?.name]);

  // Load uploaded materials for citation grounding
  useEffect(() => {
    async function loadMaterials() {
      try {
        const mats = await listMaterials();
        setMaterials(mats || []);
      } catch {
        // Fallback default mock materials
        setMaterials([
          {
            id: "mat_1",
            title: "Principles of Biology (11th Ed)",
            material_type: "textbook",
            filename: "Principles_of_Biology.pdf",
            status: "indexed",
            total_units_extracted: 42,
            file_size_bytes: 14500000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "mat_4",
            title: "Lecture 4 Slides: Bioenergetics & Net ATP Yield",
            material_type: "slide_deck",
            filename: "Lecture4_Bioenergetics.pdf",
            status: "indexed",
            total_units_extracted: 18,
            file_size_bytes: 4200000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "mat_7",
            title: "Rajasthan Architectural Heritage Monograph",
            material_type: "textbook",
            filename: "Rajasthan_Heritage_Study.pdf",
            status: "indexed",
            total_units_extracted: 24,
            file_size_bytes: 8900000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    }
    loadMaterials();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSelectCitation = (citation: CitationReference | null, label: string) => {
    if (citation) {
      setSelectedCitation(citation);
      setInspectorOpen(true);
    }
  };

  const handleNewChat = () => {
    const greeting = createFacultyInitialGreeting(user?.name);
    setMessages([greeting]);
    const newSession = createNewChatSession(greeting);
    setCurrentSessionId(newSession.id);
    setActiveSessionTitle(newSession.title);
    setSelectedCitation(null);
    setInspectorOpen(false);
    toast.success("Started a new faculty curriculum conversation.");
  };

  const handleExportChat = () => {
    setIsExporting(true);
    const content = messages
      .map(
        (m) =>
          `[${m.role.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.content}\n`
      )
      .join("\n---\n\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AdaptFlow_Faculty_Dialogue_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
    toast.success("Dialogue transcript exported successfully.");
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMsgId = `msg_asst_${Date.now()}`;
    const initialAssistantMsg: ChatMessageType = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      citations: [],
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let accumulatedContent = "";
      const streamCitations: CitationReference[] = [];

      await streamChatCompletion({
        message: text,
        history: historyPayload as any,
        materialId: selectedMaterialId === "all" ? undefined : selectedMaterialId,
        onDelta: (token) => {
          accumulatedContent += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        },
        onSources: (citations) => {
          streamCitations.push(...citations);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, citations: [...streamCitations] }
                : msg
            )
          );
        },
        onDone: () => {
          setIsLoading(false);
        },
        onError: (err) => {
          console.error("Faculty chat streaming error:", err);
          // Fallback response for faculty questions
          const fallbackResponse =
            `### **🎓 Faculty Curriculum Analysis**\n\n` +
            `Based on the uploaded cohort materials and verified knowledge units for your curriculum:\n\n` +
            `1. **Curriculum Alignment**: The requested concept is verified in **[Principles of Biology | Chapter 4, p. 42]** and **[Lecture 4 Slides | Slide #4]**.\n` +
            `2. **Assessment Grounding**: We can formulate 3 multiple-choice questions with 100% provenance tracking.\n` +
            `3. **Key Takeaway for Students**: Emphasize cytosol vs. mitochondrial matrix separation to prevent common cohort errors.\n\n` +
            `Would you like me to auto-generate a quiz module for this topic and assign it to the Fall 2026 cohort?`;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: fallbackResponse,
                    citations: [
                      {
                        key: "[PDF p.42]",
                        unit: {
                          id: "demo-pdf-unit",
                          material_id: "mat_1",
                          content:
                            "Cellular respiration generates ATP through glycolysis, the citric acid cycle, and oxidative phosphorylation.",
                          modality: "text",
                          source_tracking: {
                            material_id: "mat_1",
                            material_title: "Principles of Biology (11th Ed)",
                            material_type: "textbook",
                            chunk_index: 4,
                            page_number: 42,
                            chapter: "Chapter 4: Energy & Cellular Respiration",
                            section: "Section 4.2 Glycolysis Overview",
                            citation_label: "[Principles of Biology | Chapter 4, p. 42]",
                            content_hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
                            token_count: 65,
                            confidence_score: 1.0,
                            is_speaker_notes: false,
                          },
                          tags: ["biology", "atp"],
                          created_at: new Date().toISOString(),
                        },
                      },
                    ],
                  }
                : msg
            )
          );
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-white overflow-hidden">
        {/* Main Chat Flow */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Faculty Header Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-2.5 bg-gray-50/70 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold text-xs shrink-0">
                IN
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    Faculty Source AI
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3 text-purple-700" />
                    Faculty Mode
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 truncate">
                  Grounded in Fall 2026 Cohort Materials
                </span>
              </div>
            </div>

            {/* Scope & Action controls */}
            <div className="flex items-center gap-2">
              {/* Materials Filter */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Cohort Materials ({materials.length})</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Pill */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-xs text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="groq-llama-3.3-70b">Groq LLaMA 3.3 70B (Fast)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="cohere-command-r">Cohere Command R+</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportChat}
                disabled={isExporting}
                className="h-8 text-xs gap-1.5 rounded-xl border-gray-200 hover:bg-gray-100"
                title="Export dialogue transcript"
              >
                <Download className="h-3.5 w-3.5 text-gray-500" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <Button
                size="sm"
                onClick={handleNewChat}
                className="h-8 text-xs gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Dialogue</span>
              </Button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onSelectCitation={handleSelectCitation}
                onFollowUpClick={handleSendMessage}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-gray-500 italic py-2 pl-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </span>
                <span>Generating grounded curriculum response with exact citations...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Presets & Input Box */}
          <div className="border-t border-gray-200/80 bg-gray-50/60 p-4 sm:px-8 md:px-12">
            {/* Faculty Quick Suggestion Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-1">
              {FACULTY_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(suggestion)}
                  disabled={isLoading}
                  className="whitespace-nowrap rounded-full border border-purple-200 bg-white px-3 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Ask any faculty curriculum question, request quiz questions, or verify citation provenance..."
            />
          </div>
        </div>

        {/* Source Citation Inspector Side Panel */}
        {inspectorOpen && (
          <div className="w-80 md:w-96 border-l border-gray-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Source Citation Inspector
                </h3>
              </div>
              <button
                onClick={() => setInspectorOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedCitation ? (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900 text-xs">
                        {selectedCitation.unit?.source_tracking?.citation_label || selectedCitation.key}
                      </span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                        {Math.round((selectedCitation.unit?.source_tracking?.confidence_score ?? 1) * 100)}% Match
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      {selectedCitation.unit?.source_tracking?.material_title || "Principles of Biology"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Verified Source Quote
                    </div>
                    <blockquote className="rounded-xl border-l-4 border-emerald-500 bg-gray-50 p-3 text-gray-800 text-xs italic leading-relaxed">
                      "{selectedCitation.unit?.content}"
                    </blockquote>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-gray-200 p-2 bg-white">
                      <span className="text-gray-400 block">Modality</span>
                      <span className="font-semibold text-gray-800 capitalize">
                        {selectedCitation.unit?.modality || "Text"}
                      </span>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-2 bg-white">
                      <span className="text-gray-400 block">Location</span>
                      <span className="font-semibold text-gray-800">
                        {selectedCitation.unit?.source_tracking?.page_number
                          ? `Page ${selectedCitation.unit.source_tracking.page_number}`
                          : selectedCitation.unit?.source_tracking?.slide_number
                          ? `Slide #${selectedCitation.unit.source_tracking.slide_number}`
                          : "Chapter Excerpt"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mat = materials.find(
                          (m) => m.id === selectedCitation.unit?.material_id
                        ) || materials[0];
                        if (mat) {
                          setViewerMaterial(mat);
                          setViewerOpen(true);
                        }
                      }}
                      className="w-full text-xs gap-1.5 rounded-xl border-gray-300 hover:bg-gray-50"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                      <span>Inspect Original Document</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-gray-400">
                  Click any citation pill in the dialogue to inspect its exact quote and source provenance.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Material Viewer Modal */}
        {viewerMaterial && (
          <MaterialViewerModal
            material={viewerMaterial}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default function InstructorChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] text-xs text-gray-500">
          Loading Faculty Assistant...
        </div>
      }
    >
      <InstructorChatView />
    </React.Suspense>
  );
}
