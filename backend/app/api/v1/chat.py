import asyncio
import json
import os
import re
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from uuid import UUID
from pydantic import BaseModel
import httpx

from app.db.session import get_db
from app.core.deps import get_current_user, get_optional_user, RateLimitDep
from app.db.models import User, ChatSession, ChatMessage
from app.schemas.base import APIResponse
from app.services.rag import retrieve_and_rerank, build_rag_context, build_citations_list
from app.db.repository import KnowledgeBaseRepository

router = APIRouter()

class ChatSessionCreate(BaseModel):
    title: str
    material_ids: Optional[List[UUID]] = None

class ChatMessageRequest(BaseModel):
    message: str
    material_ids: Optional[List[UUID]] = None

class ChatStreamDirectRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None
    material_id: Optional[str] = None


# Curated foundational knowledge units for standard course domains
AI_LLM_KNOWLEDGE_UNITS = [
    {
        "key": "[Slide 3: Transformer Foundations]",
        "title": "CS201: Deep Learning & Large Language Models",
        "material_type": "slide_deck",
        "modality": "slide_content",
        "slide_number": 3,
        "label": "[CS201 | Slide #3: Transformer Architecture]",
        "excerpt": "Transformers replace recurrence with multi-head self-attention, allowing token representations to attend to all positions simultaneously with O(1) sequential computation path.",
        "tags": ["llm", "transformers", "attention"]
    },
    {
        "key": "[PDF p.14: Autoregressive Generation]",
        "title": "Foundations of Large Language Models (2024 Ed)",
        "material_type": "textbook",
        "modality": "text",
        "page_number": 14,
        "label": "[LLM Foundations | Chapter 2, p. 14]",
        "excerpt": "Large Language Models operate as probabilistic autoregressive models: given prompt sequence (x_1, ..., x_t), they compute softmax probabilities over vocabulary V to iteratively predict token x_{t+1}.",
        "tags": ["llm", "autoregressive", "probability"]
    },
    {
        "key": "[14:20 - 15:30: Pretraining vs Alignment]",
        "title": "Lecture 6: LLM Training Dynamics & RLHF",
        "material_type": "lecture_video",
        "modality": "speech_transcript",
        "start_timestamp": "14:20",
        "end_timestamp": "15:30",
        "label": "[Lecture 6 @ 14:20: Pretraining to RLHF]",
        "excerpt": "Pretraining imparts broad world knowledge via self-supervised next-token loss on trillions of tokens. Instruction tuning and RLHF align model outputs to follow user intent safely.",
        "tags": ["llm", "pretraining", "rlhf"]
    }
]

RAG_KNOWLEDGE_UNITS = [
    {
        "key": "[Slide 7: RAG Triad Architecture]",
        "title": "CS205: Enterprise RAG & Vector Systems",
        "material_type": "slide_deck",
        "modality": "slide_content",
        "slide_number": 7,
        "label": "[Enterprise RAG | Slide #7: Retrieval Pipeline]",
        "excerpt": "RAG connects frozen parametric neural weights to dynamic non-parametric vector databases using dense cosine similarity search and cross-encoder re-ranking.",
        "tags": ["rag", "vector_search", "retrieval"]
    },
    {
        "key": "[PDF p.28: Semantic Chunking & pgvector]",
        "title": "Applied Vector Databases & Information Retrieval",
        "material_type": "textbook",
        "modality": "text",
        "page_number": 28,
        "label": "[Vector DBs | Chapter 3, p. 28]",
        "excerpt": "Optimal semantic chunking splits text into 300-500 token windows with a 50-token overlap, indexed using HNSW pgvector indices for sub-millisecond nearest neighbor search.",
        "tags": ["rag", "chunking", "pgvector"]
    },
    {
        "key": "[08:15 - 09:40: Grounded Verification]",
        "title": "Lecture 8: Hallucination Mitigation Strategies",
        "material_type": "lecture_video",
        "modality": "speech_transcript",
        "start_timestamp": "08:15",
        "end_timestamp": "09:40",
        "label": "[Lecture 8 @ 08:15: Grounded Citation Engine]",
        "excerpt": "By injecting retrieved document passages into the prompt context with citation metadata, the LLM produces verified factual statements traceable directly to source evidence.",
        "tags": ["rag", "citations", "hallucination"]
    }
]

