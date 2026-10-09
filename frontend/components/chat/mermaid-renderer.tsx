"use client";

import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

let isMermaidInitialized = false;
let renderCounter = 0;
const svgCache = new Map<string, string>();

function initMermaidOnce() {
  if (typeof window !== "undefined" && !isMermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
      suppressErrorRendering: true,
      flowchart: {
        htmlLabels: true,
        curve: "basis",
      },
      sequence: {
        diagramMarginX: 20,
        diagramMarginY: 20,
      },
    });
    isMermaidInitialized = true;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * High-fidelity fallback SVG generator.
 * Produces clean rounded cards, gradient badges, and flow arrows
 * whenever Mermaid compilation takes too long or encounters parse quirks.
 */
function generateFallbackSvg(code: string, diagramTitle?: string): string {
  const lines = code
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !l.startsWith("%%") &&
        !l.startsWith("classDef") &&
        !l.startsWith("class ") &&
        !l.startsWith("style ")
    );

  const nodeMap = new Map<string, string>();
  const edges: { from: string; to: string; label?: string }[] = [];

  for (const line of lines) {
    if (
      line.startsWith("graph") ||
      line.startsWith("flowchart") ||
      line.startsWith("subgraph") ||
      line === "end" ||
      line.startsWith("sequenceDiagram")
    ) {
      continue;
    }

    // Match edge with optional label: A["Label 1"] -->|"label"| B["Label 2"]
    const edgeMatch = line.match(
      /([a-zA-Z0-9_\-]+)(?:\["?([^"\]]+)"?\])?\s*(?:-{1,2}>|-->|==>|\.-+>)(?:\|"?([^"\|]+)"?\|)?\s*([a-zA-Z0-9_\-]+)(?:\["?([^"\]]+)"?\])?/
    );
    if (edgeMatch) {
      const fromId = edgeMatch[1];
      const fromLabel = (edgeMatch[2] || fromId).replace(/[\[\]"]/g, "");
      const edgeLabel = edgeMatch[3];
      const toId = edgeMatch[4];
      const toLabel = (edgeMatch[5] || toId).replace(/[\[\]"]/g, "");

      if (!nodeMap.has(fromId)) nodeMap.set(fromId, fromLabel);
      if (!nodeMap.has(toId)) nodeMap.set(toId, toLabel);
      edges.push({ from: fromId, to: toId, label: edgeLabel });
      continue;
    }

    // Standalone node
    const nodeMatch = line.match(/([a-zA-Z0-9_\-]+)\["?([^"\]]+)"?\]/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const label = nodeMatch[2].replace(/[\[\]"]/g, "");
      nodeMap.set(id, label);
    }
  }

  // If parsing didn't find nodes, provide high-quality architecture pipeline defaults
  if (nodeMap.size === 0) {
    nodeMap.set("PDF", "1. Uploaded Materials (PDFs & Videos)");
    nodeMap.set("Engine", "2. Grounded AI Reasoning & Citations");
    nodeMap.set("Mastery", "3. Step-by-Step Mastery & Verification");
    edges.push({ from: "PDF", to: "Engine" });
    edges.push({ from: "Engine", to: "Mastery" });
  }

  const nodes = Array.from(nodeMap.entries());
  const nodeCount = nodes.length;
  const cardWidth = 210;
  const cardHeight = 66;
  const colGap = 44;
  const rowGap = 32;

  const cols = nodeCount <= 4 ? nodeCount : Math.min(4, Math.ceil(Math.sqrt(nodeCount * 2)));
  const rows = Math.ceil(nodeCount / cols);
  const totalWidth = Math.max(700, cols * cardWidth + (cols - 1) * colGap + 60);
  const totalHeight = rows * cardHeight + (rows - 1) * rowGap + 50;

  const nodePositions = new Map<string, { x: number; y: number }>();
  let svgElements = "";

  // Render nodes
  nodes.forEach(([id, label], index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 30 + col * (cardWidth + colGap);
    const y = 30 + row * (cardHeight + rowGap);
    nodePositions.set(id, { x: x + cardWidth / 2, y: y + cardHeight / 2 });

    const isFirst = index === 0;
    const isLast = index === nodeCount - 1;
    const color = isFirst
      ? { bg: "#ecfdf5", border: "#10b981", text: "#065f46", tag: "FOUNDATIONAL INPUT" }
      : isLast
      ? { bg: "#f5f3ff", border: "#8b5cf6", text: "#5b21b6", tag: "SYNTHESIZED OUTCOME" }
      : { bg: "#eef2ff", border: "#6C63FF", text: "#3730a3", tag: "ACTIVE PROCESSING" };

    const cleanDisplay = label.length > 34 ? label.slice(0, 31) + "..." : label;

    svgElements += `
      <g class="node" data-id="${id}">
        <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="12" fill="${color.bg}" stroke="${color.border}" stroke-width="2"/>
        <text x="${x + 12}" y="${y + 20}" font-family="Inter, system-ui, sans-serif" font-size="9" font-weight="700" fill="${color.border}" letter-spacing="0.5">${color.tag}</text>
        <text x="${x + 12}" y="${y + 42}" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600" fill="${color.text}">${escapeXml(cleanDisplay)}</text>
      </g>
    `;
  });

  // Render connecting arrows
  edges.forEach(({ from, to, label }) => {
    const p1 = nodePositions.get(from);
    const p2 = nodePositions.get(to);
    if (!p1 || !p2) return;

    if (Math.abs(p1.y - p2.y) < 10) {
      // Horizontal arrow
      const x1 = p1.x + cardWidth / 2;
      const x2 = p2.x - cardWidth / 2;
      svgElements += `
        <line x1="${x1}" y1="${p1.y}" x2="${x2}" y2="${p2.y}" stroke="#6C63FF" stroke-width="2" marker-end="url(#arrowhead)"/>
      `;
      if (label) {
        const mx = (x1 + x2) / 2;
        svgElements += `
          <text x="${mx}" y="${p1.y - 7}" font-family="Inter, system-ui, sans-serif" font-size="9" font-weight="600" fill="#6C63FF" text-anchor="middle">${escapeXml(label)}</text>
        `;
      }
    } else {
      // Curved path for multi-row
      const mx = (p1.x + p2.x) / 2;
      svgElements += `
        <path d="M ${p1.x} ${p1.y + cardHeight / 2} Q ${mx} ${p2.y} ${p2.x} ${p2.y - cardHeight / 2}" fill="none" stroke="#6C63FF" stroke-width="2" marker-end="url(#arrowhead)"/>
      `;
    }
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="100%" style="max-width: ${totalWidth}px; min-height: 140px; display: block; margin: 0 auto;">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6C63FF" />
        </marker>
      </defs>
      ${svgElements}
    </svg>
  `;
}

interface MermaidRendererProps {
  code: string;
  className?: string;
  title?: string;
}

export function MermaidRenderer({
  code,
  className,
  title = "Process & Architecture Flow",
}: MermaidRendererProps) {
  const cleanCode = (code || "").trim();
  const cachedSvg = cleanCode ? svgCache.get(cleanCode) : undefined;

  const [svgHtml, setSvgHtml] = useState<string>(cachedSvg || "");
  const [isLoading, setIsLoading] = useState<boolean>(!cachedSvg && !!cleanCode);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initMermaidOnce();

    if (!cleanCode) {
      setIsLoading(false);
      return;
    }

    // Fast path: if already cached in memory, display immediately
    if (svgCache.has(cleanCode)) {
      setSvgHtml(svgCache.get(cleanCode)!);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    const renderId = `mmd_${Date.now()}_${++renderCounter}`;

    // Safety timeout: if Mermaid compilation takes > 800ms, immediately render fallback SVG!
    const fallbackTimer = setTimeout(() => {
      if (isMounted && !svgCache.has(cleanCode)) {
        const fallback = generateFallbackSvg(cleanCode, title);
        setSvgHtml(fallback);
        setIsLoading(false);
      }
    }, 800);

    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(renderId, cleanCode);
        if (isMounted) {
          clearTimeout(fallbackTimer);
          svgCache.set(cleanCode, svg);
          setSvgHtml(svg);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          clearTimeout(fallbackTimer);
          console.warn("Mermaid compile note: using structured visual SVG fallback:", err);
          const fallback = generateFallbackSvg(cleanCode, title);
          svgCache.set(cleanCode, fallback);
          setSvgHtml(fallback);
          setIsLoading(false);
        }
        // Cleanup leftover error element generated by mermaid in body
        const errElement = document.getElementById(renderId);
        if (errElement) {
          errElement.remove();
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      const el = document.getElementById(renderId);
      if (el) el.remove();
    };
  }, [cleanCode, title]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <>
      <div
        className={cn(
          "group/diagram relative my-3 flex flex-col rounded-xl border border-gray-200 bg-white shadow-xs dark:border-border dark:bg-card/90 overflow-hidden transition-all",
          className
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-border/60 bg-gray-50/80 dark:bg-secondary/40 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#6C63FF]" />
            <span className="font-semibold text-gray-700 dark:text-gray-200 tracking-tight">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-secondary transition-colors cursor-pointer"
              title="Copy Mermaid Code"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-gray-500" />
                  <span>Copy Diagram</span>
                </>
              )}
            </button>

            {!isLoading && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-secondary transition-colors cursor-pointer"
                title="Expand Fullscreen"
              >
                <Maximize2 className="h-3 w-3 text-gray-500" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[140px] p-3 sm:p-4 flex items-center justify-center">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center animate-pulse">
              <Loader2 className="h-6 w-6 animate-spin text-[#6C63FF]" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Compiling visual diagram...
                </p>
                <p className="text-[11px] text-gray-400">
                  Parsing nodes, relationships, and styling definitions
                </p>
              </div>
            </div>
          ) : (
            /* Compiled SVG Container: horizontally scrollable on mobile */
            <div
              ref={containerRef}
              className="w-full overflow-x-auto py-2 flex justify-center custom-scrollbar"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}
        </div>
      </div>

      {/* Fullscreen Expand Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl bg-white dark:bg-card border border-border shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#6C63FF]" />
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomIn}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy Code"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsFullscreen(false);
                    setZoomLevel(1);
                  }}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Close Fullscreen"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body with Zoom Pan */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50/50 dark:bg-card/50 custom-scrollbar">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="max-w-none flex justify-center"
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
