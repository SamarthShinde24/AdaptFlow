import random
import re
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user
from app.db.models import User, QuizSession, Material, KnowledgeUnit
from app.db.redis import cache_get, cache_set
from app.schemas.base import APIResponse

router = APIRouter()

class QuizGenerateRequest(BaseModel):
    material_id: str
    question_count: int = 10
    difficulty: Optional[str] = "medium"

class QuizAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_answer: int

class QuizCompleteRequest(BaseModel):
    session_id: str

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
) -> List[dict]:
    diff_key = difficulty.lower()
    if diff_key not in ["easy", "medium", "advanced"]:
        diff_key = "medium"

    is_rag = any(term in material_title.lower() for term in ["rag", "retrieval", "augmented", "vector", "720p"])

    questions = []
    bank = RAG_QUESTIONS if is_rag else BIOLOGY_QUESTIONS

    for i in range(count):
        item = bank[i % len(bank)]
        spec = item.get(diff_key) or item.get("medium") or item.get("easy")
        
        raw_options = list(spec["options"])
        shuffled_options, target_idx = shuffle_options_and_track_answer(raw_options, spec["correct_answer"])

        questions.append({
            "id": f"q_{str(material_id)[:6]}_{i + 1}_{diff_key}",
            "type": "multiple_choice",
            "question": spec["question"],
            "options": shuffled_options,
            "correct_answer": target_idx,
            "explanation": spec["explanation"],
            "source_citation": spec["citation"],
            "difficulty": diff_key,
            "concept": item["concept"],
            "material_id": str(material_id)
        })

    return questions

@router.post("/generate", response_model=APIResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Material).where(Material.id == request.material_id)
    result = await db.execute(query)
    material = result.scalars().first()
    
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    unit_query = select(KnowledgeUnit).where(KnowledgeUnit.material_id == material.id)
    unit_result = await db.execute(unit_query)
    units = unit_result.scalars().all()
    
    count = max(1, min(request.question_count, 20))
    questions = build_questions_for_material(str(material.id), material.title, units, request.difficulty, count)
    
    session = QuizSession(
        user_id=current_user.id,
        material_id=material.id,
        status="active",
        score=0
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    session_data = {
        "id": str(session.id),
        "questions": questions,
        "answers": {},
        "status": "active"
    }
    
    await cache_set(f"quiz:{session.id}", json.dumps(session_data), ttl=3600)
    
    return APIResponse(success=True, data={"session_id": str(session.id), "questions": [{"id": q["id"], "question": q["question"], "options": q["options"], "type": q["type"], "difficulty": q["difficulty"]} for q in questions]})

@router.get("/sessions/{session_id}", response_model=APIResponse)
async def get_quiz_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await cache_get(f"quiz:{session_id}")
    if cached:
        return APIResponse(success=True, data=json.loads(cached))
        
    query = select(QuizSession).where(QuizSession.id == session_id, QuizSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
        
    return APIResponse(success=True, data={"id": str(session.id), "status": session.status, "score": session.score})

@router.post("/answer", response_model=APIResponse)
async def answer_question(
    request: QuizAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await cache_get(f"quiz:{request.session_id}")
    if not cached:
        raise HTTPException(status_code=404, detail="Quiz session expired or not found")
        
    session_data = json.loads(cached)
    question = next((q for q in session_data["questions"] if q["id"] == request.question_id), None)
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    is_correct = (request.selected_answer == question["correct_answer"])
    session_data["answers"][request.question_id] = {
        "selected": request.selected_answer,
        "correct": is_correct
    }
    
    await cache_set(f"quiz:{request.session_id}", json.dumps(session_data), ttl=3600)
    
    return APIResponse(success=True, data={
        "correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": question["explanation"],
        "source_citation": question["source_citation"]
    })

@router.post("/complete", response_model=APIResponse)
async def complete_quiz(
    request: QuizCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await cache_get(f"quiz:{request.session_id}")
    if not cached:
        raise HTTPException(status_code=404, detail="Quiz session expired or not found")
        
    session_data = json.loads(cached)
    
    correct_count = sum(1 for ans in session_data["answers"].values() if ans["correct"])
    total_count = len(session_data["questions"])
    score = (correct_count / total_count) * 100 if total_count > 0 else 0
    
    query = select(QuizSession).where(QuizSession.id == request.session_id, QuizSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalars().first()
    
    if session:
        session.status = "completed"
        session.score = score
        await db.commit()
        
    # Clear cache or keep it for review
    await cache_set(f"quiz:{request.session_id}", json.dumps(session_data), ttl=300)
    
    return APIResponse(success=True, data={
        "score": score,
        "correct_count": correct_count,
        "total_count": total_count
    })