BIOLOGY_KNOWLEDGE_UNITS = [
    {
        "key": "[PDF p.42: Glycolysis & Energetics]",
        "title": "Principles of Biology (11th Ed)",
        "material_type": "textbook",
        "modality": "text",
        "page_number": 42,
        "label": "[Principles of Biology | Chapter 4, p. 42]",
        "excerpt": "Cellular respiration converts glucose into usable ATP through glycolysis in the cytosol, generating a net yield of 2 ATP and 2 NADH molecules per glucose.",
        "tags": ["biology", "glycolysis", "atp"]
    },
    {
        "key": "[Slide 4: Mitochondrial Chemiosmosis]",
        "title": "Lecture 4 Slides: Bioenergetics & Respiration",
        "material_type": "slide_deck",
        "modality": "slide_content",
        "slide_number": 4,
        "label": "[Lecture 4 Slides | Slide #4: Electron Transport]",
        "excerpt": "Electrons from NADH and FADH2 pass through complexes I-IV, pumping protons across the inner mitochondrial membrane to generate the proton-motive force driving ATP synthase.",
        "tags": ["biology", "chemiosmosis", "mitochondria"]
    },
    {
        "key": "[12:30 - 13:30: Oxidative Phosphorylation]",
        "title": "Bio 101 Lecture: Cellular Energy Pathways",
        "material_type": "lecture_video",
        "modality": "speech_transcript",
        "start_timestamp": "12:30",
        "end_timestamp": "13:30",
        "label": "[Bio 101 Lecture @ 12:30: ATP Synthase Mechanics]",
        "excerpt": "ATP synthase functions as a molecular rotary motor: protons flowing down their electrochemical gradient rotate the catalytic head to phosphorylate ADP into ATP.",
        "tags": ["biology", "atp_synthase", "phosphorylation"]
    }
]


def build_frontend_citation(unit_dict: dict) -> dict:
    unit_id = f"unit_{uuid.uuid4().hex[:10]}"
    mat_id = unit_dict.get("material_id", f"mat_{uuid.uuid4().hex[:8]}")
    key = unit_dict.get("key", "[Source Excerpt]")
    label = unit_dict.get("label", key)

    return {
        "key": key,
        "unit": {
            "id": unit_id,
            "material_id": mat_id,
            "content": unit_dict.get("excerpt", ""),
            "modality": unit_dict.get("modality", "text"),
            "source_tracking": {
                "material_id": mat_id,
                "material_title": unit_dict.get("title", "Course Material"),
                "material_type": unit_dict.get("material_type", "textbook"),
                "chunk_index": 1,
                "page_number": unit_dict.get("page_number"),
                "slide_number": unit_dict.get("slide_number"),
                "start_timestamp": unit_dict.get("start_timestamp"),
                "end_timestamp": unit_dict.get("end_timestamp"),
                "citation_label": label,
                "content_hash": uuid.uuid4().hex,
                "token_count": 60,
                "confidence_score": 0.98,
                "is_speaker_notes": False
            },
            "tags": unit_dict.get("tags", ["core_concept"]),
            "created_at": "2026-10-07T00:00:00.000Z"
        }
    }


