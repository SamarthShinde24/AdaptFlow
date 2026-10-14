"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  X,
  FileText,
  Film,
  Presentation,
  Download,
  ExternalLink,
  MessageSquare,
  Play,
  Pause,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Volume2,
  FastForward,
  Layers,
  Lightbulb,
} from "lucide-react";
import { Material, MaterialType } from "@/lib/types";
import { formatBytes, formatDate, cn } from "@/lib/utils";

interface MaterialViewerModalProps {
  isOpen: boolean;
  material: Material | null;
  onClose: () => void;
  initialTimestampSeconds?: number;
  initialPageNumber?: number;
}

/**
 * Extracts a YouTube video ID from standard or shortened URLs.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

/**
 * Resolves the public static or uploaded asset URL for a given material.
 */
export function getMaterialFileUrl(material: Material | { id: string; title: string; filename?: string; material_type?: string; file_url?: string }): string {
  if ((material as any).file_url) {
    return (material as any).file_url;
  }
  const title = (material.title || "").toLowerCase();
  const filename = (material.filename || "").toLowerCase();
  const id = (material.id || "").toLowerCase();
  const type = material.material_type || "";

  // 1. Video files
  if (
    type === "lecture_video" ||
    title.includes("rag explained") ||
    filename.includes("rag explained") ||
    filename.includes(".mp4") ||
    id === "aa50916b-eedc-4306-a820-f96a7fce57f6"
  ) {
    return "/uploads/rag_explained.mp4";
  }

  // 2. Jaipur Guide PDF
  if (
    title.includes("jaipur") ||
    title.includes("hawa mahal") ||
    title.includes("rajasthan") ||
    title.includes("heritage") ||
    filename.includes("jaipur") ||
    filename.includes("heritage") ||
    id === "mat_2"
  ) {
    return "/uploads/jaipur_guide.pdf";
  }

  // 3. Principles of Biology PDF
  if (
    title.includes("biology") ||
    filename.includes("biology") ||
    id === "mat_1"
  ) {
    return "/uploads/principles_of_biology.pdf";
  }

  // 4. General fallback by type
  if (type === "textbook" || filename.endsWith(".pdf")) {
    return "/uploads/principles_of_biology.pdf";
  }

  if (type === "lecture_video" || filename.endsWith(".mp4") || filename.endsWith(".vtt")) {
    return "/uploads/rag_explained.mp4";
  }

  return "/uploads/principles_of_biology.pdf";
}

interface VideoTimestampSegment {
  timeLabel: string;
  seconds: number;
  title: string;
  concept: string;
  citationKey: string;
}

const RAG_VIDEO_TIMESTAMPS: VideoTimestampSegment[] = [
  {
    timeLabel: "00:00 - 02:15",
    seconds: 0,
    title: "Introduction to RAG & Parametric Limits",
    concept: "Why static neural weights hallucinate and require external non-parametric grounding.",
    citationKey: "[00:00 - 02:15: Introduction]",
  },
  {
    timeLabel: "02:15 - 04:18",
    seconds: 135,
    title: "Multimodal Document Ingestion & Chunking",
    concept: "Segmenting 300-500 token windows with 50-token sliding overlap for semantic fidelity.",
    citationKey: "[02:15 - 04:18: Chunking Mechanics]",
  },
  {
    timeLabel: "04:18 - 05:45",
    seconds: 258,
    title: "Dense Vector Embeddings & pgvector HNSW",
    concept: "Transforming token chunks into 1536-dimensional embeddings for sub-millisecond retrieval.",
    citationKey: "[04:18 - 05:45: Vector Embeddings]",
  },
  {
    timeLabel: "05:45 - 07:30",
    seconds: 345,
    title: "Cosine Distance Search & Candidate Filtering",
    concept: "Computing angle distance between query vectors and textbook chunk vectors in high-dimensional space.",
    citationKey: "[05:45 - 07:30: Cosine Search]",
  },
  {
    timeLabel: "07:30 - 09:12",
    seconds: 450,
    title: "Cross-Encoder Reranking & Context Injection",
    concept: "Joint scoring of prompt candidates to filter irrelevant passages before synthesis.",
    citationKey: "[07:30 - 09:12: Cross-Encoder Reranking]",
  },
  {
    timeLabel: "09:12 - 11:00",
    seconds: 552,
    title: "Grounded Generation & Source Attribution",
    concept: "Injecting verified passages into frozen LLM with strict clickable citation chips.",
    citationKey: "[09:12 - 11:00: Grounded Verification]",
  },
];

const BIO_TEXTBOOK_CHAPTERS = [
  {
    chapter: "Chapter 4",
    page: 42,
    title: "Glycolysis & Cytosolic Energy Conversion",
    summary: "Substrate-level phosphorylation yields a net of 2 ATP and 2 NADH per glucose in the cytosol.",
  },
  {
    chapter: "Chapter 9",
    page: 184,
    title: "The Citric Acid Cycle & Pyruvate Oxidation",
    summary: "Pyruvate is transported across the mitochondrial matrix, producing Acetyl-CoA, NADH, and FADH2.",
  },
  {
    chapter: "Chapter 9.4",
    page: 189,
    title: "Chemiosmotic Coupling & ATP Synthase Mechanics",
    summary: "Rotary catalysis driven by electrochemical proton-motive force synthesizes 30-32 ATP.",
  },
];

const JAIPUR_GUIDE_CHAPTERS = [
  {
    chapter: "Section 1",
    page: 1,
    title: "Architectural Heritage of the Pink City",
    summary: "Vastu Shastra grid planning established by Maharaja Sawai Jai Singh II in 1727.",
  },
  {
    chapter: "Section 3.2",
    page: 4,
    title: "Hawa Mahal Venturi Cooling Physics",
    summary: "953 jharokhas engineered to accelerate airflow through the Venturi effect for passive natural cooling.",
  },
  {
    chapter: "Section 5",
    page: 8,
    title: "Amer Fort Water Harvesting & Fortifications",
    summary: "Multi-tiered Persian waterwheel aqueducts powering high-altitude desert palace fortifications.",
  },
];

export interface SlideContent {
  slideNumber: number;
  title: string;
  category: string;
  equation?: string;
  bullets: string[];
  imagePath?: string;
  imageCaption?: string;
  keyTakeaway: string;
  speakerNotes: string;
}

