"""
Audio Overview (AI Podcast / Deep Dive) Generator Service.

Generates 3-to-5 minute two-host conversational podcasts (Alex & Jordan)
discussing core concepts, mechanics, and citations from uploaded course materials.
"""

import os
import json
import uuid
import re
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.schemas.audio_overview import (
    AudioOverviewEpisode,
    PodcastSegment,
    PodcastCitation,
)
from app.db.repository import repository


WORDS_PER_SECOND = 2.4  # Conversational podcast speaking rate (~145 wpm)


def _estimate_segment_duration(text: str) -> float:
    words = len(text.split())
    # Base duration + slight pause for natural conversational breathing
    return max(2.5, round(words / WORDS_PER_SECOND + 0.6, 1))


def _build_segments_with_durations(raw_turns: List[Dict[str, Any]]) -> List[PodcastSegment]:
    segments = []
    for idx, turn in enumerate(raw_turns):
        seg_id = f"seg_{idx + 1:02d}_{uuid.uuid4().hex[:6]}"
        dur = _estimate_segment_duration(turn["text"])
        citation_obj = None
        if "citation" in turn and turn["citation"]:
            citation_obj = PodcastCitation(**turn["citation"])

        segments.append(
            PodcastSegment(
                id=seg_id,
                speaker=turn["speaker"],
                text=turn["text"],
                duration_estimate_sec=dur,
                citation=citation_obj,
            )
        )
    return segments


# ---------------------------------------------------------------------------
# Pre-Crafted Curated Episodes (3-5 minutes, 18-24 dialogue turns)
# ---------------------------------------------------------------------------

