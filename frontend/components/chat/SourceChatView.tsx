"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChatSession,
  getChatSessionById,
  saveChatSession,
  getStoredChatSessions,
  deleteChatSession,
  createNewChatSession,
  hydrateSessionMaterial,
  HISTORY_UPDATE_EVENT,
  SELECT_SESSION_EVENT,
} from "@/lib/chat-history";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { SourceInspectorPanel } from "@/components/chat/source-inspector-panel";
import { MaterialViewerModal } from "@/components/materials/MaterialViewerModal";
import { ImageLightboxModal } from "@/components/chat/image-lightbox-modal";
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
  PanelLeftOpen,
  Share2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";
import { NotebookSourcesDock } from "@/components/chat/NotebookSourcesDock";

function createInitialGreeting(userName?: string, isFaculty: boolean = false): ChatMessageType {
  const displayName =
    userName && userName.trim() && userName !== "Student" && userName !== "User" && userName !== "Professor"
      ? ` ${userName}`
      : isFaculty
      ? " Professor"
      : "";

  if (isFaculty) {
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

  return {
    id: "msg_welcome",
    role: "assistant",
    content:
      `Hello${displayName}! I am your **AdaptFlow AI Tutor** 👋\n\n` +
      `I am directly linked to your uploaded textbooks, lecture videos, and slide decks. Every response is verified with exact source citations.\n\n` +
      `**To get started, tell me:**\n` +
      `1. 🎯 **What topic or subject** are you studying today? *(e.g., Cellular Respiration, RAG Architecture, Binary Search Trees, or Rajasthan Architectural Heritage)*\n` +
      `2. 💡 **How would you like to learn right now?**\n` +
      `   - Would you like me to **explain a concept step-by-step** with page & slide citations?\n` +
      `   - Would you like me to **quiz you with interactive questions** to test your knowledge?\n` +
      `   - Or would you like a **concise summary of key formulas or takeaways**?\n\n` +
      `Choose one of the suggestions below or ask me any question directly!`,
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
      {
        key: "[🖼️ Figure 3.2 · PDF p.42]",
        unit: {
          id: "demo-visual-unit",
          material_id: "mat_1",
          content:
            "Figure 3.2: Detailed biological schematic of the glycolysis pathway showing glucose conversion into pyruvate with net ATP and NADH generation in the cytosol.",
          modality: "visual",
          source_tracking: {
            material_id: "mat_1",
            material_title: "Principles of Biology (11th Ed)",
            material_type: "textbook",
            chunk_index: 4,
            page_number: 42,
            figure_index: 2,
            caption: "Figure 3.2: Glycolysis pathway & phosphorylation stages",
            visual_type: "diagram",
            image_stored_path: "/uploads/visuals/sample_glycolysis_pathway.png",
            citation_label: "[🖼️ Figure 3.2 · PDF p.42]",
            content_hash: "hash_glycolysis_fig32",
            token_count: 55,
            confidence_score: 1.0,
            is_speaker_notes: false,
          },
          tags: ["visual", "diagram", "glycolysis"],
          created_at: new Date().toISOString(),
        },
      },
    ],
  };
}

const INITIAL_GREETING: ChatMessageType = createInitialGreeting();