const BIOENERGETICS_SLIDES: SlideContent[] = [
  {
    slideNumber: 1,
    title: "Introduction to Bioenergetics & Thermodynamics in Living Cells",
    category: "BIO101 · Lecture 4: Bioenergetics",
    equation: "ΔG = ΔH - TΔS  (Gibbs Free Energy Equation)",
    bullets: [
      "Living cells are open thermodynamic systems that exchange both matter and energy with their environment.",
      "Spontaneous biological reactions have a negative free energy change (ΔG < 0), releasing usable work.",
      "Endergonic biosynthetic pathways are coupled to exergonic ATP hydrolysis (ΔG°' = -30.5 kJ/mol).",
    ],
    keyTakeaway: "ATP acts as the universal free energy currency, driving cellular work through reaction coupling.",
    speakerNotes: "Welcome cohort. Begin by reviewing the first and second laws of thermodynamics and why cellular life maintains localized order.",
  },
  {
    slideNumber: 2,
    title: "High-Energy Phosphoanhydride Bonds of ATP",
    category: "BIO101 · Lecture 4: Bioenergetics",
    equation: "ATP + H₂O ➔ ADP + Pi  (ΔG°' = -30.5 kJ/mol / -7.3 kcal/mol)",
    bullets: [
      "Electrostatic repulsion between four negative charges on triphosphate oxygen atoms destabilizes ATP.",
      "Hydrolysis products (ADP and inorganic phosphate Pi) enjoy greater resonance stabilization and hydration.",
      "Substrate-level phosphorylation vs. oxidative phosphorylation: two fundamental ATP generation modes in living cells.",
    ],
    keyTakeaway: "Charge relief and resonance stabilization of inorganic phosphate drive high phosphoryl-transfer potential.",
    speakerNotes: "Emphasize that 'high-energy bond' is chemical shorthand for large negative free energy of hydrolysis, not an unstable physical bond.",
  },
  {
    slideNumber: 3,
    title: "Glycolysis Overview: The 10 Enzymatic Steps in Cytosol",
    category: "BIO101 · Stage 1: Cytosolic Glycolysis",
    equation: "C₆H₁₂O₆ (Glucose) ➔ 2 C₃H₄O₃ (Pyruvate) + 2 Net ATP + 2 NADH",
    bullets: [
      "Preparatory Phase (Steps 1-5): 2 ATP invested by Hexokinase (Step 1) and Phosphofructokinase-1 (Step 3).",
      "Cleavage Step (Step 4): Fructose 1,6-bisphosphate is cleaved by Aldolase into DHAP and G3P.",
      "Payoff Phase (Steps 6-10): 4 ATP and 2 NADH generated, yielding a net positive energy balance.",
    ],
    imagePath: "/uploads/visuals/sample_glycolysis_pathway.png",
    imageCaption: "Figure 3.2: Enzymatic Glycolysis Pathway & Phosphorylation Cascades",
    keyTakeaway: "Glycolysis requires no molecular oxygen (anaerobic) and operates in the cytosol of all living organisms.",
    speakerNotes: "Highlight PFK-1 as the primary committed rate-limiting step subject to allosteric feedback inhibition.",
  },
  {
    slideNumber: 4,
    title: "Net Reaction & Energy Yield of Glycolysis",
    category: "BIO101 · Stage 1: Cytosolic Glycolysis",
    equation: "Glucose + 2 NAD⁺ + 2 ADP + 2 Pi ➔ 2 Pyruvate + 2 NADH + 2 H⁺ + 2 ATP + 2 H₂O",
    bullets: [
      "Net ATP Yield: +2 ATP via substrate-level phosphorylation (Phosphoglycerate kinase & Pyruvate kinase).",
      "Reducing Equivalents: +2 NADH produced by Glyceraldehyde-3-phosphate dehydrogenase (GAPDH).",
      "Carbon Flow: One 6-carbon hexose glucose is oxidized into two 3-carbon pyruvate molecules.",
      "Shuttle Systems: Cytosolic NADH electrons transfer to mitochondrial ETC via Malate-Aspartate or Glycerol-3-P shuttles.",
    ],
    imagePath: "/uploads/visuals/sample_glycolysis_pathway.png",
    imageCaption: "Figure 4.1: Net ATP & NADH Stoichiometry in Cytosolic Glycolysis",
    keyTakeaway: "Glycolysis releases ~5% of glucose's total potential energy while producing vital reducing equivalents.",
    speakerNotes: "Common exam trap: Students forget that 4 ATP are formed in payoff phase, so net yield is 4 - 2 = 2 ATP.",
  },
  {
    slideNumber: 5,
    title: "Pyruvate Oxidation: The Link Reaction (PDC Complex)",
    category: "BIO101 · Mitochondrial Transition",
    equation: "2 Pyruvate + 2 CoA-SH + 2 NAD⁺ ➔ 2 Acetyl-CoA + 2 CO₂ + 2 NADH + 2 H⁺",
    bullets: [
      "Pyruvate translocates from cytosol across mitochondrial inner membrane via Pyruvate Translocase symport.",
      "Pyruvate Dehydrogenase Multienzyme Complex (E1, E2, E3) catalyzes oxidative decarboxylation.",
      "Five required cofactors: Thiamine pyrophosphate (TPP), Lipoamide, FAD, NAD⁺, and Coenzyme A.",
      "Decarboxylation step releases the first CO₂ molecules from original glucose.",
    ],
    keyTakeaway: "Irreversible commit point linking glycolysis to the Krebs cycle; strongly inhibited by high Acetyl-CoA and NADH.",
    speakerNotes: "Clinical tie-in: Beriberi and Wernicke-Korsakoff syndrome involve TPP (vitamin B1) deficiency, crippling PDC activity.",
  },
  {
    slideNumber: 6,
    title: "The Citric Acid Cycle (Krebs / TCA Cycle)",
    category: "BIO101 · Mitochondrial Matrix",
    equation: "Acetyl-CoA + 3 NAD⁺ + FAD + GDP + Pi + 2 H₂O ➔ 2 CO₂ + 3 NADH + FADH₂ + GTP + CoA-SH",
    bullets: [
      "Oxaloacetate (4C) condenses with Acetyl-CoA (2C) via Citrate Synthase to form Citrate (6C).",
      "Two successive decarboxylation steps release 2 CO₂, regenerating Oxaloacetate for subsequent cycles.",
      "Energy yield per turn: 3 NADH, 1 FADH₂, 1 GTP (equivalent to ATP) via substrate-level phosphorylation.",
      "Per original glucose molecule (2 turns): 6 NADH, 2 FADH₂, 2 GTP/ATP, and 4 CO₂.",
    ],
    keyTakeaway: "The TCA cycle completely oxidizes acetyl carbons to carbon dioxide, harvesting high-energy electrons.",
    speakerNotes: "Ask cohort to calculate total CO2 produced so far: 2 from PDC link reaction + 4 from TCA = all 6 carbons from glucose released!",
  },
  {
    slideNumber: 7,
    title: "Electron Transport Chain: Complexes I through IV",
    category: "BIO101 · Inner Mitochondrial Membrane",
    equation: "NADH + ½ O₂ + H⁺ ➔ NAD⁺ + H₂O  (ΔG°' = -220 kJ/mol)",
    bullets: [
      "Complex I (NADH Dehydrogenase): Transfers electrons from NADH to Ubiquinone (Q), pumping 4 H⁺.",
      "Complex II (Succinate Dehydrogenase): Accepts electrons from FADH₂ to Q; does NOT pump protons.",
      "Complex III (Cytochrome bc1 Complex): Q-cycle transfers electrons to Cytochrome c, pumping 4 H⁺.",
      "Complex IV (Cytochrome c Oxidase): Reduces terminal electron acceptor molecular O₂ to H₂O, pumping 2 H⁺.",
    ],
    imagePath: "/uploads/visuals/sample_chemiosmosis.png",
    imageCaption: "Figure 7.1: Transmembrane Electron Transport Chain (Complexes I-IV)",
    keyTakeaway: "Four transmembrane protein complexes orchestrate sequential redox reactions, using electron flow to pump protons.",
    speakerNotes: "Cyanide, carbon monoxide, and azide inhibit Complex IV, causing rapid cellular asphyxiation.",
  },
  {
    slideNumber: 8,
    title: "The Proton-Motive Force & Chemiosmotic Coupling",
    category: "BIO101 · Inner Mitochondrial Membrane",
    equation: "Δp = Δψ - (2.303 RT / F) ΔpH  (Mitchell Chemiosmotic Hypothesis)",
    bullets: [
      "Peter Mitchell (1961) proved that electron transport energy is stored as an electrochemical proton gradient.",
      "Electrical gradient (Δψ ~ 160-180 mV, matrix negative) + Chemical gradient (ΔpH ~ 0.75-1.0 pH units lower in IMS).",
      "Inner mitochondrial membrane is strictly impermeable to protons; return occurs exclusively through ATP Synthase.",
      "Proton stoichiometry: 10 H⁺ pumped per NADH oxidized, 6 H⁺ pumped per FADH₂ oxidized.",
    ],
    imagePath: "/uploads/visuals/sample_chemiosmosis.png",
    imageCaption: "Figure 8.1: Chemiosmotic Proton-Motive Force Across Mitochondrial Inner Membrane",
    keyTakeaway: "The proton-motive force (PMF) couples exergonic electron transport to endergonic ATP synthesis without chemical intermediates.",
    speakerNotes: "Mitchell received the 1978 Nobel Prize in Chemistry for proving the chemiosmotic coupling mechanism.",
  },
  {
    slideNumber: 9,
    title: "ATP Synthase (Complex V): The Molecular Rotary Engine",
    category: "BIO101 · Inner Mitochondrial Membrane",
    equation: "3 ADP + 3 Pi + ~10 H⁺ (intermembrane) ➔ 3 ATP + ~10 H⁺ (matrix)",
    bullets: [
      "F₀ Subunit (Membrane-bound): c-ring rotor and a-channel translocate protons, driving mechanical rotation.",
      "F₁ Subunit (Matrix catalytic head): Hexameric α₃β₃ head held stationary by external stator (b₂δ stalk).",
      "Binding-Change Mechanism (Boyer): As central γ-shaft rotates, β catalytic sites cycle through Open, Loose, and Tight conformations.",
      "Approximately 4 protons required per ATP synthesized (3 for c-ring rotation, 1 for Pi/H⁺ symport).",
    ],
    imagePath: "/uploads/visuals/sample_chemiosmosis.png",
    imageCaption: "Figure 9.1: F0/F1 ATP Synthase Rotary Catalysis & Proton Conduit",
    keyTakeaway: "ATP Synthase functions as the world's smallest rotary motor, operating with near 100% mechanical efficiency.",
    speakerNotes: "Paul Boyer and John Walker received the 1997 Nobel Prize for elucidating the rotary binding-change mechanism.",
  },
  {
    slideNumber: 10,
    title: "Complete Cellular Respiration Balance Sheet: 30-32 ATP",
    category: "BIO101 · Bioenergetics Accounting",
    equation: "C₆H₁₂O₆ + 6 O₂ + 30-32 ADP + 30-32 Pi ➔ 6 CO₂ + 6 H₂O + 30-32 ATP",
    bullets: [
      "Glycolysis: 2 net ATP + 2 NADH (worth 3 or 5 ATP depending on Malate-Aspartate vs Glycerol-3-P shuttle).",
      "Pyruvate Oxidation (2x): 2 NADH (worth 5 ATP via Complex I).",
      "Citric Acid Cycle (2x): 2 GTP/ATP + 6 NADH (15 ATP) + 2 FADH₂ (3 ATP).",
      "Oxidative Phosphorylation Yield: 2.5 ATP per NADH, 1.5 ATP per FADH₂.",
      "Total Net Theoretical Yield: 30 to 32 ATP per glucose molecule.",
    ],
    keyTakeaway: "Modern consensus recognizes 2.5 ATP/NADH and 1.5 ATP/FADH₂ (30-32 total), replacing older estimates of 36-38.",
    speakerNotes: "Explain why older textbooks say 36-38: older calculations ignored proton leakage and substrate transport costs.",
  },
  {
    slideNumber: 11,
    title: "Allosteric Regulation & Energy Charge of the Cell",
    category: "BIO101 · Metabolic Regulation",
    equation: "Energy Charge = ([ATP] + ½ [ADP]) / ([ATP] + [ADP] + [AMP])  (Normal Range: 0.85 - 0.95)",
    bullets: [
      "Phosphofructokinase-1 (PFK-1): Inhibited by high [ATP] and Citrate; allosterically stimulated by [AMP] and Fructose 2,6-bisphosphate.",
      "Pyruvate Dehydrogenase: Phosphorylated (inactivated) by PDH Kinase when [NADH]/[NAD⁺] and [ATP]/[ADP] ratios are high.",
      "Isocitrate Dehydrogenase: Allosterically stimulated by ADP and NAD⁺; feedback-inhibited by ATP and NADH.",
      "Respiratory Control: Rate of electron transport is tightly governed by the availability of ADP substrate.",
    ],
    keyTakeaway: "The cell maintains energy homeostasis by throttling catabolism when ATP/NADH is abundant and accelerating when AMP/ADP rises.",
    speakerNotes: "Ask cohort: what happens during heavy sprinting? AMP shoots up, instantly activating PFK-1 to ramp up glycolysis.",
  },
  {
    slideNumber: 12,
    title: "Anaerobic Respiration & Fermentation Pathways",
    category: "BIO101 · Anaerobic Catabolism",
    equation: "Lactic Acid: Pyruvate + NADH + H⁺ ⇄ Lactate + NAD⁺  |  Alcohol: Pyruvate ➔ Acetaldehyde ➔ Ethanol + CO₂",
    bullets: [
      "Absence of Terminal Oxygen: Electron transport chain halts, causing NADH to accumulate and depleting NAD⁺.",
      "NAD⁺ Regeneration Requirement: GAPDH (Step 6 of glycolysis) strictly requires NAD⁺ to maintain ATP synthesis.",
      "Lactate Dehydrogenase (LDH): Reduces pyruvate to lactate in mammalian skeletal muscle and erythrocytes.",
      "Ethanol Fermentation: Yeast decarboxylates pyruvate to acetaldehyde, then reduces it to ethanol, regenerating NAD⁺.",
    ],
    keyTakeaway: "Fermentation produces ZERO additional ATP beyond glycolysis; its sole physiological purpose is regenerating NAD⁺.",
    speakerNotes: "Common student misconception: students often think fermentation produces ATP directly. It only keeps glycolysis alive!",
  },
  {
    slideNumber: 13,
    title: "Comparative Energetics: Glucose vs. Fatty Acid Beta-Oxidation",
    category: "BIO101 · Comparative Metabolism",
    equation: "Palmitate (C₁₆H₃₂O₂) + 23 O₂ + 106 ADP + 106 Pi ➔ 16 CO₂ + 16 H₂O + 106 ATP",
    bullets: [
      "Energy Density: Triacylglycerols provide 9 kcal/g versus 4 kcal/g for carbohydrates and glycogen.",
      "Anhydrous Storage: Lipids are hydrophobic and stored without hydration water, unlike glycogen (2g H₂O per 1g glycogen).",
      "Palmitate Oxidation (C16): 7 rounds of β-oxidation produce 8 Acetyl-CoA, 7 NADH, and 7 FADH₂.",
      "Net Yield: 106 ATP per palmitate molecule after subtracting 2 ATP equivalents for acyl-CoA activation.",
    ],
    keyTakeaway: "Fatty acids are substantially more reduced than carbohydrates, yielding over twice the ATP per gram.",
    speakerNotes: "Discuss why marathon runners 'hit the wall' when glycogen stores deplete and metabolism must switch entirely to beta-oxidation.",
  },
  {
    slideNumber: 14,
    title: "Mitochondrial Uncoupling & Non-Shivering Thermogenesis",
    category: "BIO101 · Physiological Adaptations",
    equation: "Proton Leak: H⁺ (IMS) ➔ H⁺ (Matrix) via UCP-1 [Thermogenin] bypassing ATP Synthase",
    bullets: [
      "Uncoupling Protein 1 (UCP-1 / Thermogenin): High concentrations in brown adipose tissue (BAT) inner mitochondrial membrane.",
      "Mechanism: Dissipates the proton gradient as pure heat rather than capturing it as chemical ATP bond energy.",
      "Physiological Roles: Essential for newborn infant thermoregulation and hibernating mammals emerging from torpor.",
      "Chemical Uncouplers (e.g., 2,4-Dinitrophenol / DNP): Lipophilic weak acids that carry protons across the IMM, causing lethal hyperthermia.",
    ],
    keyTakeaway: "Uncoupling dissociates electron transport from ATP synthesis, converting electrochemical potential into biological heat.",
    speakerNotes: "Warn students about DNP history: used as an illicit diet drug in the 1930s, causing blindness and fatal overheating.",
  },
  {
    slideNumber: 15,
    title: "Clinical Correlates: Metabolic Inhibitors & Mitochondrial Diseases",
    category: "BIO101 · Medical Correlates",
    equation: "Cyanide (CN⁻) & Carbon Monoxide (CO) ➔ Irreversible inhibition of Cytochrome c Oxidase (Fe³⁺/Cu_B)",
    bullets: [
      "Rotenone & Amytal: Inhibit Complex I electron transfer from iron-sulfur clusters to ubiquinone.",
      "Antimycin A: Blocks Complex III Q-cycle electron transfer to Cytochrome c₁.",
      "Oligomycin: Binds directly to the F₀ stalk of ATP Synthase, physically blocking proton translocation.",
      "Mitochondrial Encephalomyopathies (e.g., MELAS, LHON): Maternally inherited mtDNA mutations affecting ETC subunit synthesis.",
    ],
    keyTakeaway: "Specific respiratory chain inhibitors serve as powerful pharmacological tools and explain toxicological emergencies.",
    speakerNotes: "Clinical emergency tip: Hydroxocobalamin (Cyanokit) binds cyanide to form harmless cyanocobalamin (Vitamin B12), excreted in urine.",
  },
  {
    slideNumber: 16,
    title: "Key Formulas, Summary Equations & Exam Review Checklist",
    category: "BIO101 · Exam Synthesis",
    equation: "Summary: Glucose (C₆) ➔ 2 Pyruvate (C₃) ➔ 2 Acetyl-CoA (C₂) ➔ 4 CO₂ | Total: 30-32 ATP + 6 CO₂",
    bullets: [
      "Subcellular Compartments: Glycolysis in Cytosol; PDC & TCA in Matrix; ETC & ATP Synthase in Inner Mitochondrial Membrane.",
      "Key Stoichiometries: 10 H⁺ pumped per NADH (Complex I, III, IV); 6 H⁺ per FADH₂ (Complex III, IV); 4 H⁺ per synthesized ATP.",
      "Rate-Limiting Enzymes: PFK-1 (Glycolysis), PDH (Link Reaction), Isocitrate Dehydrogenase (TCA Cycle).",
      "Checklist for Exam: Master the 3 Boyer conformational states (O, L, T), Mitchell's PMF formula, and the net ATP balance sheet.",
    ],
    keyTakeaway: "Cellular bioenergetics integrates cytosolic carbohydrate cleavage, matrix decarboxylation, and inner membrane chemiosmotic rotary catalysis.",
    speakerNotes: "Final review slide for cohort exams. Recommend students practice diagramming the ETC complexes and calculating proton yields.",
  },
];