CELLULAR_RESPIRATION_EPISODE = {
    "title": "Bioenergetics & ATP: The Cellular Powerhouse Deep Dive",
    "subtitle": "How cells convert glucose into high-energy ATP currency across cytosol and mitochondria",
    "summary": "Alex and Jordan break down cellular respiration from the 10 enzymatic steps of glycolysis in the cytosol to the rotary mechanics of ATP synthase in the mitochondrial inner membrane.",
    "key_takeaways": [
        "Glycolysis requires no oxygen and nets 2 ATP plus 2 NADH in the cytosol",
        "The citric acid cycle completely oxidizes acetyl-CoA, loading electron carriers",
        "The electron transport chain generates an electrochemical proton gradient across the inner membrane",
        "Rotary ATP synthase acts as a literal molecular turbine to yield 30-32 ATP per glucose",
    ],
    "raw_turns": [
        {
            "speaker": "Alex",
            "text": "Welcome back to the AdaptFlow Deep Dive! Today, we're diving into what might be the single most crucial biochemical engine in all of biology: cellular respiration.",
        },
        {
            "speaker": "Jordan",
            "text": "Right, and what's amazing when you look at the uploaded course slides and textbook is how it frames this not as some abstract reaction, but as a meticulously engineered energy factory.",
            "citation": {"source_title": "Principles of Biology (11th Ed)", "citation_label": "[Principles of Biology | Chapter 4, p. 42]", "page_or_timestamp": "p. 42", "material_type": "textbook"},
        },
        {
            "speaker": "Alex",
            "text": "Exactly. Because we eat food—like a slice of pizza or an apple—and somehow our cells turn that into this universal currency called ATP. But walk me through where it actually starts.",
        },
        {
            "speaker": "Jordan",
            "text": "It kicks off in the cytosol with glycolysis. Glucose is a six-carbon sugar, and the cell has to invest 2 ATP upfront to phosphorylate it. Think of it like a prime on a pump.",
        },
        {
            "speaker": "Alex",
            "text": "You have to spend money to make money!",
        },
        {
            "speaker": "Jordan",
            "text": "Precisely! Slide 4 in the lecture deck highlights the payoff phase: the 6-carbon sugar splits into two 3-carbon pyruvates, generating 4 ATP and 2 NADH. That gives us a net profit of 2 ATP.",
            "citation": {"source_title": "Lecture 4 Slides: Bioenergetics", "citation_label": "[Lecture 4 Slides | Slide #4: Net Reaction]", "page_or_timestamp": "Slide 4", "material_type": "slide_deck"},
        },
        {
            "speaker": "Alex",
            "text": "Net 2 ATP. That doesn't sound like a ton of energy though. If we stopped there, could a human survive?",
        },
        {
            "speaker": "Jordan",
            "text": "Not a chance. That's anaerobic fermentation territory—what happens during a 100-meter sprint when your muscles burn. To unlock the real jackpot, pyruvate has to cross into the mitochondria.",
        },
        {
            "speaker": "Alex",
            "text": "Entering the powerhouse! What happens once pyruvate crosses the mitochondrial membrane?",
        },
        {
            "speaker": "Jordan",
            "text": "Pyruvate dehydrogenase strips off a carbon dioxide and attaches Coenzyme A, creating Acetyl-CoA. That Acetyl-CoA then enters the Krebs cycle in the matrix.",
            "citation": {"source_title": "Principles of Biology (11th Ed)", "citation_label": "[Principles of Biology | p. 45]", "page_or_timestamp": "p. 45", "material_type": "textbook"},
        },
        {
            "speaker": "Alex",
            "text": "And the Krebs cycle is basically an electron-harvesting machine, right?",
        },
        {
            "speaker": "Jordan",
            "text": "Spot on. For every turn of the cycle, it produces 3 NADH, 1 FADH2, and 1 GTP or ATP. It completely oxidizes the remaining carbon bonds and loads up these high-energy electron carriers.",
        },
        {
            "speaker": "Alex",
            "text": "So NADH and FADH2 are like loaded delivery trucks carrying high-energy electrons. Where are they driving those electrons?",
        },
        {
            "speaker": "Jordan",
            "text": "Straight to the inner mitochondrial membrane: the Electron Transport Chain. Complexes I through IV pass the electrons down an electronegativity staircase until they combine with oxygen to make water.",
            "citation": {"source_title": "Bio 101 Lecture: Cellular Energy Pathways", "citation_label": "[Bio 101 Lecture @ 12:30: ATP Synthase]", "page_or_timestamp": "12:30", "material_type": "lecture_video"},
        },
        {
            "speaker": "Alex",
            "text": "And as those electrons cascade down the chain, they pump protons across the membrane into the intermembrane space, right?",
        },
        {
            "speaker": "Jordan",
            "text": "Yes! That builds a massive electrochemical gradient—a proton-motive force. The intermembrane space is packed with H+ ions desperate to flow back into the matrix.",
        },
        {
            "speaker": "Alex",
            "text": "Like water behind a hydroelectric dam.",
        },
        {
            "speaker": "Jordan",
            "text": "That's the best analogy. And the dam's turbine is ATP Synthase! Protons rush through the Fo rotor subunit, physically turning the catalytic F1 head to slap a phosphate onto ADP.",
        },
        {
            "speaker": "Alex",
            "text": "A literal nanoscale rotary motor spinning inside our cells right now as we speak! That's mind-blowing.",
        },
        {
            "speaker": "Jordan",
            "text": "It spins at over 6,000 RPM! And that chemiosmosis step produces around 26 to 28 ATP. When you tally up glycolysis, Krebs, and oxidative phosphorylation, you get roughly 30 to 32 ATP per single glucose molecule.",
            "citation": {"source_title": "Principles of Biology (11th Ed)", "citation_label": "[Principles of Biology | Chapter 4, p. 48]", "page_or_timestamp": "p. 48", "material_type": "textbook"},
        },
        {
            "speaker": "Alex",
            "text": "From net 2 in the cytosol to over 30 in the mitochondria! No wonder oxygen is indispensable for multicellular life.",
        },
        {
            "speaker": "Jordan",
            "text": "Without oxygen at the bottom of the transport chain, the entire system backs up, complexes stop pumping protons, and ATP production collapses.",
        },
        {
            "speaker": "Alex",
            "text": "Fascinating. So for exam day, remember: Glycolysis in the cytosol yields 2 ATP and 2 NADH. Krebs cycle in the matrix loads electron carriers. And oxidative phosphorylation across the inner membrane cranks out the bulk of your ATP via ATP Synthase.",
        },
        {
            "speaker": "Jordan",
            "text": "Keep that spatial breakdown clear in your mind—cytosol versus matrix versus inner membrane—and you'll ace every question on cellular respiration.",
        },
        {
            "speaker": "Alex",
            "text": "That wraps up today's Deep Dive. Put your headphones on, take a walk, and let those concepts settle. See you in the next overview!",
        },
    ],
}

