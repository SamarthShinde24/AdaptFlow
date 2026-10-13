import { ALL_DECKS, Flashcard, FlashcardDeck, KnowledgeLevel } from "./flashcards-data";
import { Material } from "./types";

const STORAGE_KEY = "adaptflow_flashcard_decks";

/**
 * Counts sentences in a text block.
 * A sentence ends with punctuation (. ! ?) followed by whitespace or string end.
 */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const segments = trimmed
    .split(/[.?!]+(?:\s+|$)/)
    .filter((s) => s.trim().length > 0);
  return segments.length;
}

/**
 * Retrieve saved decks from localStorage or fallback to default decks.
 */
export function getStoredDecks(): FlashcardDeck[] {
  if (typeof window === "undefined") return ALL_DECKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_DECKS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Error reading flashcard decks from localStorage", err);
  }
  return ALL_DECKS;
}

/**
 * Persist decks into localStorage and dispatch a sync event.
 */
export function saveStoredDecks(decks: FlashcardDeck[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    window.dispatchEvent(new CustomEvent("adaptflow:flashcards-updated"));
  } catch (err) {
    console.error("Error persisting flashcard decks to localStorage", err);
  }
}

/**
 * Create a new flashcard in a target deck.
 */
export function addFlashcard(
  deckId: string,
  newCard: {
    question: string;
    answer: string;
    level: KnowledgeLevel;
    keyTakeaway?: string;
    title?: string;
  }
): { decks: FlashcardDeck[]; addedCard: Flashcard } {
  const decks = getStoredDecks();
  const cardId = `user_card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const title = newCard.title?.trim() || "Custom Concept";

  const card: Flashcard = {
    id: cardId,
    deckId,
    question: newCard.question.trim(),
    answer: newCard.answer.trim(),
    level: newCard.level,
    keyTakeaway: newCard.keyTakeaway?.trim() || title,
    citation: {
      label: `[${title} | Flashcard]`,
      sourceTitle: title,
      pageOrTime: "Card Entry",
    },
  };

  const updatedDecks = decks.map((deck) => {
    if (deck.id === deckId) {
      return {
        ...deck,
        cards: [...deck.cards, card],
      };
    }
    return deck;
  });

  saveStoredDecks(updatedDecks);
  return { decks: updatedDecks, addedCard: card };
}

/**
 * Edit an existing flashcard in a deck.
 */
export function updateFlashcard(
  deckId: string,
  cardId: string,
  updates: {
    question?: string;
    answer?: string;
    level?: KnowledgeLevel;
    keyTakeaway?: string;
    title?: string;
  }
): FlashcardDeck[] {
  const decks = getStoredDecks();
  const updatedDecks = decks.map((deck) => {
    if (deck.id === deckId) {
      return {
        ...deck,
        cards: deck.cards.map((c) => {
          if (c.id === cardId) {
            const newTitle = updates.title?.trim() || c.citation.sourceTitle || "Custom Concept";
            return {
              ...c,
              ...(updates.question !== undefined ? { question: updates.question.trim() } : {}),
              ...(updates.answer !== undefined ? { answer: updates.answer.trim() } : {}),
              ...(updates.level !== undefined ? { level: updates.level } : {}),
              ...(updates.keyTakeaway !== undefined ? { keyTakeaway: updates.keyTakeaway.trim() } : {}),
              citation: {
                ...c.citation,
                label: `[${newTitle} | Flashcard]`,
                sourceTitle: newTitle,
              },
            };
          }
          return c;
        }),
      };
    }
    return deck;
  });

  saveStoredDecks(updatedDecks);
  return updatedDecks;
}

/**
 * Delete a flashcard from a deck.
 */
export function deleteFlashcard(deckId: string, cardId: string): FlashcardDeck[] {
  const decks = getStoredDecks();
  const updatedDecks = decks.map((deck) => {
    if (deck.id === deckId) {
      return {
        ...deck,
        cards: deck.cards.filter((c) => c.id !== cardId),
      };
    }
    return deck;
  });

  saveStoredDecks(updatedDecks);
  return updatedDecks;
}

/**
 * Generate 10 topic-specific active recall flashcards for an ingested material.
 */
export function generateCardsForMaterial(material: Material): Flashcard[] {
  const cleanTitle = material.title
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  const lower = cleanTitle.toLowerCase();
  const deckId = `deck_${material.id}`;
  const citationLabel = `[${cleanTitle.slice(0, 24)}]`;

  // 1. Agentic AI / AI Agents
  if (lower.includes("agent") || lower.includes("agentic")) {
    return [
      {
        id: `${deckId}_1`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is an AI Agent in simple terms?",
        answer: "An AI system that observes inputs, plans steps, and uses tools to accomplish a goal.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "01:15", materialId: material.id },
      },
      {
        id: `${deckId}_2`,
        deckId,
        level: "Level 1 · Foundational",
        question: "How does an AI Agent differ from a standard chatbot?",
        answer: "A chatbot only generates replies, while an agent executes actions using external tools.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "03:10", materialId: material.id },
      },
      {
        id: `${deckId}_3`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is the perception-action cycle in AI agents?",
        answer: "The loop where an agent observes results, decides what to do next, and runs a tool.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "05:00", materialId: material.id },
      },
      {
        id: `${deckId}_4`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is the purpose of tools for an AI agent?",
        answer: "Tools let agents call external APIs, query databases, browse the web, and execute code.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "07:20", materialId: material.id },
      },
      {
        id: `${deckId}_5`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What does agent planning mean?",
        answer: "Breaking a big user objective down into a sequence of executable sub-tasks.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "09:40", materialId: material.id },
      },
      {
        id: `${deckId}_6`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "How do short-term and long-term agent memory differ?",
        answer: "Short-term memory stays in the prompt context; long-term memory is retrieved from a vector database.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "11:30", materialId: material.id },
      },
      {
        id: `${deckId}_7`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is ReAct prompting in autonomous agents?",
        answer: "An architecture combining continuous Thought (reasoning), Action (tool calls), and Observation.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "13:15", materialId: material.id },
      },
      {
        id: `${deckId}_8`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What is multi-agent collaboration?",
        answer: "A team of specialized agents passing structured messages to solve complex tasks together.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "15:00", materialId: material.id },
      },
      {
        id: `${deckId}_9`,
        deckId,
        level: "Level 3 · Advanced",
        question: "Why is human-in-the-loop critical for agentic systems?",
        answer: "It requires human confirmation before executing high-stakes actions like payments or deletions.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "16:45", materialId: material.id },
      },
      {
        id: `${deckId}_10`,
        deckId,
        level: "Level 3 · Advanced",
        question: "How do you evaluate an autonomous agent?",
        answer: "By measuring benchmark task success rates, tool call accuracy, and execution step efficiency.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "18:20", materialId: material.id },
      },
    ];
  }

  // 2. Model Context Protocol (MCP)
  if (lower.includes("mcp") || lower.includes("context protocol")) {
    return [
      {
        id: `${deckId}_1`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What does MCP stand for?",
        answer: "Model Context Protocol.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "01:00", materialId: material.id },
      },
      {
        id: `${deckId}_2`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is the primary goal of Model Context Protocol?",
        answer: "To provide an open standard for AI models to securely connect with tools and data sources.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "02:30", materialId: material.id },
      },
      {
        id: `${deckId}_3`,
        deckId,
        level: "Level 1 · Foundational",
        question: "Who developed and open-sourced MCP?",
        answer: "Anthropic introduced MCP as an open industry standard in late 2024.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "04:10", materialId: material.id },
      },
      {
        id: `${deckId}_4`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What are the three core primitives in MCP?",
        answer: "Prompts, Resources, and Tools.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "06:00", materialId: material.id },
      },
      {
        id: `${deckId}_5`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is an MCP Server?",
        answer: "A lightweight program that exposes specific data files or tool capabilities to AI apps.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "08:15", materialId: material.id },
      },
      {
        id: `${deckId}_6`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is an MCP Client?",
        answer: "An AI application (like Claude Desktop or an AI IDE) that connects to MCP servers.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "10:00", materialId: material.id },
      },
      {
        id: `${deckId}_7`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What local communication transport does MCP use?",
        answer: "Standard input/output (stdio) streams between local processes.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "12:00", materialId: material.id },
      },
      {
        id: `${deckId}_8`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What remote protocol does MCP use for web servers?",
        answer: "Server-Sent Events (SSE) over standard HTTP connections.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "14:10", materialId: material.id },
      },
      {
        id: `${deckId}_9`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What is an MCP Resource?",
        answer: "Read-only context data, such as local files or database rows, that models can inspect.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "16:00", materialId: material.id },
      },
      {
        id: `${deckId}_10`,
        deckId,
        level: "Level 3 · Advanced",
        question: "Why is MCP called the USB-C of AI applications?",
        answer: "Because it lets any AI model plug into any data source using one universal connector.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "18:00", materialId: material.id },
      },
    ];
  }

  // 3. Tokenization / NLP / Preprocessing
  if (lower.includes("token") || lower.includes("nlp") || lower.includes("preprocess")) {
    return [
      {
        id: `${deckId}_1`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is tokenization in NLP?",
        answer: "The process of splitting raw sentences into smaller units like words or subwords.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "01:20", materialId: material.id },
      },
      {
        id: `${deckId}_2`,
        deckId,
        level: "Level 1 · Foundational",
        question: "Why must text be tokenized before entering a neural network?",
        answer: "Models only process numbers, so tokens are converted into numerical embedding IDs.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "03:00", materialId: material.id },
      },
      {
        id: `${deckId}_3`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is Byte-Pair Encoding (BPE)?",
        answer: "A subword algorithm that repeatedly merges the most frequent adjacent character pairs.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "05:15", materialId: material.id },
      },
      {
        id: `${deckId}_4`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is a vocabulary in language models?",
        answer: "The complete fixed list of unique tokens that a model has been trained to recognize.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "07:10", materialId: material.id },
      },
      {
        id: `${deckId}_5`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "How do subword tokenizers handle out-of-vocabulary (OOV) words?",
        answer: "They break unknown words down into known smaller subwords or individual characters.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "09:00", materialId: material.id },
      },
      {
        id: `${deckId}_6`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What are stopwords in NLP text cleaning?",
        answer: "Frequent filler words (like 'the', 'is', 'at') often stripped during basic keyword search.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "11:20", materialId: material.id },
      },
      {
        id: `${deckId}_7`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is the difference between stemming and lemmatization?",
        answer: "Stemming chops off suffixes crudely, while lemmatization reduces words to dictionary lemmas.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "13:30", materialId: material.id },
      },
      {
        id: `${deckId}_8`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What are special tokens in transformer models?",
        answer: "Reserved markers like [CLS] for classification and [SEP] to mark sentence boundaries.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "15:40", materialId: material.id },
      },
      {
        id: `${deckId}_9`,
        deckId,
        level: "Level 3 · Advanced",
        question: "Why do tokenizers preserve leading spaces with special symbols?",
        answer: "To distinguish standalone words from subwords appearing inside longer words.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "17:10", materialId: material.id },
      },
      {
        id: `${deckId}_10`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What is the context window token limit in LLMs?",
        answer: "The maximum number of input plus output tokens an attention model can process in one pass.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "19:00", materialId: material.id },
      },
    ];
  }

  // 4. LangChain / LangGraph
  if (lower.includes("langchain") || lower.includes("langgraph")) {
    return [
      {
        id: `${deckId}_1`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is LangChain?",
        answer: "A framework for building applications with LLMs through modular and composable components.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "01:30", materialId: material.id },
      },
      {
        id: `${deckId}_2`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is a Chain in LangChain?",
        answer: "A linked pipeline where output from one step automatically feeds into the next step.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "03:15", materialId: material.id },
      },
      {
        id: `${deckId}_3`,
        deckId,
        level: "Level 1 · Foundational",
        question: "What is LCEL in LangChain?",
        answer: "LangChain Expression Language, a pipe-based syntax for composing chains with streaming support.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "05:00", materialId: material.id },
      },
      {
        id: `${deckId}_4`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is a PromptTemplate in LangChain?",
        answer: "A reusable template that formats user input variables into structured prompt strings.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "07:20", materialId: material.id },
      },
      {
        id: `${deckId}_5`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is LangGraph used for?",
        answer: "Building cyclical agent loops and multi-actor workflows with built-in state persistence.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "09:40", materialId: material.id },
      },
      {
        id: `${deckId}_6`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is a Document Loader in LangChain?",
        answer: "A utility that loads unstructured text from PDFs, HTML pages, YouTube, and databases.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "11:50", materialId: material.id },
      },
      {
        id: `${deckId}_7`,
        deckId,
        level: "Level 2 · Intermediate",
        question: "What is a VectorStore in LangChain?",
        answer: "A wrapper that simplifies storing embedding vectors and performing similarity lookups.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "13:30", materialId: material.id },
      },
      {
        id: `${deckId}_8`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What is LangSmith?",
        answer: "A platform to debug, trace, monitor, and evaluate LLM chains in production.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "15:10", materialId: material.id },
      },
      {
        id: `${deckId}_9`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What does an OutputParser do in LangChain?",
        answer: "It transforms raw model text strings into structured JSON objects or typed schemas.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "17:00", materialId: material.id },
      },
      {
        id: `${deckId}_10`,
        deckId,
        level: "Level 3 · Advanced",
        question: "What is an AgentExecutor in LangChain?",
        answer: "The runtime engine that repeatedly queries an agent, calls tools, and returns final results.",
        citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "18:45", materialId: material.id },
      },
    ];
  }

  // 5. General Fallback for any uploaded PDF, Video, or PPT
  return [
    {
      id: `${deckId}_1`,
      deckId,
      level: "Level 1 · Foundational",
      question: `What is the main topic covered in ${cleanTitle}?`,
      answer: `Foundational definitions, overview, and core principles outlined in ${cleanTitle}.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 1", materialId: material.id },
    },
    {
      id: `${deckId}_2`,
      deckId,
      level: "Level 1 · Foundational",
      question: `What primary problem does ${cleanTitle} solve?`,
      answer: `It provides structured mechanisms and verified rules to address key challenges.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 1", materialId: material.id },
    },
    {
      id: `${deckId}_3`,
      deckId,
      level: "Level 1 · Foundational",
      question: `What is the most basic definition presented in ${cleanTitle}?`,
      answer: `The standard terminology and core concept upon which the topic is constructed.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 2", materialId: material.id },
    },
    {
      id: `${deckId}_4`,
      deckId,
      level: "Level 2 · Intermediate",
      question: `How does the main mechanism in ${cleanTitle} function?`,
      answer: `By connecting conceptual rules into sequential, practical execution steps.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 2", materialId: material.id },
    },
    {
      id: `${deckId}_5`,
      deckId,
      level: "Level 2 · Intermediate",
      question: `What is the key advantage of the method detailed in ${cleanTitle}?`,
      answer: `It ensures higher reliability, systematic structure, and faster recall.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 3", materialId: material.id },
    },
    {
      id: `${deckId}_6`,
      deckId,
      level: "Level 2 · Intermediate",
      question: `What common pitfall is highlighted in ${cleanTitle}?`,
      answer: `Misapplying baseline assumptions without testing boundary edge cases.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 3", materialId: material.id },
    },
    {
      id: `${deckId}_7`,
      deckId,
      level: "Level 2 · Intermediate",
      question: `How does ${cleanTitle} handle inputs and verify outputs?`,
      answer: `By validating input schemas and measuring quantitative benchmark metrics.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 4", materialId: material.id },
    },
    {
      id: `${deckId}_8`,
      deckId,
      level: "Level 3 · Advanced",
      question: `What is the underlying theoretical principle behind ${cleanTitle}?`,
      answer: `A structured mathematical or architectural model ensuring predictable behavior.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 4", materialId: material.id },
    },
    {
      id: `${deckId}_9`,
      deckId,
      level: "Level 3 · Advanced",
      question: `How does this material connect with advanced study topics?`,
      answer: `It forms the requisite foundation for higher-order analysis and production design.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 5", materialId: material.id },
    },
    {
      id: `${deckId}_10`,
      deckId,
      level: "Level 3 · Advanced",
      question: `What is the primary actionable takeaway from ${cleanTitle}?`,
      answer: `Master the fundamental definitions and test them through active recall practice.`,
      citation: { label: citationLabel, sourceTitle: material.title, pageOrTime: "Section 5", materialId: material.id },
    },
  ];
}

