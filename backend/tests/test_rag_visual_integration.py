import pytest
from app.models.knowledge_base import ModalityType, SourceTrackingMetadata, KnowledgeUnit
from app.models.material import Material, MaterialType
from app.services.rag import (
    RetrievedChunk,
    build_rag_context,
    build_citations_list,
    retrieve_from_repository,
    embed_query,
)
from app.db.repository import repository
from app.api.v1.chat import find_topic_citations, generate_socratic_tutor_response


def test_retrieved_chunk_visual_citation():
    """Verify RetrievedChunk formats visual citations with image path and pill label."""
    st = {
        "material_id": "mat_bio_1",
        "material_title": "Principles of Biology",
        "material_type": "textbook",
        "page_number": 42,
        "figure_index": 1,
        "caption": "Figure 3.2: Glycolysis pathway",
        "visual_type": "diagram",
        "image_stored_path": "/uploads/visuals/fig_glycolysis.png",
        "citation_label": "[🖼️ Figure 3.2 · PDF p.42]",
    }

    chunk = RetrievedChunk(
        id="chunk_vis_1",
        material_id="mat_bio_1",
        content="Diagram of the ten enzymatic steps of glycolysis in cytosol yielding 2 ATP.",
        modality="visual",
        summary="Glycolysis pathway diagram",
        tags=["biology", "visual", "diagram"],
        source_tracking=st,
        similarity=0.94,
    )

    citation = chunk.to_citation()
    assert citation["is_visual"] is True
    assert citation["image_stored_path"] == "/uploads/visuals/fig_glycolysis.png"
    assert citation["visual_type"] == "diagram"
    assert citation["citation_label"] == "[🖼️ Figure 3.2 · PDF p.42]"
    assert citation["page_number"] == 42


def test_build_rag_context_with_visuals():
    """Verify build_rag_context explicitly highlights visual diagrams for the LLM."""
    st_text = {
        "material_title": "Cell Biology",
        "material_type": "textbook",
        "citation_label": "[Cell Biology | p. 40]",
    }
    chunk_text = RetrievedChunk(
        id="c1",
        material_id="m1",
        content="Glucose is transported across cellular membranes via GLUT carriers.",
        modality="text",
        summary=None,
        tags=["transport"],
        source_tracking=st_text,
        similarity=0.88,
    )

    st_vis = {
        "material_title": "Principles of Biology",
        "material_type": "textbook",
        "citation_label": "[🖼️ Figure 3.2 · PDF p.42]",
        "caption": "Figure 3.2: Glycolysis pathway",
        "visual_type": "diagram",
        "image_stored_path": "/uploads/visuals/fig_glycolysis.png",
    }
    chunk_vis = RetrievedChunk(
        id="c2",
        material_id="m1",
        content="1. Visual Type: Diagram. 2. Concept: Glucose phosphorylation and cleavage into pyruvate.",
        modality="visual",
        summary=None,
        tags=["visual", "diagram"],
        source_tracking=st_vis,
        similarity=0.96,
    )

    context = build_rag_context([chunk_text, chunk_vis])
    assert "[Cell Biology | p. 40]" in context
    assert "[VISUAL DIAGRAM]" in context
    assert "[🖼️ Figure 3.2 · PDF p.42]" in context
    assert "/uploads/visuals/fig_glycolysis.png" in context
    assert "Visual Diagram Description:" in context


def test_repository_retrieval_visual_boosting():
    """Verify retrieve_from_repository retrieves visual units and boosts them for diagram queries."""
    mat_id = "mat_rag_boost_test"
    mat = Material(
        id=mat_id,
        title="Biochemistry",
        material_type=MaterialType.TEXTBOOK,
        filename="biochem.pdf",
        file_path="/tmp/biochem.pdf",
    )
    repository.save_material(mat)

    # 1. Text unit
    unit_text = KnowledgeUnit.create(
        material_id=mat_id,
        content="Glycolysis converts glucose into pyruvate with ATP generation.",
        modality=ModalityType.TEXT,
        source_tracking=SourceTrackingMetadata(
            material_id=mat_id,
            material_title="Biochemistry",
            material_type=MaterialType.TEXTBOOK,
            page_number=40,
            citation_label="[Biochemistry | p. 40]",
        ),
    )

    # 2. Visual diagram unit
    unit_vis = KnowledgeUnit.create(
        material_id=mat_id,
        content="Detailed visual diagram of the glycolysis pathway showing enzymes and ATP phosphorylation.",
        modality=ModalityType.VISUAL,
        source_tracking=SourceTrackingMetadata(
            material_id=mat_id,
            material_title="Biochemistry",
            material_type=MaterialType.TEXTBOOK,
            page_number=42,
            figure_index=1,
            caption="Figure 3.2: Glycolysis pathway",
            visual_type="diagram",
            image_stored_path="/uploads/visuals/glycolysis_boost.png",
            citation_label="[🖼️ Figure 3.2 · PDF p.42]",
        ),
    )
    unit_vis.embedding = embed_query(unit_vis.content)
    assert len(unit_vis.embedding) == 384

    repository.save_knowledge_units([unit_text, unit_vis])

    # Query with diagram intent
    results = retrieve_from_repository("Show me the diagram of glycolysis pathway", material_ids=[mat_id])
    assert len(results) >= 1
    # Top result should be the visual unit due to visual boosting
    top_chunk = results[0]
    assert top_chunk.modality == "visual"
    assert top_chunk.source_tracking["image_stored_path"] == "/uploads/visuals/glycolysis_boost.png"


def test_chat_visual_citation_and_explicit_mention():
    """Verify chat citations include visual pill and Socratic tutor explicitly references the figure."""
    citations = find_topic_citations("Explain the glycolysis pathway and show the diagram")
    assert len(citations) >= 1

    keys = [c["key"] for c in citations]
    assert any("Figure 3.2" in k or "🖼️" in k for k in keys)

    # First citation must have visual properties
    first = citations[0]["unit"]
    st = first["source_tracking"]
    assert st.get("image_stored_path") is not None or first.get("modality") == "visual"

    # AI tutor response should explicitly reference Figure 3.2 (PDF p.42)
    response = generate_socratic_tutor_response("Explain the glycolysis pathway and show the diagram", citations)
    assert "Figure 3.2 (PDF p.42)" in response
    assert "glycolysis pathway begins with" in response
