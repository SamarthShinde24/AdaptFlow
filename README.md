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

Modern students do not study from a single medium. A single university or high school course often comprises:
- 📖 **Dense textbook chapters** (multi-column PDFs, formulas, scientific figures)
- 🎙️ **Hours of lecture recordings** (spoken explanations, informal Q&A, timecoded audio/video)
- 📊 **Visual slide decks** (compact bullet points, diagrams, presenter speaker notes)

### The Problem
When studying across these disparate modalities, students experience cognitive fragmentation:
1. **Hallucination Risk**: Generic LLMs synthesize ungrounded answers without citing specific course materials.
2. **Modality Silos**: A concept explained visually on Slide 12 might only be elaborated verbally at minute 24:15 of a lecture video.
3. **Passive Retention**: Students passively reread materials without active, adaptive recall testing or visual knowledge mapping.

### The AdaptFlow Solution
**AdaptFlow** bridges the gap by building an end-to-end **Multimodal Knowledge Graph**. It ingests, extracts, aligns, and indexes heterogeneous course formats into unified **Knowledge Units** tagged with deterministic source metadata (page numbers, exact timestamps, and slide coordinates). 

Students interact with a **Socratic AI Tutor** backed by verifiable citation chips, explore interactive **Prerequisite Knowledge Graphs**, practice with **Bayesian-driven adaptive assessments**, and study in a distraction-free studio equipped with **Obsidian Dark / Clean Light** modes and **Hindi Localization**.

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
- **Smart Video Player Grounding**: Distinguishes between videos and static documents. For video citations, clicking the source opens an embedded video player pre-seeked to the exact second.
- **Slide Decks (PPTX / Presentation PDFs)**: Deconstructs slides into titles, body text, visual shapes, and presenter notes (`[Slide #4]`).
- **Provenance Metadata**: Every extracted chunk is tagged with `SourceTrackingMetadata` (`material_id`, `chunk_id`, `timestamp`, `page_number`, `confidence_score`).

### 2. 🧠 Source-Grounded Multimodal AI Tutor (`/chat`)
- **NotebookLM-Style Studio UI**: Redesigned chat interface inspired by Google NotebookLM featuring a clean studio aesthetic, collapsible source drawers, and smart hover-activated scrollbars.
- **Server-Sent Events (SSE) Streaming**: Real-time token streaming generation with minimal first-token latency.
- **Interactive Citation Chips**: Every claim is annotated with clickable chips (e.g., `[Slide #4]`, `[PDF p. 12]`, `[Lecture @ 14:10]`).
- **Deep Source Inspector Panel**: Clicking any citation opens an inspector modal displaying the raw snippet, modality type, page/timestamp coordinates, and confidence score.
- **Fullscreen Focus Mode**: Toggle with `F` or `Esc` to enter an immersive, distraction-free reading and tutoring view.

### 3. 🗺️ Prerequisite Knowledge Graph & Pastel Visual Flowcharts
- **Interactive Topic Flow Map**: Dynamic knowledge graph on the course dashboard powered by Mermaid and SVG, mapping concept dependencies, learning trajectories, and prerequisite mastery states.
- **Educational Pastel Flowcharts**: Procedural concepts automatically render into high-legibility pastel diagrams:
  - 🍑 **Peach (`#FFE6CC`)**: Root Concept / Topic Entry
  - 🍃 **Mint (`#D5E8D4`)**: Core Processing & Primary Algorithms
  - 🌸 **Lavender (`#E1D5E7`)**: Validation, Sub-methods & Outputs
  - 🔲 **Dark Typography (`#2B2D42`)**: High-contrast, crystal-clear readability across both dark and light themes.
- **Visual Diagram Controls**: Built-in zoom in/out, pan reset, diagram PNG download, and fullscreen view.

### 4. 🎯 Adaptive Assessment Engine (`/quiz`)
- **Strict 10-Question Structure**: Standardized, high-yield 10-question evaluation tailored to the selected course material.
- **Cross-Domain Material Routing**: Dynamically generates questions tailored to the chosen syllabus:
  - *Architectural Heritage of Rajasthan* (Hawa Mahal airflow, Jantar Mantar sundials, Amber Fort Sheesh Mahal)
  - *CS201 Data Structures & Algorithms* (Binary Search Trees, Inorder traversal, AVL balance, Red-Black trees)
  - *RAG Architecture & Semantic Chunking* (Parametric vs. non-parametric memory, vector embeddings, cross-encoders)
  - *Cellular Energetics & Bioenergetics* (Glycolysis, Krebs cycle, oxidative phosphorylation)
- **Fisher-Yates Deduplication**: Prevents question repetition and guarantees distinct concept evaluation.
- **Dynamic Difficulty Steering**: Correct answers promote students to advanced synthesis questions; missed concepts route to foundational reinforcement.
- **Transparent Diagnostic Feedback**: In-depth explanations with verified source citations, mastery scoring, and zero length bias.

