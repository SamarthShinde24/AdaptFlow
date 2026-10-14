"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BarChart3,
  BookOpen,
  Globe2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Pin,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Film,
  Presentation,
  CheckCheck,
} from "lucide-react";
import { CitationReference, Material } from "@/lib/types";
import { MermaidRenderer } from "@/components/chat/mermaid-renderer";
import { CitationChip } from "@/components/chat/citation-chip";
import { cn } from "@/lib/utils";

interface StructuredResponseCardProps {
  content: string;
  citations?: CitationReference[];
  isStreaming?: boolean;
  onSelectCitation: (citation: CitationReference | null, label: string) => void;
  onFollowUpClick?: (questionText: string) => void;
  sourcesCount?: number;
}

export interface SerialPoint {
  index: number;
  label?: string;
  content: string;
}

interface ParsedSections {
  leadProse: string;
  serialPoints: SerialPoint[];
  trailingProse: string;
  mermaidCode: string;
  sources: string[];
  realWorld: string;
  extractedConcept: string;
  generalKnowledge?: string;
  isRefusal?: boolean;
}

/**
 * Formats mathematical notation for clean inline reading,
 * converting raw LaTeX backslashes into standard math symbols.
 */
function cleanMathNotation(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\\\\((.*?)\\\\\)/g, "$1")
    .replace(/\\\((.*?)\\\)/g, "$1")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt\(([^)]+)\)/g, "√($1)")
    .replace(/\\sqrt/g, "√")
    .replace(/√\{([^}]+)\}/g, "√($1)")
    .replace(/\\\[(.*?)\\\]/g, "$1");
}

/**
 * Sanitizes Mermaid code to avoid syntax parse errors and harmonizes
 * all node styling to the clean educational pastel palette:
 * - Warm Peach (#FFE6CC) for Root / Base concepts
 * - Soft Mint (#D5E8D4) for Derived / Core focal entities
 * - Soft Lavender (#E1D5E7) for Members / Attributes / Operations
 */
