"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  GitFork,
  Layers,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  Clock,
  Compass,
  BookOpen,
  Film,
  Presentation,
  AlertTriangle,
  TrendingUp,
  Copy,
  Check,
  FileCode,
  Zap,
  Target,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface GraphNode {
  id: string;
  label: string;
  stage: "Foundational" | "Core Mechanism" | "Advanced Synthesis";
  mastery: number; // 0.0 to 1.0
  status: "mastered" | "in_progress" | "recommended" | "locked";
  prerequisites: string[];
  citation: string;
  modality: "pdf" | "video" | "slides" | "diagram";
  estimatedMinutes: number;
  keyConcept: string;
  likelyMisconception: string;
  x: number;
  y: number;
}

interface GraphTrack {
  id: string;
  title: string;
  subject: string;
  description: string;
  nodes: GraphNode[];
  mermaidCode: string;
}

const BIOLOGY_NODES: GraphNode[] = [
  {
    id: "cell_bio",
    label: "Cell Anatomy & Membrane Transport",
    stage: "Foundational",
    mastery: 0.95,
    status: "mastered",
    prerequisites: [],
    citation: "[PDF p.14 · Cell Structure]",
    modality: "pdf",
    estimatedMinutes: 15,
    keyConcept: "Phospholipid bilayers, membrane fluidity, and active vs passive ion transport channels.",
    likelyMisconception: "Confusing passive facilitated diffusion with primary ATP-driven active transport.",
    x: 40,
    y: 80,
  },
  {
    id: "enzymes",
    label: "Enzymatic Catalysis & Activation Energy",
    stage: "Foundational",
    mastery: 0.90,
    status: "mastered",
    prerequisites: [],
    citation: "[Slide 2 · Bioenergetics]",
    modality: "slides",
    estimatedMinutes: 20,
    keyConcept: "Enzyme active site kinetics, lowering Gibbs activation energy (Delta G), and allosteric inhibition.",
    likelyMisconception: "Believing enzymes alter the net equilibrium or free energy change (Delta G) of a reaction.",
    x: 40,
    y: 260,
  },
  {
    id: "glycolysis",
    label: "Glycolysis Priming & Cleavage",
    stage: "Core Mechanism",
    mastery: 0.82,
    status: "mastered",
    prerequisites: ["cell_bio", "enzymes"],
    citation: "[🖼️ Figure 3.2 · PDF p.42]",
    modality: "diagram",
    estimatedMinutes: 25,
    keyConcept: "Cytosolic 10-step conversion of glucose to 2 pyruvate, yielding 2 net ATP and 2 NADH.",
    likelyMisconception: "Assuming glycolysis takes place in the mitochondrial matrix rather than the cytosol.",
    x: 290,
    y: 160,
  },
  {
    id: "fermentation",
    label: "Anaerobic Fermentation Pathways",
    stage: "Core Mechanism",
    mastery: 0.68,
    status: "in_progress",
    prerequisites: ["glycolysis"],
    citation: "[Lecture 02 @ 18:30]",
    modality: "video",
    estimatedMinutes: 20,
    keyConcept: "Regeneration of NAD+ from NADH via lactate or ethanol pathways in the absence of O2.",
    likelyMisconception: "Thinking fermentation produces high amounts of ATP directly, rather than just regenerating NAD+.",
    x: 540,
    y: 60,
  },
  {
    id: "krebs",
    label: "Pyruvate Oxidation & Citric Acid Cycle",
    stage: "Core Mechanism",
    mastery: 0.74,
    status: "in_progress",
    prerequisites: ["glycolysis"],
    citation: "[PDF p.46 · Citric Acid Cycle]",
    modality: "pdf",
    estimatedMinutes: 30,
    keyConcept: "Conversion of pyruvate to Acetyl-CoA and 8-step matrix cycle generating 6 NADH, 2 FADH2, and 2 GTP.",
    likelyMisconception: "Confusing gross carbon stoichiometry with the number of carbons entering per single pyruvate.",
    x: 540,
    y: 190,
  },
  {
    id: "etc",
    label: "Electron Transport Chain Complexes",
    stage: "Advanced Synthesis",
    mastery: 0.45,
    status: "recommended",
    prerequisites: ["krebs"],
    citation: "[Slide 4 · Chemiosmosis]",
    modality: "slides",
    estimatedMinutes: 35,
    keyConcept: "Sequential electron transfer through Complexes I-IV driving directional proton efflux.",
    likelyMisconception: "Believing electron transport complexes synthesize ATP directly rather than building a proton gradient.",
    x: 540,
    y: 320,
  },
  {
    id: "chemiosmosis",
    label: "Proton Motive Force & Chemiosmosis",
    stage: "Advanced Synthesis",
    mastery: 0.30,
    status: "recommended",
    prerequisites: ["etc"],
    citation: "[PDF p.48 · Chemiosmosis]",
    modality: "pdf",
    estimatedMinutes: 25,
    keyConcept: "Electrochemical proton gradient across the inner membrane coupling electron flow to phosphorylation.",
    likelyMisconception: "Overlooking the chemical pH differential vs the electrical voltage gradient components.",
    x: 790,
    y: 160,
  },
  {
    id: "atp_synthase",
    label: "FoF1-ATP Synthase Rotational Catalysis",
    stage: "Advanced Synthesis",
    mastery: 0.15,
    status: "locked",
    prerequisites: ["chemiosmosis"],
    citation: "[🖼️ Slide 4 · Diagram]",
    modality: "diagram",
    estimatedMinutes: 30,
    keyConcept: "Rotational motor dynamics of Fo c-ring and catalytic beta subunits synthesizing ~28 ATP per glucose.",
    likelyMisconception: "Attributing ATP production to electron entry into the catalytic head rather than proton flux.",
    x: 790,
    y: 310,
  },
];