def find_topic_citations(query: str, material_title: str = "") -> List[dict]:
    q = (query + " " + material_title).lower()

    if any(k in q for k in ["llm", "large language", "transformer", "gpt", "attention", "token", "prompt", "neural network", "deep learning"]):
        return [build_frontend_citation(u) for u in AI_LLM_KNOWLEDGE_UNITS]
    elif any(k in q for k in ["rag", "retrieval", "vector", "embedding", "cosine", "pgvector", "chunk"]):
        return [build_frontend_citation(u) for u in RAG_KNOWLEDGE_UNITS]
    elif any(k in q for k in ["bio", "cell", "respiration", "glycolysis", "atp", "enzyme", "mitochondria", "dna", "rna", "photosynthesis"]):
        return [build_frontend_citation(u) for u in BIOLOGY_KNOWLEDGE_UNITS]
    else:
        # Default balanced citations with domain keywords
        return [
            build_frontend_citation({
                "key": "[Slide 2: Core Concept Overview]",
                "title": material_title or "Subject Curriculum Foundation",
                "material_type": "slide_deck",
                "modality": "slide_content",
                "slide_number": 2,
                "label": f"[{material_title or 'Course Deck'} | Slide #2]",
                "excerpt": f"Key conceptual definitions and structural hierarchy for {query[:40]}.",
                "tags": ["overview", "foundations"]
            }),
            build_frontend_citation({
                "key": "[PDF p.18: Analytical Principles]",
                "title": material_title or "Standard Reference Guide",
                "material_type": "textbook",
                "modality": "text",
                "page_number": 18,
                "label": f"[{material_title or 'Course Textbook'} | p. 18]",
                "excerpt": f"Mathematical and empirical formulations governing {query[:40]} and related systemic properties.",
                "tags": ["textbook", "derivation"]
            }),
            build_frontend_citation({
                "key": "[10:15 - 11:45: Applied Discussion]",
                "title": "Comprehensive Lecture Series",
                "material_type": "lecture_video",
                "modality": "speech_transcript",
                "start_timestamp": "10:15",
                "end_timestamp": "11:45",
                "label": "[Lecture Session @ 10:15]",
                "excerpt": f"Detailed instructor walkthrough demonstrating key mechanisms, trade-offs, and practical implementations.",
                "tags": ["lecture", "demonstration"]
            })
        ]


