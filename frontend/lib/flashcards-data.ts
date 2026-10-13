/**
 * AdaptFlow Flashcards Library -- NotebookLM Architecture
 * High-yield active recall decks limited to 10 bite-sized cards per topic.
 * Concise answers engineered for rapid comprehension and knowledge level diagnostics.
 */

export type KnowledgeLevel = "Level 1 · Foundational" | "Level 2 · Intermediate" | "Level 3 · Advanced";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  keyTakeaway?: string;
  citation: {
    label: string;
    sourceTitle: string;
    pageOrTime?: string;
    materialId?: string;
  };
  deckId: string;
  level: KnowledgeLevel;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  promptDescription: string;
  sources: Array<{
    title: string;
    type: "textbook" | "syllabus" | "lecture_video" | "slide_deck";
    reference: string;
  }>;
  cards: Flashcard[];
}

// -----------------------------------------------------------------------------
// 1. BIOLOGY FLASHCARDS (Exactly 10 concise cards)
// -----------------------------------------------------------------------------
export const BIOLOGY_FLASHCARDS: Flashcard[] = [
  {
    id: "bio_1",
    deckId: "biology",
    level: "Level 1 · Foundational",
    question: "What is the total mark weightage and exam duration for the CBSE Class 11 Biology theory paper?",
    answer: "70 marks theory with a 3-hour duration (180 mins). The remaining 30 marks are internal practicals.",
    keyTakeaway: "Passing threshold is 33% independently in both theory and practicals.",
    citation: {
      label: "[CBSE Blueprint | p. 2]",
      sourceTitle: "CBSE Class 11 Biology Theory Blueprint",
      pageOrTime: "Section A, p. 2",
    },
  },
  {
    id: "bio_2",
    deckId: "biology",
    level: "Level 1 · Foundational",
    question: "Which unit carries the highest mark weightage in Class 11 Biology?",
    answer: "Human Physiology with 18 marks out of 70 (over 25% of the total theory examination score).",
    keyTakeaway: "Focus heavily on renal counter-current and cardiac conduction dynamics.",
    citation: {
      label: "[CBSE Blueprint | p. 3]",
      sourceTitle: "CBSE Class 11 Biology Curriculum Guide",
      pageOrTime: "Table 1.1, p. 3",
    },
  },
  {
    id: "bio_3",
    deckId: "biology",
    level: "Level 1 · Foundational",
    question: "What is the net ATP and NADH yield from one glucose molecule in glycolysis?",
    answer: "Net 2 ATP and 2 NADH molecules produced in the cell cytosol (4 produced, 2 invested).",
    keyTakeaway: "Net Reaction: Glucose + 2 NAD+ + 2 ADP -> 2 Pyruvate + 2 NADH + 2 ATP",
    citation: {
      label: "[Principles of Biology | p. 42]",
      sourceTitle: "Principles of Biology (11th Ed)",
      pageOrTime: "Chapter 4, p. 42",
      materialId: "mat_1",
    },
  },
  {
    id: "bio_4",
    deckId: "biology",
    level: "Level 2 · Intermediate",
    question: "Where is ATP Synthase located in cells, and what directly drives it?",
    answer: "In the inner mitochondrial membrane, driven by the proton (H+) electrochemical gradient across cristae.",
    keyTakeaway: "Rotary motor mechanism: protons flow through F0 to rotate the F1 catalytic head.",
    citation: {
      label: "[Principles of Biology | p. 48]",
      sourceTitle: "Principles of Biology (11th Ed)",
      pageOrTime: "Chapter 4, p. 48",
      materialId: "mat_1",
    },
  },
  {
    id: "bio_5",
    deckId: "biology",
    level: "Level 2 · Intermediate",
    question: "Does chromosome number change during S-phase of the cell cycle?",
    answer: "No. DNA amount doubles (2C to 4C), but chromosome count stays 2n because chromatids stay joined at the centromere.",
    keyTakeaway: "DNA quantity doubles; ploidy/chromosome count remains strictly constant.",
    citation: {
      label: "[Cell Cycle Lecture | 12:40]",
      sourceTitle: "Cell Structure & Function Lecture Series",
      pageOrTime: "Video Timestamp 12:40",
    },
  },
  {
    id: "bio_6",
    deckId: "biology",
    level: "Level 2 · Intermediate",
    question: "Who proposed the Fluid Mosaic Model of cell membranes, and in which year?",
    answer: "S.J. Singer and Garth Nicolson in 1972, describing a quasi-fluid lipid bilayer with moving proteins.",
    keyTakeaway: "Quasi-fluid structure enables dynamic endocytosis, exocytosis, and cell division.",
    citation: {
      label: "[Principles of Biology | p. 38]",
      sourceTitle: "Principles of Biology (11th Ed)",
      pageOrTime: "Chapter 3, p. 38",
      materialId: "mat_1",
    },
  },
  {
    id: "bio_7",
    deckId: "biology",
    level: "Level 2 · Intermediate",
    question: "During which meiotic sub-stage does genetic crossing over take place?",
    answer: "Pachytene stage of Prophase I, catalyzed by the recombinase enzyme complex at recombination nodules.",
    keyTakeaway: "Mnemonic: Leptotene -> Zygotene -> Pachytene -> Diplotene -> Diakinesis.",
    citation: {
      label: "[Cell Cycle Lecture | 18:20]",
      sourceTitle: "Cell Structure & Function Lecture Series",
      pageOrTime: "Video Timestamp 18:20",
    },
  },
  {
    id: "bio_8",
    deckId: "biology",
    level: "Level 3 · Advanced",
    question: "Why do C4 plants (like maize and sugarcane) avoid photorespiration?",
    answer: "Kranz anatomy pumps concentrated CO2 into bundle sheath cells, preventing oxygen from binding to RuBisCO.",
    keyTakeaway: "PEP carboxylase in mesophyll fixes CO2 initially with zero oxygenase activity.",
    citation: {
      label: "[Plant Physiology | Slide 18]",
      sourceTitle: "Plant Physiology & Photosynthesis Master Deck",
      pageOrTime: "Slide #18",
    },
  },
  {
    id: "bio_9",
    deckId: "biology",
    level: "Level 3 · Advanced",
    question: "How does competitive inhibition alter enzyme Vmax and Km?",
    answer: "Vmax remains unchanged (excess substrate overcomes it), while apparent Km increases (lower substrate affinity).",
    keyTakeaway: "Inhibitor binds active site reversibly; Lineweaver-Burk plot intercepts y-axis at same 1/Vmax.",
    citation: {
      label: "[Biomolecules Lab Guide | p. 98]",
      sourceTitle: "Biomolecules & Enzyme Kinetics Lab Guide",
      pageOrTime: "Section 4.2, p. 98",
    },
  },
  {
    id: "bio_10",
    deckId: "biology",
    level: "Level 3 · Advanced",
    question: "What generates the renal medullary osmotic gradient (300 to 1200 mOsm/L)?",
    answer: "The counter-current multiplier between Henle's loop and vasa recta capillaries, concentrating urine.",
    keyTakeaway: "Descending limb loses water; ascending limb actively extrudes NaCl.",
    citation: {
      label: "[Human Physiology | p. 294]",
      sourceTitle: "Human Physiology: Renal & Cardiovascular Dynamics",
      pageOrTime: "Chapter 19, p. 294",
    },
  },
];