const CS_NODES: GraphNode[] = [
  {
    id: "linear_algebra",
    label: "Linear Algebra & High-Dim Vectors",
    stage: "Foundational",
    mastery: 0.98,
    status: "mastered",
    prerequisites: [],
    citation: "[Slide 3 · Math Foundations]",
    modality: "slides",
    estimatedMinutes: 20,
    keyConcept: "Vector spaces, dot products, matrix multiplications, and angular cosine orientations in R^d.",
    likelyMisconception: "Conflating Euclidean distance magnitude with angular cosine similarity direction.",
    x: 40,
    y: 80,
  },
  {
    id: "calculus_opt",
    label: "Gradient Descent Optimization",
    stage: "Foundational",
    mastery: 0.88,
    status: "mastered",
    prerequisites: [],
    citation: "[Lecture 03 @ 12:45]",
    modality: "video",
    estimatedMinutes: 25,
    keyConcept: "First-order partial derivatives, learning rates, loss surfaces, and stochastic gradient updates.",
    likelyMisconception: "Assuming setting higher learning rates always speeds convergence rather than causing oscillation.",
    x: 40,
    y: 260,
  },
  {
    id: "neural_nets",
    label: "Backpropagation & Multilayer Perceptrons",
    stage: "Core Mechanism",
    mastery: 0.84,
    status: "mastered",
    prerequisites: ["linear_algebra", "calculus_opt"],
    citation: "[PDF p.32 · Deep Learning]",
    modality: "pdf",
    estimatedMinutes: 30,
    keyConcept: "Chain rule Jacobian propagation, activation non-linearities (ReLU/GELU), and weight updates.",
    likelyMisconception: "Zero-initializing weights, which causes identical gradients and prevents symmetry breaking.",
    x: 290,
    y: 160,
  },
  {
    id: "cnns",
    label: "Convolutional Filters & Strides",
    stage: "Core Mechanism",
    mastery: 0.76,
    status: "in_progress",
    prerequisites: ["neural_nets"],
    citation: "[Slide 7 · Convolutions]",
    modality: "slides",
    estimatedMinutes: 25,
    keyConcept: "Local receptive fields, weight sharing, stride shift parameters, and max-pooling downsampling.",
    likelyMisconception: "Believing stride preserves spatial resolution rather than downsampling feature maps.",
    x: 540,
    y: 60,
  },
  {
    id: "attention",
    label: "Self-Attention & Scaled Dot-Product",
    stage: "Core Mechanism",
    mastery: 0.70,
    status: "in_progress",
    prerequisites: ["neural_nets"],
    citation: "[PDF p.55 · Attention Is All You Need]",
    modality: "pdf",
    estimatedMinutes: 35,
    keyConcept: "Query, Key, Value matrix projections, softmax scaling by sqrt(d_k), and token context routing.",
    likelyMisconception: "Omitting the square-root dimension scaling factor, causing vanishing gradients in softmax.",
    x: 540,
    y: 190,
  },
  {
    id: "transformers",
    label: "Transformer Encoders & Cross-Attention",
    stage: "Advanced Synthesis",
    mastery: 0.52,
    status: "recommended",
    prerequisites: ["attention"],
    citation: "[Lecture 05 @ 22:10]",
    modality: "video",
    estimatedMinutes: 40,
    keyConcept: "Multi-head attention blocks, residual connections, layer normalization, and positional encoding.",
    likelyMisconception: "Assuming transformers process tokens sequentially like RNNs rather than in parallel.",
    x: 540,
    y: 320,
  },
  {
    id: "embeddings_rag",
    label: "Dense Embeddings & Vector Search (HNSW)",
    stage: "Advanced Synthesis",
    mastery: 0.38,
    status: "recommended",
    prerequisites: ["transformers"],
    citation: "[PDF p.68 · Vector Indexing]",
    modality: "pdf",
    estimatedMinutes: 30,
    keyConcept: "High-dimensional embedding projections, approximate nearest neighbor graphs, and cosine ranking.",
    likelyMisconception: "Treating sparse keyword BM25 retrieval and dense semantic vector search as identical.",
    x: 790,
    y: 160,
  },
  {
    id: "multimodal_rag",
    label: "Multimodal Grounding & RAG Pipelines",
    stage: "Advanced Synthesis",
    mastery: 0.20,
    status: "locked",
    prerequisites: ["embeddings_rag"],
    citation: "[🖼️ System Arch · Slide 10]",
    modality: "diagram",
    estimatedMinutes: 45,
    keyConcept: "Joint text-visual chunk retrieval, cross-encoder re-ranking, and grounded generation citations.",
    likelyMisconception: "Believing RAG permanently updates model parameters rather than supplying dynamic context.",
    x: 790,
    y: 310,
  },
];