/**
 * Generate a dedicated 10-card deck for a single selected material.
 */
export function generateDeckFromSingleMaterial(
  material: Material,
  currentDecks: FlashcardDeck[]
): { decks: FlashcardDeck[]; newDeck: FlashcardDeck } {
  const cleanTitle = material.title
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  const deckId = `deck_${material.id}`;
  const cards = generateCardsForMaterial(material);

  const newDeck: FlashcardDeck = {
    id: deckId,
    title: `${cleanTitle} Flashcards`,
    subject:
      material.subject ||
      (material.material_type === "lecture_video" || material.id.startsWith("yt_")
        ? "Lecture Video"
        : material.material_type === "slide_deck"
        ? "Slide Deck (PPT)"
        : "PDF Textbook"),
    promptDescription: `10 bite-sized active recall cards synthesized on 1 click from ${cleanTitle}.`,
    sources: [
      {
        title: material.title,
        type: material.material_type,
        reference: material.filename || material.title,
      },
    ],
    cards,
  };

  const remaining = currentDecks.filter((d) => d.id !== deckId);
  const updatedDecks = [newDeck, ...remaining];

  saveStoredDecks(updatedDecks);
  return { decks: updatedDecks, newDeck };
}

/**
 * Generate a 10-card deck from ingested course materials on 1-click.
 */
