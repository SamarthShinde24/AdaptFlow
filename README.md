# AdaptFlow 🎓📚🎥
> **AI-Powered Multimodal Adaptive Learning Platform with Verified Source Provenance**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org/)

AdaptFlow is an intelligent educational platform that ingests multimodal course materials—such as **PDF textbooks**, **lecture video transcripts**, and **presentation slide decks**—and structures them into a unified, source-grounded knowledge base. Students can dialogue with an AI tutor backed by verified page and timestamp citations, as well as test their knowledge through adaptive assessments generated directly from their uploaded files.

---

## 🌟 Key Features

### 1. Multimodal Study Ingestion & Knowledge Base
- **PDF Textbooks & Academic Readings**: Automatically extracts pages, outlines, and chapter bookmarks with page-level citations.
- **Lecture Videos & Audio Transcripts**: Slices timecoded `.vtt` and `.srt` transcripts with second-level timestamps and speaker tagging.
- **Presentation Slide Decks (PPTX & PDF)**: Slices presentations into slide titles, bullet points, shape content, and presenter speaker notes.
- **Source-Tracking Provenance**: Every extracted chunk is tagged with `SourceTrackingMetadata` for verifiable, hallucination-free AI tutoring.

### 2. Source-Grounded AI Tutor (`/chat`)
- **SSE Streaming Dialogue**: Real-time streaming responses directly from FastAPI.
- **Interactive Citation Chips**: Every factual claim references exact sources (e.g., `[Slide #4]`, `[PDF p. 12]`, `[Lecture @ 14:10]`).
- **Source Inspector Panel**: Click any citation chip to inspect the exact underlying knowledge unit, confidence score, and contextual excerpt.

### 3. Dual-Mode Adaptive Assessment Engine (`/quiz`)
- **Mode 1 — Principles of Biology (Preset Benchmark)**: Standardized curriculum assessment covering cellular respiration, glycolysis, enzyme mechanics, and oxidative phosphorylation.
- **Mode 2 — Quiz from My Materials (AI Generated)**: Dynamically lists all study materials uploaded to the dashboard. The user selects a material, and AdaptFlow generates 10 tailored multiple-choice questions grounded in the parsed knowledge units.
- **Real-Time Feedback & Diagnostics**: Immediate explanation cards with source citations and diagnostic performance summaries upon completion.

---

## 🏗️ Architecture Overview

```
AdaptFlow/
├── frontend/                     # Next.js 14 Web Application
│   ├── app/
│   │   ├── dashboard/page.tsx    # Upload & Multimodal Library
│   │   ├── chat/page.tsx         # Source-Grounded AI Tutor & Inspector
│   │   ├── quiz/page.tsx         # Dual-Mode Adaptive Quiz (Preset & Custom)
│   │   └── api/quiz/generate/    # Next.js proxy route for quiz generation
│   ├── components/
│   │   ├── chat/                 # Chat input, messages, citation chips
│   │   ├── dashboard/            # Dropzone, material cards, progress list
│   │   ├── quiz/                 # Question card, progress header, score card
│   │   └── ui/                   # Reusable shadcn/ui design primitives
│   └── lib/
│       ├── api.ts                # Frontend API client (REST + SSE streaming)
│       └── types.ts              # Unified TypeScript interfaces
│
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── api/v1/               # Modular REST routers (materials, chat, quiz, tasks)
│   │   ├── core/                 # App configuration & logging
│   │   ├── db/                   # Persistent thread-safe JSON repository
│   │   ├── models/               # Domain models (Material, KnowledgeUnit, Provenance)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/parsers/     # Specialized parsers (PDF, Slides, Video transcripts)
│   │   └── main.py               # FastAPI entry point & CORS configuration
│   ├── storage/                  # Ingested uploads & structured knowledge JSON
│   ├── tests/                    # Pytest test suite
│   ├── requirements.txt          # Python dependencies
│   └── run_server.py             # Uvicorn server launcher
│
└── README.md                     # Root project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.17+ or v20+)
- **Python** (v3.10+ or v3.11+)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/SamarthShinde24/AdaptFlow.git
cd AdaptFlow
```

---

### Step 2: Start the Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```bash
   python run_server.py
   ```
   *The backend will be running at `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).*

---

### Step 3: Start the Frontend (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 🧪 Running Tests

To run the backend test suite:
```bash
cd backend
pytest
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Backend system health check |
| `POST` | `/api/v1/materials/upload` | Upload & ingest textbook, video transcript, or slide deck |
| `GET` | `/api/v1/materials` | List all indexed study materials in library |
| `GET` | `/api/v1/tasks/{task_id}/status`| Poll file parsing and indexing progress |
| `POST` | `/api/v1/chat/stream` | Stream AI tutor chat with source citations (SSE) |
| `GET` | `/api/v1/quiz/questions` | Fetch curriculum preset questions |
| `POST` | `/api/quiz/generate` | Generate 10 adaptive questions from an uploaded material |

---

## 📄 License
This project is licensed under the MIT License.