const TRACKS: GraphTrack[] = [
  {
    id: "bio",
    title: "Cellular Bioenergetics & Respiration",
    subject: "Biology 101",
    description: "Prerequisite progression from foundational cell structures through chemiosmotic ATP synthesis.",
    nodes: BIOLOGY_NODES,
    mermaidCode: `graph LR
    subgraph S1 [Foundational]
        cell_bio["Cell Anatomy & Transport\\n(95% Mastered)"]
        enzymes["Enzymatic Catalysis\\n(90% Mastered)"]
    end
    subgraph S2 [Core Metabolism]
        glycolysis["Glycolysis Priming\\n(82% Mastered)"]
        fermentation["Anaerobic Fermentation\\n(68% In Progress)"]
        krebs["Citric Acid Cycle\\n(74% In Progress)"]
    end
    subgraph S3 [Respiration & ATP Synthesis]
        etc["Electron Transport Chain\\n(45% Needs Review)"]
        chemiosmosis["Chemiosmotic Coupling\\n(30% Recommended)"]
        atp_synthase["FoF1-ATP Synthase\\n(15% Locked)"]
    end
    cell_bio --> glycolysis
    enzymes --> glycolysis
    glycolysis --> fermentation
    glycolysis --> krebs
    krebs --> etc
    etc --> chemiosmosis
    chemiosmosis --> atp_synthase`,
  },
  {
    id: "cs",
    title: "Deep Learning & Multimodal RAG",
    subject: "Computer Science 201",
    description: "Curriculum progression from linear algebra to transformer attention and multimodal retrieval.",
    nodes: CS_NODES,
    mermaidCode: `graph LR
    subgraph S1 [Foundational Math]
        linear_algebra["Linear Algebra & Vectors\\n(98% Mastered)"]
        calculus_opt["Gradient Descent\\n(88% Mastered)"]
    end
    subgraph S2 [Deep Learning Core]
        neural_nets["Backprop & MLPs\\n(84% Mastered)"]
        cnns["Convolutional Networks\\n(76% In Progress)"]
        attention["Self-Attention Mechanism\\n(70% In Progress)"]
    end
    subgraph S3 [Generative & Retrieval]
        transformers["Transformer Encoders\\n(52% Needs Review)"]
        embeddings_rag["Vector Embeddings & HNSW\\n(38% Recommended)"]
        multimodal_rag["Multimodal RAG Pipelines\\n(20% Locked)"]
    end
    linear_algebra --> neural_nets
    calculus_opt --> neural_nets
    neural_nets --> cnns
    neural_nets --> attention
    attention --> transformers
    transformers --> embeddings_rag
    embeddings_rag --> multimodal_rag`,
  },
];