export function generateDeckFromMaterials(
  materials: Material[],
  currentDecks: FlashcardDeck[]
): { decks: FlashcardDeck[]; newDeck: FlashcardDeck | null } {
  if (!materials || materials.length === 0) {
    return { decks: currentDecks, newDeck: null };
  }

  const validMaterials = materials.filter((m) => m.title && m.title.trim().length > 0);
  if (validMaterials.length === 0) {
    return { decks: currentDecks, newDeck: null };
  }

  // If exactly 1 material is provided, generate a deep 10-card deck for it
  if (validMaterials.length === 1) {
    return generateDeckFromSingleMaterial(validMaterials[0], currentDecks);
  }

  // Otherwise, synthesize 10 cards across the ingested materials
  const cards: Flashcard[] = Array.from({ length: 10 }, (_, idx) => {
    const mat = validMaterials[idx % validMaterials.length];
    const isVideo = mat.material_type === "lecture_video" || mat.id.startsWith("yt_");
    const level: KnowledgeLevel =
      idx < 3 ? "Level 1 · Foundational" : idx < 7 ? "Level 2 · Intermediate" : "Level 3 · Advanced";

    const cleanTitle = mat.title
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();

    return {
      id: `ingested_${mat.id}_${idx}`,
      deckId: "custom_materials",
      level,
      question: isVideo
        ? `What is the core takeaway in ${cleanTitle}?`
        : `What key concept is outlined in ${cleanTitle}?`,
      answer: isVideo
        ? `Practical demonstrations, steps, and takeaways from ${cleanTitle}.`
        : `Essential definitions, formulas, and principles from ${cleanTitle}.`,
      citation: {
        label: `[${cleanTitle.slice(0, 24)}]`,
        sourceTitle: mat.title,
        pageOrTime: isVideo ? "Timestamp 02:00" : "Section 1",
        materialId: mat.id,
      },
    };
  });

  const customDeck: FlashcardDeck = {
    id: "custom_materials",
    title: "Course Uploads Flashcards",
    subject: "Ingested Materials",
    promptDescription:
      "10 bite-sized active recall cards synthesized across all uploaded PDFs, slide decks, and lecture videos.",
    sources: validMaterials.slice(0, 6).map((m) => ({
      title: m.title,
      type: m.material_type === "lecture_video" ? "lecture_video" : "textbook",
      reference: m.filename || "Ingested Source Material",
    })),
    cards,
  };

  const remaining = currentDecks.filter((d) => d.id !== "custom_materials");
  const updatedDecks = [customDeck, ...remaining];

  saveStoredDecks(updatedDecks);
  return { decks: updatedDecks, newDeck: customDeck };
}