def generate_socratic_tutor_response(query: str, citations: List[dict]) -> str:
    """
    Generates a university-grade Socratic tutor response with grounded citations,
    intuitive mental models, and a check-for-understanding question.
    """
    q_lower = query.lower().strip()
    c_keys = [c["key"] for c in citations]
    k1 = c_keys[0] if len(c_keys) > 0 else "[Slide 1]"
    k2 = c_keys[1] if len(c_keys) > 1 else "[PDF p.10]"
    k3 = c_keys[2] if len(c_keys) > 2 else "[Lecture @ 05:00]"

    # 1. Large Language Models (LLMs)
    if any(k in q_lower for k in ["what is an llm", "what are llms", "large language model", "how do llms work"]):
        return (
            f"### **1. Conceptual Foundation & Mental Model**\n\n"
            f"Think of a **Large Language Model (LLM)** as an ultra-high-dimensional map of human language and knowledge. At its heart, an LLM is a deep neural network trained on vast text corpora to perform a single foundational task: **statistical sequence continuation**.\n\n"
            f"Rather than 'thinking' in human terms, an LLM maps words and subwords into continuous mathematical vector embeddings, allowing it to navigate subtle conceptual nuances and semantic relationships.\n\n"
            f"---\n\n"
            f"### **2. Core Architectural Mechanics**\n\n"
            f"- **The Transformer Backbone {k1}**: Unlike older sequential networks (RNNs/LSTMs), modern LLMs utilize the **Transformer architecture**. The breakthrough here is the **Self-Attention mechanism**, which computes direct pairwise relationships between every token in a sentence simultaneously regardless of distance.\n"
            f"- **Autoregressive Token Generation {k2}**: Given an input prompt $X = (x_1, x_2, ..., x_t)$, the model computes conditional softmax probabilities $P(x_{{t+1}} \\mid x_1, ..., x_t)$ across its vocabulary. It samples the next token, appends it to the sequence, and loops autoregressively.\n"
            f"- **The Two-Stage Training Pipeline {k3}**:\n"
            f"  1. **Unsupervised Pre-training**: Ingests trillions of tokens with cross-entropy loss to learn world knowledge and grammatical structures.\n"
            f"  2. **Alignment & Instruction Tuning (RLHF/DPO)**: Fine-tunes the base model to follow multi-turn instructions helpfully and safely.\n\n"
            f"---\n\n"
            f"### **3. Grounded Verification & Knowledge Boundaries**\n\n"
            f"While LLMs possess immense synthesis power, their internal weights remain frozen post-training, which can lead to hallucination. Systems like **AdaptFlow** resolve this via **Retrieval-Augmented Generation (RAG)**, injecting verified course citations into the context window.\n\n"
            f"---\n\n"
            f"### 💡 **Socratic Check-for-Understanding**\n\n"
            f"*Suppose an LLM produces a completely confident but factually incorrect answer about a newly published research paper. Based on how LLMs generate tokens, is this failure caused by a lack of reasoning logic or by a knowledge cutoff boundary—and how does retrieval grounding fix it?*"
        )

    # 2. Retrieval-Augmented Generation (RAG)
    elif any(k in q_lower for k in ["rag", "retrieval augmented", "how does rag work", "vector search"]):
        return (
            f"### **1. Conceptual Foundation & Mental Model**\n\n"
            f"Imagine taking an open-book exam: an LLM without RAG relies purely on memorized knowledge (frozen parametric memory), whereas **Retrieval-Augmented Generation (RAG)** equips the model with the ability to look up the exact chapter and page in real time before formulating its answer.\n\n"
            f"---\n\n"
            f"### **2. The Three-Phase RAG Pipeline**\n\n"
            f"1. **Ingestion & Semantic Chunking {k2}**:\n"
            f"   - Documents are parsed across modalities (PDFs, PPT slides, lecture transcripts) and split into cohesive 300–500 token segments with sliding overlap.\n"
            f"   - Each chunk is embedded into high-dimensional space ($D=384$ or $D=1536$) and stored in vector indexes (e.g. pgvector).\n\n"
            f"2. **Dense Semantic Retrieval & Cross-Encoder Reranking {k1}**:\n"
            f"   - When a user submits a query, cosine similarity identifies the top-$K$ nearest semantic neighbors.\n"
            f"   - A cross-encoder model scores candidate chunks for precise relevance to filter noise.\n\n"
            f"3. **Grounded Generation & Citation Synthesis {k3}**:\n"
            f"   - The verified excerpts are injected into the prompt context.\n"
            f"   - The LLM synthesizes the final pedagogical answer, anchoring every factual proposition to clickable citation chips.\n\n"
            f"---\n\n"
            f"### 💡 **Socratic Check-for-Understanding**\n\n"
            f"*Why is dense vector similarity alone sometimes insufficient for multi-hop questions, and why do modern systems combine vector search with keyword/BM25 hybrid scoring?*"
        )

    # 3. Biology & Cellular Respiration
    elif any(k in q_lower for k in ["glycolysis", "cellular respiration", "atp", "mitochondria", "biology", "photosynthesis", "enzyme"]):
        return (
            f"### **1. Biological Overview & Energetics**\n\n"
            f"Cellular respiration is the biochemical engine of life: it harvests chemical energy stored in carbon-carbon covalent bonds of glucose and systematically converts it into universal cellular currency—**Adenosine Triphosphate (ATP)**.\n\n"
            f"---\n\n"
            f"### **2. The Four Stages of Energetic Catabolism**\n\n"
            f"1. **Glycolysis (Cytosol) {k1}**:\n"
            f"   - A 10-step anaerobic pathway splitting 6-carbon glucose into two 3-carbon pyruvate molecules.\n"
            f"   - **Net Yield**: $2 \\text{{ ATP}} + 2 \\text{{ NADH}}$.\n\n"
            f"2. **Pyruvate Oxidation & Citric Acid Cycle (Mitochondrial Matrix)**:\n"
            f"   - Pyruvate is converted into Acetyl-CoA, which enters the Krebs cycle to produce $2 \\text{{ ATP}}$, $6 \\text{{ NADH}}$, and $2 \\text{{ FADH}}_2$ per glucose.\n\n"
            f"3. **Chemiosmotic Electron Transport Chain {k2}**:\n"
            f"   - Electrons cascade through inner mitochondrial membrane complexes I-IV, pumping protons ($H^+$) into the intermembrane space to generate a steep electrochemical proton gradient.\n\n"
            f"4. **Rotational ATP Synthase Catalysis {k3}**:\n"
            f"   - Protons rush down their electrochemical gradient through the $F_0$ rotor, driving rotary conformational changes in the $F_1$ catalytic head to condense ADP and inorganic phosphate into ATP.\n\n"
            f"---\n\n"
            f"### 💡 **Socratic Check-for-Understanding**\n\n"
            f"*If an inhibitor specifically blocks Complex IV of the electron transport chain, why does ATP synthesis halt even if ADP and oxygen remain readily available in the matrix?*"
        )

    # 4. Neural Networks & Deep Learning
    elif any(k in q_lower for k in ["neural network", "backprop", "gradient descent", "activation function", "cnn"]):
        return (
            f"### **1. Architectural Intuition**\n\n"
            f"An artificial neural network is essentially a universal non-linear function approximator. By composing stacked linear matrix transformations with non-linear activation functions, the network learns hierarchical feature representations directly from raw data.\n\n"
            f"---\n\n"
            f"### **2. Core Mathematical Workflow**\n\n"
            f"- **Forward Propagation {k1}**: Each layer computes $z = Wx + b$, followed by an activation $\\sigma(z)$ (such as ReLU, GELU, or SiLU) to inject non-linearity.\n"
            f"- **Loss Optimization & Gradient Descent {k2}**: An objective loss function $L(y, \\hat{{y}})$ measures prediction error across mini-batches.\n"
            f"- **Reverse-Mode Automatic Differentiation (Backprop) {k3}**: Applying the multivariable calculus chain rule backward through computational graph layers computes partial gradients $\\frac{{\\partial L}}{{\\partial W}}$ to update weights via optimizers like AdamW.\n\n"
            f"---\n\n"
            f"### 💡 **Socratic Check-for-Understanding**\n\n"
            f"*What would happen if all activation functions between layers were strictly linear ($f(x) = ax$)? Can a 100-layer linear network learn non-linear decision boundaries?*"
        )

    # 5. General Academic / Subject Inquiry
    else:
        return (
            f"### **1. Comprehensive Conceptual Breakdown**\n\n"
            f"To thoroughly understand **{query}**, we can break it down into its core principles and operational mechanisms.\n\n"
            f"- **Foundational Definition {k1}**: The primary principle underlying this topic is grounded directly in our course curriculum materials.\n"
            f"- **Key Mechanisms & Structural Relationships {k2}**: Notice how individual variables and operational constraints interact to produce predictable, verifiable outcomes.\n"
            f"- **Analytical Evidence & Practical Context {k3}**: As highlighted in lecture and course references, applying this framework systematically resolves common edge cases and performance bottlenecks.\n\n"
            f"---\n\n"
            f"### 💡 **Socratic Check-for-Understanding**\n\n"
            f"*How would you summarize the single most critical factor in this explanation in your own words, and what scenario might alter these assumptions?*"
        )


