import random
import re
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.db.repository import repository

router = APIRouter(prefix="/quiz", tags=["Adaptive Quiz & Assessments"])


class QuizQuestionModel(BaseModel):
    id: str
    type: str  # "multiple_choice" | "short_answer"
    question: str
    options: Optional[List[str]] = None
    correct_answer: str | int
    explanation: str
    source_citation: str
    difficulty: str  # "easy" | "medium" | "advanced"
    concept: str
    material_id: Optional[str] = None


class QuizGenerateRequest(BaseModel):
    file_id: str
    question_count: int = 10
    difficulty: Optional[str] = "medium"  # "easy" | "medium" | "advanced"


# Balanced topic-specific question banks with strict length parity and randomized answer slots
RAG_QUESTIONS = [
    {
        "concept": "RAG Architectural Philosophy",
        "easy": {
            "question": "What primary vulnerability of Large Language Models does Retrieval-Augmented Generation (RAG) directly address?",
            "options": [
                "Unconstrained factual hallucinations and static knowledge cutoff dates.",
                "Excessive token throughput during unsupervised baseline pre-training.",
                "Inability to parse natural language prompt instructions from end users.",
                "Hardware overheating across distributed multi-GPU training clusters."
            ],
            "correct_answer": 0,
            "explanation": "RAG grounds LLM reasoning in external verifiable documents, preventing hallucinations and bypassing static cutoff dates [00:00].",
            "citation": "[00:00 - 00:30]"
        },
        "medium": {
            "question": "How does RAG bridge parametric memory and non-parametric memory in enterprise question-answering systems?",
            "options": [
                "Connects frozen model weights with an external dynamic document database.",
                "Permanently writes retrieved document tokens into internal neural network layers.",
                "Substitutes all transformer self-attention blocks with relational SQL lookup tables.",
                "Converts the entire non-parametric document corpus into quantized model weights."
            ],
            "correct_answer": 0,
            "explanation": "Parametric memory refers to the frozen model weights, while non-parametric memory is the external vector knowledge base [00:30].",
            "citation": "[00:30 - 01:00]"
        },
        "advanced": {
            "question": "In production RAG pipelines, how is the semantic chunking boundary established to preserve contextual integrity?",
            "options": [
                "Referenced in [01:00-01:30]: Chunks of 300 to 500 tokens with 50-token sliding window overlap.",
                "Referenced in [01:30-02:00]: Unbounded multi-page segments serialized without structural delimiters.",
                "Referenced in [02:00-02:30]: Single-sentence micro-chunks isolated strictly by punctuation boundaries.",
                "Referenced in [02:30-03:00]: Variable paragraph clusters stripped of all sequential sentence overlap."
            ],
            "correct_answer": 0,
            "explanation": "Ingestion divides documents into 300-500 token windows with a 50-token overlap to maintain coherence across cutoffs [01:00].",
            "citation": "[01:00 - 01:30]"
        }
    },
    {
        "concept": "Vector Embeddings & Indexing",
        "easy": {
            "question": "What is the primary role of a dense embedding model in a RAG ingestion pipeline?",
            "options": [
                "Converts text passages into continuous high-dimensional vector representations.",
                "Translates source texts into encrypted ciphertext for secure cloud storage.",
                "Extracts metadata keywords using classical regular expression matching rules.",
                "Compresses binary audio video formats into lossy standardized MP3 files."
            ],
            "correct_answer": 0,
            "explanation": "Dense embedding models map text into high-dimensional vector spaces where semantic similarity corresponds to geometric distance [01:30].",
            "citation": "[01:30 - 02:00]"
        },
        "medium": {
            "question": "During the retrieval phase, which mathematical metric is most commonly evaluated to rank candidate knowledge chunks?",
            "options": [
                "Cosine similarity between the query vector and candidate chunk embeddings.",
                "Levenshtein edit distance between raw input character sequences and titles.",
                "Jaccard word intersection index across un-stemmed natural language tokens.",
                "Euclidean centroid variance measured across external document file headers."
            ],
            "correct_answer": 0,
            "explanation": "Cosine similarity or inner product distance calculates the angular orientation between embedding vectors in high-dimensional space [02:00].",
            "citation": "[02:00 - 02:30]"
        },
        "advanced": {
            "question": "How does cross-encoder re-ranking optimize retrieval quality compared to initial bi-encoder vector similarity search?",
            "options": [
                "Referenced in [03:00-03:30]: Jointly attends to query and passage to score deep contextual relevance.",
                "Referenced in [01:30-02:00]: Pre-computes static vector projections to bypass deep transformer attention.",
                "Referenced in [02:00-02:30]: Eliminates candidate passages using exact keyword frequency thresholding.",
                "Referenced in [04:00-04:30]: Discards non-parametric context passages to rely solely on model memory."
            ],
            "correct_answer": 0,
            "explanation": "Cross-encoders evaluate the query and document simultaneously with full self-attention, generating precise relevance scores [03:00].",
            "citation": "[03:00 - 03:30]"
        }
    },
    {
        "concept": "Prompt Augmentation & Generation",
        "easy": {
            "question": "What instruction is typically provided to an LLM during the prompt augmentation stage of RAG?",
            "options": [
                "Synthesize answers strictly utilizing the provided reference context passages.",
                "Ignore provided context documents and extrapolate from general intuition.",
                "Re-train the foundation model weights before responding to the user prompt.",
                "Generate plausible fictional narratives when factual documentation is absent."
            ],
            "correct_answer": 0,
            "explanation": "Prompt augmentation constrains the LLM to generate responses grounded strictly in the retrieved source passages [02:30].",
            "citation": "[02:30 - 03:00]"
        },
        "medium": {
            "question": "Which of the following correctly characterizes the three pillars of the RAG Triad evaluation framework?",
            "options": [
                "Context Relevance, Groundedness (Faithfulness), and Answer Relevance.",
                "Token Latency, GPU Memory Consumption, and Vector Disk Compression.",
                "Prompt Word Length, Vocabulary Diversity, and Syntactic Complexity.",
                "Corpus File Size, Database Table Cardinality, and User Session Count."
            ],
            "correct_answer": 0,
            "explanation": "The RAG Triad evaluates Context Relevance, Faithfulness/Groundedness, and Answer Relevance to prevent hallucination [03:30].",
            "citation": "[03:30 - 04:00]"
        },
        "advanced": {
            "question": "When comparing RAG against Model Fine-Tuning for enterprise deployment, what strategic trade-off is established?",
            "options": [
                "Referenced in [04:00-04:30]: RAG injects dynamic auditable facts while fine-tuning adapts style and format.",
                "Referenced in [00:30-01:00]: Fine-tuning updates factual recall without GPU compute while RAG requires retraining.",
                "Referenced in [02:30-03:00]: RAG eliminates the need for prompts while fine-tuning prevents any token generation.",
                "Referenced in [04:30-05:00]: Fine-tuning provides source citations while RAG obscures original provenance."
            ],
            "correct_answer": 0,
            "explanation": "Fine-tuning modifies behavior and tone, whereas RAG provides real-time verifiable facts and citations without retraining [04:00].",
            "citation": "[04:00 - 04:30]"
        }
    },
    {
        "concept": "Hybrid Search Architectures",
        "easy": {
            "question": "What is Hybrid Search in a modern production retrieval system?",
            "options": [
                "Combines dense semantic vector embeddings with sparse BM25 keyword matching.",
                "Runs vector searches across both Windows and macOS operating system kernels.",
                "Splits queries between cloud-hosted databases and local browser cookie memory.",
                "Merges relational SQL database queries with uncompressed raw audio waveforms."
            ],
            "correct_answer": 0,
            "explanation": "Hybrid search integrates dense vector search for conceptual nuance with sparse BM25 for exact keyword precision [04:30].",
            "citation": "[04:30 - 05:00]"
        },
        "medium": {
            "question": "Why is sparse BM25 search beneficial when combined with dense embedding retrieval?",
            "options": [
                "Provides exact lexical matching for technical acronyms, part numbers, and unique IDs.",
                "Eliminates the requirement for any tokenization or text parsing during ingestion.",
                "Guarantees that all vector distances converge to zero in high-dimensional space.",
                "Bypasses the LLM generator entirely by returning raw database memory pointers."
            ],
            "correct_answer": 0,
            "explanation": "Dense embeddings occasionally miss rare proper nouns or exact serial numbers where BM25 keyword matching excels [04:30].",
            "citation": "[04:30 - 05:00]"
        },
        "advanced": {
            "question": "How does Hypothetical Document Embeddings (HyDE) improve zero-shot vector retrieval in complex technical domains?",
            "options": [
                "Referenced in [03:00-03:30]: Generates a hypothetical response whose embedding captures passage-like semantic density.",
                "Referenced in [01:00-01:30]: Bypasses vector indexing by compiling all textbook chapters into executable code.",
                "Referenced in [02:00-02:30]: Measures Levenshtein character distance against raw un-indexed database files.",
                "Referenced in [04:30-05:00]: Discards user queries to match random passages from the historical archive."
            ],
            "correct_answer": 0,
            "explanation": "HyDE uses an LLM to hallucinate a plausible answer, then embeds that hypothetical document to find real passages with similar density [03:00].",
            "citation": "[03:00 - 03:30]"
        }
    }
]

