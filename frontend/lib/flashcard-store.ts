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
  }
): { decks: FlashcardDeck[]; addedCard: Flashcard } {
  const decks = getStoredDecks();
  const cardId = `user_card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const card: Flashcard = {
    id: cardId,
    deckId,
    question: newCard.question.trim(),
    answer: newCard.answer.trim(),
    level: newCard.level,
    keyTakeaway: newCard.keyTakeaway?.trim() || "User created active recall card.",
    citation: {
      label: "[Flashcards Studio | Custom Card]",
      sourceTitle: "User Study Studio",
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
  }
): FlashcardDeck[] {
  const decks = getStoredDecks();
  const updatedDecks = decks.map((deck) => {
    if (deck.id === deckId) {
      return {
        ...deck,
        cards: deck.cards.map((c) =>
          c.id === cardId
            ? {
                ...c,
                ...(updates.question !== undefined ? { question: updates.question.trim() } : {}),
                ...(updates.answer !== undefined ? { answer: updates.answer.trim() } : {}),
                ...(updates.level !== undefined ? { level: updates.level } : {}),
                ...(updates.keyTakeaway !== undefined ? { keyTakeaway: updates.keyTakeaway.trim() } : {}),
              }
            : c
        ),
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

  const cards: Flashcard[] = validMaterials.slice(0, 10).map((mat, idx) => {
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
        ? `What is the main topic covered in ${cleanTitle}?`
        : `What key concept is explained in ${cleanTitle}?`,
      answer: isVideo
        ? `Practical steps, demonstrations, and core takeaways from ${cleanTitle}.`
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
      "10 bite-sized active recall cards synthesized on 1 click from uploaded PDFs and lecture videos.",
    sources: validMaterials.slice(0, 4).map((m) => ({
      title: m.title,
      type: m.material_type === "lecture_video" ? "lecture_video" : "textbook",
      reference: m.filename || "Ingested Source Material",
    })),
    cards,
  };

  const deckExists = currentDecks.some((d) => d.id === "custom_materials");
  const updatedDecks = deckExists
    ? currentDecks.map((d) => (d.id === "custom_materials" ? customDeck : d))
    : [customDeck, ...currentDecks];

  saveStoredDecks(updatedDecks);
  return { decks: updatedDecks, newDeck: customDeck };
}