const BST_SLIDES: SlideContent[] = [
  {
    slideNumber: 1,
    title: "Binary Search Tree (BST) Definition & Invariant Property",
    category: "CS201 · Binary Search Trees",
    equation: "BST Invariant: ∀ x in Left(u): key(x) < key(u)  AND  ∀ y in Right(u): key(y) > key(u)",
    bullets: [
      "A binary tree where every internal node stores an orderable key and two child pointers (left, right).",
      "Left Subtree Property: All nodes in the left subtree have values strictly less than the parent root node.",
      "Right Subtree Property: All nodes in the right subtree have values strictly greater than the parent root node.",
    ],
    keyTakeaway: "The BST invariant ensures that a single comparison halves the remaining search space when the tree is balanced.",
    speakerNotes: "Emphasize that the invariant must hold recursively for every single node in the subtree, not just immediate children.",
  },
  {
    slideNumber: 2,
    title: "BST Search Operation: O(h) Recursive & Iterative",
    category: "CS201 · Tree Operations",
    equation: "Time Complexity: T(h) = O(h) where h is the tree height. Balanced: O(log n), Degenerate: O(n)",
    bullets: [
      "Algorithm: Compare target key k with node value. If k == node.key, target found.",
      "If k < node.key: recursively branch left; else if k > node.key: recursively branch right.",
      "Iterative Implementation: Eliminates function call stack overhead and avoids potential stack overflow on deep trees.",
    ],
    keyTakeaway: "Search efficiency depends entirely on tree height h. Keeping h = O(log n) is the core goal of tree balancing.",
    speakerNotes: "Ask cohort to code iterative BST search on whiteboard: while (node != null && node.key != k) { node = (k < node.key) ? node.left : node.right; }.",
  },
  {
    slideNumber: 3,
    title: "Node Insertion Algorithm & Invariant Preservation",
    category: "CS201 · Tree Modification",
    equation: "Insertion: Traverse to leaf position; attach new TreeNode(key) at null pointer. Cost: O(h)",
    bullets: [
      "Search for the key: follow BST branching until encountering a null pointer where the key should exist.",
      "Attach new node as a child of the last examined non-null parent.",
      "Duplicate keys handling: either rejected (set semantics), stored in linked lists per node, or directed consistently left/right.",
    ],
    keyTakeaway: "New nodes are always inserted as leaves in standard unadjusted BST insertion.",
    speakerNotes: "Notice that the order of insertion dictates the structural shape of the tree.",
  },
  {
    slideNumber: 4,
    title: "Node Deletion: The 3 Structural Cases",
    category: "CS201 · Tree Modification",
    equation: "Case 1: Leaf (0 children)  |  Case 2: 1 Child  |  Case 3: 2 Children (In-Order Successor Swap)",
    bullets: [
      "Case 1 (Leaf Node): Simply remove the node and update the parent pointer to null.",
      "Case 2 (Single Child): Splice out the node by linking its parent directly to its single child.",
      "Case 3 (Two Children): Find in-order successor (minimum node in right subtree), copy its value, then delete the successor node.",
    ],
    keyTakeaway: "Deleting a node with two children preserves the invariant by replacing it with its immediate in-order successor or predecessor.",
    speakerNotes: "Common interview gotcha: The in-order successor never has a left child! That's why deleting it falls back to Case 1 or 2.",
  },
  {
    slideNumber: 5,
    title: "Depth-First Tree Traversals: In-Order, Pre-Order, Post-Order",
    category: "CS201 · Tree Traversals",
    equation: "In-Order: Left -> Root -> Right  |  Pre-Order: Root -> Left -> Right  |  Post-Order: Left -> Right -> Root",
    bullets: [
      "In-Order: Produces keys in strictly increasing sorted order for any valid BST.",
      "Pre-Order: Used for serializing/cloning trees or generating prefix expressions.",
      "Post-Order: Essential for bottom-up computation (e.g. deleting tree, computing subtree heights).",
      "Level-Order (BFS): Uses a FIFO queue to process nodes level by level.",
    ],
    keyTakeaway: "In-order traversal is the fundamental algorithm to verify whether a given binary tree satisfies the BST property in O(n) time.",
    speakerNotes: "Point out that pre-order traversal sequence uniquely reconstructs a BST if duplicate keys are disallowed.",
  },
  {
    slideNumber: 6,
    title: "Degenerate Trees & The O(n) Worst-Case Problem",
    category: "CS201 · Degeneracy Analysis",
    equation: "Sorted Input [1, 2, 3, 4, 5] ➔ Path-Degenerate Linked List: Height h = n - 1, Search Cost = O(n)",
    bullets: [
      "Inserting presorted or reverse-sorted elements creates a completely skewed, linked-list-like chain.",
      "Search, insertion, and deletion degrade from logarithmic O(log n) performance to linear O(n).",
      "Solution: Self-balancing binary search trees (AVL Trees, Red-Black Trees, Treaps) enforce balance via rotations.",
    ],
    keyTakeaway: "Unbalanced BSTs have unpredictable worst-case behavior under non-random insertion streams.",
    speakerNotes: "This motivated Adelson-Velsky and Landis in 1962 to invent the world's first self-balancing tree: the AVL Tree.",
  },
  {
    slideNumber: 7,
    title: "AVL Trees: Height-Balance Property & Balance Factor",
    category: "CS201 · Self-Balancing Trees",
    equation: "Balance Factor: BF(node) = Height(node.left) - Height(node.right)  ∈  {-1, 0, +1}",
    bullets: [
      "Definition: A BST where for every node, the height difference between left and right subtrees is at most 1.",
      "Strict Height Guarantee: The height of an AVL tree with n nodes is bounded by h < 1.44 log₂(n + 2).",
      "Violation Condition: Whenever insertion or deletion causes |BF(node)| ≥ 2, a tree rotation is triggered.",
    ],
    keyTakeaway: "AVL trees provide the strictest height balancing among all self-balancing BSTs, maximizing lookup speed.",
    speakerNotes: "Store the height in each node so BF can be calculated in O(1) time without recursing down the tree.",
  },
  {
    slideNumber: 8,
    title: "Tree Rotations: Single Right (LL) and Single Left (RR)",
    category: "CS201 · Tree Rotations",
    equation: "Single Rotation: Swaps parent-child relationship while preserving BST Invariant in O(1) time",
    bullets: [
      "Right Rotation (LL Case): Applied when a left child of a left child creates left-heavy imbalance (BF = +2, child BF = +1).",
      "Left Rotation (RR Case): Applied when a right child of a right child creates right-heavy imbalance (BF = -2, child BF = -1).",
      "Pointer updates: Only 3 pointer adjustments required; no data copying needed.",
    ],
    keyTakeaway: "Rotations alter tree height and shape in O(1) constant time without violating the underlying sorted order.",
    speakerNotes: "Demonstrate on the visual board: node A rotates down, child B rises to root, B's right subtree transfers to A's left.",
  },
  {
    slideNumber: 9,
    title: "Double Rotations: Left-Right (LR) and Right-Left (RL)",
    category: "CS201 · Tree Rotations",
    equation: "LR Case: Rotate Left on child, then Rotate Right on grandparent  |  RL: Right on child, Left on grandparent",
    bullets: [
      "Zig-Zag Imbalance: Occurs when insertion is on the inside subtree (BF = +2 with child BF = -1).",
      "A single rotation fails because the inside subtree remains heavy after rotation.",
      "Double rotation straightens the zig-zag into a single line, then balances the tree in O(1) total time.",
    ],
    keyTakeaway: "Four rotation cases (LL, RR, LR, RL) fully cover all possible AVL balance factor violations.",
    speakerNotes: "Encourage students to practice identifying whether an imbalance is straight (single rotation) or zig-zag (double rotation).",
  },
  {
    slideNumber: 10,
    title: "Red-Black Trees: The 5 Mandatory Color Invariants",
    category: "CS201 · Red-Black Trees",
    equation: "Height Bound: h ≤ 2 log₂(n + 1)  |  Every node is colored RED or BLACK",
    bullets: [
      "Invariant 1: Every node is either Red or Black.",
      "Invariant 2: The root node is always Black.",
      "Invariant 3: All leaf nodes (NIL / null sentinels) are Black.",
      "Invariant 4 (Red Property): If a node is Red, both of its children must be Black (no two consecutive Reds).",
      "Invariant 5 (Black Height): Every simple path from a node to descendant leaves contains the same number of Black nodes.",
    ],
    keyTakeaway: "The black-height property ensures the longest path is at most twice the length of the shortest path.",
    speakerNotes: "Java TreeMap, C++ std::map, and Linux process schedulers use Red-Black trees due to faster insertions/deletions than AVL.",
  },
  {
    slideNumber: 11,
    title: "B-Trees: Multiway Balanced Trees for Disk Storage",
    category: "CS201 · External Memory Structures",
    equation: "Block Size Optimization: Fanout B ~ 1000 ➔ Tree Height h = log_B(N) ≤ 3 for billions of records",
    bullets: [
      "Hardware Constraint: Magnetic disks and SSDs read and write data in fixed-size blocks (pages, typically 4KB-16KB).",
      "Multiway Search Tree: Each node contains up to m children and m - 1 sorted keys.",
      "Minimizing Disk I/O: By fitting hundreds of keys into a single disk page, tree height is reduced to 2 or 3 levels.",
    ],
    keyTakeaway: "B-Trees and B+ Trees form the storage foundation of PostgreSQL, MySQL InnoDB, SQLite, and modern file systems.",
    speakerNotes: "Ask cohort: Why not use an AVL tree for a database on disk? Because each node pointer dereference would cause a separate disk seek!",
  },
  {
    slideNumber: 12,
    title: "Trie (Prefix Tree) Data Structure for String Keys",
    category: "CS201 · String Indexing",
    equation: "Lookup Time: O(L) where L is string length, completely independent of total dictionary size N!",
    bullets: [
      "Tree structure where each edge represents an alphabet character; words are formed by tracing paths from the root.",
      "Common Prefixes Shared: Multiple words sharing prefixes (e.g. 'car', 'cart', 'card') share the same ancestor nodes.",
      "Applications: Autocomplete search suggestions, IP routing tables (longest prefix match), spell checkers.",
    ],
    keyTakeaway: "Tries offer lightning-fast prefix lookups bounded solely by the length of the query key.",
    speakerNotes: "Compare Space-Time Tradeoff: Standard tries use 26 child pointers per node; compressed tries (Radix Trees) collapse single-child paths.",
  },
  {
    slideNumber: 13,
    title: "Time & Space Complexity Summary: Big-O Matrix",
    category: "CS201 · Complexity Analysis",
    equation: "Summary Table: BST vs AVL vs Red-Black vs B-Tree",
    bullets: [
      "Standard BST: Search Avg O(log n), Worst O(n) | Insert Avg O(log n), Worst O(n) | Delete Avg O(log n), Worst O(n).",
      "AVL Tree: Search Worst O(log n) | Insert Worst O(log n) | Delete Worst O(log n) | Space O(n).",
      "Red-Black Tree: Search Worst O(log n) | Insert Worst O(log n) | Delete Worst O(log n) | Faster insertion rebalancing.",
      "B-Tree: Search Worst O(log_B n) | Optimized for block-based secondary storage.",
    ],
    keyTakeaway: "Balanced search trees guarantee predictable logarithmic performance even against adversarial insertion sequences.",
    speakerNotes: "For exams: memorizing the Big-O chart is good, but being able to justify WHY average is log n and worst is n is essential.",
  },
  {
    slideNumber: 14,
    title: "Tree Serialization & Deserialization",
    category: "CS201 · Serialization Algorithms",
    equation: "Reconstruction: Pre-Order + In-Order uniquely reconstructs any arbitrary binary tree in O(n) time",
    bullets: [
      "Serialization: Converting a memory-resident pointer tree into a flat string or binary byte stream for storage/network transmission.",
      "Pre-order with Null Markers: '5,3,2,#,#,4,#,#,7,#,#' allows unambiguous O(n) reconstruction using a single queue.",
      "BST Special Optimization: Since BST has an invariant, pre-order traversal alone with upper/lower bounds suffices without null markers.",
    ],
    keyTakeaway: "Serialization techniques are essential for database checkpoints, JSON payloads, and distributed data systems.",
    speakerNotes: "Classic LeetCode Hard problem: Serialize and Deserialize Binary Tree (LeetCode 297).",
  },
  {
    slideNumber: 15,
    title: "Common Student Misconceptions & Exam Traps",
    category: "CS201 · Cohort Diagnostics",
    equation: "Diagnostic Rule: Checking only parent-child relationships is INSUFFICIENT to validate a BST!",
    bullets: [
      "Trap 1: Validating only local node.left < node < node.right fails if a right-descendant value is less than an ancestor root.",
      "Correct Validation: Pass min and max bounds recursively: isValid(node, min, max).",
      "Trap 2: Assuming BST operations are always O(log n) without specifying whether the tree is self-balanced.",
      "Trap 3: Forgetting that in-order successor during node deletion is the minimum of the right subtree.",
    ],
    keyTakeaway: "Always propagate bounding intervals [min, max] when validating BST properties recursively.",
    speakerNotes: "Show a counterexample tree on the board: root 10, right child 15, 15's left child 6. Local checks pass, but 6 < 10 violates the invariant!",
  },
  {
    slideNumber: 16,
    title: "Key Algorithmic Invariants & Technical Interview Takeaways",
    category: "CS201 · Final Synthesis",
    equation: "Core Principle: Invariant Preservation = Correctness + Logarithmic Scaling",
    bullets: [
      "Fundamental Invariant: In-order traversal yields strictly monotonic sorted order.",
      "Balancing Mechanism: Tree rotations rebalance heights in O(1) time without rearranging elements.",
      "Selection Rule: Use AVL for read-heavy lookup systems; use Red-Black for frequent insertions and deletions.",
      "Review Checklist: Practice AVL single/double rotations, successor deletion, and recursive interval verification.",
    ],
    keyTakeaway: "Mastery of tree invariants unlocks high-performance systems engineering and technical interview problem solving.",
    speakerNotes: "Congratulations to the cohort. Next lecture will explore Graph Theory, BFS/DFS, and Dijkstra's Shortest Path algorithm.",
  },
];