export function PrerequisiteKnowledgeGraph() {
  const [selectedTrackId, setSelectedTrackId] = useState<string>("bio");
  const [viewMode, setViewMode] = useState<"flow" | "mermaid">("flow");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("glycolysis");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const [mermaidSvg, setMermaidSvg] = useState<string>("");
  const mermaidRef = useRef<HTMLDivElement>(null);

  const currentTrack = TRACKS.find((t) => t.id === selectedTrackId) || TRACKS[0];
  const selectedNode = currentTrack.nodes.find((n) => n.id === selectedNodeId) || currentTrack.nodes[2];

  // Render Mermaid code dynamically when switching to Mermaid view
  useEffect(() => {
    let isMounted = true;
    if (viewMode === "mermaid") {
      import("mermaid")
        .then((mermaidModule) => {
          if (!isMounted) return;
          const mermaid = mermaidModule.default;
          mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            securityLevel: "loose",
            themeVariables: {
              fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
              fontSize: "12px",
              primaryColor: "#FFE6CC",
              primaryTextColor: "#111827",
              primaryBorderColor: "#334155",
              secondaryColor: "#D5E8D4",
              secondaryTextColor: "#111827",
              secondaryBorderColor: "#334155",
              tertiaryColor: "#E1D5E7",
              tertiaryTextColor: "#111827",
              tertiaryBorderColor: "#9673A6",
              mainBkg: "#FFE6CC",
              nodeBorder: "#334155",
              nodeTextColor: "#111827",
              lineColor: "#334155",
            },
            flowchart: {
              curve: "basis",
              htmlLabels: true,
            },
          });
          const renderId = `mermaid-svg-${Date.now()}`;
          mermaid
            .render(renderId, currentTrack.mermaidCode)
            .then((result) => {
              if (isMounted) setMermaidSvg(result.svg);
            })
            .catch((err) => {
              console.error("Mermaid render error:", err);
            });
        })
        .catch((e) => console.error("Failed to load mermaid:", e));
    }
    return () => {
      isMounted = false;
    };
  }, [viewMode, currentTrack.mermaidCode]);

  // Copy Mermaid syntax to clipboard
  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(currentTrack.mermaidCode);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  // Node status helper styles
  const getStatusStyles = (status: GraphNode["status"], isSelected: boolean) => {
    if (isSelected) {
      return "border-[#6C63FF] bg-[#6C63FF]/15 dark:bg-[#6C63FF]/20 shadow-md ring-2 ring-[#6C63FF]/50";
    }
    switch (status) {
      case "mastered":
        return "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/10 hover:border-emerald-500 hover:shadow-xs";
      case "in_progress":
        return "border-blue-500/40 bg-blue-500/10 dark:bg-blue-500/10 hover:border-blue-500 hover:shadow-xs";
      case "recommended":
        return "border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/10 hover:border-amber-500 hover:shadow-xs animate-pulse";
      case "locked":
        return "border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-zinc-900/60 opacity-60";
    }
  };

  // Calculate connections (edges)
  const edges: { from: GraphNode; to: GraphNode; isHighlighted: boolean }[] = [];
  currentTrack.nodes.forEach((toNode) => {
    toNode.prerequisites.forEach((fromId) => {
      const fromNode = currentTrack.nodes.find((n) => n.id === fromId);
      if (fromNode) {
        const isHighlighted =
          selectedNodeId === toNode.id ||
          selectedNodeId === fromNode.id ||
          hoveredNodeId === toNode.id ||
          hoveredNodeId === fromNode.id;
        edges.push({ from: fromNode, to: toNode, isHighlighted });
      }
    });
  });

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-5 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-md space-y-6">
      {/* Component Header with Track & Mode Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/30">
              <GitFork className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Prerequisite Knowledge Graph</span>
              <span className="hidden sm:inline-block rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                Topic Flow Map
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Interactive curriculum DAG showing prerequisite mastery chains, BKT concept growth, and multimodal source locations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Track Selector Pill */}
          <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-zinc-900/80 p-1 text-xs">
            {TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  setSelectedTrackId(track.id);
                  setSelectedNodeId(track.nodes[2]?.id || track.nodes[0]?.id);
                }}
                className={cn(
                  "rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer text-xs",
                  selectedTrackId === track.id
                    ? "bg-[#6C63FF] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {track.subject}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Interactive Canvas vs Mermaid */}
          <div className="flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-zinc-900/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("flow")}
              className={cn(
                "rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "flow"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Compass className="h-3.5 w-3.5 text-[#6C63FF]" />
              <span>Flow Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("mermaid")}
              className={cn(
                "rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "mermaid"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <FileCode className="h-3.5 w-3.5 text-blue-500" />
              <span>Mermaid.js</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Content Area */}
      {viewMode === "flow" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Canvas: SVG Directed Acyclic Graph */}
          <div className="xl:col-span-8 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/50 p-3 sm:p-4 overflow-x-auto relative shadow-inner">
            {/* Stage Column Delimiters */}
            <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-4 border-b border-slate-200/60 dark:border-white/[0.04] pb-2 min-w-[880px]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Layer 1: Foundational
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Layer 2: Core Mechanism
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Layer 3: Advanced Synthesis
              </span>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative min-w-[960px] h-[440px]">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 960 440">
                <defs>
                  {/* Arrowhead Markers */}
                  <marker
                    id="arrow-default"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#94A3B8" />
                  </marker>
                  <marker
                    id="arrow-active"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#6C63FF" />
                  </marker>
                  <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Curved Bezier Connectors */}
                {edges.map((edge, idx) => {
                  const nodeW = 180;
                  const nodeH = 74;
                  const startX = edge.from.x + nodeW;
                  const startY = edge.from.y + nodeH / 2;
                  const endX = edge.to.x;
                  const endY = edge.to.y + nodeH / 2;
                  const deltaX = endX - startX;
                  const cp1X = startX + deltaX * 0.45;
                  const cp2X = endX - deltaX * 0.45;

                  const pathD = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

                  return (
                    <path
                      key={idx}
                      d={pathD}
                      fill="none"
                      stroke={edge.isHighlighted ? "url(#edge-gradient)" : "#94A3B8"}
                      strokeWidth={edge.isHighlighted ? "3" : "1.8"}
                      strokeDasharray={edge.isHighlighted ? "none" : "5, 4"}
                      strokeOpacity={edge.isHighlighted ? 1 : 0.45}
                      markerEnd={edge.isHighlighted ? "url(#arrow-active)" : "url(#arrow-default)"}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>

              {/* Node Cards on Canvas */}
              {currentTrack.nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const nodeW = 180;
                const nodeH = 74;

                return (
                  <div
                    key={node.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNodeId(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{
                      position: "absolute",
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${nodeW}px`,
                      height: `${nodeH}px`,
                    }}
                    className={cn(
                      "rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none text-left backdrop-blur-md",
                      getStatusStyles(node.status, isSelected)
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                        {node.label}
                      </span>
                      {node.status === "mastered" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      {node.status === "in_progress" && (
                        <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      {node.status === "recommended" && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                      )}
                      {node.status === "locked" && (
                        <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Mastery Bar & Citation */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {Math.round(node.mastery * 100)}%
                        </span>
                        <span className="font-mono text-[9px] text-[#6C63FF] dark:text-[#8B85FF] truncate max-w-[95px]">
                          {node.citation.replace(/[\[\]]/g, "")}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            node.status === "mastered"
                              ? "bg-emerald-500"
                              : node.status === "in_progress"
                              ? "bg-blue-500"
                              : node.status === "recommended"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          )}
                          style={{ width: `${Math.round(node.mastery * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canvas Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200/60 dark:border-white/[0.04] flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Mastered (&gt;=80%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> In Progress (60-79%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" /> Recommended Next
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Locked / Prereq Missing
                </span>
              </div>
              <span className="font-mono text-[10px]">Click any node to inspect prerequisite chain</span>
            </div>
          </div>

          {/* Right Panel: Selected Concept Inspector */}
          <div className="xl:col-span-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-zinc-900/60 p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6C63FF] dark:text-[#8B85FF] font-bold">
                  {selectedNode.stage}
                </span>
                <Badge
                  variant={
                    selectedNode.status === "mastered"
                      ? "success"
                      : selectedNode.status === "recommended"
                      ? "warning"
                      : "secondary"
                  }
                  className="text-[10px] uppercase font-mono"
                >
                  {selectedNode.status.replace("_", " ")}
                </Badge>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {selectedNode.label}
              </h3>
            </div>

            {/* BKT Mastery Meter */}
            <div className="rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#121215] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#6C63FF]" /> BKT Mastery Probability
                </span>
                <span className="font-mono font-bold text-[#6C63FF] dark:text-[#8B85FF]">
                  {Math.round(selectedNode.mastery * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-blue-500 transition-all duration-300"
                  style={{ width: `${Math.round(selectedNode.mastery * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Corbett &amp; Anderson posterior estimate based on diagnostic interaction telemetry.
              </p>
            </div>

            {/* Key Concept Synopsis */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Core Conceptual Principle:
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                {selectedNode.keyConcept}
              </p>
            </div>

            {/* Misconception Alert Callout */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.08] p-3 space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Frequent Cognitive Misconception:</span>
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                {selectedNode.likelyMisconception}
              </p>
            </div>

            {/* Prerequisites & Unlocks */}
            <div className="space-y-2 text-xs border-t border-slate-200/80 dark:border-white/[0.06] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Direct Prerequisites:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedNode.prerequisites.length === 0
                    ? "None (Entry Point)"
                    : selectedNode.prerequisites.join(", ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Source Citation:</span>
                <span className="font-mono text-[#6C63FF] dark:text-[#8B85FF] font-semibold">
                  {selectedNode.citation}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Estimated Review Time:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ~{selectedNode.estimatedMinutes} minutes
                </span>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="pt-2 space-y-2">
              <Link
                href={`/chat?query=${encodeURIComponent(
                  `I am studying the prerequisite concept "${selectedNode.label}" cited in ${selectedNode.citation}. Can you teach me the core principles and help resolve this common misconception: "${selectedNode.likelyMisconception}"?`
                )}`}
                className="w-full"
              >
                <Button className="w-full gap-2 text-xs h-9.5 bg-[#6C63FF] hover:bg-[#5850EC] text-white shadow-xs cursor-pointer">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  <span>Launch Socratic Session in Chat</span>
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
              </Link>

              <Link
                href={`/quiz?topic=${encodeURIComponent(selectedNode.label)}`}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs h-9 bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Target className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Take 3-Question Concept Check</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Mermaid View: Live Render & Source Code Export */
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-blue-500" />
              <span>Standard Mermaid.js Flowchart Rendering (Track D Prerequisite Spec)</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMermaid}
              className="gap-1.5 text-xs h-8 bg-white dark:bg-zinc-800 border-slate-200 dark:border-white/10 cursor-pointer"
            >
              {copiedMermaid ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedMermaid ? "Copied Syntax!" : "Copy Mermaid Code"}</span>
            </Button>
          </div>

          {/* Rendered Mermaid SVG Container */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-900 p-6 overflow-x-auto flex items-center justify-center min-h-[320px]">
            {mermaidSvg ? (
              <div
                dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                className="w-full flex justify-center text-white"
              />
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping" />
                <span>Compiling Mermaid diagram syntax...</span>
              </div>
            )}
          </div>

          {/* Raw Mermaid Syntax Preview */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-950 p-4 text-xs font-mono text-slate-300 overflow-x-auto">
            <pre>{currentTrack.mermaidCode}</pre>
          </div>
        </div>
      )}
    </section>
  );
}