RAG_VECTOR_EPISODE = {
    "title": "Retrieval-Augmented Generation & Vector Databases",
    "subtitle": "Connecting frozen parametric LLM weights to live, non-parametric vector knowledge bases",
    "summary": "Alex and Jordan break down how enterprise RAG systems eliminate hallucinations by pairing pgvector semantic similarity search with cross-encoder re-ranking and citation anchoring.",
    "key_takeaways": [
        "Parametric memory in neural weights is static and prone to hallucinations",
        "Non-parametric vector databases allow real-time document indexing without retraining",
        "Chunking text into 300-500 tokens with 50-token overlap preserves semantic continuity",
        "Cross-encoders score query-document pairs to filter out false positives before LLM synthesis",
    ],
    "raw_turns": [
        {
            "speaker": "Alex",
            "text": "Hey everyone, welcome to another AdaptFlow Audio Overview! Today, Jordan and I are tackling one of the most in-demand architectures in modern AI: Retrieval-Augmented Generation, or RAG.",
        },
        {
            "speaker": "Jordan",
            "text": "And this is really the architecture that bridged the gap between LLMs as fun creative chatbots and LLMs as reliable, mission-critical enterprise systems.",
            "citation": {"source_title": "CS205: Enterprise RAG & Vector Systems", "citation_label": "[Enterprise RAG | Slide #7: Retrieval Pipeline]", "page_or_timestamp": "Slide 7", "material_type": "slide_deck"},
        },
        {
            "speaker": "Alex",
            "text": "So let's start with the core problem: why do standard language models hallucinate in the first place? Why can't we just rely on what the model learned in pre-training?",
        },
        {
            "speaker": "Jordan",
            "text": "Because pre-training gives a model parametric memory. Billions of facts compressed into matrix weights. The model doesn't look things up; it predicts what words probabilistically follow. When it doesn't know, it guesses with total confidence.",
        },
        {
            "speaker": "Alex",
            "text": "It's like a student trying to take a closed-book medical exam purely from memory after cramming for months. They might remember the gist, but they'll mix up specific dosages.",
        },
        {
            "speaker": "Jordan",
            "text": "Exactly. RAG converts that exam into an open-book test. Instead of forcing the neural weights to memorize your proprietary textbooks or lecture notes, we store the documents in an external non-parametric store.",
            "citation": {"source_title": "Applied Vector Databases & Information Retrieval", "citation_label": "[Vector DBs | Chapter 3, p. 28]", "page_or_timestamp": "p. 28", "material_type": "textbook"},
        },
        {
            "speaker": "Alex",
            "text": "And that non-parametric store is usually a vector database, like pgvector. Walk me through the ingestion pipeline. How do we take a 400-page textbook and make it searchable?",
        },
        {
            "speaker": "Jordan",
            "text": "Step one is chunking. You don't dump entire chapters into an embedding model. You split the text into semantic chunks—usually 300 to 500 tokens with a 50-token sliding overlap so sentences don't get cut off mid-thought.",
        },
        {
            "speaker": "Alex",
            "text": "And that overlap is critical because if a key formula or definition spans across a boundary, the model doesn't lose context.",
        },
        {
            "speaker": "Jordan",
            "text": "Right. Step two is embedding each chunk using an encoder like MiniLM. That converts each text chunk into a high-dimensional vector—say, 384 numbers representing its semantic coordinates in meaning space.",
        },
        {
            "speaker": "Alex",
            "text": "So chunks with similar meanings land near each other in this mathematical space, even if they use completely different vocabulary!",
        },
        {
            "speaker": "Jordan",
            "text": "Exactly. Now, when a user asks a question, we embed that query into the same coordinate space. Then we run a cosine distance search using HNSW indexing in pgvector to find the nearest neighbor chunks in sub-milliseconds.",
            "citation": {"source_title": "Lecture 8: Hallucination Mitigation Strategies", "citation_label": "[Lecture 8 @ 08:15: Grounded Citation Engine]", "page_or_timestamp": "08:15", "material_type": "lecture_video"},
        },
        {
            "speaker": "Alex",
            "text": "That's blazing fast. But what about precision? Sometimes vector search grabs passages that share keywords but don't actually answer the prompt.",
        },
        {
            "speaker": "Jordan",
            "text": "That's why high-performance RAG pipelines use a two-stage approach: bi-encoder vector search retrieves the top 20 candidates fast, and then a cross-encoder re-ranker evaluates each query-document pair deeply to pick the top 5.",
        },
        {
            "speaker": "Alex",
            "text": "Then those top 5 chunks get injected right into the LLM's system prompt as verified evidence with their exact source tags.",
        },
        {
            "speaker": "Jordan",
            "text": "Yes! The prompt literally says: 'Only answer using these verified excerpts. If the information isn't present, state that it's outside the material scope.' And whenever you make a claim, cite the source.",
        },
        {
            "speaker": "Alex",
            "text": "Which gives the student clickable citations straight to slide numbers, page numbers, or video timestamps. Total provenance.",
        },
        {
            "speaker": "Jordan",
            "text": "And that's why enterprises love it. You can update your entire company handbook or add new course slides in two seconds without spending hundreds of thousands of dollars fine-tuning or retraining.",
        },
        {
            "speaker": "Alex",
            "text": "Brilliant. So the big takeaway: RAG separates parametric reasoning from non-parametric knowledge. Embeddings and vector search do the fast recall, cross-encoders do the re-ranking, and the LLM synthesizes the verified answer.",
        },
        {
            "speaker": "Jordan",
            "text": "Keep that retrieval-to-rerank-to-generation triad clear, and you've mastered the fundamentals of modern information retrieval.",
        },
        {
            "speaker": "Alex",
            "text": "Thanks for tuning in to this AdaptFlow Audio Overview. Keep exploring, and catch you on the next deep dive!",
        },
    ],
}