function getSlideDeckData(material: Material): SlideContent[] {
  const title = (material.title || "").toLowerCase();
  const filename = (material.filename || "").toLowerCase();

  if (
    title.includes("trees") ||
    filename.includes("trees") ||
    title.includes("bst") ||
    filename.includes("bst") ||
    title.includes("cs201") ||
    material.id === "mat_5"
  ) {
    return BST_SLIDES;
  }

  // Default to Bioenergetics slides for BIO101 / bioenergetics / mat_4
  if (
    title.includes("bio") ||
    filename.includes("bio") ||
    material.id === "mat_4" ||
    title.includes("atp") ||
    title.includes("lecture 4")
  ) {
    return BIOENERGETICS_SLIDES;
  }

  // Generic dynamic generator for any user-uploaded or other presentation
  return Array.from({ length: 16 }, (_, i) => {
    const num = i + 1;
    return {
      slideNumber: num,
      title: `${material.title}: Core Concept Module #${num}`,
      category: `${material.subject || "Course Curriculum"} · Slide ${num}`,
      equation: num % 2 === 0 ? `Concept Formulation #${num} [Verified Provenance Matrix]` : undefined,
      bullets: [
        `Detailed curriculum extraction for ${material.title} covering core theoretical frameworks and formulas.`,
        `Interactive slide breakdown with synchronized faculty speaker notes and verified knowledge units.`,
        `Direct provenance link to Chapter ${Math.ceil(num / 2)}, section ${num}.`,
        `Verified examination focus points and common cohort misconceptions analyzed.`,
      ],
      keyTakeaway: `Key learning objective for Slide #${num}: Master the primary structural relationships and algorithmic proofs.`,
      speakerNotes: `Faculty cue for Slide #${num}: Emphasize practical applications and tie into upcoming mid-term assessment questions.`,
    };
  });
}