// -----------------------------------------------------------------------------
// 2. AI & RAG ARCHITECTURE FLASHCARDS (Exactly 10 concise cards)
// -----------------------------------------------------------------------------
export const AI_RAG_FLASHCARDS: Flashcard[] = [
  {
    id: "rag_1",
    deckId: "rag",
    level: "Level 1 · Foundational",
    question: "What is Retrieval-Augmented Generation (RAG) in simple terms?",
    answer: "Injecting relevant external document chunks into the LLM prompt to ground answers and stop hallucinations.",
    keyTakeaway: "Combines frozen neural weights with an external, up-to-date vector database.",
    citation: {
      label: "[RAG Explained | 02:15]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Video Timestamp 02:15",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_2",
    deckId: "rag",
    level: "Level 1 · Foundational",
    question: "What is an embedding vector in semantic search?",
    answer: "A dense array of floating-point numbers (e.g. 1536 dimensions) capturing conceptual text meaning in space.",
    keyTakeaway: "Semantically similar phrases map to nearby points with high cosine similarity.",
    citation: {
      label: "[RAG Explained | 04:30]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Video Timestamp 04:30",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_3",
    deckId: "rag",
    level: "Level 1 · Foundational",
    question: "What similarity metric is standard for normalized dense vectors?",
    answer: "Cosine similarity: measures the angle cosine between vectors, ranging from -1 (opposite) to +1 (identical).",
    keyTakeaway: "Formula: cos(theta) = (A · B) / (||A|| ||B||). Dot product equals cosine for normalized vectors.",
    citation: {
      label: "[Vector Indexes | Slide 4]",
      sourceTitle: "CS201 Lecture 7: Vector Indexes & Graph Search",
      pageOrTime: "Slide #4",
    },
  },
  {
    id: "rag_4",
    deckId: "rag",
    level: "Level 2 · Intermediate",
    question: "What is the typical optimal chunk size for technical documents?",
    answer: "300 to 500 tokens with a 50-token sliding overlap to avoid splitting sentences across boundaries.",
    keyTakeaway: "Too small (<150) loses context; too large (>800) dilutes embedding precision.",
    citation: {
      label: "[RAG Ingestion Guide | p. 12]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Section 2, p. 12",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_5",
    deckId: "rag",
    level: "Level 2 · Intermediate",
    question: "What search complexity does HNSW graph indexing achieve?",
    answer: "Logarithmic O(log N) search time using multi-layer skip graphs instead of brute-force O(N) distance scans.",
    keyTakeaway: "Enables sub-millisecond similarity lookups across millions of vectors in pgvector.",
    citation: {
      label: "[pgvector Docs | p. 8]",
      sourceTitle: "CS201 Lecture 7: Vector Indexes & Graph Search",
      pageOrTime: "Section 3.4, p. 8",
    },
  },
  {
    id: "rag_6",
    deckId: "rag",
    level: "Level 2 · Intermediate",
    question: "Why use a Cross-Encoder reranker after initial Bi-Encoder vector retrieval?",
    answer: "Bi-encoders retrieve top-100 fast; Cross-encoders run full joint query-chunk attention to score the top-5 precisely.",
    keyTakeaway: "Two-stage synergy: High recall at stage 1 + High precision at stage 2.",
    citation: {
      label: "[RAG Architecture | 08:30]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Video Timestamp 08:30",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_7",
    deckId: "rag",
    level: "Level 2 · Intermediate",
    question: "What is the difference between parametric and non-parametric memory?",
    answer: "Parametric memory is frozen inside neural network weights; non-parametric memory is the external searchable database.",
    keyTakeaway: "Non-parametric memory updates instantly without model retraining.",
    citation: {
      label: "[RAG Explained | 03:00]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Video Timestamp 03:00",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_8",
    deckId: "rag",
    level: "Level 3 · Advanced",
    question: "What is the 'Lost in the Middle' phenomenon in LLM context windows?",
    answer: "LLMs recall facts placed at the extreme start or end of a prompt significantly better than facts in the middle.",
    keyTakeaway: "Mitigation: Place the most critical retrieved evidence at the very top or bottom of the context.",
    citation: {
      label: "[Stanford Research | 2023]",
      sourceTitle: "Stanford NLP: Lost in the Middle Phenomenon",
      pageOrTime: "ArXiv:2307.03172",
    },
  },
  {
    id: "rag_9",
    deckId: "rag",
    level: "Level 3 · Advanced",
    question: "How does HyDE (Hypothetical Document Embeddings) improve retrieval quality?",
    answer: "The LLM writes a hypothetical response first, and its embedding searches for real documents with matching semantic patterns.",
    keyTakeaway: "Bridges the semantic gap between short user queries and rich explanatory documents.",
    citation: {
      label: "[Advanced RAG | p. 19]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Section 4.1, p. 19",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_10",
    deckId: "rag",
    level: "Level 3 · Advanced",
    question: "What are the 3 core evaluation metrics in the RAGAS framework?",
    answer: "Faithfulness (grounded in context), Answer Relevance (directly answers query), and Context Recall (retrieval completeness).",
    keyTakeaway: "Automated reference-free LLM-as-a-judge benchmarking for production RAG.",
    citation: {
      label: "[RAGAS Benchmark | 2024]",
      sourceTitle: "RAGAS Evaluation Framework Documentation",
      pageOrTime: "Metrics Overview, p. 4",
    },
  },
];

// -----------------------------------------------------------------------------
// 3. COMPUTER SCIENCE & DATA STRUCTURES FLASHCARDS (Exactly 10 concise cards)
// -----------------------------------------------------------------------------
export const CS_FLASHCARDS: Flashcard[] = [
  {
    id: "cs_1",
    deckId: "cs",
    level: "Level 1 · Foundational",
    question: "What is the defining invariant of a Binary Search Tree (BST)?",
    answer: "Every node in the left subtree has a key smaller than the root; every right subtree node has a key larger.",
    keyTakeaway: "In-order traversal of a valid BST always yields sorted ascending values.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 3]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #3",
    },
  },
  {
    id: "cs_2",
    deckId: "cs",
    level: "Level 1 · Foundational",
    question: "What is the worst-case lookup time in an unbalanced BST, and when does it happen?",
    answer: "O(N) linear time, occurring when elements are inserted in already sorted order, degrading the tree into a linked list.",
    keyTakeaway: "Self-balancing trees (AVL, Red-Black) prevent this degradation.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 5]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #5",
    },
  },
  {
    id: "cs_3",
    deckId: "cs",
    level: "Level 1 · Foundational",
    question: "What is the balance factor in an AVL Tree, and what is its allowed range?",
    answer: "Balance Factor = height(left) - height(right). In AVL trees, it must strictly be -1, 0, or +1 at every node.",
    keyTakeaway: "If any node's balance factor reaches +/-2, immediate rotation is triggered.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 8]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #8",
    },
  },
  {
    id: "cs_4",
    deckId: "cs",
    level: "Level 2 · Intermediate",
    question: "What single rotation fixes a Right-Right (RR) imbalance in an AVL tree?",
    answer: "A single Left Rotation: elevates the right child to root and demotes the original root to left child.",
    keyTakeaway: "Rotations take O(1) constant time, adjusting only 3 node pointers.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 11]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #11",
    },
  },
  {
    id: "cs_5",
    deckId: "cs",
    level: "Level 2 · Intermediate",
    question: "What is the time complexity of lookup, insertion, and deletion in a balanced Red-Black tree?",
    answer: "Guaranteed O(log N) for all three operations, with tree height bounded by 2 * log2(N + 1).",
    keyTakeaway: "Used in Linux kernel virtual memory management (rbtree) and C++ std::map.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 15]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #15",
    },
  },
  {
    id: "cs_6",
    deckId: "cs",
    level: "Level 2 · Intermediate",
    question: "Why do relational database engines use B-Trees instead of Binary Search Trees for disk storage?",
    answer: "B-Trees have massive branching factors (hundreds of keys per node), minimizing expensive disk I/O seek operations.",
    keyTakeaway: "Broad, flat tree structure fits filesystem page sizes (typically 4KB to 16KB).",
    citation: {
      label: "[CS201 Lecture 7 | Slide 20]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #20",
    },
  },
  {
    id: "cs_7",
    deckId: "cs",
    level: "Level 2 · Intermediate",
    question: "What is the heap-order property of a Min-Heap?",
    answer: "Every parent node's key is less than or equal to the keys of its children; the minimum element is always at the root.",
    keyTakeaway: "Supports O(1) peek minimum, O(log N) insertion and extract-min.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 22]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #22",
    },
  },
  {
    id: "cs_8",
    deckId: "cs",
    level: "Level 3 · Advanced",
    question: "What are the 5 invariant rules of a valid Red-Black Tree?",
    answer: "1. Nodes are red/black, 2. Root is black, 3. Nil leaves are black, 4. Red nodes have black children, 5. Equal black-height paths.",
    keyTakeaway: "Rule 4 and 5 guarantee no path is more than twice as long as any other.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 24]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #24",
    },
  },
  {
    id: "cs_9",
    deckId: "cs",
    level: "Level 3 · Advanced",
    question: "What compound rotation fixes a Left-Right (LR) imbalance?",
    answer: "A double rotation: first a Left Rotation on the left child, followed by a Right Rotation on the parent node.",
    keyTakeaway: "Straightens the inner zig-zag bend before elevating the middle node to root.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 13]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #13",
    },
  },
  {
    id: "cs_10",
    deckId: "cs",
    level: "Level 3 · Advanced",
    question: "How does amortized analysis prove dynamic array doubling takes O(1) per append?",
    answer: "Allocating 2N capacity takes O(N) work once every N appends, spreading the cost so each insertion averages O(1) amortized time.",
    keyTakeaway: "Sum of geometric resizing costs across N elements is <= 2N operations.",
    citation: {
      label: "[CS201 Lecture 7 | Slide 27]",
      sourceTitle: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
      pageOrTime: "Slide #27",
    },
  },
];

