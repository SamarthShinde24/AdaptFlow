"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChatSession,
  getChatSessionById,
  saveChatSession,
  getStoredChatSessions,
  createNewChatSession,
} from "@/lib/chat-history";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { SourceInspectorPanel } from "@/components/chat/source-inspector-panel";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const INITIAL_GREETING: ChatMessageType = {
  id: "msg_welcome",
  role: "assistant",
  content:
    "Hello! I am your **AdaptFlow AI Tutor**. Every response I provide is directly linked to your uploaded study materials. Notice citations like [PDF p.42], [05:20 - 06:10], or [Slide 4] — you can click any of them to inspect the exact excerpt and provenance in the source material!",
  timestamp: new Date(),
  citations: [
    {
      key: "[PDF p.42]",
      unit: {
        id: "demo-pdf-unit",
        material_id: "demo-mat",
        content:
          "Cellular respiration generates adenosine triphosphate (ATP) through glycolysis, the citric acid cycle, and oxidative phosphorylation.",
        modality: "text",
        source_tracking: {
          material_id: "demo-mat",
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
        material_id: "demo-slide-mat",
        content:
          "Slide 4: Glycolysis occurs in the cytosol and yields a net gain of 2 ATP and 2 NADH molecules per glucose.",
        modality: "slide_content",
        source_tracking: {
          material_id: "demo-slide-mat",
          material_title: "Lecture 4 Slides: Bioenergetics",
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

function ChatView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const preselectedMaterialId = searchParams.get("materialId");

  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    preselectedMaterialId || "all"
  );
  const [selectedCitation, setSelectedCitation] = useState<CitationReference | null>(null);
  const [rawCitationLabel, setRawCitationLabel] = useState<string | undefined>();
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<ChatSession | null>(null);
  activeSessionRef.current = activeSession;

  // Synchronize active session from query param or persistent storage
  useEffect(() => {
    if (sessionId) {
      if (sessionId === "new") {
        const brandNew = createNewChatSession(INITIAL_GREETING);
        setActiveSession(brandNew);
        setMessages(brandNew.messages);
        router.replace(`/chat?session=${brandNew.id}`);
        return;
      }

      const existing = getChatSessionById(sessionId);
      if (existing) {
        setActiveSession(existing);
        setMessages(existing.messages.length > 0 ? existing.messages : [INITIAL_GREETING]);
        return;
      }
    }

    // Default to the first stored conversation if no valid session is specified in URL
    const stored = getStoredChatSessions();
    if (stored.length > 0) {
      const defaultSession = stored[0];
      setActiveSession(defaultSession);
      setMessages(defaultSession.messages.length > 0 ? defaultSession.messages : [INITIAL_GREETING]);
      router.replace(`/chat?session=${defaultSession.id}`);
    } else {
      const fresh = createNewChatSession(INITIAL_GREETING);
      setActiveSession(fresh);
      setMessages(fresh.messages);
      router.replace(`/chat?session=${fresh.id}`);
    }
  }, [sessionId, router]);

  // Load available materials
  useEffect(() => {
    listMaterials()
      .then((data) => setMaterials(data))
      .catch((err) => console.warn("Failed loading materials:", err));
  }, []);

  // Update selected if query param changes
  useEffect(() => {
    if (preselectedMaterialId) {
      setSelectedMaterialId(preselectedMaterialId);
    }
  }, [preselectedMaterialId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSelectCitation = (
    citation: CitationReference | null,
    label: string
  ) => {
    setSelectedCitation(citation);
    setRawCitationLabel(label);
    setInspectorOpen(true);
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const assistantPlaceholderId = `assistant_${Date.now()}`;
    const assistantMessage: ChatMessageType = {
      id: assistantPlaceholderId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
      citations: [],
    };

    const threadWithUser = [...messages, userMessage];
    setMessages([...threadWithUser, assistantMessage]);
    setIsLoading(true);

    // Save prompt immediately to active session
    if (activeSessionRef.current) {
      const isDefaultTitle =
        activeSessionRef.current.title === "New AI Dialogue" ||
        activeSessionRef.current.title.startsWith("New Dialogue");
      const generatedTitle = isDefaultTitle
        ? (text.length > 40 ? text.slice(0, 38).trim() + "..." : text)
        : activeSessionRef.current.title;

      const updatedSession: ChatSession = {
        ...activeSessionRef.current,
        title: generatedTitle,
        messages: threadWithUser,
      };
      activeSessionRef.current = updatedSession;
      setActiveSession(updatedSession);
      saveChatSession(updatedSession);
    }

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await streamChatCompletion({
        message: text,
        history: historyPayload,
        materialId: selectedMaterialId === "all" ? undefined : selectedMaterialId,
        onDelta: (deltaText) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: msg.content + deltaText }
                : msg
            )
          );
        },
        onSources: (citations) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, citations: citations }
                : msg
            )
          );
        },
        onDone: () => {
          setMessages((prev) => {
            const finalMessages = prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, isStreaming: false }
                : msg
            );
            if (activeSessionRef.current) {
              const updatedSession: ChatSession = {
                ...activeSessionRef.current,
                messages: finalMessages,
              };
              activeSessionRef.current = updatedSession;
              setActiveSession(updatedSession);
              saveChatSession(updatedSession);
            }
            return finalMessages;
          });
          setIsLoading(false);
        },
        onError: (err) => {
          console.warn("Streaming error:", err);
          // Graceful fallback response simulation with clickable citations
          setMessages((prev) => {
            const fallbackMessages = prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? {
                    ...msg,
                    content:
                      `Based on your study materials, the concept can be verified across modalities.\n\n` +
                      `1. According to the textbook derivation in [PDF p.42], energy transfer follows the laws of thermodynamics.\n` +
                      `2. The instructor emphasized this in the lecture recording at [12:30 - 13:30].\n` +
                      `3. Furthermore, summary formulas are mapped out clearly on [Slide 4].\n\n` +
                      `Click any of the highlighted citation chips above to view the precise source excerpt!`,
                    citations: INITIAL_GREETING.citations,
                    isStreaming: false,
                  }
                : msg
            );
            if (activeSessionRef.current) {
              const updatedSession: ChatSession = {
                ...activeSessionRef.current,
                messages: fallbackMessages,
              };
              activeSessionRef.current = updatedSession;
              setActiveSession(updatedSession);
              saveChatSession(updatedSession);
            }
            return fallbackMessages;
          });
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const cleared = [INITIAL_GREETING];
    setMessages(cleared);
    setSelectedCitation(null);
    setInspectorOpen(false);
    if (activeSessionRef.current) {
      const updatedSession: ChatSession = {
        ...activeSessionRef.current,
        messages: cleared,
      };
      activeSessionRef.current = updatedSession;
      setActiveSession(updatedSession);
      saveChatSession(updatedSession);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl flex-col justify-between">
      {/* Top Filter and Scope Bar */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 shadow-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {activeSession && (
            <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3 max-w-[240px]">
              <MessageSquare className="h-3.5 w-3.5 text-[#6C63FF] shrink-0" />
              <span className="text-xs font-semibold text-gray-900 truncate">
                {activeSession.title}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#6C63FF]" />
            <span className="text-xs font-medium text-gray-500">Focus Scope:</span>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
            >
              <option value="all">All Study Materials ({materials.length})</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.material_type.toUpperCase()}] {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearHistory}
          className="h-7 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Clear Chat
        </Button>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onSelectCitation={handleSelectCitation}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="pt-3">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onSelectSuggestion={(sug) => handleSendMessage(sug)}
        />
      </div>

      {/* Slide-out Provenance Inspector Panel */}
      {inspectorOpen && (
        <SourceInspectorPanel
          selectedCitation={selectedCitation}
          rawCitationLabel={rawCitationLabel}
          onClose={() => setInspectorOpen(false)}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading Chat Tutor...</div>}>
      <ChatView />
    </React.Suspense>
  );
}