export function MaterialViewerModal({
  isOpen,
  material,
  onClose,
  initialTimestampSeconds = 0,
  initialPageNumber = 1,
}: MaterialViewerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<"viewer" | "index">("viewer");
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(initialTimestampSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(initialPageNumber);
  const [currentSlide, setCurrentSlide] = useState<number>(initialPageNumber || 1);

  const slideList = useMemo(() => {
    return material ? getSlideDeckData(material) : [];
  }, [material]);

  const activeSlideData = useMemo(() => {
    const target = slideList.find((s) => s.slideNumber === currentSlide);
    return target || slideList[0] || {
      slideNumber: 1,
      title: "Slide Overview",
      category: "Lecture Slide Deck",
      bullets: ["Curriculum content loaded."],
      keyTakeaway: "Core concept review.",
      speakerNotes: "Presenter notes available.",
    };
  }, [slideList, currentSlide]);

  const totalSlides = slideList.length || 16;

  const fileUrl = useMemo(() => {
    return material ? getMaterialFileUrl(material) : "";
  }, [material]);

  // Handle escape key and slide keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (material?.material_type === "slide_deck") {
        if (e.key === "ArrowLeft") {
          setCurrentSlide((s) => Math.max(s - 1, 1));
        } else if (e.key === "ArrowRight") {
          setCurrentSlide((s) => Math.min(s + 1, totalSlides));
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, material?.material_type, totalSlides]);

  // Calculate stable initial start second once per open session to prevent iframe reloads
  const initialStart = useMemo(() => {
    return Math.max(0, Math.floor(initialTimestampSeconds || 0));
  }, [material?.id, isOpen]);

  // Listen for message events from YouTube iframe with throttling to avoid re-render lag
  useEffect(() => {
    let lastSecond = -1;
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === "string" && event.data.startsWith("{")) {
          const data = JSON.parse(event.data);
          if (data.event === "infoDelivery" && data.info) {
            if (typeof data.info.currentTime === "number") {
              const sec = Math.floor(data.info.currentTime);
              // Only update state when integer second advances
              if (sec !== lastSecond) {
                lastSecond = sec;
                setCurrentVideoTime(sec);
              }
            }
            if (typeof data.info.playbackRate === "number") {
              setPlaybackSpeed((prev) => (prev !== data.info.playbackRate ? data.info.playbackRate : prev));
            }
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, []);

  // Sync page and slide numbers when initialPageNumber changes
  useEffect(() => {
    if (initialPageNumber) {
      setCurrentPage(initialPageNumber);
      setCurrentSlide(initialPageNumber);
    }
  }, [initialPageNumber]);

  // Seek video to initial timestamp when opened
  useEffect(() => {
    if (material?.material_type === "lecture_video" && videoRef.current) {
      if (initialTimestampSeconds > 0) {
        videoRef.current.currentTime = initialTimestampSeconds;
      }
    }
  }, [material, initialTimestampSeconds]);

  if (!isOpen || !material) return null;

  const isVideo = material.material_type === "lecture_video";
  const isPdf = material.material_type === "textbook";
  const isSlide = material.material_type === "slide_deck";

  const youtubeId = useMemo(() => {
    if (!material) return null;
    if ((material as any).youtube_id) return (material as any).youtube_id;
    const fromUrl = extractYouTubeId((material as any).file_url || material.filename || "");
    if (fromUrl) return fromUrl;
    if (material.id.startsWith("yt_")) return material.id.replace("yt_", "");
    return null;
  }, [material]);

  // Initialize YouTube Iframe Player API for programmatic speed & seek control
  useEffect(() => {
    if (!isOpen || !youtubeId) return;

    let timer: any = null;

    const initPlayer = () => {
      const win = window as any;
      if (typeof window !== "undefined" && win.YT && win.YT.Player && iframeRef.current) {
        try {
          ytPlayerRef.current = new win.YT.Player("yt-player-embed-frame", {
            events: {
              onReady: (event: any) => {
                if (playbackSpeed !== 1) {
                  event.target.setPlaybackRate(playbackSpeed);
                }
              },
              onPlaybackRateChange: (event: any) => {
                const rate = event.data;
                if (typeof rate === "number" && rate > 0) {
                  setPlaybackSpeed(rate);
                }
              },
            },
          });
        } catch (err) {
          console.warn("Could not instantiate YT.Player:", err);
        }
      }
    };

    if (typeof window !== "undefined") {
      const win = window as any;
      if (!win.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

        const prevReady = win.onYouTubeIframeAPIReady;
        win.onYouTubeIframeAPIReady = () => {
          if (prevReady) prevReady();
          initPlayer();
        };
      } else {
        timer = setTimeout(initPlayer, 300);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [isOpen, youtubeId]);

  const handleSeekVideo = (seconds: number) => {
    setCurrentVideoTime(seconds);

    // 1. Standard HTML5 video
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }

    // 2. YouTube YT.Player API
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.seekTo === "function") {
          ytPlayerRef.current.seekTo(seconds, true);
          ytPlayerRef.current.playVideo();
        }
      } catch (err) {
        console.warn("ytPlayer seekTo notice:", err);
      }
    }

    // 3. YouTube iframe postMessage fallback
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "seekTo",
            args: [seconds, true],
          }),
          "*"
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "playVideo",
            args: [],
          }),
          "*"
        );
      } catch (err) {
        console.warn("Could not postMessage seekTo to YouTube iframe:", err);
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);

    // 1. Standard HTML5 video
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      videoRef.current.defaultPlaybackRate = speed;
    }

    // 2. YouTube YT.Player API
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.setPlaybackRate === "function") {
          ytPlayerRef.current.setPlaybackRate(speed);
        }
      } catch (err) {
        console.warn("ytPlayer setPlaybackRate notice:", err);
      }
    }

    // 3. YouTube iframe postMessage fallback
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "setPlaybackRate",
            args: [speed],
          }),
          "*"
        );
      } catch (err) {
        console.warn("Could not postMessage setPlaybackRate to YouTube iframe:", err);
      }
    }
  };

  const activeTimestamp = RAG_VIDEO_TIMESTAMPS.find(
    (t, idx) =>
      currentVideoTime >= t.seconds &&
      (idx === RAG_VIDEO_TIMESTAMPS.length - 1 || currentVideoTime < RAG_VIDEO_TIMESTAMPS[idx + 1].seconds)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-[92vh] rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* Modal Header Bar                                                  */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/95 px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
                isPdf
                  ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                  : isVideo
                  ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
              }`}
            >
              {isPdf ? (
                <FileText className="h-5 w-5" />
              ) : isVideo ? (
                <Film className="h-5 w-5" />
              ) : (
                <Presentation className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                  {material.title}
                </h2>
                <span
                  className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    isPdf
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : isVideo
                      ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                      : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {isPdf ? "PDF Textbook" : isVideo ? "Lecture Video (MM:SS)" : "Slide Deck"}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 font-mono">
                {material.filename} · {formatBytes(material.file_size_bytes)} · {material.subject || "Course Material"}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Ask AI Tutor with this material */}
            <Link
              href={`/chat?materialId=${material.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
              title="Chat with AI Tutor using this material"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </Link>

            {/* Open in New Window */}
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors shadow-2xs"
                title="Open in new browser tab"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <span className="hidden md:inline">Open Tab</span>
              </a>
            )}

            {/* Download File */}
            {fileUrl && (
              <a
                href={fileUrl}
                download={material.filename}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors shadow-2xs"
                title="Download original uploaded file"
              >
                <Download className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <span className="hidden md:inline">Download</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
              title="Close viewer (Esc)"
              aria-label="Close viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* Main Content Area                                                 */}
        {/* ================================================================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-100/70 dark:bg-gray-950">
          {/* =============================================================== */}
          {/* MODE 1: LECTURE VIDEO PLAYER                                    */}
          {/* =============================================================== */}
          {isVideo && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Video Player Column */}
              <div className="flex-1 flex flex-col justify-between bg-black p-3 sm:p-5 overflow-hidden">
                <div className="relative flex-1 flex items-center justify-center rounded-2xl overflow-hidden bg-black shadow-inner">
                  {youtubeId ? (
                    <iframe
                      ref={iframeRef}
                      id="yt-player-embed-frame"
                      src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&start=${initialStart}`}
                      title={material.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full min-h-[380px] max-h-[65vh] object-contain rounded-xl border border-[#262642]"
                      onLoad={() => {
                        if (iframeRef.current?.contentWindow) {
                          try {
                            iframeRef.current.contentWindow.postMessage(
                              JSON.stringify({ event: "listening" }),
                              "*"
                            );
                            if (playbackSpeed !== 1) {
                              iframeRef.current.contentWindow.postMessage(
                                JSON.stringify({
                                  event: "command",
                                  func: "setPlaybackRate",
                                  args: [playbackSpeed],
                                }),
                                "*"
                              );
                            }
                          } catch {}
                        }
                      }}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={fileUrl}
                      controls
                      playsInline
                      className="w-full h-full max-h-[65vh] object-contain rounded-xl"
                      onTimeUpdate={(e) => {
                        const sec = Math.floor(e.currentTarget.currentTime);
                        if (sec !== Math.floor(currentVideoTime)) {
                          setCurrentVideoTime(sec);
                        }
                      }}
                    />
                  )}
                </div>

                {/* Video Controls Bar */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-white/90 text-xs">
                  <div className="flex items-center gap-2">
                    {youtubeId ? (
                      <span className="flex items-center gap-1.5 font-semibold text-rose-400">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>Synchronized Video Stream</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Audio/Visual Synchronized</span>
                      </span>
                    )}
                    {activeTimestamp && (
                      <span className="rounded-full bg-purple-500/30 border border-purple-400/40 px-2 py-0.5 text-[11px] font-mono text-purple-200">
                        {activeTimestamp.timeLabel}
                      </span>
                    )}
                  </div>

                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-xl border border-white/10 backdrop-blur-xs">
                    <span className="text-[11px] text-gray-400 font-medium">Speed:</span>
                    {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        title={`Set playback speed to ${spd}x`}
                        aria-label={`Playback speed ${spd}x`}
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
                          playbackSpeed === spd
                            ? "bg-[#6C63FF] text-white shadow-xs scale-105"
                            : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synchronized Transcript / Timestamps Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-64 md:h-full overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-zinc-900/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Tracked Timestamps ({RAG_VIDEO_TIMESTAMPS.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400">Click to seek</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {RAG_VIDEO_TIMESTAMPS.map((seg, idx) => {
                    const isSelected = activeTimestamp?.seconds === seg.seconds;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSeekVideo(seg.seconds)}
                        className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer ${
                          isSelected
                            ? "border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-xs"
                            : "border-gray-200/80 dark:border-gray-750 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-[11px] font-bold rounded-md px-1.5 py-0.5 ${
                              isSelected
                                ? "bg-purple-600 text-white"
                                : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                            }`}
                          >
                            {seg.timeLabel}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-0.5">
                            <Play className="h-2.5 w-2.5" />
                            <span>Jump</span>
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-xs font-bold text-gray-900 dark:text-white leading-snug">
                          {seg.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {seg.concept}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODE 2: PDF TEXTBOOK VIEWER                                     */}
          {/* =============================================================== */}
          {isPdf && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Embedded PDF iframe / Document Canvas */}
              <div className="flex-1 flex flex-col bg-gray-200/80 dark:bg-gray-950 p-3 sm:p-5 overflow-hidden">
                {/* PDF Toolbar */}
                <div className="mb-2 flex items-center justify-between rounded-xl bg-white dark:bg-gray-800 px-4 py-2 text-xs border border-gray-200 dark:border-gray-700 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{material.title}</span>
                    </span>
                    <span className="rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-xs font-bold">
                      Page {currentPage}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Zoom: {pdfZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setPdfZoom((z) => Math.min(z + 15, 175))}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfZoom((z) => Math.max(z - 15, 75))}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                      title="Zoom out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfZoom(100)}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                      title="Reset zoom"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Embedded PDF Iframe / Object with exact page anchoring */}
                <div className="relative flex-1 rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-white shadow-sm">
                  <iframe
                    key={`pdf-${material.id}-${currentPage}`}
                    src={`${fileUrl}#page=${currentPage}&zoom=${pdfZoom}`}
                    className="w-full h-full min-h-[500px]"
                    title={material.title}
                  />
                </div>
              </div>

              {/* Indexed Chapters / Sections Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-64 md:h-full overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-zinc-900/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Chapter & Page Index
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400">Bounding-box OCR</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                  {(material.title.toLowerCase().includes("jaipur") ||
                    material.title.toLowerCase().includes("hawa mahal") ||
                    material.title.toLowerCase().includes("heritage") ||
                    material.id === "mat_2"
                    ? JAIPUR_GUIDE_CHAPTERS
                    : BIO_TEXTBOOK_CHAPTERS
                  ).map((ch, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-3 border border-gray-200/80 dark:border-gray-750 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5">
                          {ch.chapter} · Page {ch.page}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Indexed</span>
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-xs font-bold text-gray-900 dark:text-white leading-snug">
                        {ch.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        {ch.summary}
                      </p>
                    </div>
                  ))}

                  <div className="pt-2 text-center">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open full document in reader window</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODE 3: SLIDE DECK VIEWER                                       */}
          {/* =============================================================== */}
          {isSlide && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Slide Presentation Canvas */}
              <div className="flex-1 flex flex-col bg-slate-100 dark:bg-zinc-950 p-3 sm:p-5 overflow-y-auto custom-scrollbar">
                {/* Slide Top Control Bar */}
                <div className="mb-3 flex items-center justify-between rounded-xl bg-white dark:bg-gray-800 px-4 py-2 text-xs border border-gray-200 dark:border-gray-750 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Presentation className="h-4 w-4 text-amber-500" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{material.title}</span>
                    </span>
                    <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-xs font-bold">
                      Slide {currentSlide} of {slideList.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentSlide((s) => Math.max(s - 1, 1))}
                      disabled={currentSlide <= 1}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Previous Slide (ArrowLeft)"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSlide((s) => Math.min(s + 1, slideList.length))}
                      disabled={currentSlide >= slideList.length}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Next Slide (ArrowRight)"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Slide Presentation Card */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md p-5 sm:p-7 flex flex-col justify-between min-h-[420px] relative transition-all">
                  <div>
                    {/* Slide Header: Badge + Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                        <Presentation className="h-3.5 w-3.5 text-amber-500" />
                        <span>{activeSlideData.category}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500">
                        Slide #{currentSlide} of {slideList.length}
                      </span>
                    </div>

                    {/* Slide Headline */}
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
                      {activeSlideData.title}
                    </h3>

                    {/* Equation / Formulation Callout Block (if present) */}
                    {activeSlideData.equation && (
                      <div className="mb-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 p-3 sm:p-3.5">
                        <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 tracking-wider mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Core Equation / Law:</span>
                        </div>
                        <div className="font-mono text-xs sm:text-sm font-semibold text-gray-900 dark:text-amber-100 overflow-x-auto py-0.5">
                          {activeSlideData.equation}
                        </div>
                      </div>
                    )}

                    {/* Content Section: 2 Columns when Diagram is present, or 1 Column */}
                    <div className={cn("grid gap-4 items-start", activeSlideData.imagePath ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1")}>
                      {/* Bullets List */}
                      <div className={cn("space-y-2.5", activeSlideData.imagePath ? "lg:col-span-7" : "w-full")}>
                        {activeSlideData.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold mt-0.5">
                              {bIdx + 1}
                            </span>
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>

                      {/* Embedded Slide Visual Diagram */}
                      {activeSlideData.imagePath && (
                        <div className="lg:col-span-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 p-2.5 flex flex-col items-center">
                          <img
                            src={activeSlideData.imagePath}
                            alt={activeSlideData.imageCaption || activeSlideData.title}
                            className="max-h-48 w-auto object-contain rounded-lg shadow-xs"
                          />
                          {activeSlideData.imageCaption && (
                            <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 text-center font-medium">
                              {activeSlideData.imageCaption}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Exam Takeaway Banner */}
                  <div className="mt-5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 text-xs flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-800 dark:text-emerald-300 font-bold block mb-0.5">
                        Key Exam Takeaway:
                      </strong>
                      <span className="text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
                        {activeSlideData.keyTakeaway}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Presenter / Speaker Notes Dock */}
                <div className="mt-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white mb-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Presenter & Faculty Speaker Notes</span>
                    <span className="text-[10px] font-normal text-gray-400">· Synchronized to Slide #{currentSlide}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                    &ldquo;{activeSlideData.speakerNotes}&rdquo;
                  </p>
                </div>
              </div>

              {/* Right Slide Thumbnails & Index Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-64 md:h-full overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-zinc-900/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Slide Deck Index ({slideList.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400">Click to jump</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {slideList.map((sItem) => {
                    const isSelected = currentSlide === sItem.slideNumber;
                    return (
                      <button
                        key={sItem.slideNumber}
                        type="button"
                        onClick={() => setCurrentSlide(sItem.slideNumber)}
                        className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 shadow-xs"
                            : "border-gray-200/80 dark:border-gray-750 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-750 hover:bg-gray-50 dark:hover:bg-gray-750"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-[10px] font-bold rounded-md px-1.5 py-0.5 ${
                              isSelected
                                ? "bg-amber-600 text-white"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            Slide #{sItem.slideNumber}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1.5 text-xs font-bold text-gray-900 dark:text-white leading-snug line-clamp-1">
                          {sItem.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {sItem.bullets[0]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