// -----------------------------------------------------------------------------
// 4. JAIPUR ARCHITECTURE & PHYSICS FLASHCARDS (Exactly 10 concise cards)
// -----------------------------------------------------------------------------
export const JAIPUR_FLASHCARDS: Flashcard[] = [
  {
    id: "jai_1",
    deckId: "jaipur",
    level: "Level 1 · Foundational",
    question: "What architectural feature gives Hawa Mahal its natural cooling capability?",
    answer: "953 intricately carved jharokha casements that act as micro-Venturi nozzles, cooling desert wind passively.",
    keyTakeaway: "Built in 1799 by Maharaja Sawai Pratap Singh for royal Rajput ladies.",
    citation: {
      label: "[Jaipur Guide | p. 4]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 2, p. 4",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_2",
    deckId: "jaipur",
    level: "Level 1 · Foundational",
    question: "What physical fluid dynamics law explains the Venturi cooling effect?",
    answer: "Bernoulli's Principle: When fluid passes through a constricted opening, velocity increases and pressure drops.",
    keyTakeaway: "Continuity: A1 * V1 = A2 * V2. Constricted area accelerates airflow.",
    citation: {
      label: "[Jaipur Guide | p. 5]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 2, p. 5",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_3",
    deckId: "jaipur",
    level: "Level 1 · Foundational",
    question: "By how many degrees Celsius does Hawa Mahal lower incoming ambient air?",
    answer: "Passive Venturi airflow and evaporative courtyards cool incoming air by 5 to 8 degrees Celsius naturally.",
    keyTakeaway: "Zero electricity required: pure thermodynamic passive architectural design.",
    citation: {
      label: "[Jaipur Guide | p. 6]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 2, p. 6",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_4",
    deckId: "jaipur",
    level: "Level 2 · Intermediate",
    question: "What thermal role do the terracotta jali lattice screens play in hot arid climates?",
    answer: "They block direct solar radiation glare while allowing accelerated breeze convection and night-time radiational cooling.",
    keyTakeaway: "High thermal mass terracotta absorbs day heat and releases it slowly at desert night.",
    citation: {
      label: "[Jaipur Guide | p. 7]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 3, p. 7",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_5",
    deckId: "jaipur",
    level: "Level 2 · Intermediate",
    question: "What acoustic engineering feature exists in Amer Fort's Sheesh Mahal?",
    answer: "Concave marble arches reflect whispering sound waves across chambers while mirrored glass deflects lantern heat.",
    keyTakeaway: "Belgian convex mirror glass creates shimmering illumination from a single candle.",
    citation: {
      label: "[Jaipur Guide | p. 11]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 4, p. 11",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_6",
    deckId: "jaipur",
    level: "Level 2 · Intermediate",
    question: "What is the time accuracy of the Vrihat Samrat Yantra sundial at Jantar Mantar?",
    answer: "It measures local solar time with an accuracy of 2 seconds, utilizing a 27-meter tall gnomon casting a moving shadow.",
    keyTakeaway: "Shadow moves at approximately 1 millimeter per second along the curved marble scale.",
    citation: {
      label: "[Jaipur Guide | p. 14]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 5, p. 14",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_7",
    deckId: "jaipur",
    level: "Level 2 · Intermediate",
    question: "What geometric urban planning model was used by Vidyadhar Bhattacharya for Jaipur in 1727?",
    answer: "The Vastu Shastra Prastara grid plan: a nine-square mandala (Navagraha) with broad 30-meter main axial avenues.",
    keyTakeaway: "First planned city in medieval India, designed for defense, trade, and solar ventilation.",
    citation: {
      label: "[Jaipur Guide | p. 2]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 1, p. 2",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_8",
    deckId: "jaipur",
    level: "Level 3 · Advanced",
    question: "Why does the adiabatic expansion of compressed airflow produce a temperature drop?",
    answer: "As gas rapidly expands through the micro-orifice without external heat input, it does work, consuming internal kinetic energy.",
    keyTakeaway: "Thermodynamic principle: Q = 0, delta-U = -W, leading directly to lower gas temperature.",
    citation: {
      label: "[Jaipur Guide | p. 6]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Thermodynamic Notes, p. 6",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_9",
    deckId: "jaipur",
    level: "Level 3 · Advanced",
    question: "How do stepwells like Panna Meena Kund achieve microclimate thermal buffering?",
    answer: "Subterranean depth, high stone thermal inertia, and water evaporation keep lower step levels 10°C cooler than the ground surface.",
    keyTakeaway: "Symmetrical criss-cross staircase geometry facilitates water access as water tables shift seasonally.",
    citation: {
      label: "[Jaipur Guide | p. 18]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Section 6, p. 18",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
  {
    id: "jai_10",
    deckId: "jaipur",
    level: "Level 3 · Advanced",
    question: "How do modern zero-energy green buildings replicate Hawa Mahal's facade principles?",
    answer: "Using parameterized parametric terracotta screens (evaporative facades) to cut air conditioning loads by 35-40% in arid zones.",
    keyTakeaway: "Integrates computational fluid dynamics (CFD) with ancient vernacular passive shading.",
    citation: {
      label: "[Jaipur Guide | p. 22]",
      sourceTitle: "The Definitive Jaipur Guide: Itineraries & Architecture",
      pageOrTime: "Sustainable Architecture, p. 22",
      materialId: "c89b6ec3-b239-4f2d-a452-d56ea1b5363b",
    },
  },
];

// -----------------------------------------------------------------------------
// DECK CATALOG (Exactly 10 cards per deck)
// -----------------------------------------------------------------------------
export const ALL_DECKS: FlashcardDeck[] = [
  {
    id: "biology",
    title: "Biology Flashcards",
    subject: "Biology & CBSE Class 11",
    promptDescription:
      "Generate 10 concise, high-yield active recall flashcards covering foundational to advanced concepts in CBSE Class 11 Biology, cell division, enzymes, and bioenergetics.",
    sources: [
      {
        title: "CBSE Class 11 Biology Theory Blueprint & Curriculum Guide",
        type: "syllabus",
        reference: "Official Evaluation Blueprint, p. 1-8",
      },
      {
        title: "Principles of Biology (11th Ed) Textbook",
        type: "textbook",
        reference: "Chapters 1-5: Cell Structure & Cellular Respiration, p. 38-72",
      },
      {
        title: "Unit 3: Cell Structure & Function Lecture Series",
        type: "lecture_video",
        reference: "Lecture 3: Mitosis, Meiosis & Cell Cycle Checkpoints [12:40]",
      },
    ],
    cards: BIOLOGY_FLASHCARDS,
  },
  {
    id: "rag",
    title: "AI & RAG Architecture Flashcards",
    subject: "Computer Science / AI",
    promptDescription:
      "Generate 10 concise, high-impact flashcards on Retrieval-Augmented Generation (RAG), vector databases (pgvector, HNSW), embeddings, and reranking pipelines.",
    sources: [
      {
        title: "Vidssave.Com RAG Explained [Video Lecture]",
        type: "lecture_video",
        reference: "Timestamps 00:00 - 18:30",
      },
      {
        title: "CS201 Lecture 7: Vector Indexes & Graph Search",
        type: "slide_deck",
        reference: "Slide Deck #1-28",
      },
    ],
    cards: AI_RAG_FLASHCARDS,
  },
  {
    id: "cs",
    title: "Data Structures & Trees Flashcards",
    subject: "Computer Science",
    promptDescription:
      "Generate 10 concise flashcards on Binary Search Trees, AVL balance factors, Red-Black tree invariants, and logarithmic complexity proofs.",
    sources: [
      {
        title: "CS201 Lecture 7: Binary Search Trees & Vector Indexes",
        type: "slide_deck",
        reference: "Slides #1-30",
      },
    ],
    cards: CS_FLASHCARDS,
  },
  {
    id: "jaipur",
    title: "Jaipur Architecture & Physics Flashcards",
    subject: "Heritage & Thermal Physics",
    promptDescription:
      "Generate 10 concise flashcards on Hawa Mahal Venturi cooling thermodynamics, Bernoulli airflow dynamics, and sustainable architectural design.",
    sources: [
      {
        title: "The Definitive Jaipur Guide: Itineraries & Architecture",
        type: "textbook",
        reference: "Chapters 1-6: Venturi Thermodynamics, p. 1-24",
      },
    ],
    cards: JAIPUR_FLASHCARDS,
  },
];