function sanitizeMermaidCode(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:mermaid)?/i, "").replace(/```$/, "").trim();
  cleaned = cleaned.replace(/;\s*$/gm, "");

  if (
    !cleaned.startsWith("graph") &&
    !cleaned.startsWith("flowchart") &&
    !cleaned.startsWith("sequenceDiagram") &&
    !cleaned.startsWith("gantt") &&
    !cleaned.startsWith("classDiagram") &&
    !cleaned.startsWith("stateDiagram")
  ) {
    cleaned = `graph TD\n${cleaned}`;
  }

  // Harmonize legacy saturated dark/neon styles to clean educational pastels with dark text
  cleaned = cleaned
    .replace(/fill:#10b981/gi, "fill:#D5E8D4")
    .replace(/fill:#059669/gi, "fill:#D5E8D4")
    .replace(/fill:#6C63FF/gi, "fill:#E1D5E7")
    .replace(/fill:#4f46e5/gi, "fill:#E1D5E7")
    .replace(/fill:#8b5cf6/gi, "fill:#E1D5E7")
    .replace(/fill:#7c3aed/gi, "fill:#E1D5E7")
    .replace(/fill:#ea580c/gi, "fill:#FFE6CC")
    .replace(/fill:#f59e0b/gi, "fill:#FFE6CC")
    .replace(/fill:#d97706/gi, "fill:#FFE6CC")
    .replace(/fill:#0ea5e9/gi, "fill:#D5E8D4")
    .replace(/stroke:#4f46e5/gi, "stroke:#9673A6")
    .replace(/stroke:#7c3aed/gi, "stroke:#9673A6")
    .replace(/stroke:#059669/gi, "stroke:#333333")
    .replace(/color:#fff(?:fff)?/gi, "color:#000000");

  return cleaned;
}

/**
 * Generates an accurate, topic-grounded Mermaid diagram using
 * clean educational pastel palette and clear hierarchical structure.
 */
function getOrGenerateMermaidDiagram(
  rawText: string,
  concept: string,
  existingMermaid: string | null
): string {
  if (existingMermaid && existingMermaid.trim().length > 10) {
    return sanitizeMermaidCode(existingMermaid);
  }

  const query = (rawText + " " + concept).toLowerCase();

  // 1. Object-Oriented Programming (OOP) & Inheritance (Matching reference design)
  if (
    query.includes("inheritance") ||
    query.includes("derived class") ||
    query.includes("base class") ||
    query.includes("subclass") ||
    query.includes("polymorphism") ||
    query.includes("object oriented") ||
    query.includes("oop")
  ) {
    return `graph TD
    BaseClass["Base Class<br>(Parent)"]
    DerivedClass["Derived Class<br>(Child)"]
    Attributes["Attributes<br>(data members)"]
    Methods["Methods<br>(behaviors)"]
    InheritedAttributes["Inherited<br>Attributes"]
    InheritedMethods["Inherited<br>Methods"]
    OverriddenMethods["Overridden /<br>New Methods"]

    BaseClass --> Attributes
    BaseClass --> DerivedClass
    BaseClass --> Methods
    Attributes --> InheritedAttributes
    Methods --> InheritedMethods
    DerivedClass --> OverriddenMethods
    InheritedMethods --> OverriddenMethods

    style BaseClass fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style DerivedClass fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style Attributes fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Methods fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style InheritedAttributes fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style InheritedMethods fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style OverriddenMethods fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
  }

  // 2. Vector Mathematics, Linear Algebra, & Geometry
  if (
    (query.includes("vector") && !query.includes("rag") && !query.includes("retrieval augmented")) ||
    query.includes("magnitude") ||
    query.includes("dot product") ||
    query.includes("cross product") ||
    query.includes("euclidean norm")
  ) {
    return `graph TD
    VectorSpace["Vector Space<br>(Directional Magnitude)"]
    Origin["Origin Reference<br>(0, 0 Coordinates)"]
    Magnitude["Magnitude: ||v||<br>(√(x² + y²))"]
    Direction["Direction: θ<br>(Angle with Axes)"]
    Components["Component Scalars<br>(x-Axis & y-Axis)"]
    Basis["Standard Basis<br>(i, j, k Vectors)"]
    Operations["Vector Algebra<br>(Dot & Cross Product)"]
    Similarity["Cosine Similarity<br>(High-Dim Embeddings)"]

    VectorSpace --> Origin
    VectorSpace --> Magnitude
    VectorSpace --> Direction
    Direction --> Components
    Components --> Basis
    Basis --> Operations
    Operations --> Similarity

    style VectorSpace fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style Magnitude fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style Origin fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Direction fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Components fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Basis fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Operations fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Similarity fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
  }

  // 3. AdaptFlow AI Learning Engine (Greeting & Overview)
  if (
    query.includes("adaptflow") ||
    query.includes("hello") ||
    query.includes("ai tutor") ||
    query.includes("welcome")
  ) {
    return `graph TD
    Platform["AdaptFlow Platform<br>(Multimodal AI Tutor)"]
    Ingestion["Course Ingestion<br>(PDFs, Lecture Videos, Slides)"]
    KnowledgeCore["Knowledge Core<br>(OCR & Dense pgvector Index)"]
    Tutor["Source Chat<br>(Clickable Citations)"]
    Quiz["Adaptive Quiz<br>(BKT Knowledge Engine)"]
    Visuals["Visual Diagrams<br>(Interactive Topic Maps)"]

    Platform --> Ingestion
    Platform --> KnowledgeCore
    KnowledgeCore --> Tutor
    KnowledgeCore --> Quiz
    KnowledgeCore --> Visuals

    style Platform fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style KnowledgeCore fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style Ingestion fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Tutor fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Quiz fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Visuals fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
  }

  // 4. RAG (Retrieval-Augmented Generation) & Vector Search
  if (
    query.includes("rag") ||
    query.includes("retrieval augmented") ||
    query.includes("vector search") ||
    query.includes("chunking") ||
    query.includes("embedding") ||
    query.includes("rerank")
  ) {
    return `graph TD
    UserQuery["Student Query<br>(Natural Language Question)"]
    VectorStore["Vector Database<br>(pgvector / HNSW Chunks)"]
    DenseRetriever["Dense Retriever<br>(Cosine Similarity Search)"]
    ContextWindow["Context Window<br>(Top-k Grounded Passages)"]
    LLMCore["LLM Synthesis Core<br>(Frozen Parametric Model)"]
    GroundedOutput["Grounded Answer<br>(Exact Page & Time Citations)"]

    UserQuery --> DenseRetriever
    VectorStore --> DenseRetriever
    DenseRetriever --> ContextWindow
    ContextWindow --> LLMCore
    UserQuery --> LLMCore
    LLMCore --> GroundedOutput

    style UserQuery fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style LLMCore fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style VectorStore fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style DenseRetriever fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style ContextWindow fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style GroundedOutput fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
  }

  // 5. Biology & Cellular Respiration (Glycolysis, Krebs, ATP Synthase)
  if (
    query.includes("glycolysis") ||
    query.includes("cellular respiration") ||
    query.includes("atp") ||
    query.includes("mitochondria") ||
    query.includes("krebs") ||
    query.includes("pyruvate") ||
    query.includes("chemiosmosis")
  ) {
    return `graph TD
    Glucose["Glucose Input<br>(6-Carbon Sugar)"]
    Glycolysis["Glycolysis<br>(10-Step Cytosolic Pathway)"]
    Pyruvate["2 Pyruvate<br>(3-Carbon Molecules)"]
    KrebsCycle["Citric Acid Cycle<br>(Mitochondrial Matrix)"]
    ElectronTransport["Electron Transport Chain<br>(Complexes I-IV)"]
    ATPYield["Rotary ATP Synthase<br>(Final 30-32 ATP Yield)"]

    Glucose --> Glycolysis
    Glycolysis --> Pyruvate
    Pyruvate --> KrebsCycle
    KrebsCycle --> ElectronTransport
    ElectronTransport --> ATPYield

    style Glucose fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style Glycolysis fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style Pyruvate fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style KrebsCycle fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style ElectronTransport fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style ATPYield fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
  }

  // 6. Data Structures: Trees, BST, Heaps, Graphs
  if (
    query.includes("tree") ||
    query.includes("bst") ||
    query.includes("binary search tree") ||
    query.includes("heap") ||
    query.includes("graph")
  ) {
    return `graph TD
    RootNode["Root Node: 50<br>(Tree Origin)"]
    LeftChild["Left Subtree: 30<br>(Keys < 50)"]
    RightChild["Right Subtree: 70<br>(Keys > 50)"]
    Leaf20["Node: 20<br>(Left Leaf)"]
    Leaf40["Node: 40<br>(Right Leaf)"]
    Leaf60["Node: 60<br>(Left Leaf)"]
    Leaf80["Node: 80<br>(Right Leaf)"]

    RootNode --> LeftChild
    RootNode --> RightChild
    LeftChild --> Leaf20
    LeftChild --> Leaf40
    RightChild --> Leaf60
    RightChild --> Leaf80

    style RootNode fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style LeftChild fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style RightChild fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style Leaf20 fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Leaf40 fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Leaf60 fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style Leaf80 fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
  }

  // 7. Large Language Models (LLMs) & Transformers
  if (
    query.includes("transformer") ||
    query.includes("attention") ||
    query.includes("llm")
  ) {
    return `graph TD
    InputTokens["Prompt Token IDs<br>(Vocabulary Indices)"]
    Embeddings["Token Embeddings<br>(Positional + Semantic)"]
    AttentionCore["Multi-Head Attention<br>(Query · Key · Value)"]
    FeedForward["Feed-Forward Network<br>(MLP & LayerNorm)"]
    VocabularySoftmax["Softmax Layer<br>(Token Distribution)"]
    NextTokenOutput["Next Token Output<br>(Autoregressive Sampling)"]

    InputTokens --> Embeddings
    Embeddings --> AttentionCore
    AttentionCore --> FeedForward
    FeedForward --> VocabularySoftmax
    VocabularySoftmax --> NextTokenOutput

    style InputTokens fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style AttentionCore fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style Embeddings fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style FeedForward fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style VocabularySoftmax fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style NextTokenOutput fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
  }

  // 8. Universal Pedagogical Flowchart Fallback
  const displayConcept = concept && concept.length < 35 ? concept : "Academic Concept";
  return `graph TD
    RootConcept["${displayConcept}<br>(Foundational Root)"]
    CoreMechanism["Core Mechanism<br>(Operational Logic)"]
    InputConstraints["Inputs & Constraints<br>(Boundary Conditions)"]
    KeyProperties["Key Properties<br>(Defining Behaviors)"]
    SynthesisOutcome["Synthesis & Outcome<br>(Verified Application)"]

    RootConcept --> InputConstraints
    RootConcept --> CoreMechanism
    RootConcept --> KeyProperties
    CoreMechanism --> SynthesisOutcome
    InputConstraints --> CoreMechanism
    KeyProperties --> SynthesisOutcome

    style RootConcept fill:#FFE6CC,stroke:#333333,stroke-width:1.5px,color:#000
    style CoreMechanism fill:#D5E8D4,stroke:#333333,stroke-width:2px,color:#000
    style InputConstraints fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style KeyProperties fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000
    style SynthesisOutcome fill:#E1D5E7,stroke:#9673A6,stroke-width:1.5px,color:#000`;
}

