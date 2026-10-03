# AdaptFlow Multimodal Backend 🎓📚🎥

A robust, production-ready **FastAPI** backend for **AdaptFlow** designed to ingest, parse, and structure multimodal educational study materials (**PDF textbooks**, **lecture videos**, and **slide decks**) into a unified knowledge base with fine-grained **source-tracking metadata and citation provenance**.

---

## 🌟 Key Capabilities

1. **Multimodal Study Material Ingestion**:
   - **PDF Textbooks & Academic Readings**: Extracts page numbers, table of contents / chapter bookmarks, and paragraph sections.
   - **Lecture Videos & Transcripts**: Parses timestamped speech transcripts (`.vtt`, `.srt`, video sidecars) with second-level accuracy (`start_time_seconds`, `end_time_seconds`) and speaker diarization tags.
   - **Slide Decks (PPTX & Presentations)**: Dissects slides into slide numbers, titles, bullet/shape content, tables, and distinguishes visual content from **presenter speaker notes**.

2. **High-Precision Source Tracking & Provenance**:
   - Every granular knowledge unit in the knowledge base is tagged with a complete `SourceTrackingMetadata` card.
   - Generates human-readable citation tags (e.g. `[Biology 101 | Chapter 3, p. 45]` or `[Lecture 04 @ 12:30-13:15, Speaker: Prof. Davis]`).
   - Generates SHA-256 content hashes and token estimates for caching and deduplication.

3. **Source-Aware Search & Knowledge Retrieval**:
   - Filter query results by material type (`textbook`, `lecture_video`, `slide_deck`).
   - Filter by modality (`text`, `speech_transcript`, `slide_content`, `speaker_notes`, `table`).
   - Narrow queries by specific textbook page ranges (`min_page`, `max_page`), slide numbers (`slide_number`), or video timestamp windows (`min_timestamp_seconds`, `max_timestamp_seconds`).

4. **Asynchronous Background Processing**:
   - Uses FastAPI `BackgroundTasks` with progress tracking (`PENDING` -> `PARSING` -> `INDEXED` / `FAILED`).
   - Real-time polling endpoint `/api/v1/tasks/{task_id}/status`.

---

## 📁 Project Architecture

```
adaptflow-backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── materials.py       # Upload, list, get, and delete study materials
│   │   │   ├── knowledge.py       # Query knowledge units with source provenance
│   │   │   └── tasks.py           # Polling background parsing progress
│   │   └── router.py              # Root API router mounting /api/v1
│   ├── core/
│   │   ├── config.py              # Application settings (Pydantic Settings)
│   │   └── logging.py             # Structured logger
│   ├── db/
│   │   └── repository.py          # Storage repository with persistent JSON backing
│   ├── models/
│   │   ├── material.py            # Material, MaterialType, ProcessingStatus
│   │   └── knowledge_base.py      # KnowledgeUnit, SourceTrackingMetadata, ModalityType
│   ├── schemas/
│   │   ├── material.py            # Upload & read schemas for materials
│   │   ├── knowledge.py           # Query & search response schemas
│   │   └── task.py                # Task status schema
│   ├── services/
│   │   ├── storage.py             # File storage isolation & extension validation
│   │   ├── ingestion.py           # Parsing orchestrator & knowledge indexer
│   │   └── parsers/
│   │       ├── base.py            # Abstract BaseParser interface
│   │       ├── pdf_parser.py      # PDF parser with TOC outline & page tracking
│   │       ├── video_parser.py    # Video transcript parser with timestamp tracking
│   │       ├── slide_parser.py    # PPTX parser with slide index & speaker notes
│   │       └── __init__.py        # ParserRegistry factory
│   └── main.py                    # FastAPI entrypoint, OpenAPI docs, and CORS
├── tests/
│   ├── test_materials.py          # End-to-end API integration tests
│   └── test_parsers.py            # Parser unit tests for PDF, video, and slides
├── storage/
│   ├── uploads/                   # Uploaded raw material files
│   └── data/                      # Persisted knowledge base data
├── requirements.txt
├── run_server.py
└── .env.example
```

---

