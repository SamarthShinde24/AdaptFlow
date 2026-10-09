import { ChatMessage, CitationReference } from "./types";

export interface ChatSession {
  id: string;
  title: string;
  dateGroup: "Today" | "Yesterday" | "Last 7 Days";
  timestamp: string;
  sourcePreview: string;
  materialId?: string;
  messages: ChatMessage[];
  updatedAt: string;
}

const STORAGE_KEY = "adaptflow_chat_sessions_v1";
export const HISTORY_UPDATE_EVENT = "adaptflow:history-updated";
export const SELECT_SESSION_EVENT = "adaptflow:select-session";

export const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: "hist_1",
    title: "Cellular Respiration & ATP Synthesis",
    dateGroup: "Today",
    timestamp: "10:45 AM",
    sourcePreview: "[PDF p.42 · Biology]",
    materialId: "mat_1",
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "hist_1_m1",
        role: "user",
        content: "Can you explain how ATP is synthesized during cellular respiration and where the energy comes from?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "hist_1_m2",
        role: "assistant",
        content:
          "Cellular respiration generates adenosine triphosphate (ATP) through three interconnected metabolic stages: glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation.\n\n" +
          "1. **Glycolysis**: Takes place in the cytosol, breaking down 1 glucose molecule into 2 pyruvate molecules and yielding a net gain of 2 ATP and 2 NADH [Slide 4].\n\n" +
          "2. **Citric Acid Cycle**: Operates within the mitochondrial matrix, oxidizing pyruvate-derived Acetyl-CoA to release CO₂ while synthesizing 2 ATP and reducing NAD⁺ and FAD into high-energy electron carriers [PDF p.42].\n\n" +
          "3. **Oxidative Phosphorylation**: The electron transport chain pumps protons into the mitochondrial intermembrane space, creating a proton-motive force. Chemiosmosis powers ATP synthase to synthesize 28 to 34 ATP molecules [PDF p.42].\n\n" +
          "You can click any of the citation chips to inspect the precise textbook chapter or lecture slide!",
        timestamp: new Date(Date.now() - 118 * 60 * 1000),
        citations: [
          {
            key: "[PDF p.42]",
            unit: {
              id: "unit-bio-p42",
              material_id: "mat_1",
              content:
                "Cellular respiration generates adenosine triphosphate (ATP) through glycolysis, the citric acid cycle, and oxidative phosphorylation. Chemiosmotic phosphorylation produces the bulk of ATP yield in aerobic respiration.",
              modality: "text",
              source_tracking: {
                material_id: "mat_1",
                material_title: "Principles of Biology (11th Ed)",
                material_type: "textbook",
                chunk_index: 4,
                page_number: 42,
                chapter: "Chapter 4: Energy & Cellular Respiration",
                section: "Section 4.2 Glycolysis & Chemiosmosis",
                citation_label: "[Principles of Biology | Chapter 4, p. 42]",
                content_hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
                token_count: 65,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["biology", "atp", "respiration"],
              created_at: new Date().toISOString(),
            },
          },
          {
            key: "[Slide 4]",
            unit: {
              id: "unit-slide-4",
              material_id: "mat_4",
              content:
                "Slide 4: Net ATP and NADH synthesis summary. Glycolysis yields 2 net ATP via substrate-level phosphorylation and 2 NADH reducing equivalents per glucose molecule.",
              modality: "slide_content",
              source_tracking: {
                material_id: "mat_4",
                material_title: "Lecture 4 Slides: Bioenergetics",
                material_type: "slide_deck",
                chunk_index: 4,
                slide_number: 4,
                slide_title: "Net Reaction of Glycolysis",
                citation_label: "[Lecture 4 Slides | Slide #4: Net Reaction of Glycolysis]",
                content_hash: "8c3ef943b1298457f9208a0d249f7e44a4746f33cfbb20786cf87d3a0e1c0702",
                token_count: 50,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["bioenergetics", "slide", "glycolysis"],
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
      {
        id: "hist_1_m3",
        role: "user",
        content: "What is the difference between substrate-level phosphorylation and oxidative phosphorylation?",
        timestamp: new Date(Date.now() - 110 * 60 * 1000),
      },
      {
        id: "hist_1_m4",
        role: "assistant",
        content:
          "The fundamental difference lies in how the phosphate group is bound to ADP to form ATP:\n\n" +
          "- **Substrate-Level Phosphorylation**: A soluble kinase enzyme directly transfers a high-energy phosphate group from an organic substrate intermediate to ADP. This occurs directly during glycolysis and the citric acid cycle without requiring an electron transport chain or oxygen [Slide 4].\n\n" +
          "- **Oxidative Phosphorylation**: Relies on a multi-protein electron transport chain embedded in the inner mitochondrial membrane. Redox reactions pump protons across the membrane, establishing an electrochemical proton gradient. ATP synthase then harnesses this proton-motive force to phosphorylate ADP into ATP, generating over 90% of cellular energy [PDF p.42].",
        timestamp: new Date(Date.now() - 108 * 60 * 1000),
        citations: [
          {
            key: "[Slide 4]",
            unit: {
              id: "unit-slide-4",
              material_id: "mat_4",
              content:
                "Slide 4: Substrate-level phosphorylation directly generates ATP from phosphoglycerate intermediates without requiring oxygen.",
              modality: "slide_content",
              source_tracking: {
                material_id: "mat_4",
                material_title: "Lecture 4 Slides: Bioenergetics",
                material_type: "slide_deck",
                chunk_index: 4,
                slide_number: 4,
                slide_title: "Substrate vs Oxidative Phosphorylation",
                citation_label: "[Lecture 4 Slides | Slide #4]",
                content_hash: "8c3ef943b1298457f9208a0d249f7e44a4746f33cfbb20786cf87d3a0e1c0702",
                token_count: 42,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["bioenergetics", "phosphorylation"],
              created_at: new Date().toISOString(),
            },
          },
          {
            key: "[PDF p.42]",
            unit: {
              id: "unit-bio-p42",
              material_id: "mat_1",
              content:
                "Oxidative phosphorylation accounts for the vast majority of ATP synthesis in aerobic organisms through chemiosmotic coupling across the inner mitochondrial membrane.",
              modality: "text",
              source_tracking: {
                material_id: "mat_1",
                material_title: "Principles of Biology (11th Ed)",
                material_type: "textbook",
                chunk_index: 4,
                page_number: 42,
                chapter: "Chapter 4: Energy & Cellular Respiration",
                citation_label: "[Principles of Biology | Chapter 4, p. 42]",
                content_hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
                token_count: 55,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["biology", "atp"],
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    ],
  },
  {
    id: "hist_2",
    title: "Hawa Mahal Architectural History",
    dateGroup: "Today",
    timestamp: "9:15 AM",
    sourcePreview: "[PDF p.1 · Heritage]",
    materialId: "mat_2",
    updatedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "hist_2_m1",
        role: "user",
        content: "What is the historical and architectural significance of Hawa Mahal in Jaipur?",
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      },
      {
        id: "hist_2_m2",
        role: "assistant",
        content:
          "Hawa Mahal, or the 'Palace of Winds', is an architectural masterpiece located in Jaipur, Rajasthan, commissioned in 1799 by Maharaja Sawai Pratap Singh [PDF p.1].\n\n" +
          "### Key Architectural Highlights:\n" +
          "- **953 Jharokhas (Latticed Windows)**: Intricately designed sandstone casements allowed royal women to observe city festivals and daily street processions without violating purdah customs [PDF p.1].\n" +
          "- **Venturi Cooling Effect**: The honeycomb structure creates a natural wind funnel. As breeze passes through the narrowed openings, velocity increases while pressure drops, cooling the entire palace during sweltering desert summers.\n" +
          "- **Crown Silhouette**: Master architect Lal Chand Ustad shaped the five-storey exterior to resemble Lord Krishna's crown, constructed using iconic red and pink sandstone [PDF p.1].",
        timestamp: new Date(Date.now() - 3.4 * 60 * 60 * 1000),
        citations: [
          {
            key: "[PDF p.1]",
            unit: {
              id: "unit-hawa-p1",
              material_id: "mat_2",
              content:
                "Hawa Mahal was commissioned by Maharaja Sawai Pratap Singh in 1799. Designed by Lal Chand Ustad, the five-storey facade boasts 953 jharokhas that leverage the Venturi effect for natural ventilation.",
              modality: "text",
              source_tracking: {
                material_id: "mat_2",
                material_title: "The Definitive Jaipur Guide: Itineraries, Landmarks & Architecture",
                material_type: "textbook",
                chunk_index: 1,
                page_number: 1,
                chapter: "Chapter 1: Rajputana Palaces",
                citation_label: "[Rajasthan Heritage Guide | Chapter 1, p. 1]",
                content_hash: "b765af389c891f7d23d8c114529bc2718e0018f67e1c93a89e17b8f2c",
                token_count: 60,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["architecture", "history", "heritage"],
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    ],
  },
  {
    id: "hist_3",
    title: "Glycolysis Net ATP & NADH Reaction",
    dateGroup: "Yesterday",
    timestamp: "Yesterday, 3:20 PM",
    sourcePreview: "[Slide 4 · Bioenergetics]",
    materialId: "mat_4",
    updatedAt: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "hist_3_m1",
        role: "user",
        content: "What is the net reaction and overall ATP/NADH yield of glycolysis?",
        timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000),
      },
      {
        id: "hist_3_m2",
        role: "assistant",
        content:
          "Glycolysis converts one 6-carbon glucose molecule into two 3-carbon pyruvate molecules through a sequence of 10 cytosolic enzymatic reactions [Slide 4].\n\n" +
          "### Net Chemical Reaction:\n" +
          "Glucose + 2 NAD⁺ + 2 ADP + 2 Pᵢ ➔ 2 Pyruvate + 2 NADH + 2 H⁺ + 2 ATP + 2 H₂O\n\n" +
          "### Energetic Breakdown:\n" +
          "1. **Investment Phase (Steps 1–5)**: Consumes 2 ATP to phosphorylate glucose into fructose-1,6-bisphosphate.\n" +
          "2. **Payoff Phase (Steps 6–10)**: Generates 4 ATP via substrate-level phosphorylation and 2 NADH molecules.\n" +
          "3. **Net Total**: **2 ATP** and **2 NADH** per glucose [Slide 4].",
        timestamp: new Date(Date.now() - 20.8 * 60 * 60 * 1000),
        citations: [
          {
            key: "[Slide 4]",
            unit: {
              id: "unit-bio-slide4",
              material_id: "mat_4",
              content:
                "Slide 4: Net Glycolysis Reaction: 1 Glucose + 2 NAD+ + 2 ADP + 2 Pi -> 2 Pyruvate + 2 NADH + 2 H+ + 2 ATP + 2 H2O. Net yield is 2 ATP and 2 NADH.",
              modality: "slide_content",
              source_tracking: {
                material_id: "mat_4",
                material_title: "Lecture 4 Slides: Bioenergetics & Net ATP Yield",
                material_type: "slide_deck",
                chunk_index: 4,
                slide_number: 4,
                slide_title: "Net Reaction of Glycolysis",
                citation_label: "[Lecture 4 Slides | Slide #4]",
                content_hash: "8c3ef943b1298457f9208a0d249f7e44a4746f33cfbb20786cf87d3a0e1c0702",
                token_count: 45,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["glycolysis", "bioenergetics"],
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    ],
  },
  {
    id: "hist_4",
    title: "Binary Search Trees & Complexity",
    dateGroup: "Yesterday",
    timestamp: "Yesterday, 1:10 PM",
    sourcePreview: "[CS201 · Slide 12]",
    materialId: "mat_5",
    updatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "hist_4_m1",
        role: "user",
        content: "What are the time complexities for search, insert, and delete in a Binary Search Tree (BST)?",
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
      },
      {
        id: "hist_4_m2",
        role: "assistant",
        content:
          "In a standard Binary Search Tree (BST), operation runtimes are directly governed by the tree height (h) [CS201 · Slide 12]:\n\n" +
          "- **Average Case (Balanced Tree, h = log n)**:\n" +
          "  - Search: O(log n)\n" +
          "  - Insertion: O(log n)\n" +
          "  - Deletion: O(log n)\n\n" +
          "- **Worst Case (Degenerate / Skewed Tree, h = n)**:\n" +
          "  - When keys are inserted in sorted order, the BST degenerates into a linear linked list. In this state, search, insert, and delete all degrade to O(n) [CS201 · Slide 12].\n\n" +
          "Self-balancing BST variants like AVL Trees and Red-Black Trees maintain balance through node rotations to ensure strict O(log n) worst-case performance.",
        timestamp: new Date(Date.now() - 22.8 * 60 * 60 * 1000),
        citations: [
          {
            key: "[CS201 · Slide 12]",
            unit: {
              id: "unit-cs201-s12",
              material_id: "mat_5",
              content:
                "Slide 12: BST Performance Analysis. Average case is O(log n) when tree is balanced. Worst case is O(n) when elements are inserted in ascending or descending sequence.",
              modality: "slide_content",
              source_tracking: {
                material_id: "mat_5",
                material_title: "CS201 Data Structures & Algorithms: Binary Search Trees",
                material_type: "slide_deck",
                chunk_index: 12,
                slide_number: 12,
                slide_title: "Binary Search Tree Time Complexity",
                citation_label: "[CS201 Lecture 7 | Slide #12]",
                content_hash: "c20178394018274619472619401739281729481729481729381729",
                token_count: 55,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["algorithms", "trees", "complexity"],
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    ],
  },
  {
    id: "hist_5",
    title: "Photosynthesis Light-Dependent Reactions",
    dateGroup: "Last 7 Days",
    timestamp: "Oct 1, 4:40 PM",
    sourcePreview: "[PDF p.88 · Biology]",
    materialId: "mat_1",
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "hist_5_m1",
        role: "user",
        content: "Where do the light-dependent reactions of photosynthesis occur and what are the main products?",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: "hist_5_m2",
        role: "assistant",
        content:
          "The light-dependent reactions of photosynthesis take place across the thylakoid membranes inside plant chloroplasts [PDF p.88].\n\n" +
          "### Sequence of Events:\n" +
          "1. **Light Harvesting**: Chlorophyll in Photosystem II (P680) and Photosystem I (P700) absorbs solar photons, elevating electrons to excited states.\n" +
          "2. **Photolysis of Water**: Water is split into protons, electrons, and molecular oxygen (2 H₂O ➔ O₂ + 4 H⁺ + 4 e⁻).\n" +
          "3. **Proton Gradient & ATP Synthesis**: An electron transport chain drives protons into the thylakoid lumen. ATP synthase harnesses this gradient to synthesize ATP (photophosphorylation) [PDF p.88].\n" +
          "4. **Final Products**: Generates **ATP** and **NADPH**, which subsequently fuel the Calvin cycle (light-independent reactions) in the stroma.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120000),
        citations: [
          {
            key: "[PDF p.88]",
            unit: {
              id: "unit-bio-p88",
              material_id: "mat_1",
              content:
                "Light-dependent reactions occur in the thylakoid membrane where light energy is converted into chemical energy in the form of ATP and NADPH, releasing O2 as a byproduct.",
              modality: "text",
              source_tracking: {
                material_id: "mat_1",
                material_title: "Principles of Biology (11th Ed)",
                material_type: "textbook",
                chunk_index: 8,
                page_number: 88,
                chapter: "Chapter 8: Photosynthetic Pathways",
                citation_label: "[Principles of Biology | Chapter 8, p. 88]",
                content_hash: "d9817492817491729481729481729481729481729481729481729",
                token_count: 50,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["biology", "photosynthesis"],
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    ],
  },
  {
    id: "hist_6",
    title: "Laws of Thermodynamics & Equilibrium",
    dateGroup: "Last 7 Days",
    timestamp: "Sep 29, 11:15 AM",
    sourcePreview: "[Lecture Video 12:30]",
    materialId: "mat_3",
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "hist_6_m1",
        role: "user",
        content: "How does the second law of thermodynamics apply to living organisms and chemical equilibrium?",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "hist_6_m2",
        role: "assistant",
        content:
          "The Second Law of Thermodynamics dictates that any spontaneous process increases the overall entropy of the universe [Lecture Video 12:30].\n\n" +
          "### Biological Application:\n" +
          "- **Open Systems**: Living organisms maintain low internal entropy by being thermodynamically open systems. They take in free energy from nutrients or sunlight and export heat and waste into their surroundings [Lecture Video 12:30].\n" +
          "- **Gibbs Free Energy**: Spontaneity is governed by ΔG = ΔH - TΔS. A negative ΔG indicates an exergonic reaction that can perform work.\n" +
          "- **Dynamic Equilibrium vs. Life**: In an isolated system at chemical equilibrium, ΔG = 0 and no work can be done. Living cells continuously manipulate reactant and product concentrations to prevent reaching dead chemical equilibrium.",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 150000),
        citations: [
          {
            key: "[Lecture Video 12:30]",
            unit: {
              id: "unit-thermo-vid",
              material_id: "mat_3",
              content:
                "Lecture recording segment 12:30: Discussion on open systems thermodynamics and why biological organisms must continually export entropy to sustain metabolic non-equilibrium.",
              modality: "speech_transcript",
              source_tracking: {
                material_id: "mat_3",
                material_title: "Welcome Lecture: Introduction to Bioenergetics",
                material_type: "lecture_video",
                chunk_index: 3,
                start_time_seconds: 750,
                end_time_seconds: 825,
                start_timestamp: "12:30",
                end_timestamp: "13:45",
                citation_label: "[Bioenergetics Video | 12:30 - 13:45]",
                content_hash: "e10293847561029384756102938475610293847561029384756",
                token_count: 52,
                confidence_score: 1.0,
                is_speaker_notes: false,
              },
              tags: ["physics", "thermodynamics", "entropy"],
              created_at: new Date().toISOString(),
            },
          },
        ],
      },
    ],
  },
];

const legacyMaterialMap: Record<string, string> = {
  "demo-mat": "mat_1",
  "demo-slide-mat": "mat_4",
  "mat-rajasthan-heritage": "mat_2",
  "mat-cs201": "mat_5",
  "mat-cs201-book": "mat_5",
  "mat-thermo-video": "mat_3",
};

const defaultSessionMap: Record<string, string> = {
  hist_1: "mat_1",
  hist_2: "mat_2",
  hist_3: "mat_4",
  hist_4: "mat_5",
  hist_5: "mat_1",
  hist_6: "mat_3",
};

/**
 * Hydrates or resolves a consistent materialId for a given chat session.
 * Prevents Focus Scope dropdown from displaying mismatched study materials.
 */
export function hydrateSessionMaterial(session: ChatSession): ChatSession {
  let matId = session.materialId;

  // Remap legacy IDs if present
  if (matId && legacyMaterialMap[matId]) {
    matId = legacyMaterialMap[matId];
  }

  // If no materialId or if empty/undefined:
  if (!matId || matId.trim() === "") {
    if (defaultSessionMap[session.id]) {
      matId = defaultSessionMap[session.id];
    } else {
      const title = (session.title || "").toLowerCase();
      if (title.includes("glycolysis") || title.includes("bioenergetic") || title.includes("atp yield")) {
        matId = "mat_4";
      } else if (title.includes("jaipur") || title.includes("hawa mahal") || title.includes("rajasthan") || title.includes("heritage")) {
        matId = "mat_2";
      } else if (title.includes("tree") || title.includes("bst") || title.includes("binary search") || title.includes("cs201")) {
        matId = "mat_5";
      } else if (title.includes("cellular") || title.includes("respiration") || title.includes("photosynthesis") || title.includes("biology")) {
        matId = "mat_1";
      } else if (title.includes("thermodynamics") || title.includes("equilibrium") || title.includes("entropy")) {
        matId = "mat_3";
      } else if (title.includes("rag") || title.includes("retrieval") || title.includes("vector")) {
        matId = "aa50916b-eedc-4306-a820-f96a7fce57f6";
      } else {
        matId = "all";
      }
    }
  }

  return { ...session, materialId: matId };
}

/**
 * Retrieve all chat sessions from localStorage, initializing default realistic sessions on first access.
 */
export function getStoredChatSessions(): ChatSession[] {
  if (typeof window === "undefined") {
    return DEFAULT_SESSIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SESSIONS));
      return DEFAULT_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let needsResave = false;
      const hydrated = parsed.map((s: ChatSession) => {
        const h = hydrateSessionMaterial(s);
        if (h.materialId !== s.materialId) {
          needsResave = true;
        }
        return h;
      });
      if (needsResave) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
        } catch (_) {}
      }
      return hydrated;
    }
    // If empty array was stored, populate defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SESSIONS));
    return DEFAULT_SESSIONS;
  } catch (err) {
    console.error("Failed to read chat sessions from localStorage:", err);
    return DEFAULT_SESSIONS;
  }
}

/**
 * Find a specific session by ID.
 */
export function getChatSessionById(id: string): ChatSession | undefined {
  const sessions = getStoredChatSessions();
  const found = sessions.find((s) => s.id === id);
  return found ? hydrateSessionMaterial(found) : undefined;
}

/**
 * Save or update a session in storage and broadcast update event.
 */
export function saveChatSession(session: ChatSession): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredChatSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    let updated: ChatSession[];
    const sessionToSave = hydrateSessionMaterial(session);
    if (existingIndex >= 0) {
      updated = [...sessions];
      updated[existingIndex] = { ...sessionToSave, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...sessionToSave, updatedAt: new Date().toISOString() }, ...sessions];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: { updatedSessionId: session.id } }));
  } catch (err) {
    console.error("Failed saving chat session to localStorage:", err);
  }
}

/**
 * Delete a session by ID and broadcast update event.
 */
export function deleteChatSession(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredChatSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: { deletedSessionId: id } }));
  } catch (err) {
    console.error("Failed deleting chat session from localStorage:", err);
  }
}

/**
 * Creates a brand new empty session.
 */
export function createNewChatSession(
  initialGreeting?: ChatMessage,
  materialId: string = "all"
): ChatSession {
  const newId = `session_${Date.now()}`;
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const newSession: ChatSession = {
    id: newId,
    title: "New AI Dialogue",
    dateGroup: "Today",
    timestamp: timeString,
    sourcePreview: materialId && materialId !== "all" ? `[Scope: ${materialId}]` : "[All Study Materials]",
    materialId: materialId || "all",
    messages: initialGreeting ? [initialGreeting] : [],
    updatedAt: now.toISOString(),
  };

  saveChatSession(newSession);
  return newSession;
}