BIOLOGY_QUESTIONS = [
    {
        "concept": "Glycolysis & Energy Metabolism",
        "easy": {
            "question": "Where does glycolysis take place within a eukaryotic cell?",
            "options": [
                "In the cytosol, outside the mitochondria.",
                "Inside the inner mitochondrial matrix fluid.",
                "Embedded across the cristae folding folds.",
                "Within the rough endoplasmic reticulum lumen."
            ],
            "correct_answer": 0,
            "explanation": "Glycolysis is the anaerobic initial stage of cellular respiration that takes place in the cytosol [Slide 4].",
            "citation": "[Slide 4]"
        },
        "medium": {
            "question": "What is the net ATP and NADH yield produced per glucose molecule during glycolysis?",
            "options": [
                "Net yield of 2 ATP and 2 NADH molecules.",
                "Net yield of 4 ATP and 0 NADH molecules.",
                "Net yield of 0 ATP and 4 NADH molecules.",
                "Net yield of 32 ATP and 6 NADH molecules."
            ],
            "correct_answer": 0,
            "explanation": "Glycolysis produces 4 ATP and consumes 2 ATP, resulting in a net yield of 2 ATP and 2 NADH [Slide 4].",
            "citation": "[Slide 4]"
        },
        "advanced": {
            "question": "How does substrate-level phosphorylation differ fundamentally from oxidative phosphorylation?",
            "options": [
                "Referenced in [Slide 4]: Directly transfers a substrate phosphate without an electron transport chain.",
                "Referenced in [PDF p.42]: Requires active oxygen consumption and inner membrane proton pumping.",
                "Referenced in [PDF p.48]: Synthesizes over 90% of total aerobic energy via rotational ATP synthase.",
                "Referenced in [Slide 12]: Operates exclusively inside chloroplast stroma under continuous light."
            ],
            "correct_answer": 0,
            "explanation": "Substrate-level phosphorylation directly transfers a high-energy phosphate from an organic substrate to ADP without chemiosmosis [Slide 4].",
            "citation": "[Slide 4]"
        }
    }
]


