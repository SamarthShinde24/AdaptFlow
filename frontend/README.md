# AdaptFlow Frontend 🎓🚀

A modern, production-grade adaptive learning frontend built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**, seamlessly connected to the **FastAPI backend**.

---

## 🎨 Design Philosophy & Architecture

- **Dark-Mode-First Token System**: Deep slate/zinc canvas (`#090d16`), glassmorphism overlays (`backdrop-blur-xl`), with electric indigo (`#6366f1`), cyan (`#06b6d4`), and emerald (`#10b981`) accent tokens.
- **Micro-Interactions**: Smooth state transitions from drag-and-drop to live upload progress, typing cursors, and glowing citation cards.
- **Zero Placeholders**: Every component is completely functional, strictly typed, and hooked into the backend API client.

---

## 🧭 Core Views Built

### 1. Multimodal Upload Dashboard (`/dashboard`)
- **Drag-and-Drop Zone**: Accepts PDF textbooks, PPTX slide decks, and MP4/video files. Automatically detects modality from file extensions and attaches course & subject metadata.
- **Per-File Ingestion Queue**: Displays smooth progress bar animations transitioning across:
  - `uploading` (percentage of bytes transmitted)
  - `processing` (FastAPI background parser extracting chapters, timestamps, and slide notes)
  - `ready` (green badge, knowledge unit counter)
- **Study Materials Library**: Renders interactive cards with modality badges, formatted file sizes, timestamps, unit counters, a "Quick Chat" shortcut, and a delete button with confirmation.
- **Library Overview Stats**: Displays total structured knowledge units, and breakdowns for textbooks, videos, and slides.

### 2. Source-Grounded Chat Interface (`/chat`)
- **Conversation Thread**: High-contrast user bubbles and assistant responses styled with AI avatars.
- **Inline Clickable Citation Chips**:
  - Automatically parses citation tags (e.g. `[Slide 4]`, `[PDF p.42]`, `[12:30 - 13:30]`).
  - Distinct color themes: Blue for PDF, Violet for Video, Amber for Slides.
  - Clicking any citation smoothly opens the **Right-Side Source Inspector Panel**.
- **Slide-Over Source Inspector Panel**:
  - Displays document title, modality badge, and exact locator (Page/Chapter, Video Timestamp + Speaker, or Slide Index + Speaker Notes).
  - Shows verified excerpt text and SHA-256 cryptographic provenance hash.
- **Input Bar**:
  - Auto-resizing textarea.
  - Keyboard shortcut: **Enter** to send, **Shift + Enter** for newline.
  - Starter prompt suggestion chips.
- **Streaming Response**: Real-time SSE / chunked token streaming from FastAPI backend with live cursor animation.

### 3. Adaptive Quiz / Assessment View (`/quiz`)
- **Adaptive Question Flow**: Renders both **Multiple Choice** and **Short Answer** questions generated from the uploaded knowledge base.
- **Immediate Feedback**:
  - Instant emerald (Correct) or rose (Incorrect) banner upon submission.
  - In-depth pedagogical explanation.
  - Clickable source citation card linking back to the exact location in the original study material.
- **Progress Tracking**: Top header displaying `Question X of N`, animated progress bar, current streak/score, and difficulty tag (`Easy`, `Medium`, `Advanced`).
- **Final Score Summary Card**:
  - Overall score percentage and mastery evaluation badge.
  - Question-by-question breakdown.
  - "Retake Assessment" and "Discuss Missed Concepts with AI Tutor" action buttons.

---

## 🚀 Running AdaptFlow (Backend + Frontend)

### 1. Start the FastAPI Backend
```bash
cd C:\Users\samarth\.gemini\antigravity\scratch\adaptflow-backend
python run_server.py
```
*Runs at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.*

### 2. Start the Next.js Frontend
```bash
cd C:\Users\samarth\.gemini\antigravity\scratch\adaptflow-frontend
npm run dev
```
*Runs at `http://localhost:3000`.*