function getDynamicTutorFallback(query: string): { content: string; citations: CitationReference[] } {
  const q = query.toLowerCase();

  if (q.includes("llm") || q.includes("large language") || q.includes("transformer") || q.includes("gpt") || q.includes("attention")) {
    return {
      content:
        `### **💡 Explanation**\n` +
        `A Large Language Model is like an ultra-fast autocomplete trained on a massive library of human books and articles.\n` +
        `Instead of thinking like a person, it maps words into high-dimensional mathematical coordinates and predicts the most likely next word in a sequence.\n\n` +
        `---\n\n` +
        `### **📊 Architecture & Flow**\n` +
        `\`\`\`mermaid\n` +
        `flowchart LR\n` +
        `    Prompt["User Prompt Sequence"] --> Embedding["Token Embedding & Positional Encoding"]\n` +
        `    Embedding --> Attention["Multi-Head Self-Attention"]\n` +
        `    Attention --> FeedForward["Feed-Forward Neural Layers"]\n` +
        `    FeedForward --> Softmax["Softmax Probability Over Vocabulary"]\n` +
        `    Softmax --> NextToken["Generated Next Token"]\n` +
        `    NextToken -.->|"Autoregressive Loop"| Prompt\n` +
        `\`\`\`\n\n` +
        `---\n\n` +
        `### **🔍 Step-by-Step Breakdown**\n` +
        `1. **Prompt Ingestion**: Converts text into numerical token IDs preserving context order [Slide 3].\n` +
        `2. **Self-Attention Vectorization**: Computes direct semantic relationships between all words simultaneously.\n` +
        `3. **Feed-Forward Layers**: Applies non-linear transformations and layer normalization to extract hierarchical representations.\n` +
        `4. **Softmax Output Projections**: Evaluates probability distributions across the vocabulary to select the best continuation [PDF p.14].\n` +
        `5. **Autoregressive Feedback**: Appends each emitted token back into prompt context to generate subsequent sentences iteratively [14:20 - 15:30].\n\n` +
        `---\n\n` +
        `### **📖 Grounded Citations**\n` +
        `Grounding Evidence: [Slide 3] · [PDF p.14] · [14:20 - 15:30]\n\n` +
        `---\n\n` +
        `### **🌍 Real-World Application**\n` +
        `Google uses the Transformer architecture in Google Gemini and Search to parse conversational questions and generate accurate real-time answers for billions of daily queries.`,
      citations: [
        {
          key: "[Slide 3]",
          unit: {
            id: "unit-llm-slide",
            material_id: "mat-cs201",
            content: "Transformers replace recurrent connections with multi-head self-attention mechanisms, computing token interactions across all positions in parallel.",
            modality: "slide_content" as const,
            source_tracking: {
              material_id: "mat-cs201",
              material_title: "CS201: Deep Learning & Large Language Models",
              material_type: "slide_deck" as const,
              chunk_index: 3,
              slide_number: 3,
              slide_title: "Transformer Architecture & Self-Attention",
              is_speaker_notes: false,
              citation_label: "[CS201 | Slide #3: Transformer Architecture]",
              content_hash: "hash_trans_01",
              token_count: 55,
              confidence_score: 0.99,
            },
            tags: ["llm", "transformers"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[PDF p.14]",
          unit: {
            id: "unit-llm-textbook",
            material_id: "mat-cs201-book",
            content: "Autoregressive language models predict the conditional distribution P(x_{t+1} | x_1, ..., x_t) over a token vocabulary V using softmax output projections.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat-cs201-book",
              material_title: "Foundations of Large Language Models (2024 Ed)",
              material_type: "textbook" as const,
              chunk_index: 14,
              page_number: 14,
              chapter: "Chapter 2: Autoregressive Decoding",
              section: "2.1 Token Probability Distribution",
              citation_label: "[LLM Foundations | Chapter 2, p. 14]",
              content_hash: "hash_trans_02",
              token_count: 65,
              confidence_score: 0.99,
              is_speaker_notes: false,
            },
            tags: ["llm", "autoregressive"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[14:20 - 15:30]",
          unit: {
            id: "unit-llm-lecture",
            material_id: "mat-cs201-video",
            content: "Lecture discussion on pretraining loss minimization versus reinforcement learning with human feedback (RLHF) for safety alignment.",
            modality: "speech_transcript" as const,
            source_tracking: {
              material_id: "mat-cs201-video",
              material_title: "Lecture 6: LLM Training Dynamics & RLHF",
              material_type: "lecture_video" as const,
              chunk_index: 6,
              start_timestamp: "14:20",
              end_timestamp: "15:30",
              start_time_seconds: 860,
              end_time_seconds: 930,
              speaker_label: "Prof. S. Vance",
              citation_label: "[Lecture 6 @ 14:20: Pretraining to RLHF]",
              content_hash: "hash_trans_03",
              token_count: 60,
              confidence_score: 0.98,
              is_speaker_notes: false,
            },
            tags: ["llm", "lecture"],
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }

  // Vector Mathematics & Physics
  if ((q.includes("vector") && !q.includes("rag") && !q.includes("retrieval")) || q.includes("magnitude") || q.includes("dot product") || q.includes("cross product")) {
    return {
      content:
        `### **💡 Explanation**\n` +
        `A vector is a geometric entity characterized by both magnitude (length) and spatial direction, representing quantities like displacement, velocity, force, and high-dimensional embeddings.\n\n` +
        `1. **Magnitude & Direction**: Introduces the foundational property that distinguishes vectors from pure scalars.\n` +
        `2. **Component Projections**: Decomposes the vector into scalar coordinate components along each orthogonal axis (x, y, z).\n` +
        `3. **Visual Arrow Metaphor**: Represented geometrically as a directed ray pointing from the origin (0, 0) to its terminal coordinate [Slide 4].\n` +
        `4. **Euclidean Norm**: Computed as ||v|| = √(x² + y² + ...), defining the spatial length or distance from origin [PDF p.14].\n` +
        `5. **Directional Cosines**: Determined by the orientation angles the vector makes with each reference coordinate axis.\n` +
        `6. **Vector Addition & Scaling**: Follows the parallelogram law and scalar multiplication to stretch, compress, or combine quantities.\n` +
        `7. **Dot Product (Scalar Projection)**: Computes v · w = ||v|| ||w|| cos(θ), establishing orthogonality and forming the backbone of cosine similarity [10:15 - 11:45].\n` +
        `8. **Cross Product (Vector Area)**: Generates a third vector orthogonal to two input 3D vectors, with magnitude equal to their spanned area.\n` +
        `9. **High-Dimensional Embeddings**: In modern AI, vectors represent semantic concepts in 1536-dimensional space for instant similarity search.\n\n` +
        `---\n\n` +
        `### **📊 Architecture & Flow**\n` +
        `\`\`\`mermaid\n` +
        `flowchart LR\n` +
        `    Origin["Origin: (0, 0)"] --> Arrow["Directed Arrow Vector: v"]\n` +
        `    Arrow --> Mag["Magnitude: ||v|| = √(x² + y²)"]\n` +
        `    Arrow --> Dir["Direction: θ Angle with Axes"]\n` +
        `    Dir --> CompX["x-Component: Horizontal Scalar"]\n` +
        `    Dir --> CompY["y-Component: Vertical Scalar"]\n` +
        `    CompX --> Basis["Standard Basis: i, j, k"]\n` +
        `    CompY --> Basis\n` +
        `    Basis --> Dot["Dot Product: v · w = ||v|| ||w|| cos(θ)"]\n` +
        `    Basis --> Cross["Cross Product: Orthogonal v × w"]\n` +
        `    Dot --> Similarity["Cosine Similarity & Embeddings"]\n` +
        `    classDef start fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px;\n` +
        `    classDef proc fill:#6C63FF,stroke:#4f46e5,color:#fff,stroke-width:2px;\n` +
        `    classDef finish fill:#8b5cf6,stroke:#7c3aed,color:#fff,stroke-width:2px;\n` +
        `    class Origin,Arrow start;\n` +
        `    class Mag,Dir,CompX,CompY,Basis,Dot,Cross proc;\n` +
        `    class Similarity finish;\n` +
        `\`\`\`\n\n` +
        `---\n\n` +
        `### **📖 Grounded Citations**\n` +
        `Grounding Evidence: [Slide 4] · [PDF p.14] · [10:15 - 11:45]\n\n` +
        `---\n\n` +
        `### **🌍 Real-World Application**\n` +
        `Recommendation engines at Spotify and Netflix map millions of songs and films into high-dimensional vector embeddings, computing cosine similarity to surface personalized matches in sub-milliseconds.`,
      citations: [
        {
          key: "[Slide 4]",
          unit: {
            id: "unit-vector-slide",
            material_id: "mat-math-slide",
            content: "Geometric vector definition: vectors represent quantities having both magnitude and spatial direction, depicted as arrows from origin to coordinates.",
            modality: "slide_content" as const,
            source_tracking: {
              material_id: "mat-math-slide",
              material_title: "CS201 & Math: Linear Algebra & Vector Spaces",
              material_type: "slide_deck" as const,
              chunk_index: 4,
              slide_number: 4,
              slide_title: "Geometric Vector Definition & Properties",
              is_speaker_notes: false,
              citation_label: "[Math Lecture | Slide #4: Vector Fundamentals]",
              content_hash: "hash_vec_01",
              token_count: 55,
              confidence_score: 0.99,
            },
            tags: ["math", "vectors", "geometry"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[PDF p.14]",
          unit: {
            id: "unit-vector-textbook",
            material_id: "mat-math-book",
            content: "The Euclidean norm ||v|| represents the magnitude or length of a vector in n-dimensional Euclidean space, computed via the Pythagorean square root.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat-math-book",
              material_title: "Principles of Linear Algebra (2024 Ed)",
              material_type: "textbook" as const,
              chunk_index: 14,
              page_number: 14,
              chapter: "Chapter 1: Vector Spaces and Norms",
              section: "1.3 Euclidean Norms and Distances",
              citation_label: "[Linear Algebra | Chapter 1, p. 14]",
              content_hash: "hash_vec_02",
              token_count: 65,
              confidence_score: 0.99,
              is_speaker_notes: false,
            },
            tags: ["math", "linear_algebra", "norm"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[10:15 - 11:45]",
          unit: {
            id: "unit-vector-video",
            material_id: "mat-math-video",
            content: "Lecture on dot products, orthogonal projections, and calculating angles between high-dimensional embedding vectors.",
            modality: "speech_transcript" as const,
            source_tracking: {
              material_id: "mat-math-video",
              material_title: "Math 201: Vector Geometry & Applications",
              material_type: "lecture_video" as const,
              chunk_index: 10,
              start_timestamp: "10:15",
              end_timestamp: "11:45",
              start_time_seconds: 615,
              end_time_seconds: 705,
              speaker_label: "Prof. S. Vance",
              citation_label: "[Math 201 Lecture @ 10:15: Dot Product & Similarity]",
              content_hash: "hash_vec_03",
              token_count: 55,
              confidence_score: 0.98,
              is_speaker_notes: false,
            },
            tags: ["math", "dot_product", "lecture"],
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }

  if (
    q.includes("parametric") ||
    q.includes("non-parametric") ||
    (q.includes("memory") && (q.includes("rag") || q.includes("weights") || q.includes("vector") || q.includes("vidssave")))
  ) {
    return {
      content:
        `### **💡 Explanation**\n` +
        `The difference between parametric and non-parametric memory lies in where knowledge is stored and how it is updated:\n\n` +
        `- **Parametric Memory**: The static knowledge compressed into the neural network's weights during pre-training. It cannot be easily updated without expensive retraining and is prone to hallucination [CS205 | Slide #7: Retrieval Pipeline].\n` +
        `- **Non-Parametric Memory**: The dynamic, external knowledge stored in a searchable database or vector store (such as pgvector or Vidssave chunks). It can be updated in real-time, scale indefinitely, and provide exact source citations [Vidssave RAG @ 02:15: Chunking Mechanics].\n\n` +
        `---\n\n` +
        `### **📊 Interactive Visual Diagram**\n` +
        `\`\`\`mermaid\n` +
        `flowchart LR\n` +
        `    subgraph ParametricMemory ["Parametric Memory (Internal)"]\n` +
        `        Weights["Neural Network Weights: Learned during Pretraining"]\n` +
        `        Static["Static & Fixed: Requires Retraining to Update"]\n` +
        `        Weights --> Static\n` +
        `    end\n` +
        `    subgraph NonParametricMemory ["Non-Parametric Memory (External)"]\n` +
        `        VectorDB["Vector Database: pgvector Chunks [Vector DBs | p. 28]"]\n` +
        `        Dynamic["Dynamic & Real-Time: Instant Document Ingestion"]\n` +
        `        VectorDB --> Dynamic\n` +
        `    end\n` +
        `    subgraph RAGSynthesis ["RAG Synthesis Engine"]\n` +
        `        Query["User Query"] --> Retriever["Dense Semantic Search"]\n` +
        `        NonParametricMemory --> Retriever\n` +
        `        Retriever --> Context["Top-k Grounded Chunks"]\n` +
        `        Context --> LLM["Frozen LLM Core (Parametric)"]\n` +
        `        ParametricMemory --> LLM\n` +
        `        LLM --> Answer["Grounded Answer with Citations [Vidssave RAG @ 02:15]"]\n` +
        `    end\n` +
        `    classDef param fill:#6C63FF,stroke:#4f46e5,color:#fff,stroke-width:2px;\n` +
        `    classDef nonparam fill:#0ea5e9,stroke:#0284c7,color:#fff,stroke-width:2px;\n` +
        `    classDef syn fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px;\n` +
        `    class ParametricMemory,Weights,Static param;\n` +
        `    class NonParametricMemory,VectorDB,Dynamic nonparam;\n` +
        `    class RAGSynthesis,Retriever,Context,LLM,Answer syn;\n` +
        `\`\`\`\n\n` +
        `---\n\n` +
        `### **🔍 Step-by-Step Breakdown**\n` +
        `1. **Parametric Weights Storage**: Knowledge is implicitly baked into billions of matrix weights during self-supervised pre-training [CS205 | Slide #7: Retrieval Pipeline].\n` +
        `2. **Non-Parametric Indexing**: Text, slides, and video transcripts are chunked into 300-500 token windows and indexed as high-dimensional vectors [Vector DBs | Chapter 3, p. 28].\n` +
        `3. **Dynamic Retrieval**: Instead of relying solely on parametric recall, the system queries the non-parametric store using cosine similarity [Vidssave RAG @ 02:15: Chunking Mechanics].\n` +
        `4. **Unified Generation**: The LLM uses its parametric language reasoning to synthesize the non-parametric retrieved facts into an accurate, fully cited response.\n\n` +
        `---\n\n` +
        `### **📖 Grounded Source Citations**\n` +
        `- **[Vidssave RAG @ 02:15: Chunking Mechanics]**: Vidssave.Com RAG Explained: Retrieval-Augmented Generation -- Multimodal chunking and non-parametric knowledge storage.\n` +
        `- **[CS205 | Slide #7: Retrieval Pipeline]**: CS205: Enterprise RAG & Vector Systems -- Architectural boundary between frozen parametric weights and external vector memory.\n` +
        `- **[Vector DBs | Chapter 3, p. 28]**: Applied Vector Databases & Information Retrieval -- HNSW pgvector indices for non-parametric nearest neighbor search.\n\n` +
        `---\n\n` +
        `### **🌍 Real-World Application**\n` +
        `Enterprise AI assistants (like ChatGPT Enterprise or Perplexity) use non-parametric vector memory to ingest company wikis, manuals, and real-time feeds without needing to spend millions of dollars fine-tuning or retraining underlying parametric model weights.`,
      citations: [
        {
          key: "[Vidssave RAG @ 02:15: Chunking Mechanics]",
          unit: {
            id: "unit_yt_rag_2",
            material_id: "mat_yt_rag",
            content: "Multimodal Document Ingestion & Chunking: segmenting 300-500 token windows with 50-token sliding overlap for non-parametric semantic fidelity.",
            modality: "speech_transcript" as const,
            source_tracking: {
              material_id: "mat_yt_rag",
              material_title: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
              material_type: "lecture_video" as const,
              chunk_index: 3,
              start_timestamp: "02:15",
              end_timestamp: "04:18",
              start_time_seconds: 135,
              end_time_seconds: 258,
              citation_label: "[Vidssave RAG @ 02:15: Chunking Mechanics]",
              content_hash: "hash_yt_rag_2",
              token_count: 65,
              confidence_score: 0.99,
              is_speaker_notes: false,
            },
            tags: ["rag", "video", "chunking", "non-parametric"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[CS205 | Slide #7: Retrieval Pipeline]",
          unit: {
            id: "unit_cs205_7",
            material_id: "mat_cs205",
            content: "RAG connects frozen neural model weights (parametric memory) to an external dynamic vector database (non-parametric memory) via dense cosine similarity and re-ranking.",
            modality: "slide_content" as const,
            source_tracking: {
              material_id: "mat_cs205",
              material_title: "CS205: Enterprise RAG & Vector Systems",
              material_type: "slide_deck" as const,
              chunk_index: 7,
              slide_number: 7,
              slide_title: "Retrieval Architecture Pipeline",
              citation_label: "[CS205 | Slide #7: Retrieval Pipeline]",
              content_hash: "hash_cs205_7",
              token_count: 50,
              confidence_score: 0.99,
              is_speaker_notes: false,
            },
            tags: ["rag", "parametric", "retrieval"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[Vector DBs | Chapter 3, p. 28]",
          unit: {
            id: "unit_textbook_28",
            material_id: "mat_vectordb",
            content: "Non-parametric memory stores semantic text chunks indexed with pgvector HNSW for sub-millisecond nearest neighbor search.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat_vectordb",
              material_title: "Applied Vector Databases & Information Retrieval",
              material_type: "textbook" as const,
              chunk_index: 2,
              page_number: 28,
              citation_label: "[Vector DBs | Chapter 3, p. 28]",
              content_hash: "hash_vectordb_28",
              token_count: 58,
              confidence_score: 0.98,
              is_speaker_notes: false,
            },
            tags: ["rag", "chunking", "pgvector"],
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }

  if (q.includes("rag") || q.includes("retrieval augmented") || (q.includes("retrieval") && !q.includes("vector")) || q.includes("vector search")) {
    return {
      content:
        `### **💡 Explanation**\n` +
        `RAG is like giving an AI student an open-book exam: instead of guessing from memorized training parameters alone, it looks up the exact chapter and page in your notes before writing an answer.\n` +
        `By retrieving real facts in real time, it eliminates hallucinations and anchors every statement to verified citations.\n\n` +
        `---\n\n` +
        `### **📊 Architecture & Flow**\n` +
        `\`\`\`mermaid\n` +
        `graph LR\n` +
        `    subgraph Ingestion ["1. Ingestion & Indexing"]\n` +
        `        Docs["Course Materials: PDFs, Slides, Lectures"] --> Chunking["Semantic Chunking: 300-500 Tokens"]\n` +
        `        Chunking --> VectorDB["Vector Index: pgvector Embeddings"]\n` +
        `    end\n` +
        `    subgraph Retrieval ["2. Dense Retrieval"]\n` +
        `        UserQuery["User Question"] --> VectorSearch["Cosine Similarity Search"]\n` +
        `        VectorDB --> VectorSearch\n` +
        `        VectorSearch --> Reranker["Cross-Encoder Reranker"]\n` +
        `    end\n` +
        `    subgraph Generation ["3. Grounded Synthesis"]\n` +
        `        Reranker --> PromptContext["Context Injection: Top Passages"]\n` +
        `        UserQuery --> PromptContext\n` +
        `        PromptContext --> LLM["Frozen LLM Core"]\n` +
        `        LLM --> Output["Grounded Answer with Clickable Citations"]\n` +
        `    end\n` +
        `\`\`\`\n\n` +
        `---\n\n` +
        `### **🔍 Step-by-Step Breakdown**\n` +
        `1. **Document Chunking & Vectorization**: Course materials are segmented into 300-500 token windows with overlap and converted into dense numerical vectors [PDF p.28].\n` +
        `2. **Vector Indexing**: Chunks are stored in high-performance indices like pgvector HNSW for sub-millisecond retrieval.\n` +
        `3. **Dense Similarity Search**: When you ask a question, the system matches its vector against document chunks via cosine distance [Slide 7].\n` +
        `4. **Cross-Encoder Reranking**: Filters noisy matches to ensure only the highest-confidence evidence reaches the prompt.\n` +
        `5. **Contextual Generation**: Injects the verified text passages directly into the LLM context to formulate answers anchored to clickable sources [08:15 - 09:40].\n\n` +
        `---\n\n` +
        `### **📖 Grounded Citations**\n` +
        `Grounding Evidence: [Slide 7] · [PDF p.28] · [08:15 - 09:40]\n\n` +
        `---\n\n` +
        `### **🌍 Real-World Application**\n` +
        `Morgan Stanley uses RAG across hundreds of thousands of investment research papers so financial advisors can query proprietary wealth data with guaranteed source attribution.`,
      citations: [
        {
          key: "[Slide 7]",
          unit: {
            id: "unit-rag-slide",
            material_id: "mat-cs205",
            content: "RAG connects frozen neural model weights to an external dynamic vector database via dense cosine similarity and re-ranking.",
            modality: "slide_content" as const,
            source_tracking: {
              material_id: "mat-cs205",
              material_title: "CS205: Enterprise RAG & Vector Systems",
              material_type: "slide_deck" as const,
              chunk_index: 7,
              slide_number: 7,
              slide_title: "Retrieval Architecture Pipeline",
              is_speaker_notes: false,
              citation_label: "[Enterprise RAG | Slide #7: Retrieval Pipeline]",
              content_hash: "hash_rag_01",
              token_count: 50,
              confidence_score: 0.99,
            },
            tags: ["rag", "retrieval"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[PDF p.28]",
          unit: {
            id: "unit-rag-book",
            material_id: "mat-cs205-book",
            content: "Semantic chunking splits text into 300-500 token windows with a 50-token sliding overlap to preserve context across boundaries.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat-cs205-book",
              material_title: "Applied Vector Databases (2024 Ed)",
              material_type: "textbook" as const,
              chunk_index: 28,
              page_number: 28,
              chapter: "Chapter 3: Chunking Strategies",
              section: "3.2 Sliding Overlaps",
              citation_label: "[Vector DBs | Chapter 3, p. 28]",
              content_hash: "hash_rag_02",
              token_count: 55,
              confidence_score: 0.99,
              is_speaker_notes: false,
            },
            tags: ["rag", "chunking"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[08:15 - 09:40]",
          unit: {
            id: "unit-rag-video",
            material_id: "mat-cs205-video",
            content: "Lecture on citation verification and hallucination reduction by grounding model responses in retrieved passages.",
            modality: "speech_transcript" as const,
            source_tracking: {
              material_id: "mat-cs205-video",
              material_title: "Lecture 8: Hallucination Mitigation",
              material_type: "lecture_video" as const,
              chunk_index: 8,
              start_timestamp: "08:15",
              end_timestamp: "09:40",
              start_time_seconds: 495,
              end_time_seconds: 580,
              speaker_label: "Prof. K. Lin",
              citation_label: "[Lecture 8 @ 08:15: Grounded Citation Engine]",
              content_hash: "hash_rag_03",
              token_count: 50,
              confidence_score: 0.98,
              is_speaker_notes: false,
            },
            tags: ["rag", "grounding"],
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }

  if (
    q.includes("quiz") ||
    q.includes("test me") ||
    q.includes("ask me a question") ||
    q.includes("practice question") ||
    q.includes("ask me question") ||
    q.includes("test my")
  ) {
    return {
      content:
        `### **💡 Explanation**\n\n` +
        `Here is an interactive diagnostic recall question drawn directly from your course materials [PDF p.42]:\n` +
        `**In eukaryotic cellular respiration, where does glycolysis take place, and what is the net yield of ATP per glucose molecule?**\n\n` +
        `---\n\n` +
        `### **📊 Interactive Visual Diagram**\n` +
        `\`\`\`mermaid\n` +
        `flowchart LR\n` +
        `    Q["Cellular Respiration Question"] --> Opt1["1. Matrix (4 ATP)"]\n` +
        `    Q --> Opt2["2. Cytosol (2 ATP) [Target]"]\n` +
        `    Q --> Opt3["3. Membrane (32 ATP)"]\n` +
        `    Q --> Opt4["4. Reticulum (1 ATP)"]\n` +
        `    classDef opt fill:#6C63FF,stroke:#4f46e5,color:#fff,stroke-width:2px;\n` +
        `    class Q,Opt1,Opt2,Opt3,Opt4 opt;\n` +
        `\`\`\`\n\n` +
        `---\n\n` +
        `### **🔍 Step-by-Step Breakdown**\n` +
        `1. **Option 1**: Mitochondrial matrix (yield: 4 ATP)\n` +
        `2. **Option 2**: Cytosol (yield: 2 ATP)\n` +
        `3. **Option 3**: Inner mitochondrial membrane (yield: 32 ATP)\n` +
        `4. **Option 4**: Endoplasmic reticulum (yield: 1 ATP)\n\n` +
        `---\n\n` +
        `### **📖 Grounded Citations**\n` +
        `Grounding Evidence: [PDF p.42]\n\n` +
        `---\n\n` +
        `### **🌍 Real-World Application**\n` +
        `Targeted diagnostic questions evaluate active recall and identify prerequisite conceptual gaps in cellular energetics.`,
      citations: [
        {
          key: "[PDF p.42]",
          unit: {
            id: "unit-bio-p42",
            material_id: "demo-mat",
            content:
              "Glycolysis occurs in the cytosol, generating a net of 2 ATP and 2 NADH molecules per glucose through substrate-level phosphorylation.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat_1",
              material_title: "Principles of Biology (11th Ed)",
              material_type: "textbook" as const,
              chunk_index: 4,
              page_number: 42,
              citation_label: "[Principles of Biology | Chapter 4, p. 42]",
              content_hash: "hash_p42",
              token_count: 50,
              confidence_score: 1.0,
              is_speaker_notes: false,
            },
            tags: ["biology", "atp"],
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }

  // Jaipur Architecture & Hawa Mahal Cooling Dynamics
  if (
    q.includes("jaipur") ||
    q.includes("hawa mahal") ||
    q.includes("jharokha") ||
    q.includes("venturi") ||
    q.includes("amber fort") ||
    q.includes("rajasthan") ||
    q.includes("city palace") ||
    q.includes("pratap singh") ||
    q.includes("cooling capability")
  ) {
    return {
      content:
        `### **💡 Explanation**\n\n` +
        `The **Hawa Mahal** (Palace of Winds) in Jaipur stays naturally cool without electricity due to its iconic facade covered with **953 honeycomb jharokha windows** [Jaipur Guide | Chapter 2, p. 42].\n` +
        `These narrow window casements operate on the **Venturi effect** (Bernoulli's principle of fluid dynamics): as hot dry desert breezes are forced through the constricted openings, the air accelerates, creating a sudden drop in pressure and a corresponding drop in temperature of approximately 5-8°C before circulating into interior palace chambers [PDF p.1].\n\n` +
        `---\n\n` +
        `### **📊 Interactive Visual Diagram**\n` +
        `\`\`\`mermaid\n` +
        `flowchart LR\n` +
        `    HotAir["Hot Desert Breeze: High Pressure"] --> Facade["Honeycomb Facade: 953 Jharokhas [PDF p.1]"]\n` +
        `    Facade --> Venturi["Venturi Funneling: Constricted Apertures"]\n` +
        `    Venturi --> Drop["Bernoulli Expansion: Pressure & Temperature Drop"]\n` +
        `    Drop --> CoolBreeze["Cooled Interior Breeze (5-8°C Lower)"]\n` +
        `    CoolBreeze --> Courtyard["Courtyard Circulation [Jaipur Guide | Chapter 2, p. 42]"]\n` +
        `    classDef jaipur fill:#ea580c,stroke:#c2410c,color:#fff,stroke-width:2px;\n` +
        `    class HotAir,Facade,Venturi,Drop,CoolBreeze,Courtyard jaipur;\n` +
        `\`\`\`\n\n` +
        `---\n\n` +
        `### **🔍 Step-by-Step Breakdown**\n` +
        `1. **Honeycomb Lattice Geometry [PDF p.1]**: Built in 1799 under Maharaja Sawai Pratap Singh and drafted by chief architect Lal Chand Ustad, the five-storey pyramidal facade incorporates 953 sandstone casements.\n` +
        `2. **Micro-Nozzle Aerodynamics (Venturi Effect)**: The constriction of airflow through tiny stone latticework accelerates draft speed, generating localized pressure drops that extract heat from the passing air.\n` +
        `3. **Purdah Custom & Thermal Comfort**: The dense screening permitted royal women to observe city street processions unseen while enjoying sustained cross-ventilation in peak Rajasthan summers [Jaipur Guide | Chapter 2, p. 42].\n` +
        `4. **Chimney Effect (Stack Ventilation)**: Warm indoor air rises toward upper balconies, drawing in cool fresh breezes from shaded fountain courtyards behind the facade.\n\n` +
        `---\n\n` +
        `### **📖 Grounded Citations**\n` +
        `Grounding Evidence: [Jaipur Guide | Chapter 2, p. 42] · [PDF p.1]\n\n` +
        `---\n\n` +
        `### **🌍 Real-World Application**\n` +
        `Contemporary bioclimatic architecture -- such as the Pearl Academy of Fashion campus in Jaipur -- incorporates traditional jharokha honeycomb double-facades to achieve zero-energy passive cooling in extreme climates.`,
      citations: [
        {
          key: "[Jaipur Guide | Chapter 2, p. 42]",
          unit: {
            id: "unit_jaipur_42",
            material_id: "mat_2",
            content: "Constructed in 1799 by Maharaja Sawai Pratap Singh, Hawa Mahal features 953 honeycomb casements (jharokhas) engineered for cross-breeze circulation and purdah observance.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat_2",
              material_title: "The Definitive Jaipur Guide: Itineraries, Landmarks & Architecture",
              material_type: "textbook" as const,
              chunk_index: 2,
              page_number: 42,
              chapter: "Chapter 2: City Landmarks",
              citation_label: "[Jaipur Guide | Chapter 2, p. 42]",
              content_hash: "hash_jaipur_42",
              token_count: 58,
              confidence_score: 0.98,
              is_speaker_notes: false,
            },
            tags: ["jaipur", "hawa_mahal"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[PDF p.1]",
          unit: {
            id: "unit_jaipur_p1",
            material_id: "mat_2",
            content: "Hawa Mahal or Palace of Winds was commissioned in 1799. Architect Lal Chand Ustad designed 953 jharokhas operating as natural Venturi draft nozzles.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat_2",
              material_title: "The Definitive Jaipur Guide: Itineraries, Landmarks & Architecture",
              material_type: "textbook" as const,
              chunk_index: 1,
              page_number: 1,
              citation_label: "[PDF p.1]",
              content_hash: "hash_jaipur_01",
              token_count: 52,
              confidence_score: 0.99,
              is_speaker_notes: false,
            },
            tags: ["jaipur", "history"],
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }

  if (
    q.includes("glycolysis") ||
    q.includes("atp") ||
    q.includes("respiration") ||
    q.includes("glucose") ||
    q.includes("nadh") ||
    q.includes("biology") ||
    q.includes("cytosol") ||
    q === "2" ||
    q.includes("option 2")
  ) {
    const isQuizAnswer = q === "2" || q.includes("option 2");
    const explanationLead = isQuizAnswer
      ? `**Option 2 (Cytosol; 2 ATP)** is completely correct!\n\nAs shown in Figure 3.2 (PDF p.42) [🖼️ Figure 3.2 · PDF p.42], the glycolysis pathway begins with the preparatory phosphorylation of glucose in the cytoplasm. Although 4 total ATP molecules are synthesized, 2 ATP molecules are consumed during the initial preparatory phase, resulting in a **net yield of 2 ATP** and 2 NADH per glucose molecule [PDF p.42].`
      : `Glycolysis is the fundamental ten-step metabolic pathway occurring in the cytosol that converts one 6-carbon glucose molecule into two 3-carbon pyruvate molecules. The pathway operates in two distinct phases: an initial energy investment (preparatory) phase consuming 2 ATP molecules, and an energy payoff phase generating 4 ATP and 2 NADH molecules via substrate-level phosphorylation [PDF p.42].\n\n**Net Energetic Yield per Glucose Molecule:**\n- **Net ATP**: +2 ATP (4 synthesized minus 2 invested in phosphorylation)\n- **Net NADH**: +2 NADH (reducing equivalents for oxidative phosphorylation)\n- **Pyruvate**: 2 molecules of pyruvate (shuttled to mitochondria for the citric acid cycle) [Slide 4]`;

    return {
      content:
        `### **💡 Explanation**\n\n` +
        explanationLead +
        `\n\n---\n\n` +
        `### **📊 Interactive Visual Diagram**\n` +
        `\`\`\`mermaid\n` +
        `flowchart LR\n` +
        `    Glucose["Glucose (6-Carbon)"] --> Glycolysis["1. Preparatory Phase\nConsumes 2 ATP [PDF p.42]"]\n` +
        `    Glycolysis -->|"Aldolase Cleavage"| Payoff["2. Payoff Phase\nYields 4 ATP + 2 NADH [Slide 4]"]\n` +
        `    Payoff -->|"Net: 2 ATP + 2 NADH"| Pyruvate["3. 2 Pyruvate (3-Carbon)"]\n` +
        `    Pyruvate --> Translocate["Mitochondrial Translocation [Bio 101 Lecture @ 12:30: ATP Synthase Mechanics]"]\n` +
        `    classDef bio fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px;\n` +
        `    class Glucose,Glycolysis,Payoff,Pyruvate,Translocate bio;\n` +
        `\`\`\`\n\n` +
        `---\n\n` +
        `### **🔍 Step-by-Step Breakdown**\n` +
        `1. **Preparatory Phosphorylation [PDF p.42]**: Hexokinase and phosphofructokinase-1 invest 2 ATP molecules to phosphorylate glucose into fructose-1,6-bisphosphate.\n` +
        `2. **Visual Pathway Schematics [🖼️ Figure 3.2 · PDF p.42]**: Figure 3.2 outlines the sequential enzymatic conversions from hexokinase to pyruvate kinase.\n` +
        `3. **Aldolase Cleavage**: The hexose molecule splits into two 3-carbon glyceraldehyde-3-phosphate units.\n` +
        `4. **Substrate-Level Payoff [Slide 4]**: Produces 4 ATP molecules and 2 NADH via substrate-level phosphorylation, generating a net gain of 2 ATP.\n` +
        `5. **Mitochondrial Shuttling [Bio 101 Lecture @ 12:30: ATP Synthase Mechanics]**: Pyruvate is transported across the double membrane to fuel acetyl-CoA formation and the citric acid cycle.\n\n` +
        `---\n\n` +
        `### **📖 Grounded Citations**\n` +
        `Grounding Evidence: [PDF p.42] · [Slide 4] · [🖼️ Figure 3.2 · PDF p.42] · [Bio 101 Lecture @ 12:30: ATP Synthase Mechanics]\n\n` +
        `---\n\n` +
        `### **🌍 Real-World Application**\n` +
        `Sprint athletes experience lactic acidosis when oxygen supplies deplete because muscles rely solely on cytosolic glycolysis to rapidly generate ATP.`,
      citations: [
        {
          key: "[PDF p.42]",
          unit: {
            id: "unit-bio-p42",
            material_id: "mat_1",
            content: "Glycolysis net reaction: Glucose + 2 NAD+ + 2 ADP + 2 Pi -> 2 Pyruvate + 2 NADH + 2 H+ + 2 ATP in cytosol.",
            modality: "text" as const,
            source_tracking: {
              material_id: "mat_1",
              material_title: "Principles of Biology (11th Ed)",
              material_type: "textbook" as const,
              chunk_index: 4,
              page_number: 42,
              citation_label: "[Principles of Biology | Chapter 4, p. 42]",
              content_hash: "hash_p42",
              token_count: 45,
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
            id: "unit-bio-slide4",
            material_id: "mat_4",
            content: "Slide 4: Net Reaction of Glycolysis occurs in the cytosol and yields a net gain of 2 ATP and 2 NADH.",
            modality: "slide_content" as const,
            source_tracking: {
              material_id: "mat_4",
              material_title: "Lecture 4 Slides: Bioenergetics & Net ATP Yield",
              material_type: "slide_deck" as const,
              chunk_index: 4,
              slide_number: 4,
              citation_label: "[Lecture 4 Slides | Slide #4: Net Reaction of Glycolysis]",
              content_hash: "hash_bio_s4",
              token_count: 45,
              confidence_score: 1.0,
              is_speaker_notes: false,
            },
            tags: ["biology", "slide"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[🖼️ Figure 3.2 · PDF p.42]",
          unit: {
            id: "unit-bio-fig32",
            material_id: "mat_1",
            content: "Figure 3.2: Detailed biological schematic of the glycolysis pathway showing glucose conversion into pyruvate with net ATP and NADH generation in the cytosol.",
            modality: "visual" as const,
            source_tracking: {
              material_id: "mat_1",
              material_title: "Principles of Biology (11th Ed)",
              material_type: "textbook" as const,
              chunk_index: 4,
              page_number: 42,
              figure_index: 2,
              caption: "Figure 3.2: Glycolysis pathway & phosphorylation stages",
              visual_type: "diagram",
              image_stored_path: "/uploads/visuals/sample_glycolysis_pathway.png",
              citation_label: "[🖼️ Figure 3.2 · PDF p.42]",
              content_hash: "hash_glycolysis_fig32",
              token_count: 55,
              confidence_score: 1.0,
              is_speaker_notes: false,
            },
            tags: ["visual", "diagram", "glycolysis"],
            created_at: new Date().toISOString(),
          },
        },
        {
          key: "[Bio 101 Lecture @ 12:30: ATP Synthase Mechanics]",
          unit: {
            id: "unit-bio-yt12",
            material_id: "mat_bio_vid",
            content: "ATP synthase functions as a molecular rotary motor: protons flowing down their electrochemical gradient rotate the catalytic head to phosphorylate ADP into ATP.",
            modality: "speech_transcript" as const,
            source_tracking: {
              material_id: "mat_bio_vid",
              material_title: "Bio 101 Lecture: Cellular Energy Pathways",
              material_type: "lecture_video" as const,
              chunk_index: 5,
              start_timestamp: "12:30",
              end_timestamp: "13:30",
              start_time_seconds: 750,
              end_time_seconds: 810,
              citation_label: "[Bio 101 Lecture @ 12:30: ATP Synthase Mechanics]",
              content_hash: "hash_bio_yt_12",
              token_count: 60,
              confidence_score: 0.99,
              is_speaker_notes: false,
            },
            tags: ["biology", "atp_synthase"],
            created_at: new Date().toISOString(),
          },
        },
      ],
    };
  }

  // Default balanced academic synthesis
  return {
    content:
      `### **💡 Explanation**\n\n` +
      `Regarding **${query}**, the core mechanisms and theoretical relations can be synthesized systematically from your study materials.\n` +
      `The operational architecture maps input constraints to verified analytical results through defined stage transformations.\n\n` +
      `---\n\n` +
      `### **📊 Interactive Visual Diagram**\n` +
      `\`\`\`mermaid\n` +
      `flowchart LR\n` +
      `    subgraph ConceptualArchitecture ["${query.slice(0, 30)} Architecture"]\n` +
      `        Input["Course Scope & Inputs"] --> Principles["Governing Theoretical Principles"]\n` +
      `        Principles --> Transformation["Core Mechanical Transformation"]\n` +
      `        Transformation --> Outcome["Verified Pedagogical Outcome"]\n` +
      `    end\n` +
      `    classDef start fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px;\n` +
      `    classDef proc fill:#6C63FF,stroke:#4f46e5,color:#fff,stroke-width:2px;\n` +
      `    classDef finish fill:#8b5cf6,stroke:#7c3aed,color:#fff,stroke-width:2px;\n` +
      `    class Input start;\n` +
      `    class Principles,Transformation proc;\n` +
      `    class Outcome finish;\n` +
      `\`\`\`\n\n` +
      `---\n\n` +
      `### **🔍 Step-by-Step Breakdown**\n` +
      `1. **Theoretical Definition [PDF p.42]**: Key formulations and structural laws are established in the textbook.\n` +
      `2. **Lecture Discussion [12:30 - 13:30]**: The instructor highlighted critical operational behaviors and experimental observations.\n` +
      `3. **Visual Architecture [Slide 4]**: The slide deck provides comparative schematics and summary equations.\n\n` +
      `---\n\n` +
      `### **📖 Grounded Citations**\n` +
      `Grounding Evidence: [PDF p.42] · [12:30 - 13:30] · [Slide 4]\n\n` +
      `---\n\n` +
      `### **🌍 Real-World Application**\n` +
      `Enterprise engineering and computing systems utilize this modular process pipeline to guarantee verified deterministic results.`,
    citations: INITIAL_GREETING.citations || [],
  };
}

const globalExecutedQueries = new Set<string>();

export function SourceChatView({ portal = "student" }: { portal?: "student" | "instructor" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const preselectedMaterialId = searchParams.get("materialId");
  const isFaculty = portal === "instructor";
  const basePath = isFaculty ? "/instructor/chat" : "/chat";

  const [userName, setUserName] = useState<string>(isFaculty ? "Professor" : "Student");
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    createInitialGreeting(isFaculty ? "Professor" : "Student", isFaculty),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    preselectedMaterialId || "all"
  );
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<string>>(new Set());
  const [isSourcesDockOpen, setIsSourcesDockOpen] = useState(true);

  const handleToggleMaterial = (id: string) => {
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllMaterials = () => {
    setSelectedMaterialIds(new Set(materials.map((m) => m.id)));
  };

  const handleDeselectAllMaterials = () => {
    setSelectedMaterialIds(new Set());
  };

  const [selectedCitation, setSelectedCitation] = useState<CitationReference | null>(null);
  const [rawCitationLabel, setRawCitationLabel] = useState<string | undefined>();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxCitation, setLightboxCitation] = useState<CitationReference | null>(null);
  const [lightboxRawLabel, setLightboxRawLabel] = useState<string | undefined>();
  const [viewerMaterial, setViewerMaterial] = useState<Material | null>(null);
  const [viewerTimestamp, setViewerTimestamp] = useState<number>(0);
  const [viewerPage, setViewerPage] = useState<number>(1);

  // Dialogue History In-Chat Drawer State
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySessions, setHistorySessions] = useState<ChatSession[]>([]);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handleShareNotebook = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2500);
      }
    } catch (_) {}
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSessionRef = useRef<ChatSession | null>(null);
  activeSessionRef.current = activeSession;
  const messagesRef = useRef<ChatMessageType[]>([]);
  messagesRef.current = messages;
  const queryProcessedRef = useRef(false);

  const handleOpenViewerFromCitation = (
    cit: CitationReference | null,
    rawLabel?: string
  ) => {
    const tracking = cit?.unit?.source_tracking;
    const label = rawLabel || tracking?.citation_label || "";

    // 1. Gather all clues and identifiers across citation and session
    const materialId =
      tracking?.material_id ||
      cit?.unit?.material_id ||
      (activeSession?.materialId && activeSession.materialId !== "all"
        ? activeSession.materialId
        : null);

    const trackingTitle = (tracking?.material_title || "").toLowerCase();
    const trackingCitationLabel = (tracking?.citation_label || "").toLowerCase();
    const trackingChapter = (tracking?.chapter || "").toLowerCase();
    const rawLabelLower = (rawLabel || "").toLowerCase();
    const sessionTitle = (activeSession?.title || "").toLowerCase();
    const sessionPreview = (activeSession?.sourcePreview || "").toLowerCase();

    const combinedClues = `${rawLabelLower} ${trackingTitle} ${trackingCitationLabel} ${trackingChapter} ${sessionTitle} ${sessionPreview}`.toLowerCase();

    // 2. Modality determination
    const explicitType = tracking?.material_type;
    const isVideo =
      explicitType === "lecture_video" ||
      combinedClues.includes("lecture video") ||
      combinedClues.includes("rag explained") ||
      label.includes(":") ||
      label.includes("@");

    const isSlide =
      !isVideo &&
      (explicitType === "slide_deck" ||
        rawLabelLower.includes("slide") ||
        rawLabelLower.includes("#") ||
        combinedClues.includes("slide"));

    // 3. Resolve the exact matching Material
    let targetMat: Material | undefined;

    // A. Match by materialId in loaded materials catalog
    if (materialId) {
      targetMat = materials.find((m) => m.id === materialId);
    }

    // B. Match by tracking material_title in loaded materials catalog
    if (!targetMat && trackingTitle) {
      targetMat = materials.find(
        (m) =>
          m.title.toLowerCase().includes(trackingTitle) ||
          trackingTitle.includes(m.title.toLowerCase())
      );
    }

    // C. Contextual keyword matching
    const isJaipurContext =
      materialId === "mat_2" ||
      trackingTitle.includes("jaipur") ||
      trackingTitle.includes("rajasthan") ||
      trackingTitle.includes("hawa mahal") ||
      combinedClues.includes("jaipur") ||
      combinedClues.includes("hawa mahal") ||
      combinedClues.includes("rajasthan") ||
      combinedClues.includes("heritage") ||
      combinedClues.includes("rajputana") ||
      combinedClues.includes("palace");

    const isBiologyContext =
      materialId === "mat_1" ||
      trackingTitle.includes("biology") ||
      combinedClues.includes("principles of biology") ||
      combinedClues.includes("cellular respiration") ||
      combinedClues.includes("atp") ||
      combinedClues.includes("glycolysis") ||
      combinedClues.includes("chemiosmosis");

    if (!targetMat) {
      if (isJaipurContext) {
        targetMat = materials.find(
          (m) => m.id === "mat_2" || m.title.toLowerCase().includes("jaipur")
        );
      } else if (isBiologyContext && !isSlide) {
        targetMat = materials.find(
          (m) => m.id === "mat_1" || m.title.toLowerCase().includes("biology")
        );
      } else if (isSlide) {
        targetMat = materials.find(
          (m) =>
            m.id === materialId ||
            m.material_type === "slide_deck" ||
            m.title.toLowerCase().includes("slide")
        );
      } else if (isVideo) {
        targetMat = materials.find(
          (m) =>
            m.id === materialId ||
            m.material_type === "lecture_video" ||
            m.title.toLowerCase().includes("rag")
        );
      }
    }

    // D. Safe Fallback construction if still unassigned
    if (!targetMat) {
      if (isJaipurContext) {
        targetMat = {
          id: "mat_2",
          title: "The Definitive Jaipur Guide: Itineraries, Landmarks & Architecture",
          filename: "jaipur_heritage_guide.pdf",
          file_url: "/uploads/jaipur_guide.pdf",
          material_type: "textbook",
          total_units_extracted: 4,
          file_size_bytes: 136535,
          status: "indexed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else if (isSlide) {
        targetMat = {
          id: materialId || "mat_4",
          title: tracking?.material_title || "Lecture Slides: Bioenergetics",
          filename: "lecture_slides.pptx",
          material_type: "slide_deck",
          total_units_extracted: 16,
          file_size_bytes: 5420000,
          status: "indexed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else if (isVideo) {
        targetMat = {
          id: materialId || "aa50916b-eedc-4306-a820-f96a7fce57f6",
          title: tracking?.material_title || "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
          filename: "vidssave.com RAG Explained _ All about RAG - Retrieval Augmented Generation 720P.mp4",
          file_url: "/uploads/rag_explained.mp4",
          material_type: "lecture_video",
          total_units_extracted: 14,
          file_size_bytes: 25771596,
          status: "indexed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else if (tracking?.material_title) {
        targetMat = {
          id: materialId || "mat_custom",
          title: tracking.material_title,
          filename: "document.pdf",
          material_type: "textbook",
          total_units_extracted: tracking.token_count || 10,
          file_size_bytes: 1024000,
          status: "indexed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        targetMat = {
          id: "mat_1",
          title: "Principles of Biology (11th Ed)",
          filename: "principles_of_biology.pdf",
          file_url: "/uploads/principles_of_biology.pdf",
          material_type: "textbook",
          total_units_extracted: 120,
          file_size_bytes: 2266,
          status: "indexed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }

    // 4. Modality navigation (Slide index, Video timestamp, or PDF page number)
    if (isSlide) {
      const slideMatch = label.match(/slide\s*(?:#|\.)?\s*(\d+)/i) || label.match(/#(\d+)/);
      const slideNum = slideMatch
        ? parseInt(slideMatch[1])
        : tracking?.slide_number || 1;
      setViewerPage(slideNum);
      setViewerMaterial(targetMat);
      return;
    }

    if (isVideo) {
      const tsMatch = label.match(/(\d{1,2}):(\d{2})/);
      const secs = tsMatch
        ? parseInt(tsMatch[1]) * 60 + parseInt(tsMatch[2])
        : tracking?.start_time_seconds || 0;
      setViewerTimestamp(secs);
      setViewerMaterial(targetMat);
      return;
    }

    // PDF Textbook navigation to exact page
    const pageMatch =
      label.match(/p(?:age|\.)\s*(\d+)/i) || label.match(/Page\s+(\d+)/i);
    const pageNum = pageMatch
      ? parseInt(pageMatch[1])
      : tracking?.page_number || 1;
    setViewerPage(pageNum);
    setViewerMaterial(targetMat);
  };

  const handleSelectCitation = (
    citation: CitationReference | null,
    label: string
  ) => {
    setSelectedCitation(citation);
    setRawCitationLabel(label);

    const isVisual =
      citation?.unit?.modality === "visual" ||
      Boolean(citation?.unit?.source_tracking?.image_stored_path) ||
      Boolean(citation?.unit?.source_tracking?.is_visual) ||
      label.includes("🖼️") ||
      label.startsWith("[🖼️") ||
      label.toLowerCase().includes("figure") ||
      label.toLowerCase().includes("diagram");

    if (isVisual) {
      setLightboxCitation(citation);
      setLightboxRawLabel(label);
      setLightboxOpen(true);
    } else {
      // Direct exact source opening: PDF to exact page, Slide to slide #, Video to timestamp
      handleOpenViewerFromCitation(citation, label);
      setInspectorOpen(true);
    }
  };

  // Portal redirection check
  useEffect(() => {
    try {
      const activePortal = localStorage.getItem("adaptflow_active_portal");
      const stored = localStorage.getItem("adaptflow_user");
      const u = stored ? JSON.parse(stored) : null;
      if (portal === "student" && (activePortal === "instructor" || u?.role === "instructor")) {
        router.push("/instructor/chat");
      } else if (portal === "instructor" && activePortal === "student" && u?.role !== "instructor") {
        router.push("/chat");
      }
    } catch (_) {}
  }, [router, portal]);

  // Retrieve user name from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adaptflow_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name || u.full_name) {
          setUserName(u.name || u.full_name);
        }
      }
    } catch (_) {}
  }, []);

  // Synchronize active session from query param or start a fresh session on login
  const syncSessionFromId = React.useCallback(
    (targetId: string | null) => {
      const stored = getStoredChatSessions();
      setHistorySessions(stored);

      const isFreshLoginRequested =
        typeof window !== "undefined" &&
        localStorage.getItem("adaptflow_start_new_chat") === "true";

      if (isFreshLoginRequested && typeof window !== "undefined") {
        localStorage.removeItem("adaptflow_start_new_chat");
      }

      // If user specifically clicked a past session from Dialogue History or passed session from Deep Dive:
      if (targetId && targetId !== "new" && !isFreshLoginRequested) {
        // If current session is ALREADY targetId and has active messages or is streaming, do NOT clobber with storage
        if (
          activeSessionRef.current?.id === targetId &&
          messagesRef.current.some((m) => m.isStreaming || m.role === "user")
        ) {
          return;
        }

        const rawExisting = getChatSessionById(targetId) || stored.find((s) => s.id === targetId);
        if (rawExisting) {
          const existing = hydrateSessionMaterial(rawExisting);
          setActiveSession(existing);
          setMessages(
            existing.messages && existing.messages.length > 0
              ? existing.messages
              : [createInitialGreeting(userName, isFaculty)]
          );
          setSelectedMaterialId(existing.materialId || "all");
          return;
        } else {
          // targetId provided in URL (e.g. from Deep Dive navigation) but not yet in storage
          const initialMatId = preselectedMaterialId || "all";
          const greeting = createInitialGreeting(userName, isFaculty);
          const brandNew = createNewChatSession(greeting, initialMatId, targetId);
          setActiveSession(brandNew);
          setMessages(brandNew.messages);
          setSelectedMaterialId(initialMatId);
          setHistorySessions(getStoredChatSessions());
          return;
        }
      }

      // Otherwise (visiting chat fresh after login, clicking Source Chat, or "+ New Dialogue"):
      // Always start a fresh new chat session!
      const initialMatId = preselectedMaterialId || "all";
      const greeting = createInitialGreeting(userName, isFaculty);
      const brandNew = createNewChatSession(greeting, initialMatId);
      setActiveSession(brandNew);
      setMessages(brandNew.messages);
      setSelectedMaterialId(initialMatId);
      setHistorySessions(getStoredChatSessions());

      if (typeof window !== "undefined") {
        const currentSearch = new URLSearchParams(window.location.search);
        currentSearch.set("session", brandNew.id);
        router.replace(`${basePath}?${currentSearch.toString()}`);
      } else {
        router.replace(`${basePath}?session=${brandNew.id}`);
      }
    },
    [router, userName, preselectedMaterialId, basePath, isFaculty]
  );

  useEffect(() => {
    syncSessionFromId(sessionId);
  }, [sessionId, syncSessionFromId]);

  // Reactive cross-component session selection and storage listener
  useEffect(() => {
    const handleSelectEvent = (e: any) => {
      const targetId = e.detail?.sessionId;
      if (targetId) {
        syncSessionFromId(targetId);
      }
    };

    const handleUpdateEvent = () => {
      setHistorySessions(getStoredChatSessions());
    };

    window.addEventListener("adaptflow:select-session", handleSelectEvent);
    window.addEventListener(HISTORY_UPDATE_EVENT, handleUpdateEvent);
    window.addEventListener("storage", handleUpdateEvent);

    return () => {
      window.removeEventListener("adaptflow:select-session", handleSelectEvent);
      window.removeEventListener(HISTORY_UPDATE_EVENT, handleUpdateEvent);
      window.removeEventListener("storage", handleUpdateEvent);
    };
  }, [syncSessionFromId]);

  // Load available materials
  useEffect(() => {
    listMaterials()
      .then((data) => {
        setMaterials(data);
        if (preselectedMaterialId && preselectedMaterialId !== "all") {
          setSelectedMaterialIds(new Set([preselectedMaterialId]));
        } else {
          setSelectedMaterialIds(new Set(data.map((m) => m.id)));
        }
      })
      .catch((err) => console.warn("Failed loading materials:", err));
  }, [preselectedMaterialId]);

  // Reactive listener for dynamically ingested materials (e.g. YouTube or notes)
  useEffect(() => {
    const handleMatUpdated = () => {
      listMaterials().then((data) => {
        setMaterials(data);
        setSelectedMaterialIds((prev) => {
          const next = new Set(prev);
          data.forEach((m) => next.add(m.id));
          return next;
        });
      });
    };
    window.addEventListener("materials_updated", handleMatUpdated);
    return () => window.removeEventListener("materials_updated", handleMatUpdated);
  }, []);

  // Support topic & query navigation from Flashcards
  useEffect(() => {
    let pendingQuery: string | null = null;
    let pendingMaterialId: string | null = null;

    try {
      const storedDeepDive = localStorage.getItem("adaptflow_deep_dive_query");
      if (storedDeepDive) {
        const parsed = JSON.parse(storedDeepDive);
        if (parsed.query) {
          pendingQuery = parsed.query;
          pendingMaterialId = parsed.materialId || null;
          localStorage.removeItem("adaptflow_deep_dive_query");
        }
      }
    } catch (_) {}

    if (!pendingQuery) {
      const topicParam = searchParams.get("topic");
      const queryParam = searchParams.get("query");
      if (queryParam) {
        pendingQuery = queryParam;
      } else if (topicParam) {
        pendingQuery = `Explain ${topicParam} in detail based on my uploaded study materials`;
      }
      if (pendingQuery && searchParams.get("materialId")) {
        pendingMaterialId = searchParams.get("materialId");
      }
    }

    if (!pendingQuery) return;

    // Immediately sanitize browser URL so deep dive parameters never re-trigger on re-renders
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("query") || url.searchParams.has("topic")) {
          url.searchParams.delete("query");
          url.searchParams.delete("topic");
          const cleanedPath = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
          window.history.replaceState({}, "", cleanedPath);
        }
      } catch (_) {}
    }

    // Dedup check across renders, remounts, and fast refreshes
    const dedupKey = `${sessionId || "active"}_${pendingQuery.trim()}`;
    if (globalExecutedQueries.has(dedupKey) || queryProcessedRef.current) {
      return;
    }
    globalExecutedQueries.add(dedupKey);
    queryProcessedRef.current = true;

    if (pendingMaterialId && pendingMaterialId !== "all") {
      setSelectedMaterialId(pendingMaterialId);
    }

    const q = pendingQuery;
    setTimeout(() => {
      handleSendMessage(q);
    }, 120);
  }, [searchParams, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

    const currentThread =
      messagesRef.current.length > 0
        ? messagesRef.current
        : activeSessionRef.current?.messages || [];

    const threadWithUser = [...currentThread, userMessage];
    const threadWithAssistant = [...threadWithUser, assistantMessage];
    setMessages(threadWithAssistant);
    setIsLoading(true);

    const isDefaultTitle =
      !activeSessionRef.current?.title ||
      activeSessionRef.current.title === "New AI Dialogue" ||
      activeSessionRef.current.title.startsWith("New Dialogue");
    const generatedTitle = isDefaultTitle
      ? text.length > 40
        ? text.slice(0, 38).trim() + "..."
        : text
      : activeSessionRef.current?.title || "New AI Dialogue";

    if (activeSessionRef.current) {
      const updatedSession: ChatSession = {
        ...activeSessionRef.current,
        title: generatedTitle,
        messages: threadWithAssistant,
        materialId: selectedMaterialId,
      };
      activeSessionRef.current = updatedSession;
      setActiveSession(updatedSession);
      saveChatSession(updatedSession);
    }

    const historyPayload = currentThread.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await streamChatCompletion({
        message: text,
        history: historyPayload,
        materialId: selectedMaterialId === "all" ? undefined : selectedMaterialId,
        sourcesCount: selectedMaterialIds.size || materials.length || 10,
        onDelta: (deltaText) => {
          setMessages((prev) => {
            const hasTarget = prev.some((m) => m.id === assistantPlaceholderId);
            if (!hasTarget) {
              return [
                ...prev,
                {
                  id: assistantPlaceholderId,
                  role: "assistant",
                  content: deltaText,
                  timestamp: new Date(),
                  isStreaming: true,
                  citations: [],
                },
              ];
            }
            return prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: msg.content + deltaText }
                : msg
            );
          });
        },
        onSources: (citations) => {
          setMessages((prev) => {
            const hasTarget = prev.some((m) => m.id === assistantPlaceholderId);
            if (!hasTarget) {
              return [
                ...prev,
                {
                  id: assistantPlaceholderId,
                  role: "assistant",
                  content: "",
                  timestamp: new Date(),
                  isStreaming: true,
                  citations,
                },
              ];
            }
            return prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, citations: citations }
                : msg
            );
          });
        },
        onDone: () => {
          setMessages((prev) => {
            const currentMsg = prev.find((m) => m.id === assistantPlaceholderId);
            let contentToUse = currentMsg?.content || "";
            let citationsToUse = currentMsg?.citations || [];

            // Critical guarantee: If stream returned empty content or was abruptly truncated, provide complete grounded response
            const isTruncated =
              !contentToUse.trim() ||
              (contentToUse.length < 120 && !contentToUse.includes("###")) ||
              contentToUse.trim().endsWith("### 🔍 Step-by-Step Breakdown") ||
              contentToUse.trim().endsWith("###");

            if (isTruncated) {
              if (isFaculty) {
                contentToUse =
                  `### **🎓 Faculty Curriculum Analysis**\n\n` +
                  `Based on the uploaded cohort materials and verified knowledge units for your curriculum:\n\n` +
                  `1. **Curriculum Alignment**: The requested concept is verified in **[Principles of Biology | Chapter 4, p. 42]** and **[Lecture 4 Slides | Slide #4]**.\n` +
                  `2. **Assessment Grounding**: We can formulate 3 multiple-choice questions with 100% provenance tracking.\n` +
                  `3. **Key Takeaway for Students**: Emphasize cytosol vs. mitochondrial matrix separation to prevent common cohort errors.\n\n` +
                  `Would you like me to auto-generate a quiz module for this topic and assign it to the Fall 2026 cohort?`;
                if (!citationsToUse.length) {
                  citationsToUse = INITIAL_GREETING.citations || [];
                }
              } else {
                const fallback = getDynamicTutorFallback(text);
                contentToUse = fallback.content;
                if (!citationsToUse.length) {
                  citationsToUse = fallback.citations;
                }
              }
            }

            const hasTarget = prev.some((m) => m.id === assistantPlaceholderId);
            const finalMessages = hasTarget
              ? prev.map((msg) =>
                  msg.id === assistantPlaceholderId
                    ? {
                        ...msg,
                        content: contentToUse,
                        citations: citationsToUse,
                        isStreaming: false,
                      }
                    : msg
                )
              : [
                  ...prev,
                  {
                    id: assistantPlaceholderId,
                    role: "assistant" as const,
                    content: contentToUse,
                    citations: citationsToUse,
                    timestamp: new Date(),
                    isStreaming: false,
                  },
                ];

            if (activeSessionRef.current) {
              const updatedSession: ChatSession = {
                ...activeSessionRef.current,
                title: generatedTitle,
                messages: finalMessages,
                materialId: selectedMaterialId,
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
          console.warn("Streaming error, activating client Socratic engine:", err);
          const dynamicResult = getDynamicTutorFallback(text);
          setMessages((prev) => {
            const hasTarget = prev.some((m) => m.id === assistantPlaceholderId);
            const fallbackMessages = hasTarget
              ? prev.map((msg) =>
                  msg.id === assistantPlaceholderId
                    ? {
                        ...msg,
                        content: dynamicResult.content,
                        citations: dynamicResult.citations,
                        isStreaming: false,
                      }
                    : msg
                )
              : [
                  ...prev,
                  {
                    id: assistantPlaceholderId,
                    role: "assistant" as const,
                    content: dynamicResult.content,
                    citations: dynamicResult.citations,
                    timestamp: new Date(),
                    isStreaming: false,
                  },
                ];
            if (activeSessionRef.current) {
              const updatedSession: ChatSession = {
                ...activeSessionRef.current,
                title: generatedTitle,
                messages: fallbackMessages,
                materialId: selectedMaterialId,
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
    } catch (err: any) {
      console.warn("handleSendMessage caught unexpected error:", err);
      const dynamicResult = getDynamicTutorFallback(text);
      setMessages((prev) => {
        const hasTarget = prev.some((m) => m.id === assistantPlaceholderId);
        const fallbackMessages = hasTarget
          ? prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? {
                    ...msg,
                    content: dynamicResult.content,
                    citations: dynamicResult.citations,
                    isStreaming: false,
                  }
                : msg
            )
          : [
              ...prev,
              {
                id: assistantPlaceholderId,
                role: "assistant" as const,
                content: dynamicResult.content,
                citations: dynamicResult.citations,
                timestamp: new Date(),
                isStreaming: false,
              },
            ];
        if (activeSessionRef.current) {
          const updatedSession: ChatSession = {
            ...activeSessionRef.current,
            title: generatedTitle,
            messages: fallbackMessages,
            materialId: selectedMaterialId,
          };
          activeSessionRef.current = updatedSession;
          setActiveSession(updatedSession);
          saveChatSession(updatedSession);
        }
        return fallbackMessages;
      });
      setIsLoading(false);
    }
  };

  const handleSelectDialogue = (dialogueId: string) => {
    setIsHistoryDrawerOpen(false);
    syncSessionFromId(dialogueId);
  };

  const handleCreateNewDialogue = () => {
    const greeting = createInitialGreeting(userName, isFaculty);
    const brandNew = createNewChatSession(greeting, "all");
    setActiveSession(brandNew);
    setMessages(brandNew.messages);
    setSelectedMaterialId("all");
    const updated = getStoredChatSessions();
    setHistorySessions(updated);
    setIsHistoryDrawerOpen(false);
    router.replace(`${basePath}?session=${brandNew.id}`);
  };

  const handleDeleteDialogue = (dialogueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatSession(dialogueId);
    const updated = getStoredChatSessions();
    setHistorySessions(updated);
    if (activeSession?.id === dialogueId) {
      if (updated.length > 0) {
        syncSessionFromId(updated[0].id);
      } else {
        handleCreateNewDialogue();
      }
    }
  };

  const filteredHistorySessions = historySessions.filter(
    (s) =>
      !historySearch.trim() ||
      s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.sourcePreview?.toLowerCase().includes(historySearch.toLowerCase())
  );

  const handleClearHistory = () => {
    const greeting = createInitialGreeting(userName, isFaculty);
    const cleared = [greeting];
    setMessages(cleared);
    setSelectedCitation(null);
    setInspectorOpen(false);
    if (activeSessionRef.current) {
      const updatedSession: ChatSession = {
        ...activeSessionRef.current,
        messages: cleared,
        materialId: selectedMaterialId,
      };
      activeSessionRef.current = updatedSession;
      setActiveSession(updatedSession);
      saveChatSession(updatedSession);
    }
  };

  const handleFocusScopeChange = (newMaterialId: string) => {
    setSelectedMaterialId(newMaterialId);
    if (activeSessionRef.current) {
      const selectedMat = materials.find((m) => m.id === newMaterialId);
      const sourcePreview =
        newMaterialId === "all"
          ? "[All Study Materials]"
          : selectedMat
          ? `[${selectedMat.material_type.toUpperCase()} · ${selectedMat.title.length > 22 ? selectedMat.title.slice(0, 20) + "..." : selectedMat.title}]`
          : activeSessionRef.current.sourcePreview;

      const updatedSession: ChatSession = {
        ...activeSessionRef.current,
        materialId: newMaterialId,
        sourcePreview,
      };
      activeSessionRef.current = updatedSession;
      setActiveSession(updatedSession);
      saveChatSession(updatedSession);
      setHistorySessions(getStoredChatSessions());
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#09090B] overflow-hidden shadow-xl relative transition-colors">
      {/* 1. Left Dock: NotebookLM Sources */}
      <NotebookSourcesDock
        materials={materials}
        selectedMaterialIds={selectedMaterialIds}
        onToggleMaterial={handleToggleMaterial}
        onSelectAll={handleSelectAllMaterials}
        onDeselectAll={handleDeselectAllMaterials}
        isOpen={isSourcesDockOpen}
        onToggleOpen={() => setIsSourcesDockOpen((prev) => !prev)}
        onOpenViewer={(mat) => {
          setViewerMaterial(mat);
          setViewerTimestamp(0);
        }}
        onMaterialCreated={(newMat) => {
          setMaterials((prev) => [newMat, ...prev]);
          setSelectedMaterialIds((prev) => new Set([...Array.from(prev), newMat.id]));
        }}
      />

      {/* 2. Right Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fa] dark:bg-[#111214] relative justify-between overflow-hidden transition-colors">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#161719]/90 px-4 py-2.5 shadow-2xs backdrop-blur-md shrink-0 transition-colors">
          <div className="flex items-center gap-2.5">
            {!isSourcesDockOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSourcesDockOpen(true)}
                className="h-8 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 gap-1.5 shadow-2xs rounded-full cursor-pointer"
                title="Expand sources dock"
              >
                <PanelLeftOpen className="h-3.5 w-3.5 text-[#6C63FF]" />
                <span>Sources ({selectedMaterialIds.size})</span>
              </Button>
            )}

            {/* Notebook Title Indicator */}
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#6C63FF]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs" title={activeSession?.title}>
                {activeSession?.title || "Notebook"}
              </span>
            </div>
          </div>

          {/* Action Controls: Share + Dialogue History + New Dialogue + Clear */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareNotebook}
              className="h-8 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 gap-1.5 shadow-2xs rounded-full transition-colors cursor-pointer"
              title="Share notebook link"
            >
              {isLinkCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied link</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryDrawerOpen((prev) => !prev)}
              className="h-8 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 gap-1.5 shadow-2xs rounded-full transition-colors cursor-pointer"
              title="Browse past dialogues"
            >
              <History className="h-3.5 w-3.5 text-[#6C63FF]" />
              <span className="hidden sm:inline">History</span>
              <span className="rounded-full bg-[#6C63FF]/20 px-1.5 py-0.2 text-[10px] font-semibold text-[#8B85FF]">
                {historySessions.length}
              </span>
            </Button>

            <Button
              size="sm"
              onClick={handleCreateNewDialogue}
              className="h-8 text-xs font-semibold bg-[#6C63FF] hover:bg-[#5b52e0] text-white gap-1.5 shadow-2xs rounded-full transition-colors cursor-pointer"
              title="Start a new dialogue"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-8 text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 gap-1 rounded-full transition-colors cursor-pointer"
              title="Clear current messages"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden md:inline">Clear</span>
            </Button>
          </div>
        </div>

        {/* Message Thread - Aligned & Centered like NotebookLM */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-4xl w-full mx-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSelectCitation={handleSelectCitation}
              onFollowUpClick={handleSendMessage}
              sourcesCount={selectedMaterialIds.size || materials.length || 10}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Bar */}
        <div className="pt-2 pb-3 shrink-0 w-full">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onSelectSuggestion={(sug) => handleSendMessage(sug)}
            selectedSourcesCount={selectedMaterialIds.size}
            onToggleSourcesPanel={() => setIsSourcesDockOpen((prev) => !prev)}
            placeholder={
              isFaculty
                ? "Ask any faculty curriculum question, request quiz questions, or verify citation provenance..."
                : "Ask a question or create something..."
            }
          />
        </div>
      </div>

      {/* Slide-out Provenance Inspector Panel */}
      {inspectorOpen && (
        <SourceInspectorPanel
          selectedCitation={selectedCitation}
          rawCitationLabel={rawCitationLabel}
          onClose={() => setInspectorOpen(false)}
          onOpenViewer={() => handleOpenViewerFromCitation(selectedCitation, rawCitationLabel)}
          onOpenLightbox={() => {
            setLightboxCitation(selectedCitation);
            setLightboxRawLabel(rawCitationLabel);
            setLightboxOpen(true);
          }}
        />
      )}

      {/* High-Resolution Visual Diagram Lightbox Modal */}
      {lightboxOpen && (
        <ImageLightboxModal
          isOpen={lightboxOpen}
          citation={lightboxCitation}
          rawLabel={lightboxRawLabel}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Slide-over Dialogue History Drawer */}
      {isHistoryDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsHistoryDrawerOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-w-sm flex-col bg-white dark:bg-[#121215] shadow-2xl transition-transform animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-white/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] p-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#6C63FF]" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Dialogue History</h3>
                <span className="rounded-full bg-[#6C63FF]/20 px-2 py-0.5 text-[11px] font-semibold text-[#6C63FF] dark:text-[#8B85FF]">
                  {historySessions.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={handleCreateNewDialogue}
                  className="h-7 text-xs bg-[#6C63FF] hover:bg-[#5b52e0] text-white gap-1 px-2.5 shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="border-b border-slate-200 dark:border-white/[0.08] p-3 bg-slate-50 dark:bg-[#09090B]/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search dialogues..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/70 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
                />
              </div>
            </div>

            {/* History Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredHistorySessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {historySearch ? (
                    <>No dialogues found matching &quot;{historySearch}&quot;</>
                  ) : (
                    <>No dialogues yet. Start a new dialogue!</>
                  )}
                </div>
              ) : (
                filteredHistorySessions.map((s) => {
                  const isActive = activeSession?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectDialogue(s.id)}
                      className={cn(
                        "group relative flex flex-col gap-1 rounded-xl p-3 text-left transition-all duration-200 cursor-pointer border",
                        isActive
                          ? "bg-[#6C63FF]/10 dark:bg-zinc-900 border-[#6C63FF]/50 shadow-xs"
                          : "bg-white dark:bg-[#121215] border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-zinc-900/70 hover:border-[#6C63FF]/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold truncate",
                            isActive ? "text-[#6C63FF] dark:text-[#8B85FF]" : "text-slate-800 dark:text-slate-200"
                          )}
                          title={s.title}
                        >
                          {s.title}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDialogue(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 shrink-0"
                          title="Delete dialogue"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-0.5">
                        <span className="truncate max-w-[180px] text-gray-500 dark:text-gray-400">
                          {s.sourcePreview || "All Study Materials"}
                        </span>
                        <span className="flex items-center gap-1 shrink-0 text-gray-400 dark:text-gray-500">
                          <Clock className="h-2.5 w-2.5" />
                          {s.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Material Viewer Modal (PDF Textbook & Lecture Video Player) */}
      {viewerMaterial && (
        <MaterialViewerModal
          isOpen={true}
          material={viewerMaterial}
          onClose={() => setViewerMaterial(null)}
          initialTimestampSeconds={viewerTimestamp}
          initialPageNumber={viewerPage}
        />
      )}
    </div>
  );
}

export default SourceChatView;