### 5. ⚙️ Settings & Personalization Studio (v2.4 Pro)
- **Obsidian Dark & Clean Light Themes**: Custom-engineered palettes with seamless theme switching and zero flash on reload.
- **Hindi Language & Localization (हिंदी)**:
  - One-click language switching between **English (EN)** and **हिंदी (Hindi)**.
  - **Selective Translation Rule**: The Sidebar and all Headings remain strictly in English, while body copy, descriptions, buttons, dialogs, and quiz elements translate to natural Hindi.
  - Zero-loss instant reversibility and persistent storage in `localStorage`.
- **Study Goals & Pacing**: Configurable daily flashcard targets (10, 20, 30, 50 cards/day).
- **Audio & Sound Effects**: Subtle auditory chimes on card flip, correct answer, and quiz completion.
- **Bayesian Knowledge Tracing (BKT)**: Real-time calculation of latent student mastery probability $P(L_t)$.
- **Adaptive Spaced Repetition (SRS)**: Automatic resurfacing of missed concepts based on forgetting curve decay.
- **Data & Cache Management**: One-click local cache clearing and instant Study Profile JSON export.
- **Keyboard Shortcuts Reference**: Built-in hotkey guide (`Ctrl+B`, `Ctrl+K`, `Enter`, `Space`, `←/→`, `C/X`, `F`).

### 6. 👥 Role-Based Portals (Student & Instructor)
- **Student Dashboard (`/dashboard`)**:
  - Multimodal library overview with drag-and-drop file upload.
  - Study streak, mastery metrics, and recent activity logs.
  - Prerequisite knowledge flow visualization and quick-start study decks.
- **Instructor Dashboard (`/instructor/dashboard`)**:
  - Class-wide student performance tracking and grade analytics.
  - Subject assignment and cohort management (`/api/instructor/assign-subjects`).
  - Assignment creation and student submission review workflow (`/assignments`).
  - Direct document inspection with "Eye" icon preview to inspect student-submitted materials.
  - Synchronized Source Chat experience matching the student tutoring studio.
- **Role-Based Authentication (`/auth`)**:
  - Seamless dedicated onboarding and login paths for both Students and Instructors.

### 7. 📊 Rigorous System Evaluation (RAGAS & DeepEval)
- **Standardized Evaluation Suite (`eval/benchmark_ragas.py`)**: Evaluates the retrieval and generation pipeline across a 25-question multi-subject golden test set.
- **RAGAS Benchmark Metrics**:
  - **Faithfulness (Groundedness)**: `1.0000` (zero ungrounded hallucinations)
  - **Context Precision (Signal-to-Noise)**: `0.9444` (high-density retrieval)
  - **Context Recall (Completeness)**: `1.0000` (complete information capture)
  - **Refusal Accuracy (Out-of-Scope Guard)**: `100.0%` (clean rejection of unsupported queries)
  - **Citation Attribution Fidelity**: `100.0%` (exact page, slide, and timestamp anchors)
  - **Overall Harmonic Score**: `0.9374` (S-Tier)
- Full methodology, per-question analysis, and failure analysis available in [**`eval/EVALUATION.md`**](eval/EVALUATION.md).

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
  │   (Library &   (NotebookLM-     (Adaptive 10Q     (Portal &  │
  │   Flow Graph)   Style Studio)     Assessments)     Analytics)│
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
│   │   ├── chat/                      # NotebookLM studio, citations, inspector
│   │   ├── dashboard/                 # Dropzone, material cards, knowledge graph
│   │   ├── quiz/                      # Question card, progress bar, score review
│   │   ├── instructor/                # Class metrics, student tables, modal dialogs
│   │   ├── SettingsModal.tsx          # v2.4 Pro settings (theme, goals, BKT, language)
│   │   └── ui/                        # Reusable Radix UI & Tailwind components
│   ├── context/
│   │   ├── AuthContext.tsx            # Role-based authentication state
│   │   └── LanguageContext.tsx        # Hindi / English selective translation engine
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
├── eval/                              # Evaluation Suite & Benchmarks
│   ├── benchmark_ragas.py             # Automated RAGAS benchmark runner
│   └── EVALUATION.md                  # Comprehensive evaluation report
│
└── README.md                          # Project documentation
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Ctrl + B` | Global | Toggle sidebar visibility (Rail vs Expanded) |
| `Ctrl + K` | Global | Open Command Palette / Global AI Search |
| `Enter` | Chat Studio | Send dialogue message to AI Tutor |
| `Space` | Flashcards | Flip flashcard front / back |
| `←` / `→` | Flashcards | Navigate to previous / next card |
| `C` / `X` | Flashcards | Score card as Mastered (`C`) or Review Needed (`X`) |
| `F` or `Esc` | Focus Mode | Toggle Fullscreen Focus Mode on / off |

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
3. **Adaptive Formative Assessment**: Quizzes adapt dynamically to student responses to optimize the learning curve based on Bayesian Knowledge Tracing.
4. **Visual Knowledge Mapping**: Automatic prerequisite dependency graphs and educational pastel flowcharts transform complex procedures into intuitive visual roadmaps.
5. **Universal Accessibility & Localization**: Dual-theme support (Obsidian Dark & Clean Light) paired with Hindi localization and distraction-free Fullscreen Focus Mode.
6. **Production Deployed**: Fully containerized and deployed live on Railway & Vercel with database connections, Redis caching, and dynamic port handling.

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