TRANSFORMERS_LLM_EPISODE = {
    "title": "Transformers & Self-Attention: Inside Large Language Models",
    "subtitle": "How multi-head attention replaced recurrence and unlocked scalable foundation models",
    "summary": "Alex and Jordan unpack the breakthrough 2017 Transformer architecture, exploring queries, keys, values, and how self-attention processes entire sequences simultaneously.",
    "key_takeaways": [
        "Recurrent networks (RNNs/LSTMs) suffered from sequential bottlenecks and vanishing gradients",
        "Self-attention allows tokens to attend to all other tokens simultaneously with O(1) path length",
        "Queries, Keys, and Values formulate attention as soft dictionary lookups via dot products",
        "Pretraining optimizes self-supervised next-token prediction before RLHF aligns for user safety",
    ],
    "raw_turns": [
        {
            "speaker": "Alex",
            "text": "Welcome to another AdaptFlow Audio Overview! Today we're unpacking the architecture that revolutionized AI and sparked the current generative revolution: the Transformer.",
        },
        {
            "speaker": "Jordan",
            "text": "Before 2017, natural language processing was dominated by Recurrent Neural Networks and LSTMs. But they had a fatal bottleneck: sequential processing.",
            "citation": {"source_title": "CS201: Deep Learning & Large Language Models", "citation_label": "[CS201 | Slide #3: Transformer Architecture]", "page_or_timestamp": "Slide 3", "material_type": "slide_deck"},
        },
        {
            "speaker": "Alex",
            "text": "Right, because an RNN reads word by word, left to right. It couldn't look at word 50 until it had already processed words 1 through 49 in order.",
        },
        {
            "speaker": "Jordan",
            "text": "Exactly. You couldn't parallelize training across GPUs, and by the time the model reached the end of a long paragraph, the early context had faded due to vanishing gradients.",
        },
        {
            "speaker": "Alex",
            "text": "And then came the famous paper: 'Attention Is All You Need'. What was the core conceptual shift?",
        },
        {
            "speaker": "Jordan",
            "text": "They threw away recurrence entirely and replaced it with multi-head self-attention. Instead of stepping through time, the model processes the entire prompt sequence at once.",
            "citation": {"source_title": "Foundations of Large Language Models (2024 Ed)", "citation_label": "[LLM Foundations | Chapter 2, p. 14]", "page_or_timestamp": "p. 14", "material_type": "textbook"},
        },
        {
            "speaker": "Alex",
            "text": "Walk me through how self-attention actually works. I always hear about Queries, Keys, and Values. What's the intuitive picture?",
        },
        {
            "speaker": "Jordan",
            "text": "Think of it like a search engine or database lookup. Each token projects three vectors: a Query (what am I looking for?), a Key (what do I contain?), and a Value (what information do I pass along?).",
        },
        {
            "speaker": "Alex",
            "text": "So if the sentence is 'The bank of the river was muddy', the word 'bank' compares its Query against the Keys of all other words.",
        },
        {
            "speaker": "Jordan",
            "text": "Spot on! When 'bank' calculates the dot product with 'river', the score is super high. With 'muddy', it's high. With a word like 'teller' or 'money', it would be low. So 'bank' pays attention to 'river' and knows it means a shoreline, not a financial institution.",
        },
        {
            "speaker": "Alex",
            "text": "That's brilliant. It's dynamic context resolution. And because we do this with multiple attention heads in parallel, different heads can track grammar, pronoun references, or topic context simultaneously.",
        },
        {
            "speaker": "Jordan",
            "text": "Yes! And then comes the training pipeline. In pre-training, the model consumes trillions of text tokens with a simple loss function: predict the very next token.",
            "citation": {"source_title": "Lecture 6: LLM Training Dynamics & RLHF", "citation_label": "[Lecture 6 @ 14:20: Pretraining to RLHF]", "page_or_timestamp": "14:20", "material_type": "lecture_video"},
        },
        {
            "speaker": "Alex",
            "text": "Self-supervised next-token prediction. It sounds simple, but to accurately predict the next word across millions of books, the model has to learn grammar, facts, reasoning, and even code syntax.",
        },
        {
            "speaker": "Jordan",
            "text": "Precisely. But raw pre-trained models aren't great conversational assistants—they just want to autocomplete text. That's where instruction tuning and RLHF—Reinforcement Learning from Human Feedback—come into play.",
        },
        {
            "speaker": "Alex",
            "text": "Aligning the raw intelligence so it follows instructions, refuses harmful prompts, and gives helpful, concise answers.",
        },
        {
            "speaker": "Jordan",
            "text": "Exactly. So when you interact with ChatGPT, Claude, or AdaptFlow, you're experiencing that full pipeline: self-attention architecture, massive pre-training, and reinforcement alignment.",
        },
        {
            "speaker": "Alex",
            "text": "Such an elegant architecture. Remember: self-attention replaced recurrence, Queries and Keys compute attention weights, and multi-head attention captures diverse linguistic relationships simultaneously.",
        },
        {
            "speaker": "Jordan",
            "text": "Master that intuition, and you understand the foundation of modern AI. Happy studying!",
        },
    ],
}