## 🏷️ Source-Tracking Metadata Schema

Each `KnowledgeUnit` produced by AdaptFlow includes the following provenance structure:

```json
{
  "id": "c1f79b32-e015-46b7-a3d8-9df21f753549",
  "material_id": "8a32d1ef-417c-4861-8ff8-e1ad793540c1",
  "content": "The mitochondria is the powerhouse of the cell...",
  "modality": "text",
  "source_tracking": {
    "material_id": "8a32d1ef-417c-4861-8ff8-e1ad793540c1",
    "material_title": "Cell Biology 101",
    "material_type": "textbook",
    "chunk_index": 12,
    
    // Textbook locators
    "page_number": 42,
    "page_range": "p. 42",
    "chapter": "Chapter 4: Organelles",
    "section": "Section 4.3 Mitochondria",
    "paragraph_index": 3,
    
    // Video locators (populated for lecture_video)
    "start_time_seconds": null,
    "end_time_seconds": null,
    "start_timestamp": null,
    "end_timestamp": null,
    "speaker_label": null,
    
    // Slide deck locators (populated for slide_deck)
    "slide_number": null,
    "slide_title": null,
    "is_speaker_notes": false,
    
    // Common citation & traceability
    "citation_label": "[Cell Biology 101 | Chapter 4: Organelles, p. 42 (Section 4.3 Mitochondria)]",
    "content_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "token_count": 85,
    "confidence_score": 1.0
  },
  "tags": ["biology", "organelles"],
  "created_at": "2026-10-03T20:30:00"
}
```

---

## 🚀 Getting Started

### 1. Installation

Ensure Python 3.11+ is installed. Then install dependencies:

```bash
pip install -r requirements.txt
```

### 2. Run the Development Server

```bash
python run_server.py
```

The API will be available at:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 📡 API Reference & Example Workflows

### 1. Upload a PDF Textbook
```bash
curl -X POST "http://localhost:8000/api/v1/materials/upload" \
  -F "file=@biology_textbook.pdf" \
  -F "material_type=textbook" \
  -F "title=Campbell Biology 11th Edition" \
  -F "course_id=BIO101" \
  -F "subject=Biology"
```
**Response:**
```json
{
  "message": "Material successfully uploaded and queued for processing.",
  "material": {
    "id": "8a32d1ef-417c-4861-8ff8-e1ad793540c1",
    "title": "Campbell Biology 11th Edition",
    "material_type": "textbook",
    "status": "pending"
  },
  "task_id": "task_4f89d31acb82",
  "check_status_url": "/api/v1/tasks/task_4f89d31acb82/status"
}
```

### 2. Upload a Lecture Video / Subtitles
```bash
curl -X POST "http://localhost:8000/api/v1/materials/upload" \
  -F "file=@lecture_01.vtt" \
  -F "material_type=lecture_video" \
  -F "title=Lecture 1: Photosynthesis & Calvin Cycle" \
  -F "course_id=BIO101"
```

### 3. Upload a Slide Deck (.pptx)
```bash
curl -X POST "http://localhost:8000/api/v1/materials/upload" \
  -F "file=@week2_slides.pptx" \
  -F "material_type=slide_deck" \
  -F "title=Week 2: Cellular Structures" \
  -F "course_id=BIO101"
```

### 4. Check Background Ingestion Status
```bash
curl "http://localhost:8000/api/v1/tasks/task_4f89d31acb82/status"
```

### 5. Search the Knowledge Base with Provenance Filtering
Search for `"Calvin Cycle"` across all materials, or restrict to a specific page or slide range:
```bash
curl -X POST "http://localhost:8000/api/v1/knowledge/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Calvin Cycle",
    "material_type": "textbook",
    "min_page": 40,
    "max_page": 55,
    "limit": 10
  }'
```

Or search for explanations from lecture speech transcripts:
```bash
curl -X POST "http://localhost:8000/api/v1/knowledge/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "rubisco enzyme",
    "modality": "speech_transcript"
  }'
```

---

## 🧪 Running the Test Suite

Run pytest to verify the full suite of parser unit tests and API integration tests:

```bash
pytest
```
