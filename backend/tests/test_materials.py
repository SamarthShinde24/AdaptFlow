import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.material import Material, MaterialType, ProcessingStatus
from app.models.knowledge_base import ModalityType, SourceTrackingMetadata, KnowledgeUnit
from app.db.repository import repository


@pytest.fixture(autouse=True)
def clean_repository():
    """Clear repository before each test."""
    repository._materials.clear()
    repository._knowledge_units.clear()
    repository._tasks.clear()
    yield


@pytest.mark.asyncio
async def test_health_and_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        root_res = await ac.get("/")
        assert root_res.status_code == 200
        assert "AdaptFlow" in root_res.json()["message"]


@pytest.mark.asyncio
async def test_upload_material_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        file_payload = ("syllabus.pdf", b"%PDF-1.4 sample content", "application/pdf")
        response = await ac.post(
            "/api/v1/materials/upload",
            data={
                "material_type": "textbook",
                "title": "Algorithms 101 Syllabus",
                "course_id": "CS102",
                "subject": "Computer Science",
            },
            files={"file": file_payload},
        )
        assert response.status_code == 202
        data = response.json()
        assert "task_id" in data
        assert data["material"]["title"] == "Algorithms 101 Syllabus"
        assert data["material"]["material_type"] == "textbook"
        material_id = data["material"]["id"]

        # Test listing materials
        list_res = await ac.get("/api/v1/materials")
        assert list_res.status_code == 200
        materials = list_res.json()["materials"]
        assert len(materials) == 1
        assert materials[0]["id"] == material_id

        # Test get material by ID
        detail_res = await ac.get(f"/api/v1/materials/{material_id}")
        assert detail_res.status_code == 200
        assert detail_res.json()["id"] == material_id


@pytest.mark.asyncio
async def test_knowledge_base_search_and_provenance():
    # Insert structured knowledge units with distinct source tracking
    mat_id = "test-mat-001"

    # 1. Textbook unit
    unit_pdf = KnowledgeUnit.create(
        material_id=mat_id,
        content="Photosynthesis occurs in chloroplasts and converts light into glucose.",
        modality=ModalityType.TEXT,
        source_tracking=SourceTrackingMetadata(
            material_id=mat_id,
            material_title="Biology Core Concepts",
            material_type=MaterialType.TEXTBOOK,
            chunk_index=1,
            page_number=45,
            chapter="Chapter 3: Bioenergetics",
            section="Section 3.1 Chloroplasts",
        ),
        tags=["biology", "photosynthesis"],
    )

    # 2. Lecture video unit
    unit_video = KnowledgeUnit.create(
        material_id=mat_id,
        content="Notice how the ATP synthase rotor rotates during proton flow.",
        modality=ModalityType.SPEECH_TRANSCRIPT,
        source_tracking=SourceTrackingMetadata(
            material_id=mat_id,
            material_title="Lecture 5: Cellular Respiration",
            material_type=MaterialType.LECTURE_VIDEO,
            chunk_index=2,
            start_time_seconds=750.0,
            end_time_seconds=810.0,
            start_timestamp="12:30",
            end_timestamp="13:30",
            speaker_label="Prof. Davis",
        ),
        tags=["biology", "atp"],
    )

    # 3. Slide deck unit
    unit_slide = KnowledgeUnit.create(
        material_id=mat_id,
        content="Electron Transport Chain: Complex I -> CoQ -> Complex III -> Cyt C -> Complex IV.",
        modality=ModalityType.SLIDE_CONTENT,
        source_tracking=SourceTrackingMetadata(
            material_id=mat_id,
            material_title="Cell Bio Slides",
            material_type=MaterialType.SLIDE_DECK,
            chunk_index=3,
            slide_number=18,
            slide_title="The ETC Pathway",
            is_speaker_notes=False,
        ),
        tags=["biology", "etc"],
    )

    repository.save_knowledge_units([unit_pdf, unit_video, unit_slide])

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Search for "chloroplasts"
        search_res = await ac.post(
            "/api/v1/knowledge/search",
            json={"query": "chloroplasts"},
        )
        assert search_res.status_code == 200
        results = search_res.json()["results"]
        assert len(results) == 1
        assert results[0]["source_tracking"]["page_number"] == 45
        assert results[0]["source_tracking"]["chapter"] == "Chapter 3: Bioenergetics"
        assert "p. 45" in results[0]["source_tracking"]["citation_label"]

        # Search filtered by video modality
        video_search = await ac.post(
            "/api/v1/knowledge/search",
            json={"modality": "speech_transcript"},
        )
        assert video_search.status_code == 200
        v_results = video_search.json()["results"]
        assert len(v_results) == 1
        assert v_results[0]["source_tracking"]["start_timestamp"] == "12:30"
        assert v_results[0]["source_tracking"]["speaker_label"] == "Prof. Davis"

        # Search filtered by slide number
        slide_search = await ac.post(
            "/api/v1/knowledge/search",
            json={"slide_number": 18},
        )
        assert slide_search.status_code == 200
        s_results = slide_search.json()["results"]
        assert len(s_results) == 1
        assert s_results[0]["source_tracking"]["slide_title"] == "The ETC Pathway"