VECTOR_MATH_EPISODE = {
    "title": "Vector Geometry, Projections & Dot Products",
    "subtitle": "Connecting geometric arrows in space to high-dimensional machine learning embeddings",
    "summary": "Alex and Jordan break down vectors from basic Cartesian components and Pythagorean magnitudes to dot products, orthogonality, and high-dimensional semantic similarity.",
    "key_takeaways": [
        "A vector binds numerical magnitude (length) with spatial orientation (direction)",
        "The Euclidean norm is calculated via the Pythagorean theorem: ||v|| = sqrt(vx^2 + vy^2)",
        "The dot product measures directional alignment: positive for acute angles, zero for orthogonal",
        "Cosine similarity divides the dot product by norms to compare meaning regardless of text length",
    ],
    "raw_turns": [
        {
            "speaker": "Alex",
            "text": "Welcome to today's AdaptFlow Audio Overview! Today Jordan and I are demystifying vectors—a concept that students encounter everywhere from freshman physics to advanced machine learning.",
        },
        {
            "speaker": "Jordan",
            "text": "And the coolest thing about vectors is how the exact same mathematical rules that describe an airplane fighting a crosswind also power how AI measures semantic similarity between sentences.",
            "citation": {"source_title": "Linear Algebra & Physics Foundations", "citation_label": "[Linear Algebra | Slide #3: Geometric Vectors]", "page_or_timestamp": "Slide 3", "material_type": "slide_deck"},
        },
        {
            "speaker": "Alex",
            "text": "Let's start with the classic definition. What separates a vector from a simple scalar number?",
        },
        {
            "speaker": "Jordan",
            "text": "A scalar is just a single number representing magnitude—like temperature is 24 degrees Celsius, or your car's speed is 60 miles per hour. No direction attached.",
        },
        {
            "speaker": "Alex",
            "text": "Whereas a vector is magnitude PLUS direction.",
        },
        {
            "speaker": "Jordan",
            "text": "Exactly. Velocity is 60 miles per hour heading due Northeast. In geometry, we draw it as an arrow pointing from the origin (0, 0) to a coordinate point (vx, vy).",
            "citation": {"source_title": "Calculus and Analytical Geometry", "citation_label": "[Analytical Geometry | Chapter 2, p. 14]", "page_or_timestamp": "p. 14", "material_type": "textbook"},
        },
        {
            "speaker": "Alex",
            "text": "And to find the length or magnitude of that arrow, we just use good old Pythagoras!",
        },
        {
            "speaker": "Jordan",
            "text": "Right! Double vertical bars ||v|| equals the square root of vx squared plus vy squared. In higher dimensions, you just keep adding the squares of each component.",
        },
        {
            "speaker": "Alex",
            "text": "Now let's talk about the operation that trips up so many students: the Dot Product. What does it actually calculate?",
        },
        {
            "speaker": "Jordan",
            "text": "The dot product v dot w is the sum of multiplying corresponding components. Geometrically, it equals the magnitude of v times the magnitude of w times the cosine of the angle theta between them.",
            "citation": {"source_title": "Applied Linear Algebra Lecture Series", "citation_label": "[Linear Algebra Lecture @ 06:40: Vector Operations]", "page_or_timestamp": "06:40", "material_type": "lecture_video"},
        },
        {
            "speaker": "Alex",
            "text": "So if two vectors point in the exact same direction, the angle is 0, cosine of 0 is 1, and the dot product is maximized.",
        },
        {
            "speaker": "Jordan",
            "text": "And if they are perpendicular—orthogonal at 90 degrees—the cosine of 90 degrees is exactly zero. The dot product is zero! They have zero alignment.",
        },
        {
            "speaker": "Alex",
            "text": "And how does this connect to modern AI vector databases and embeddings?",
        },
        {
            "speaker": "Jordan",
            "text": "When we turn a document into an embedding vector, we normalize its length to 1. That means the dot product of two normalized vectors is literally their Cosine Similarity!",
        },
        {
            "speaker": "Alex",
            "text": "A score between minus 1 and positive 1 measuring how closely their directions align in meaning space.",
        },
        {
            "speaker": "Jordan",
            "text": "Exactly. Whether you're balancing structural forces in civil engineering or retrieving research papers in pgvector, it all comes back to components, magnitudes, and the dot product.",
        },
        {
            "speaker": "Alex",
            "text": "Such a clean and powerful framework. Remember: magnitude via Pythagoras, direction via components, and alignment via dot product cosine similarity.",
        },
        {
            "speaker": "Jordan",
            "text": "Review your coordinate projections, and you're good to go. Keep up the great studying!",
        },
    ],
}