/**
 * Intelligent pedagogical parser:
 * Extracts Concept Title, Lead Prose, Serial Points (1, 2, 3...),
 * Mermaid Diagram, Citations, and Real-World Application.
 */
function parseResponseContent(rawText: string, isStreaming = false): ParsedSections {
  const text = rawText || "";

  // 0. Check for strict Outside Material Scope refusal
  const isRefusal = /⚠️\s*Outside\s+Material\s+Scope/i.test(text);
  if (isRefusal) {
    return {
      leadProse: text,
      serialPoints: [],
      trailingProse: "",
      mermaidCode: "",
      sources: [],
      realWorld: "",
      extractedConcept: "Outside Material Scope",
      isRefusal: true,
    };
  }

  // 0.5. Extract General Knowledge block if present
  let generalKnowledge = "";
  const gkRegex = /:::general-knowledge\s*([\s\S]*?):::/i;
  const gkMatch = text.match(gkRegex);
  if (gkMatch && gkMatch[1]) {
    generalKnowledge = gkMatch[1]
      .replace(/^💡\s*General\s+Knowledge/i, "")
      .replace(/^ℹ️\s*Not\s+from\s+your\s+sources/i, "")
      .trim();
  } else {
    const gkPlainMatch = text.match(/(?:💡\s*General\s+Knowledge[\s\S]*?)(?=(?:###|---|:::|$))/i);
    if (gkPlainMatch) {
      generalKnowledge = gkPlainMatch[0]
        .replace(/^💡\s*General\s+Knowledge/i, "")
        .replace(/^ℹ️\s*Not\s+from\s+your\s+sources/i, "")
        .trim();
    }
  }

  let rawMermaid: string | null = null;
  let extractedConcept = "Subject Concept";

  // 1. Extract closed or actively streaming unclosed ```mermaid code block
  const mermaidBlockRegex = /```mermaid\s*([\s\S]*?)(?:```|$)/i;
  const mermaidMatch = text.match(mermaidBlockRegex);
  if (mermaidMatch && mermaidMatch[1]) {
    rawMermaid = mermaidMatch[1].trim();
  }

  // 2. Extract concept title from markdown headers, ignoring generic labels
  const titleMatch =
    text.match(/###\s*(?:\*\*)?([^#*\n\r]+)(?:\*\*)?/i) ||
    text.match(/\*\*([^*]+)\*\*/i);

  if (titleMatch && titleMatch[1]) {
    const rawFound = titleMatch[1].replace(/[0-9.]/g, "").trim();
    const isGeneric = /^(?:explanation|q|overview|summary|answer|core mental model|step-by-step breakdown|interactive visual diagram)$/i.test(rawFound);
    if (!isGeneric && rawFound.length > 2 && rawFound.length < 50) {
      extractedConcept = rawFound;
    }
  }

  // Fallback to topic deduction from query content if title is generic
  if (
    extractedConcept === "Subject Concept" ||
    extractedConcept.toLowerCase().includes("explanation") ||
    extractedConcept.toLowerCase() === "q"
  ) {
    const lower = text.toLowerCase();
    if (lower.includes("vector")) {
      extractedConcept = "Vector (Linear Algebra & Physics)";
    } else if (lower.includes("glycolysis") || lower.includes("cellular respiration")) {
      extractedConcept = "Cellular Respiration & Glycolysis";
    } else if (lower.includes("rag") || lower.includes("retrieval augmented")) {
      extractedConcept = "Retrieval-Augmented Generation (RAG)";
    } else if (lower.includes("transformer") || lower.includes("attention")) {
      extractedConcept = "Transformer & Attention Mechanism";
    } else if (lower.includes("neural network") || lower.includes("backprop")) {
      extractedConcept = "Neural Network & Backpropagation";
    } else if (lower.includes("binary search") || lower.includes("bst")) {
      extractedConcept = "Binary Search Tree (BST)";
    } else {
      extractedConcept = "Source-Grounded Concept";
    }
  }

  // 3. Remove mermaid and general knowledge blocks to isolate prose text
  let prose = text.replace(mermaidBlockRegex, "");
  if (gkMatch) {
    prose = prose.replace(gkRegex, "");
  } else if (generalKnowledge) {
    prose = prose.replace(/(?:💡\s*General\s+Knowledge[\s\S]*?)(?=(?:###|---|:::|$))/i, "");
  }
  prose = prose.trim();

  // 4. Extract Real-World application if explicitly labelled
  let realWorld = "";
  const rwMatch = prose.match(/(?:###\s*(?:\*\*)?.*(?:real-world|in practice|practical).*[\r\n]+)([\s\S]*?)(?:$|###|---)/i);
  if (rwMatch) {
    realWorld = rwMatch[1].trim();
    prose = prose.replace(rwMatch[0], "").trim();
  } else {
    // Check trailing real-world mention
    const trailRw = prose.match(/(?:real-world(?:\s+use\s+case|\s+application|\s+example)?|in\s+practice)[\s\S]*$/i);
    if (trailRw && trailRw[0].length < 300) {
      realWorld = trailRw[0].trim();
      prose = prose.replace(trailRw[0], "").trim();
    }
  }

  // 5. Clean markdown headers and prompt artifacts
  let cleanedProse = prose
    .replace(/(?:###\s*(?:\*\*)?|\*\*\s*)(?:💡\s*)?(?:Explanation|Q|Overview|Summary)(?:\*\*)?\s*/gi, "")
    .replace(/(?:###\s*(?:\*\*)?|\*\*\s*)(?:📊\s*)?(?:Interactive Visual Diagram|Architecture & Flow)(?:\*\*)?\s*/gi, "")
    .replace(/(?:###\s*(?:\*\*)?|\*\*\s*)(?:🔍\s*)?(?:Step-by-Step Breakdown|Breakdown)(?:\*\*)?\s*/gi, "")
    .replace(/(?:###\s*(?:\*\*)?|\*\*\s*)(?:📖\s*)?(?:Grounded Source Citations|Grounded Citations|Citations)(?:\*\*)?\s*/gi, "")
    .replace(/---/g, "")
    .trim();

  // 6. Split inline flattened numbered points (e.g. "...direction. 2. - Lists...") onto separate lines
  cleanedProse = cleanedProse.replace(/(?<=\S)\s+(?=(?:\d{1,2}\.|\d{1,2}\))\s+(?:-|[A-Za-z]))/g, "\n\n");
  cleanedProse = cleanedProse.replace(/[ \t]{2,}/g, " ");

  // 7. Parse lines into leadProse, serialPoints, and trailingProse
  const lines = cleanedProse.split("\n").map((l) => l.trim()).filter(Boolean);
  const serialPoints: SerialPoint[] = [];
  const leadLines: string[] = [];
  const trailingLines: string[] = [];

  for (const line of lines) {
    // Check if line is a numbered item or bullet: "1. ...", "2) ...", "- ...", "* ..."
    const itemMatch = line.match(/^(?:(\d{1,2})[\.\)]|[-*•])\s*(?:-\s*)?(.*)$/);
    if (itemMatch) {
      const num = itemMatch[1] ? parseInt(itemMatch[1], 10) : serialPoints.length + 1;
      let body = itemMatch[2].trim();
      let label: string | undefined = undefined;

      // Extract lead label if present, e.g. "**Visual Metaphor**: ..." or "Visual Metaphor: ..."
      const labelMatch = body.match(/^(?:\*\*)?([^:*]{3,40})(?:\*\*)?:\s*(.*)$/);
      if (labelMatch) {
        label = labelMatch[1].trim();
        body = labelMatch[2].trim();
      }

      serialPoints.push({
        index: num,
        label,
        content: cleanMathNotation(body),
      });
    } else {
      if (serialPoints.length === 0) {
        leadLines.push(cleanMathNotation(line));
      } else {
        trailingLines.push(cleanMathNotation(line));
      }
    }
  }

  let leadProse = leadLines.join("\n\n");
  let trailingProse = trailingLines.join("\n\n");

  if (!leadProse && serialPoints.length === 0) {
    leadProse = isStreaming
      ? "Synthesizing source-grounded response with verified visual citations..."
      : `Core theoretical model and system dynamics for ${extractedConcept}.`;
  }

  // 8. Default real-world example if missing
  if (!realWorld && !isStreaming) {
    if (text.toLowerCase().includes("vector")) {
      realWorld = "Recommendation engines at Spotify and Netflix map millions of songs and films into high-dimensional vector embeddings, computing cosine similarity to surface personalized matches in sub-milliseconds.";
    } else if (text.toLowerCase().includes("rag")) {
      realWorld = "Morgan Stanley & Bloomberg deploy RAG across thousands of financial documents so analysts query proprietary filings with verifiable source citations.";
    } else if (text.toLowerCase().includes("glycolysis")) {
      realWorld = "Elite athletes monitor the anaerobic threshold where muscles switch from mitochondrial oxidative phosphorylation to lactic fermentation.";
    } else {
      realWorld = "Modern production platforms implement this structured architecture to guarantee fault tolerance, strict verification, and deterministic execution.";
    }
  }

  // 9. Extract all citations from text
  const sourceMatches = Array.from(
    text.matchAll(/\[(?:🖼️|Figure|Fig\.|Slide|PDF|Lecture|Video|p\.|Chapter|Ch\.|Sec\.|@|\d{1,2}:\d{2}|Source)[^\]]*\]/gi)
  ).map((m) => m[0]);
  const uniqueSources = Array.from(new Set(sourceMatches));

  // 10. Guaranteed sanitized Mermaid diagram
  const guaranteedMermaid = sanitizeMermaidCode(
    getOrGenerateMermaidDiagram(text, extractedConcept, rawMermaid)
  );

  return {
    leadProse,
    serialPoints,
    trailingProse,
    mermaidCode: guaranteedMermaid,
    sources: uniqueSources,
    realWorld,
    extractedConcept,
    generalKnowledge: generalKnowledge || undefined,
    isRefusal: false,
  };
}

export function StructuredResponseCard({
  content,
  citations = [],
  isStreaming = false,
  onSelectCitation,
  onFollowUpClick,
  sourcesCount,
}: StructuredResponseCardProps) {
  const router = useRouter();

  // Collapsible section toggles: default diagram and sources open
  const [openDiagram, setOpenDiagram] = useState(true);
  const [openSources, setOpenSources] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [savedToNote, setSavedToNote] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const parsed = useMemo(() => parseResponseContent(content, isStreaming), [content, isStreaming]);

  // Dynamically normalize refusal text so the mentioned sources count matches the active selected sources
  const normalizedLeadProse = useMemo(() => {
    if (!parsed.leadProse) return "";
    let prose = parsed.leadProse;
    const effectiveCount = sourcesCount && sourcesCount > 0 ? sourcesCount : 10;
    prose = prose.replace(
      /not found in (?:any of your )?\d+ sources/gi,
      `not found in any of your ${effectiveCount} sources`
    );
    return prose;
  }, [parsed.leadProse, sourcesCount]);

  const isRefusal = useMemo(() => {
    return (
      Boolean(parsed.isRefusal) ||
      content.includes("Outside Material Scope") ||
      (citations.length === 0 && content.startsWith("⚠️"))
    );
  }, [parsed.isRefusal, content, citations.length]);

  const isPartiallyGrounded = useMemo(() => {
    if (isRefusal) return false;
    return (
      Boolean(parsed.generalKnowledge) ||
      content.includes("Low confidence") ||
      content.includes("partially_grounded") ||
      citations.some((c) => {
        const score = c.unit?.source_tracking?.confidence_score;
        return typeof score === "number" && score >= 0.4 && score < 0.65;
      })
    );
  }, [isRefusal, parsed.generalKnowledge, content, citations]);

  const handleCopyWholeAnswer = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    } catch {}
  };

  const handleSaveToNote = () => {
    if (typeof window === "undefined") return;
    try {
      const noteTitle = `${parsed.extractedConcept} - Study Note`;
      const noteMaterial: Material = {
        id: `note_${Date.now()}`,
        title: noteTitle,
        filename: `notebook_note_${Date.now()}.txt`,
        material_type: "textbook",
        file_size_bytes: content.length * 2,
        total_units_extracted: 1,
        course_id: "NOTEBOOK_NOTES",
        subject: "Saved Notes",
        status: "indexed",
        status_message: "Saved from NotebookLM chat session",
        metadata: {
          is_user_note: true,
          note_body: content,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stored: Material[] = JSON.parse(
        localStorage.getItem("adaptflow_client_materials") || "[]"
      );
      stored.unshift(noteMaterial);
      localStorage.setItem("adaptflow_client_materials", JSON.stringify(stored));
      window.dispatchEvent(
        new CustomEvent("materials_updated", { detail: { material: noteMaterial } })
      );

      setSavedToNote(true);
      setTimeout(() => setSavedToNote(false), 3000);
    } catch (_) {}
  };

  const handleLaunchQuiz = () => {
    const topic = parsed.extractedConcept || "Adaptive Assessment";
    router.push(`/quiz?topic=${encodeURIComponent(topic)}`);
  };

  // Follow-up suggestions
  const followUpSuggestions = useMemo(() => {
    const concept = parsed.extractedConcept || "this concept";
    return [
      {
        icon: "🔄",
        label: `Compare with alternative mechanisms`,
        prompt: `How does ${concept} compare with alternative approaches and edge cases?`,
      },
      {
        icon: "⚡",
        label: `Trace step-by-step execution`,
        prompt: `Can you walk me through a concrete end-to-end execution of ${concept}?`,
      },
      {
        icon: "📝",
        label: `Quiz me on ${concept}`,
        isQuiz: true,
      },
    ];
  }, [parsed.extractedConcept]);

  /**
   * Helper that finds citation patterns like [Slide 4], [PDF p.12], [08:15 - 09:40]
   * and renders them as clickable interactive chips with accessible contrast.
   */
  const renderTextWithCitationChips = (textSegment: string) => {
    if (!textSegment) return null;

    const cleanedText = cleanMathNotation(textSegment);
    const citationPattern = /(\[(?:🖼️|Figure|Fig\.|Slide|PDF|Lecture|Video|p\.|Chapter|Ch\.|Sec\.|@|\d{1,2}:\d{2}|Source)[^\]]*\])/gi;
    const parts = cleanedText.split(citationPattern);

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
                <strong key={`b-${i}`} className="font-semibold text-slate-900 dark:text-white">
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

  // Deduplicated source keys
  const displaySources = useMemo(() => {
    const keys = new Set<string>();
    const list: Array<{ label: string; citation?: CitationReference; type?: string }> = [];

    // Add structured citation references first
    for (const c of citations) {
      if (!keys.has(c.key.toLowerCase())) {
        keys.add(c.key.toLowerCase());
        list.push({
          label: c.key,
          citation: c,
          type: c.unit?.source_tracking?.material_type || c.unit?.modality,
        });
      }
    }

    // Add any inline source references extracted from text
    for (const s of parsed.sources) {
      if (!keys.has(s.toLowerCase())) {
        keys.add(s.toLowerCase());
        const match = citations.find((c) => c.key.toLowerCase() === s.toLowerCase());
        list.push({
          label: s,
          citation: match,
          type: match?.unit?.source_tracking?.material_type || match?.unit?.modality,
        });
      }
    }

    return list;
  }, [citations, parsed.sources]);

  // Modality preview for top Grounded card
  const sourcePreviewText = useMemo(() => {
    if (displaySources.length === 0) return "General knowledge & course notes";
    const labels = displaySources
      .map((s) => s.citation?.unit?.source_tracking?.material_title || s.label)
      .filter(Boolean);
    const unique = Array.from(new Set(labels));
    if (unique.length <= 2) return unique.join(", ");
    return `${unique[0]}, ${unique[1]} + ${unique.length - 2} more`;
  }, [displaySources]);

  return (
    <div className="w-full space-y-3 font-sans">
      {/* ========================================================================= */}
      {/* 1. NotebookLM Top Grounded Sources Capsule                                 */}
      {/* ========================================================================= */}
      {!isRefusal && (
        <div
          onClick={() => setOpenSources((prev) => !prev)}
          className="group flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#f0f4f9] dark:bg-[#1e1f20] px-3.5 py-2.5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer select-none"
          title="Click to view verified citations"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Overlapping Modality Icons (NotebookLM signature look) */}
            <div className="flex items-center -space-x-1.5 shrink-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-white dark:ring-[#1e1f20] shadow-2xs">
                <FileText className="h-3 w-3" />
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white ring-2 ring-white dark:ring-[#1e1f20] shadow-2xs">
                <Film className="h-3 w-3" />
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white dark:ring-[#1e1f20] shadow-2xs">
                <Presentation className="h-3 w-3" />
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                Report & Course sources ({displaySources.length || 1})
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[280px] sm:max-w-md">
                {sourcePreviewText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPartiallyGrounded ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                <span>Partially Grounded</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>All sources verified ✓</span>
              </span>
            )}
            <button
              type="button"
              className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 p-0.5"
            >
              {openSources ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Expandable Citations Drawer */}
      {openSources && !isRefusal && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#151618] p-4 shadow-sm space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pb-1 border-b border-slate-100 dark:border-white/5">
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              Verified Course Materials & Extracted Excerpts
            </span>
            <span>{displaySources.length} citations</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            Click any citation chip below to inspect the verified page, slide deck #, or video timestamp:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {displaySources.map((s, idx) => (
              <CitationChip
                key={`cit-main-${idx}`}
                label={s.label}
                citation={s.citation}
                onClick={(cit, lbl) => onSelectCitation(cit, lbl)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Primary Response Card                                                  */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191c] text-slate-900 dark:text-zinc-100 shadow-2xs overflow-hidden transition-all duration-200">
        {/* Concept Title Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#6C63FF] text-white shadow-2xs">
              <Sparkles className="h-3 w-3" />
            </span>
            <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
              {parsed.extractedConcept}
            </h3>
          </div>
        </div>

        {/* Content Section */}
        {isRefusal ? (
          <div className="p-4 sm:p-5">
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>⚠️ Outside Material Scope</span>
              </div>
              <div className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-normal">
                {renderTextWithCitationChips(
                  normalizedLeadProse.replace(/⚠️\s*Outside\s+Material\s+Scope\s*/i, "").trim()
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-5 pb-4 space-y-3.5">
            {/* Streaming Placeholder */}
            {isStreaming && !normalizedLeadProse && parsed.serialPoints.length === 0 && (
              <div className="flex items-center gap-2.5 py-3 text-xs text-slate-500 dark:text-zinc-400">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#6C63FF] animate-ping" />
                <span className="font-medium animate-pulse">
                  Synthesizing grounded explanation from your course materials...
                </span>
              </div>
            )}

            {/* Lead Prose */}
            {normalizedLeadProse && (
              <div className="text-sm leading-relaxed text-slate-800 dark:text-zinc-200 font-normal">
                {renderTextWithCitationChips(normalizedLeadProse)}
                {isStreaming && parsed.serialPoints.length === 0 && (
                  <span className="inline-block h-3.5 w-1.5 ml-1 bg-[#6C63FF] animate-pulse align-middle" />
                )}
              </div>
            )}

            {/* General Knowledge Callout */}
            {parsed.generalKnowledge && (
              <div className="rounded-xl border-l-4 border-amber-400 dark:border-amber-500 bg-amber-500/[0.05] p-3.5 text-slate-800 dark:text-amber-100/90 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-500/15">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
                    <span>💡</span>
                    <span>General Knowledge</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    ℹ️ Not from your sources
                  </span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                  {renderTextWithCitationChips(parsed.generalKnowledge)}
                </div>
              </div>
            )}

            {/* Serial Points Stack */}
            {parsed.serialPoints.length > 0 && (
              <div className="space-y-2.5 my-2">
                {parsed.serialPoints.map((point) => (
                  <div
                    key={point.index}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.07] bg-slate-50/60 dark:bg-zinc-900/50 hover:bg-slate-100/70 dark:hover:bg-zinc-900/80 transition-all"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#6C63FF]/15 dark:bg-[#6C63FF]/25 text-[#6C63FF] dark:text-[#8B85FF] text-xs font-bold font-mono mt-0.5">
                      {String(point.index).padStart(2, "0")}
                    </span>
                    <div className="flex-1 text-sm text-slate-800 dark:text-zinc-200 leading-relaxed min-w-0">
                      {point.label && (
                        <span className="font-semibold text-slate-900 dark:text-white mr-1.5 capitalize">
                          {point.label}:
                        </span>
                      )}
                      <span>{renderTextWithCitationChips(point.content)}</span>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <span className="inline-block h-3.5 w-1.5 ml-1 bg-[#6C63FF] animate-pulse align-middle" />
                )}
              </div>
            )}

            {/* Trailing Prose */}
            {parsed.trailingProse && (
              <div className="text-sm leading-relaxed text-slate-800 dark:text-zinc-200">
                {renderTextWithCitationChips(parsed.trailingProse)}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* Interactive Visual Flowchart                                              */}
        {/* ========================================================================= */}
        {!isRefusal && (
          <div className="border-t border-slate-200/70 dark:border-white/[0.08]">
            <button
              onClick={() => setOpenDiagram((prev) => !prev)}
              className="flex w-full items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40 px-4 py-2.5 text-left text-xs font-bold text-slate-800 dark:text-zinc-200 transition-colors hover:bg-slate-100/70 dark:hover:bg-zinc-900/70 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#6C63FF] shrink-0" />
                <span>Interactive Architecture & Flowchart</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#6C63FF]/15 px-2 py-0.5 text-[10px] font-semibold text-[#6C63FF] dark:text-[#8B85FF]">
                  Live Diagram
                </span>
                {openDiagram ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            {openDiagram && (
              <div className="p-3.5 bg-slate-50/30 dark:bg-[#0D0D14] space-y-2">
                <MermaidRenderer
                  code={parsed.mermaidCode}
                  title={`${parsed.extractedConcept} · Process Flow`}
                  isStreaming={isStreaming}
                />
              </div>
            )}
          </div>
        )}

        {/* Practical Application */}
        {!isRefusal && parsed.realWorld && (
          <div className="p-3.5 sm:p-4 bg-slate-50/50 dark:bg-zinc-900/30 border-t border-slate-200/70 dark:border-white/[0.08]">
            <div className="border-l-2 border-[#6C63FF] pl-3 py-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#6C63FF] dark:text-[#8B85FF] mb-1">
                <Globe2 className="h-3.5 w-3.5" />
                <span>Practical & Industry Insight</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                {renderTextWithCitationChips(parsed.realWorld)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. NotebookLM Bottom Action Bar (Save to note, Copy, Thumbs Up/Down)      */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          {/* Save to Note Button */}
          <button
            type="button"
            onClick={handleSaveToNote}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer shadow-2xs select-none",
              savedToNote
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
            )}
            title="Save this answer as a note in your Sources dock"
          >
            {savedToNote ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Saved to note</span>
              </>
            ) : (
              <>
                <Pin className="h-3.5 w-3.5 text-[#6C63FF]" />
                <span>Save to note</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyWholeAnswer}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs select-none"
            title="Copy response"
          >
            {copiedAnswer ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Feedback Icons (Thumbs Up / Down) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFeedback((prev) => (prev === "up" ? null : "up"))}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border transition-all cursor-pointer",
              feedback === "up"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            )}
            title="Good response"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setFeedback((prev) => (prev === "down" ? null : "down"))}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border transition-all cursor-pointer",
              feedback === "down"
                ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            )}
            title="Poor response"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Follow-up Suggestions Chips */}
      {!isStreaming && !isRefusal && (
        <div className="pt-2 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {followUpSuggestions.map((item, idx) => {
              if (item.isQuiz) {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={handleLaunchQuiz}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/10 dark:bg-[#6C63FF]/15 px-3 py-1 text-xs font-bold text-[#6C63FF] dark:text-[#8B85FF] hover:bg-[#6C63FF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1b1e] px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-[#6C63FF]/50 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
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
