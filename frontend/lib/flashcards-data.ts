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
    question: "What is the marks and time limit for Class 11 Biology theory?",
    answer: "70 marks and 3 hours (180 minutes).",
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
    question: "Which unit carries the highest marks in Class 11 Biology?",
    answer: "Human Physiology, with 18 marks out of 70.",
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
    question: "What is the net ATP and NADH made in glycolysis?",
    answer: "Net 2 ATP and 2 NADH per glucose molecule.",
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
    question: "Where is ATP Synthase located in cells?",
    answer: "In the inner mitochondrial membrane, powered by a proton gradient.",
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
    question: "Does chromosome count change during S-phase?",
    answer: "No, DNA doubles but chromosome count remains 2n.",
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
    question: "Who proposed the Fluid Mosaic Model of cell membranes?",
    answer: "Singer and Nicolson in 1972.",
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
    question: "In which meiotic stage does crossing over happen?",
    answer: "Pachytene stage of Prophase I in meiosis.",
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
    question: "Why do C4 plants like maize avoid photorespiration?",
    answer: "Kranz anatomy concentrates CO2 so RuBisCO binds carbon instead of oxygen.",
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
    answer: "Vmax stays unchanged, while apparent Km increases.",
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
    question: "What helps mammalian kidneys concentrate urine?",
    answer: "The counter-current mechanism in Henle's loop and vasa recta.",
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
    question: "What is Retrieval-Augmented Generation (RAG)?",
    answer: "Giving external documents to an AI model to stop hallucinations.",
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
    question: "What is an embedding vector?",
    answer: "A list of numbers capturing the meaning of text in multi-dimensional space.",
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
    question: "What metric is most used to compare vectors?",
    answer: "Cosine similarity, measuring the angle between two vectors.",
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
    question: "What is an ideal chunk size for RAG documents?",
    answer: "300 to 500 tokens with a 50-token overlap to maintain context.",
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
    question: "How fast is HNSW vector search?",
    answer: "Fast logarithmic O(log N) search using multi-layer graph skip lists.",
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
    question: "Why use a Cross-Encoder reranker after vector search?",
    answer: "Vector search finds top results fast; the reranker scores the top-5 accurately.",
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
    answer: "Parametric is inside the AI weights; non-parametric is in the external database.",
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
    question: "What is the 'Lost in the Middle' problem in LLMs?",
    answer: "Models remember facts at the start and end of prompts better than the middle.",
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
    question: "How does HyDE improve search results?",
    answer: "The AI creates a draft answer first, then uses its embedding to find real docs.",
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
    question: "What are the 3 core evaluation metrics in RAGAS?",
    answer: "Faithfulness, Answer Relevance, and Context Recall.",
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
    question: "What is the rule of a Binary Search Tree (BST)?",
    answer: "Left keys are smaller than root; right keys are larger.",
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
    question: "What is worst-case lookup time in an unbalanced BST?",
    answer: "O(N) linear time, when elements are inserted in already sorted order.",
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
    question: "What is the allowed balance factor in an AVL Tree?",
    answer: "Must strictly be -1, 0, or +1 at every node.",
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
    answer: "A single Left Rotation.",
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
    question: "What is the lookup time in a balanced Red-Black tree?",
    answer: "Guaranteed O(log N) for lookups, insertions, and deletions.",
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
    question: "Why do databases use B-Trees instead of BSTs for disk storage?",
    answer: "B-Trees hold many keys per node, minimizing slow disk reads.",
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
    question: "What is the key property of a Min-Heap?",
    answer: "Parent node is always smaller than its children; smallest item is at root.",
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
    question: "What color is the root node in a Red-Black Tree?",
    answer: "The root node is always black.",
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
    question: "What rotation fixes a Left-Right (LR) imbalance?",
    answer: "Left Rotation on the child, followed by Right Rotation on the parent.",
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
    question: "What is the amortized cost to append to a dynamic array?",
    answer: "O(1) constant time on average per append.",
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
    question: "How does Hawa Mahal cool incoming desert air naturally?",
    answer: "953 carved windows act as micro-Venturi nozzles, accelerating air breezes.",
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
    question: "What physical law explains the Venturi cooling effect?",
    answer: "Bernoulli's Principle: Constricted openings increase air speed and lower pressure.",
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
    question: "By how much does Hawa Mahal lower incoming air temperature?",
    answer: "It cools air by 5 to 8 degrees Celsius naturally with zero electricity.",
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
    question: "What thermal role do terracotta jali lattice screens play?",
    answer: "They block solar glare while letting accelerated cool breezes flow through.",
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
    question: "What acoustic feature exists in Amer Fort's Sheesh Mahal?",
    answer: "Curved marble arches reflect whispers clearly across the chamber.",
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
    question: "How accurate is the giant sundial at Jantar Mantar?",
    answer: "It measures local solar time with an accuracy of 2 seconds.",
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
    question: "What urban planning layout was used for Jaipur in 1727?",
    answer: "A nine-square mandala grid plan with wide 30-meter main roads.",
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
    question: "Why does air cool down when expanding through small openings?",
    answer: "Expanding air does work using its internal heat energy, dropping temperature.",
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
    question: "How do stepwells keep water and air cool in desert heat?",
    answer: "Deep subterranean stone walls trap cool air and protect against evaporation.",
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
    question: "How do modern zero-energy buildings use Hawa Mahal principles?",
    answer: "They use terracotta screen facades to cut air conditioning loads by up to 40%.",
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