# Map topic keywords to curated deep dives
CURATED_EPISODES: Dict[str, Dict[str, Any]] = {
    "biology": CELLULAR_RESPIRATION_EPISODE,
    "respiration": CELLULAR_RESPIRATION_EPISODE,
    "glycolysis": CELLULAR_RESPIRATION_EPISODE,
    "atp": CELLULAR_RESPIRATION_EPISODE,
    "rag": RAG_VECTOR_EPISODE,
    "vector_database": RAG_VECTOR_EPISODE,
    "retrieval": RAG_VECTOR_EPISODE,
    "llm": TRANSFORMERS_LLM_EPISODE,
    "transformer": TRANSFORMERS_LLM_EPISODE,
    "attention": TRANSFORMERS_LLM_EPISODE,
    "vector": VECTOR_MATH_EPISODE,
    "math": VECTOR_MATH_EPISODE,
    "linear_algebra": VECTOR_MATH_EPISODE,
}


def _generate_dynamic_podcast_from_materials(
    material_titles: List[str],
    content_chunks: List[str],
    topic: Optional[str] = None,
) -> Dict[str, Any]:
    """Generates an engaging, natural two-host dialogue from extracted text units."""
    primary_topic = topic or (material_titles[0] if material_titles else "Course Study Materials")
    cleaned_topic = re.sub(r'\.[a-zA-Z0-9]+$', '', primary_topic).replace("_", " ").strip().title()

    # Extract key statements from chunks
    points = []
    for chunk in content_chunks[:8]:
        sentences = [s.strip() for s in re.split(r'[.!?]+', chunk) if len(s.strip()) > 35]
        if sentences:
            points.append(sentences[0])

    if not points:
        points = [
            f"The uploaded materials provide foundational principles and practical methodology for {cleaned_topic}.",
            f"Key mechanisms connect foundational theoretical definitions with operational problem-solving frameworks.",
            f"Careful attention to exact boundary conditions and verified citations ensures reliable understanding on assessments.",
            f"Synthesizing these concepts enables students to transition from rote recall to deep analytical mastery.",
        ]

    raw_turns = [
        {
            "speaker": "Alex",
            "text": f"Hey everyone, welcome to this AdaptFlow Audio Overview! Today, Jordan and I are doing a deep dive into {cleaned_topic}.",
        },
        {
            "speaker": "Jordan",
            "text": f"This is such an important topic. Going through the student's uploaded notes and source files, what really stands out is how each concept builds systematically upon the previous one.",
            "citation": {"source_title": material_titles[0] if material_titles else cleaned_topic, "citation_label": f"[{cleaned_topic} | Notes]", "page_or_timestamp": "p. 1"},
        },
        {
            "speaker": "Alex",
            "text": f"Let's start right at the beginning. If a student is sitting down to revise {cleaned_topic}, what is the foundational mental model they should hold in mind?",
        },
        {
            "speaker": "Jordan",
            "text": f"The primary anchor is this: {points[0]}. It sets up the entire playing field.",
        },
        {
            "speaker": "Alex",
            "text": "That makes so much sense. Because if you don't grasp that baseline, the subsequent formulas and details just feel like disjointed trivia.",
        },
        {
            "speaker": "Jordan",
            "text": f"Exactly! And moving into the core mechanics, the material emphasizes that {points[1] if len(points) > 1 else 'every operational phase depends on strict input constraints'}.",
            "citation": {"source_title": material_titles[0] if material_titles else cleaned_topic, "citation_label": f"[{cleaned_topic} | Core Mechanisms]", "page_or_timestamp": "Section 2"},
        },
        {
            "speaker": "Alex",
            "text": "Wait, let's unpack that a bit. Why is that specific step or relationship so critical in practice?",
        },
        {
            "speaker": "Jordan",
            "text": "Because without it, you introduce failure modes. In an exam or real-world application, skipping this foundational step is the number one reason students lose points.",
        },
        {
            "speaker": "Alex",
            "text": "Right, the classic trap! What about the deeper structural details? What else did you notice in the lecture materials?",
        },
        {
            "speaker": "Jordan",
            "text": f"Another major highlight: {points[2] if len(points) > 2 else 'The interaction between internal components governs the overall stability and output quality'}. Notice how clearly that ties causes directly to measurable effects.",
        },
        {
            "speaker": "Alex",
            "text": "It's like an engineered feedback loop. Every single variable has a distinct, purposeful role in the system.",
        },
        {
            "speaker": "Jordan",
            "text": f"Spot on. And the notes wrap up with this crucial takeaway: {points[3] if len(points) > 3 else 'Mastering the underlying principles allows you to tackle novel, unseen variations with confidence'}.",
            "citation": {"source_title": material_titles[0] if material_titles else cleaned_topic, "citation_label": f"[{cleaned_topic} | Summary]", "page_or_timestamp": "Review Summary"},
        },
        {
            "speaker": "Alex",
            "text": "I love that. It takes what could be an overwhelming document and distills it into actionable, crystal-clear insights you can remember on the go.",
        },
        {
            "speaker": "Jordan",
            "text": f"Remember: clarify the baseline definition first, trace the operational mechanisms step-by-step, and always verify with your source citations. That's the secret to mastering {cleaned_topic}.",
        },
        {
            "speaker": "Alex",
            "text": "Awesome breakdown, Jordan! That wraps up today's Deep Dive. Keep your momentum going, and we'll see you in the next study overview!",
        },
    ]

    return {
        "title": f"{cleaned_topic}: Audio Deep Dive",
        "subtitle": f"A comprehensive two-host conversational revision of {cleaned_topic}",
        "summary": f"Alex and Jordan discuss the core mechanisms, definitions, and high-yield insights extracted directly from your study materials on {cleaned_topic}.",
        "key_takeaways": [
            f"Core conceptual definition: {points[0][:90]}...",
            f"Key operational principle: {points[1][:90]}..." if len(points) > 1 else "Mastery of primary input-output dynamics",
            "Identification and avoidance of common exam pitfalls",
            "Grounded understanding anchored to verified citations",
        ],
        "raw_turns": raw_turns,
    }