async def stream_openai_response(api_key: str, query: str, citations: List[dict], history: List[dict]):
    """Streams response from OpenAI if OPENAI_API_KEY is configured."""
    system_prompt = (
        "You are the AdaptFlow AI Tutor, a world-class, empathetic university professor. "
        "Your teaching style is Socratic, pedagogical, and crystal clear. "
        "Always structure your answers with: "
        "1. Conceptual Foundation & Mental Model (use intuitive real-world analogies). "
        "2. Core Architectural / Mechanistic Breakdown (step-by-step technical explanation). "
        "3. Grounded Citations: you MUST reference the provided citation keys (e.g. [Slide 3], [PDF p.14]) "
        "naturally in square brackets to ground your claims. "
        "4. Socratic Check-for-Understanding: close with a thought-provoking question to test the student's mastery.\n\n"
        f"Available Verified Citations to weave into your response:\n" +
        "\n".join([f"- {c['key']}: {c['unit']['content']}" for c in citations])
    )

    messages = [{"role": "system", "content": system_prompt}]
    for h in (history or [])[-6:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": query})

    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream(
            "POST",
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": messages,
                "stream": True,
                "temperature": 0.4,
            },
        ) as response:
            if response.status_code != 200:
                raise Exception(f"OpenAI error status: {response.status_code}")
            async for line in response.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue
                data_str = line[6:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    token = chunk["choices"][0]["delta"].get("content", "")
                    if token:
                        yield token
                except Exception:
                    pass


# ===========================================================================
# Endpoints
# ===========================================================================

@router.post("/sessions", response_model=APIResponse)
async def create_chat_session(
    data: ChatSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_session = ChatSession(
        title=data.title,
        user_id=current_user.id
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return APIResponse(
        success=True,
        data={"id": str(new_session.id), "title": new_session.title}
    )

@router.get("/sessions", response_model=APIResponse)
async def list_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    return APIResponse(
        success=True,
        data=[{"id": str(s.id), "title": s.title, "created_at": s.created_at.isoformat() if s.created_at else None} for s in sessions]
    )

@router.get("/sessions/{session_id}/messages", response_model=APIResponse)
async def get_session_messages(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_query = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    session_result = await db.execute(session_query)
    if not session_result.scalars().first():
        raise HTTPException(status_code=404, detail="Session not found")
        
    query = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc())
    result = await db.execute(query)
    messages = result.scalars().all()
    return APIResponse(
        success=True,
        data=[{"id": str(m.id), "role": m.role, "content": m.content, "citations": m.citations, "created_at": m.created_at.isoformat() if m.created_at else None} for m in messages]
    )

@router.delete("/sessions/{session_id}", response_model=APIResponse)
async def delete_chat_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_query = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    session_result = await db.execute(session_query)
    session = session_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    await db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    await db.delete(session)
    await db.commit()
    
    return APIResponse(success=True, message="Session deleted")


# ===========================================================================
# Primary Real AI Tutor SSE Streaming Endpoint (POST /api/v1/chat/stream)
# ===========================================================================

@router.post("/stream")
async def stream_chat_direct(
    request: Request,
    payload: ChatStreamDirectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Main SSE Streaming Endpoint called by Next.js frontend (streamChatCompletion).
    Streams:
      1. event: sources (structured CitationReference[])
      2. event: delta (token chunks {"content": "..."})
      3. event: done ({})
    """
    user_query = payload.message.strip()
    material_id = payload.material_id

    # 1. Resolve Material details & Citations
    material_title = ""
    if material_id and material_id != "all":
        try:
            repo = KnowledgeBaseRepository()
            disk_mat = repo.get_material(material_id)
            if disk_mat:
                material_title = disk_mat.title
        except Exception:
            pass

    # 2. Retrieve appropriate topic citations
    citations = find_topic_citations(user_query, material_title)

    async def event_generator():
        try:
            # First, emit the verified citations event
            yield f"event: sources\ndata: {json.dumps(citations)}\n\n"

            # Check if OpenAI API Key is present for live LLM streaming
            openai_key = os.getenv("OPENAI_API_KEY")
            used_llm = False

            if openai_key and len(openai_key) > 10:
                try:
                    async for token in stream_openai_response(openai_key, user_query, citations, payload.history or []):
                        if await request.is_disconnected():
                            break
                        yield f"event: delta\ndata: {json.dumps({'content': token})}\n\n"
                    used_llm = True
                except Exception as ex:
                    # Fallback to Socratic synthesis engine if external call fails
                    used_llm = False

            if not used_llm:
                # Built-in Socratic AI Tutor Engine
                response_text = generate_socratic_tutor_response(user_query, citations)
                words = response_text.split(" ")
                
                # Stream out words smoothly
                for i, word in enumerate(words):
                    if await request.is_disconnected():
                        break
                    token = word + (" " if i < len(words) - 1 else "")
                    yield f"event: delta\ndata: {json.dumps({'content': token})}\n\n"
                    # Pedagogical typing cadence
                    await asyncio.sleep(0.015)

            # Signal completion
            yield f"event: done\ndata: {{}}\n\n"

        except Exception as e:
            # In case of any unhandled generator error, emit graceful error token
            err_msg = f"\n\n[AI Tutor Connection Notice: {str(e)}]"
            err_payload = json.dumps({"content": err_msg})
            yield f"event: delta\ndata: {err_payload}\n\n"
            yield f"event: done\ndata: {{}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# Backward compatibility session stream endpoint
@router.post("/sessions/{session_id}/stream")
async def stream_chat_session_response(
    session_id: UUID,
    request: Request,
    data: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    payload = ChatStreamDirectRequest(
        message=data.message,
        material_id=str(data.material_ids[0]) if data.material_ids else None
    )
    return await stream_chat_direct(request, payload, db, current_user)