@pytest.mark.asyncio
async def test_invalid_extension_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        file_payload = ("malicious.exe", b"binary content", "application/octet-stream")
        response = await ac.post(
            "/api/v1/materials/upload",
            data={
                "material_type": "textbook",
                "title": "Bad File",
            },
            files={"file": file_payload},
        )
        assert response.status_code == 400
        assert "Unsupported file extension" in response.json()["detail"]


@pytest.mark.asyncio
async def test_delete_material_and_units():
    mat_id = "test-mat-delete"
    mat = Material(
        id=mat_id,
        title="To be deleted",
        material_type=MaterialType.TEXTBOOK,
        filename="delete_me.pdf",
        file_path="/tmp/fake.pdf",
    )
    repository.save_material(mat)

    unit = KnowledgeUnit.create(
        material_id=mat_id,
        content="Transient knowledge unit",
        modality=ModalityType.TEXT,
        source_tracking=SourceTrackingMetadata(
            material_id=mat_id,
            material_title="To be deleted",
            material_type=MaterialType.TEXTBOOK,
            page_number=1,
        ),
    )
    repository.save_knowledge_units([unit])

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Verify material and knowledge unit exist
        detail_res = await ac.get(f"/api/v1/materials/{mat_id}")
        assert detail_res.status_code == 200

        units_res = await ac.get(f"/api/v1/knowledge/material/{mat_id}")
        assert units_res.status_code == 200
        assert len(units_res.json()) == 1

        # Delete material
        del_res = await ac.delete(f"/api/v1/materials/{mat_id}")
        assert del_res.status_code == 200

        # Verify not found now
        del_check = await ac.get(f"/api/v1/materials/{mat_id}")
        assert del_check.status_code == 404

        # Verify knowledge units were pruned
        units_check = await ac.get(f"/api/v1/knowledge/material/{mat_id}")
        assert units_check.status_code == 404


@pytest.mark.asyncio
async def test_task_status_polling_and_ingestion():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        file_payload = ("test_transcript.vtt", b"WEBVTT\n\n00:01.000 --> 00:05.000\nHello students", "text/vtt")
        upload_res = await ac.post(
            "/api/v1/materials/upload",
            data={
                "material_type": "lecture_video",
                "title": "Welcome Lecture",
                "course_id": "CS101",
            },
            files={"file": file_payload},
        )
        assert upload_res.status_code == 202
        task_id = upload_res.json()["task_id"]
        material_id = upload_res.json()["material"]["id"]

        # Poll task status
        status_res = await ac.get(f"/api/v1/tasks/{task_id}/status")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["task_id"] == task_id
        assert status_data["material_id"] == material_id
        assert status_data["status"] in [ProcessingStatus.PENDING, ProcessingStatus.PARSING, ProcessingStatus.INDEXED]


@pytest.mark.asyncio
async def test_generate_quiz_from_material_endpoint():
    mat_id = "test-bio-mat"
    mat = Material(
        id=mat_id,
        title="Intro to Biology",
        material_type=MaterialType.TEXTBOOK,
        filename="bio.pdf",
        file_path="/tmp/bio.pdf",
        file_size_bytes=1000,
        status=ProcessingStatus.INDEXED,
    )
    repository.save_material(mat)

    unit = KnowledgeUnit.create(
        material_id=mat_id,
        content="Glycolysis breaks down glucose into pyruvate with a net gain of 2 ATP.",
        modality=ModalityType.TEXT,
        source_tracking=SourceTrackingMetadata(
            material_id=mat_id,
            material_title=mat.title,
            material_type=mat.material_type,
            chunk_index=0,
            page_number=14,
            chapter="Chapter 4: Energy",
            citation_label="[Intro to Biology | p. 14]",
            content_hash="biohash123",
            token_count=16,
            confidence_score=0.99,
        ),
    )
    repository.save_knowledge_units([unit])

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test direct alias /api/quiz/generate
        res = await ac.post(
            "/api/quiz/generate",
            json={"file_id": mat.id, "question_count": 10},
        )
        assert res.status_code == 200
        questions = res.json()
        assert len(questions) == 10
        assert questions[0]["type"] == "multiple_choice"
        assert len(questions[0]["options"]) == 4
        assert questions[0]["correct_answer"] in [0, 1, 2, 3]
        assert "Intro to Biology" in questions[0]["question"]
        assert questions[0]["source_citation"] == "[Intro to Biology | p. 14]"

        # Test v1 endpoint /api/v1/quiz/generate
        v1_res = await ac.post(
            "/api/v1/quiz/generate",
            json={"file_id": mat.id, "question_count": 5},
        )
        assert v1_res.status_code == 200
        assert len(v1_res.json()) == 5