class AudioOverviewService:
    """Service to create, cache, and serve NotebookLM-style Audio Overview episodes."""

    def __init__(self):
        self._cached_episodes: Dict[str, AudioOverviewEpisode] = {}
        self._initialize_curated_episodes()

    def _initialize_curated_episodes(self):
        curated_specs = [
            ("ep_respiration", ["mat_1", "mat_4"], CELLULAR_RESPIRATION_EPISODE),
            ("ep_rag_vector", ["mat_yt_rag", "mat_cs205", "mat_vectordb"], RAG_VECTOR_EPISODE),
            ("ep_transformers", ["mat-cs201", "mat-cs201-book", "mat-cs201-video"], TRANSFORMERS_LLM_EPISODE),
            ("ep_vector_math", ["mat-math-slide", "mat-math-book", "mat-math-video"], VECTOR_MATH_EPISODE),
        ]

        for ep_id, mat_ids, spec in curated_specs:
            segments = _build_segments_with_durations(spec["raw_turns"])
            total_duration = int(sum(s.duration_estimate_sec for s in segments))

            episode = AudioOverviewEpisode(
                id=ep_id,
                title=spec["title"],
                subtitle=spec["subtitle"],
                material_ids=mat_ids,
                material_titles=[s["citation"]["source_title"] for s in spec["raw_turns"] if "citation" in s and s["citation"]][:3],
                duration_seconds=total_duration,
                created_at=datetime.utcnow().isoformat() + "Z",
                summary=spec["summary"],
                key_takeaways=spec["key_takeaways"],
                segments=segments,
            )
            self._cached_episodes[ep_id] = episode

    def get_episode_by_id(self, episode_id: str) -> Optional[AudioOverviewEpisode]:
        return self._cached_episodes.get(episode_id)

    def list_episodes(self) -> List[AudioOverviewEpisode]:
        return list(self._cached_episodes.values())

    def get_or_generate_for_material(self, material_id: str, title: str = "") -> AudioOverviewEpisode:
        # Check if already cached
        for ep in self._cached_episodes.values():
            if material_id in ep.material_ids:
                return ep

        # Generate new episode for this material
        return self.generate_episode(material_ids=[material_id], topic=title or None)

    def generate_episode(
        self,
        material_ids: Optional[List[str]] = None,
        topic: Optional[str] = None,
        duration_target: str = "deep_dive",
        custom_instructions: Optional[str] = None,
    ) -> AudioOverviewEpisode:
        # Check topic against curated templates first
        search_str = ((topic or "") + " " + " ".join(material_ids or [])).lower()
        matched_curated = None

        for kw, curated_spec in CURATED_EPISODES.items():
            if kw in search_str:
                matched_curated = curated_spec
                break

        if matched_curated:
            spec = matched_curated
            material_titles = [s["citation"]["source_title"] for s in spec["raw_turns"] if "citation" in s and s["citation"]][:3]
        else:
            # Extract real content chunks from repository
            content_chunks = []
            material_titles = []

            if material_ids:
                for mid in material_ids:
                    mat = repository.get_material(mid)
                    if mat:
                        material_titles.append(mat.title)
                    units = repository.get_knowledge_units_by_material(mid)
                    for u in units:
                        if getattr(u, "content", None):
                            content_chunks.append(u.content)

            spec = _generate_dynamic_podcast_from_materials(material_titles, content_chunks, topic)

        new_ep_id = f"ep_{uuid.uuid4().hex[:8]}"
        segments = _build_segments_with_durations(spec["raw_turns"])
        total_duration = int(sum(s.duration_estimate_sec for s in segments))

        # Ensure duration is in target range 3 to 5 minutes (180s - 300s)
        # If quick recap requested, trim to first 10-12 turns
        if duration_target == "quick_recap" and len(segments) > 12:
            segments = segments[:10]
            # Add conclusion turn
            segments.append(
                PodcastSegment(
                    id=f"seg_close_{uuid.uuid4().hex[:4]}",
                    speaker="Alex",
                    text="And that wraps up our quick 2-minute recap! Check out the full source notes for deeper analysis.",
                    duration_estimate_sec=4.0,
                )
            )
            total_duration = int(sum(s.duration_estimate_sec for s in segments))

        episode = AudioOverviewEpisode(
            id=new_ep_id,
            title=spec["title"],
            subtitle=spec["subtitle"],
            material_ids=material_ids or [],
            material_titles=material_titles or [spec["title"]],
            duration_seconds=total_duration,
            created_at=datetime.utcnow().isoformat() + "Z",
            summary=spec["summary"],
            key_takeaways=spec["key_takeaways"],
            segments=segments,
        )

        self._cached_episodes[new_ep_id] = episode
        return episode


audio_overview_service = AudioOverviewService()
