# AdaptFlow 🎓⚡🎥
> **The AI-Powered Multimodal Adaptive Learning Platform with Verified Source Provenance**  
> *Built for the **Multimodal AI Hackathon***

[![Live Demo](https://img.shields.io/badge/Demo-adaptflow--ai.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://adaptflow-ai.vercel.app)
[![API Status](https://img.shields.io/badge/API-Online%20on%20Railway-blueviolet?style=for-the-badge&logo=railway)](https://adaptflow-production.up.railway.app/health)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org/)

---

## 💡 The Multimodal Hackathon Challenge

Modern students do not study from a single medium. A single university course often comprises:
- 📖 **Dense textbook chapters** (multi-column PDFs, formulas, scientific figures)
- 🎙️ **Hours of lecture recordings** (spoken explanations, informal Q&A, timecoded audio)
- 📊 **Visual slide decks** (compact bullet points, diagrams, presenter speaker notes)

### The Problem
When studying across these disparate modalities, students experience cognitive fragmentation:
1. **Hallucination Risk**: Generic LLMs synthesize ungrounded answers without citing specific course materials.
2. **Modality Silos**: A concept explained visually on Slide 12 might only be elaborated verbally at minute 24:15 of a lecture video.
3. **Passive Retention**: Students passively reread materials without active, adaptive recall testing.

### The AdaptFlow Solution
**AdaptFlow** bridges the gap by building an end-to-end **Multimodal Knowledge Graph**. It ingests, extracts, aligns, and indexes heterogeneous course formats into unified **Knowledge Units** tagged with deterministic source metadata (page numbers, exact timestamps, and slide coordinates). 

Students interact with a **Socratic AI Tutor** backed by verifiable citation chips and take **10-question adaptive assessments** that dynamically adjust difficulty based on real-time mastery.

---

## 🌐 Live Deployments

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | [https://adaptflow-ai.vercel.app](https://adaptflow-ai.vercel.app) |
| **FastAPI Backend** | Railway | [https://adaptflow-production.up.railway.app](https://adaptflow-production.up.railway.app) |
| **API Health Status** | Railway | [https://adaptflow-production.up.railway.app/health](https://adaptflow-production.up.railway.app/health) |
| **Interactive API Docs** | Swagger / OpenAPI | [https://adaptflow-production.up.railway.app/docs](https://adaptflow-production.up.railway.app/docs) |

---

## ✨ Core Pillars & Features

### 1. 📂 Multimodal Ingestion Pipeline
- **PDF Textbooks & Papers**: Structural extraction preserving hierarchy, chapter headings, and page-level references.
- **Lecture Videos & Audio Transcripts**: Slices timecoded `.vtt` and `.srt` transcripts with second-level timestamps (`[Lecture @ 14:10]`) and speaker recognition.
- **Slide Decks (PPTX / Presentation PDFs)**: Deconstructs slides into titles, body text, visual shapes, and presenter notes (`[Slide #4]`).
- **Provenance Metadata**: Every extracted chunk is tagged with `SourceTrackingMetadata` (`material_id`, `chunk_id`, `timestamp`, `page_number`, `confidence_score`).

### 2. 🧠 Source-Grounded Multimodal AI Tutor (`/chat`)
- **Server-Sent Events (SSE) Streaming**: Real-time streaming token generation with low latency.
- **Interactive Citation Chips**: Every claim is annotated with clickable chips (e.g., `[Slide #4]`, `[PDF p. 12]`, `[Lecture @ 14:10]`).
- **Deep Source Inspector Panel**: Clicking any citation opens an inspector modal displaying the raw snippet, modality type, page/timestamp coordinates, and confidence.
- **Dialogue History & Persistence**: Full conversation history tracking with session memory.

### 3. 🎯 Adaptive Assessment Engine (`/quiz`)
- **Strict 10-Question Structure**: Every quiz is standardized to a focused, high-yield 10-question evaluation.
- **Cross-Domain Material Routing**: Dynamically generates questions tailored to the specific material chosen:
  - *Architectural Heritage of Rajasthan* (Hawa Mahal airflow, Jantar Mantar sundials, Amber Fort Sheesh Mahal)
  - *CS201 Data Structures & Algorithms* (Binary Search Trees, Inorder traversal, AVL balance, Red-Black trees)
  - *RAG Architecture & Semantic Chunking* (Parametric vs. non-parametric memory, vector embeddings, cross-encoders)
  - *Cellular Energetics & Bioenergetics* (Glycolysis, Krebs cycle, oxidative phosphorylation)
- **Fisher-Yates Deduplication**: Prevents repeated questions and ensures distinct concept coverage.
- **Dynamic Difficulty Steering**: Correct answers promote the student to advanced conceptual questions; incorrect answers route to foundational reinforcement.
- **Transparent Diagnostic Feedback**: In-depth explanations with verified source citations and zero length bias.

### 4. 👥 Role-Based Portals (Student & Instructor)
- **Student Dashboard (`/dashboard`)**:
  - Multimodal library overview with file upload dropzone.
  - Study streak, mastery metrics, and recent activity logs.
  - Direct shortcuts to AI Tutor, Adaptive Quizzes, and Assignments.
- **Instructor Dashboard (`/instructor/dashboard`)**:
  - Class-wide student performance tracking and grade analytics.
  - Subject assignment and cohort management (`/api/instructor/assign-subjects`).
  - Assignment creation and submission review workflow (`/assignments`).
- **Role-Based Authentication (`/auth`)**:
  - Seamless dedicated onboarding and login paths for both Students and Instructors.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADAPTFLOW ARCHITECTURE                          │
└────────────────────────────────────────────────────────────────────────┘

  [ USER / CLIENT ]
         │
         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 Next.js 14 Web Application                   │
  │     (Tailwind CSS • Shadcn UI • Lucide • TypeScript)          │
  │                                                              │
  │   /dashboard      /chat            /quiz         /instructor │
  │   (Library)    (AI Tutor)     (Adaptive 10Q)     (Portal)    │
  └───────────────┬──────────────────────────────┬───────────────┘
                  │                              │
         REST API │                     SSE Chat │ Streaming
                  ▼                              ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                   FastAPI Backend Service                    │
  │                     (Python 3.11 • Uvicorn)                  │
  │                                                              │
  │  ┌───────────────────────┐        ┌───────────────────────┐  │
  │  │  Multimodal Parsers   │        │     RAG Engine &      │  │
  │  │  • PDF / Textbook     │        │   Provenance Tracker  │  │
  │  │  • Video Timecodes    │        │  • Semantic Chunking  │  │
  │  │  • Slide PPTX / Decks │        │  • Dynamic Citations  │  │
  │  └───────────┬───────────┘        └───────────┬───────────┘  │
  │              │                                │              │
  │  ┌───────────┴───────────┐        ┌───────────┴───────────┐  │
  │  │ Adaptive Quiz Router  │        │   Auth & Roles Guard  │  │
  │  │ • Difficulty Steering │        │ • Students            │  │
  │  │ • Fisher-Yates Engine │        │ • Instructors         │  │
  │  └───────────────────────┘        └───────────────────────┘  │
  └───────────────┬──────────────────────────────┬───────────────┘
                  │                              │
                  ▼                              ▼
         ┌──────────────────┐           ┌──────────────────┐
         │ PostgreSQL (SQL) │           │ Redis (Caching)  │
         │ Persistent Data  │           │ Fast State Cache │
         └──────────────────┘           └──────────────────┘
```

---

## 📂 Project Repository Structure

```
AdaptFlow/
├── frontend/                          # Next.js 14 Frontend Application
│   ├── app/
│   │   ├── auth/                      # Role-based Signup & Login routes
│   │   │   ├── signup/                # Student & Instructor registration
│   │   │   └── login/                 # Role selection & login
│   │   ├── dashboard/                 # Student Multimodal Library & Metrics
│   │   ├── instructor/dashboard/      # Instructor Management & Student Stats
│   │   ├── chat/                      # Source-Grounded AI Tutor with Inspector
│   │   ├── quiz/                      # Adaptive 10-Question Assessment Runner
│   │   │   └── difficulty/            # Pre-quiz difficulty calibration
│   │   ├── assignments/               # Assignment submission & review
│   │   └── api/                       # Next.js API Routes (proxies & mock fallback)
│   ├── components/
│   │   ├── chat/                      # Message bubbles, citation chips, inspector
│   │   ├── dashboard/                 # Dropzone, material cards, stats cards
│   │   ├── quiz/                      # Question card, progress bar, score review
│   │   ├── instructor/                # Class metrics, student tables, modal dialogs
│   │   └── ui/                        # Reusable Radix UI & Tailwind components
│   ├── lib/
│   │   ├── api.ts                     # API client (REST fetchers & SSE streaming)
│   │   └── types.ts                   # Domain TypeScript interfaces
│   └── package.json
│
├── backend/                           # FastAPI Python Backend Application
│   ├── app/
│   │   ├── api/v1/                    # Modular API route controllers
│   │   │   ├── materials.py           # Upload, parsing, and material listing
│   │   │   ├── chat.py                # SSE streaming AI tutor endpoint
│   │   │   ├── quiz.py                # Adaptive quiz generator & grader
│   │   │   └── tasks.py               # Background task status polling
│   │   ├── core/                      # Configuration, settings & logging
│   │   ├── db/                        # SQLAlchemy async sessions & Redis connectors
│   │   ├── models/                    # Database models (User, Material, Quiz)
│   │   ├── schemas/                   # Pydantic validation request/response schemas
│   │   └── services/parsers/          # Specialized parsers (PDF, PPTX, Video VTT)
│   ├── run_server.py                  # Dynamic PORT-binding server launcher
│   ├── requirements.txt               # Backend Python dependencies
│   └── Dockerfile                     # Production container definition
│
└── README.md                          # Project documentation
```

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- **Node.js** 18.17+ or 20+
- **Python** 3.10+ or 3.11+
- **Git**
- *(Optional)* PostgreSQL & Redis for full database persistence

---

### 1. Clone the Repository
```bash
git clone https://github.com/SamarthShinde24/AdaptFlow.git
cd AdaptFlow
```

---

### 2. Configure & Run Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
python run_server.py
```
> The API will be available at **`http://localhost:8000`**.  
> Explore the interactive OpenAPI docs at **`http://localhost:8000/docs`**.

---

### 3. Configure & Run Frontend (Next.js)

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Setup local environment variables
# Create .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```
> Visit **`http://localhost:3000`** in your browser to start exploring AdaptFlow!

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Live system health check (`db`, `redis`, status) |
| `POST` | `/api/v1/materials/upload` | Ingest PDF textbook, video transcript (`.vtt`), or slides (`.pptx`) |
| `GET` | `/api/v1/materials` | List all indexed study materials in library |
| `POST` | `/api/v1/chat/stream` | Stream AI Tutor answer with real-time citation markers (SSE) |
| `POST` | `/api/v1/quiz/generate` | Generate 10 adaptive questions grounded in selected material |
| `GET` | `/api/v1/quiz/questions` | Retrieve question bank for specific material/curriculum |
| `POST` | `/api/v1/quiz/answer` | Submit question answer and update adaptive learner state |
| `POST` | `/api/v1/quiz/complete` | Complete quiz session and compute diagnostic breakdown |

---

## 🏆 Multimodal Hackathon Highlights

1. **True Cross-Modal Synthesis**: Unifies text, video speech, and presentation slides into an interconnected semantic graph with millisecond- and page-level precision.
2. **Hallucination-Proof AI Tutoring**: Every generated answer is anchored to verified course units with deep source inspection.
3. **Adaptive Formative Assessment**: Not just static flashcards—quizzes adapt dynamically to student responses to optimize the learning curve.
4. **Production Deployed**: Fully containerized and deployed live on Railway & Vercel with database connections, Redis caching, and dynamic port handling.

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