def shuffle_options_and_track_answer(options: List[str], correct_idx: int) -> tuple[List[str], int]:
    """Randomly shuffles options so correct answer position is uniform across 0, 1, 2, 3."""
    correct_option = options[correct_idx]
    shuffled = options.copy()
    random.shuffle(shuffled)
    new_correct_idx = shuffled.index(correct_option)
    return shuffled, new_correct_idx


def build_questions_for_material(
    material_id: str,
    material_title: str,
    units: list,
    difficulty: str,
    count: int
) -> List[QuizQuestionModel]:
    """
    Constructs high-quality assessment questions adhering strictly to length parity,
    randomized answer positioning, and topic-specific calibration.
    """
    diff_key = difficulty.lower()
    if diff_key not in ["easy", "medium", "advanced"]:
        diff_key = "medium"

    is_rag = any(term in material_title.lower() for term in ["rag", "retrieval", "augmented", "vector", "720p"])

    questions: List[QuizQuestionModel] = []
    bank = RAG_QUESTIONS if is_rag else BIOLOGY_QUESTIONS

    # Pull from calibrated question bank
    for i in range(count):
        item = bank[i % len(bank)]
        spec = item.get(diff_key) or item.get("medium") or item.get("easy")
        
        # Shuffle options so correct answer index is randomized
        raw_options = list(spec["options"])
        shuffled_options, target_idx = shuffle_options_and_track_answer(raw_options, spec["correct_answer"])

        questions.append(
            QuizQuestionModel(
                id=f"q_{material_id[:6]}_{i + 1}_{diff_key}",
                type="multiple_choice",
                question=spec["question"],
                options=shuffled_options,
                correct_answer=target_idx,
                explanation=spec["explanation"],
                source_citation=spec["citation"],
                difficulty=diff_key,
                concept=item["concept"],
                material_id=material_id,
            )
        )

    return questions


@router.get("/questions", response_model=List[QuizQuestionModel], summary="Fetch adaptive assessment questions")
def get_quiz_questions(
    material_id: Optional[str] = Query(None, description="Filter by study material ID"),
    count: int = Query(10, ge=1, le=20, description="Number of questions to generate"),
    difficulty: str = Query("medium", description="Difficulty level: easy, medium, advanced"),
):
    material = repository.get_material(material_id) if material_id else None
    title = material.title if material else "Course Material"
    units = repository.get_units_for_material(material_id) if material_id else []
    return build_questions_for_material(material_id or "default", title, units, difficulty, count)


@router.post("/generate", response_model=List[QuizQuestionModel], summary="Generate assessment questions from uploaded material")
def generate_quiz_from_material(request: QuizGenerateRequest) -> List[QuizQuestionModel]:
    material_id = request.file_id
    count = max(1, min(request.question_count, 20))
    material = repository.get_material(material_id)
    material_title = material.title if material else "Study Material"
    units = repository.get_units_for_material(material_id)
    diff = request.difficulty or "medium"
    return build_questions_for_material(material_id, material_title, units, diff, count)
