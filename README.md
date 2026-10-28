# VOXA AI — Next-Generation Conversational AI & Document Intelligence Platform

<p align="center">
  <img src="frontend/public/auth-hero.png" alt="VOXA AI Platform Preview" width="850" style="border-radius: 14px; box-shadow: 0 15px 35px rgba(0,0,0,0.4);" />
</p>

<p align="center">
  <strong>An enterprise-grade, full-stack AI workspace integrating multi-model LLMs, context-grounded document analysis, interactive voice synthesis, automated presentation generation, and cloud-native file storage.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Project_Type-Full--Stack_AI_Platform-7928CA?style=for-the-badge&logo=rocket" alt="Full Stack AI" />
  <img src="https://img.shields.io/badge/Architecture-MVC_%2B_Async_Engine-0070F3?style=for-the-badge" alt="MVC" />
  <img src="https://img.shields.io/badge/Status-Tested_%26_Production_Ready-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Hackathon_Ready-Yes-ff69b4?style=for-the-badge" alt="Hackathon Ready" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.10-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/FastAPI-0.139-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.12%20%7C%203.13-3776AB?style=flat-square&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Serverless-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Google_Gemini-2.0%20%2F%201.5-8E75C2?style=flat-square&logo=google" alt="Google Gemini" />
</p>

---

## 📌 Quick Pitch & Presentation Summary

| Attribute | Details |
| :--- | :--- |
| **Project Title** | **VOXA AI** — Full-Stack Generative AI & Productivity Workspace |
| **Domain / Track** | Artificial Intelligence, EdTech, Enterprise Workflow Automation, Cloud Computing |
| **Core Innovation** | Multi-model fallback orchestration (Gemini + OpenAI), serverless document parsing (`pdf2json`/`mammoth`), animated interactive SVG voice avatar, and prompt-to-presentation generation in a single unified dashboard. |
| **Architecture** | Modern Client-Server: Next.js 16 (App Router + Turbopack) + FastAPI (Asynchronous MVC) + PostgreSQL (Neon Cloud) |
| **Security Standards** | JWT (HS256) stateless authentication, Bcrypt salt-hashing, SlowAPI rate-limiting, and sanitized input validation via Pydantic schemas. |

---

## Table of Contents

- [1. Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
- [2. The Innovation Factor ("Why VOXA AI?")](#2-the-innovation-factor-why-voxa-ai)
- [3. Modular Feature Breakdown](#3-modular-feature-breakdown)
- [4. System Architecture & Data Flow](#4-system-architecture--data-flow)
- [5. Engineering Highlights & Design Decisions](#5-engineering-highlights--design-decisions)
- [6. Technology Stack](#6-technology-stack)
- [7. Project Directory Structure](#7-project-directory-structure)
- [8. Installation & Setup Guide](#8-installation--setup-guide)
  - [Backend Setup (FastAPI)](#backend-setup-fastapi)
  - [Frontend Setup (Next.js)](#frontend-setup-nextjs)
- [9. Environment Variables Reference](#9-environment-variables-reference)
- [10. API Specification & Endpoints](#10-api-specification--endpoints)
- [11. College Presentation & Viva Defense Cheat Sheet](#11-college-presentation--viva-defense-cheat-sheet)
- [12. Troubleshooting & Diagnostics](#12-troubleshooting--diagnostics)
- [13. Deployment Strategy](#13-deployment-strategy)
- [14. Academic & Project Metadata](#14-academic--project-metadata)

---

## 1. Executive Summary & Problem Statement

### The Problem
Modern students, researchers, and professionals face severe tool fragmentation:
1. **Generic Chatbots Lack Context Grounding:** Users cannot easily upload proprietary documents (PDF/DOCX) without hitting expensive subscription paywalls or strict file-size limits.
2. **Context Window Overflows & High Token Costs:** Uploading full research papers frequently fails or depletes API quotas due to uncontrolled token consumption.
3. **Disjointed Workflow Execution:** Drafting slides, transcribing voice prompts, taking structured notes, and managing cloud media require switching between 4–5 distinct SaaS subscriptions.
4. **Single-Point-of-Failure AI APIs:** When a single AI provider experiences rate limits (HTTP 429) or service degradation, typical AI applications crash completely.

### The Solution: VOXA AI
**VOXA AI** is an enterprise-grade AI productivity suite that solves these challenges through:
- **Resilient AI Multi-Orchestration:** Built with an intelligent fallback system that routes prompts to Google Gemini as primary, automatically falling back to OpenAI GPT or xAI Grok if rate limits or network errors occur.
- **In-Memory Document Text Extraction:** Server-side parsing of PDF, DOCX, and TXT files with smart chunking and token budgeting to protect API limits.
- **Multi-Modal Productivity Canvas:** Native voice assistant with dynamic avatar visualization, automated presentation generation with CSS styling templates, and Cloudinary CDN storage in a single dashboard.

---

## 2. The Innovation Factor ("Why VOXA AI?")

How VOXA AI compares to typical chatbot wrappers and existing platforms:

| Feature Dimension | Traditional Chatbot Wrappers | Enterprise SaaS (ChatGPT Plus, etc.) | **VOXA AI (Our Implementation)** |
| :--- | :--- | :--- | :--- |
| **Architecture** | Simple API relay script | Proprietary closed-source monolith | **Modular MVC architecture (FastAPI + Next.js 16)** |
| **API Resilience** | Single API key (fails on error) | High-cost multi-region infra | **Automatic Provider Fallback (Gemini ➔ OpenAI ➔ xAI)** |
| **Document Parsing** | Client-side simple text cut | Cloud-locked vector indexes | **Server-side `pdf2json` + `mammoth` with token capping** |
| **Voice Interface** | Standard browser text-to-speech | Audio streaming | **Interactive SVG Robot Avatar with dynamic speech animations** |
| **Slide Generation** | Not supported | Requires 3rd-party plugins | **Native prompt-to-slides generator with CSS themes** |
| **Cloud Asset Storage** | Local filesystem (non-scalable) | Proprietary cloud storage | **Integrated Cloudinary CDN with preview & direct download** |
| **Database & Migrations**| None / SQLite (in-memory) | Proprietary databases | **PostgreSQL (Neon) with SQLAlchemy 2.0 Async & Alembic** |
| **Rate Limiting** | None (vulnerable to abuse) | Strict commercial limits | **Configurable SlowAPI token-bucket rate limiter** |

---

## 3. Modular Feature Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VOXA AI MODULAR SUITE                           │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 1. AI Chat & Docs  │ 2. Voice & Avatar  │ 3. Automated Presentations   │
│ - Multi-Model LLMs │ - Dynamic 3D Avatar│ - Prompt-to-Deck Generator   │
│ - Markdown Stream  │ - Speech Synthesis │ - CSS Slide Theme Templates  │
│ - PDF/DOCX Parsing │ - Audio Telemetry  │ - Slide Navigation Engine    │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 4. AI Tutor & Prep │ 5. Cloud Storage   │ 6. Analytics & Workspace     │
│ - Topic-Level Prep │ - Cloudinary CDN   │ - Token Usage Charts         │
│ - Mock Interviews  │ - Direct Downloads │ - Ctrl+K Command Palette     │
│ - Interactive Quiz │ - Image Studio     │ - Notes & Folder Hierarchy   │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### Module 1: AI Chat & Context-Grounded Document Analyzer
- **Real-Time Markdown Rendering:** Supports code syntax highlighting, copy-to-clipboard, tables, and latex formulas via `react-markdown` and `react-syntax-highlighter`.
- **Local Ollama Integration (Exclusive to Document Analyzer):** Zero-cloud-cost, 100% private on-device document processing powered by Ollama (`llama3.2`), with automatic intelligent cloud fallback when offline.
- **Document Text Ingestion:** Server-side extraction pipeline handles `.pdf`, `.docx`, and `.txt` files.
- **Smart Token Budgeting:** Automatically cleans whitespace and truncates context exceeding 5,000 characters to safeguard against API context overflow errors.

### Module 2: Interactive Voice Assistant with Dynamic Robot Avatar
- **Interactive SVG Avatar (`RobotAvatar`):** Custom animated vector avatar featuring responsive eye blinking, mouth phoneme movement, and voice activity visualizers.
- **Hands-Free Conversational Loop:** Seamless speech-to-text input processing and synchronized audio response playback.

### Module 3: AI Presentation Generator
- **Prompt-to-Slide Deck:** Generates professional multi-slide decks complete with titles, bullet points, takeaways, and speaker notes from a single prompt.
- **Dynamic Theming Engine:** Toggle between `Border Design`, `Full Design`, and `Minimal Dark` themes rendered using Tailwind CSS.

### Module 4: Cloud-Native Media Storage & Image Studio
- **Cloudinary Integration:** Upload, host, and index media assets on Cloudinary CDN without burdening application servers.
- **Image Studio:** Prompt-driven visual generation workspace with style selection (Photoreal, Cinematic, Anime, Digital Art) and aspect ratio controls.

### Module 5: AI Notes & Folder Organization
- **Rich Note Editor:** Full CRUD operations on user notes with support for tags, pinning high-priority notes, and organizing into custom folders.

### Module 6: Telemetry, Usage Analytics & Command Palette
- **Usage Telemetry:** Real-time metrics on token consumption and activity frequency visualised with `Recharts`.
- **Keyboard-First Navigation:** Global `Ctrl + K` (or `Cmd + K`) command palette built with `cmdk` for fast sub-millisecond route transitions.

---

## 4. System Architecture & Data Flow

VOXA AI implements a decoupled **Client-Server MVC (Model-View-Controller)** architecture designed for low latency, stateless horizontal scaling, and zero single-point-of-failure operations.

```mermaid
flowchart TD
    subgraph Presentation["1. Presentation Tier (Next.js 16 + React 19)"]
        UI["Modern UI (Tailwind CSS 4 + Base UI Primitives)"]
        State["State Stores (Zustand + Sonner Notifications)"]
        ClientExtract["Serverless Extraction Routes (/api/docs/analyze)"]
        Palette["Global Command Palette (cmdk)"]
    end

    subgraph Gateway["2. API Gateway & Security Tier (FastAPI)"]
        Middleware["CORS Whitelist + Config Guards"]
        Limiter["SlowAPI Rate Limiter (Token Bucket)"]
        Router["FastAPI Central APIRouter"]
    end

    subgraph MVC["3. Application Tier (MVC Controllers & Services)"]
        AuthCtrl["Auth Controller (JWT + Bcrypt)"]
        ChatCtrl["Chat & Document Controller"]
        VoiceCtrl["Voice & Tutor Controller"]
        MediaCtrl["Media Controller (Cloudinary Upload)"]
        AISvc["AI Service Orchestrator"]
    end

    subgraph DataTier["4. Data Tier (PostgreSQL + Cloud Services)"]
        NeonDB[("PostgreSQL (Neon Cloud DB)\nAsyncPG Connection Pool")]
        Cloudinary[("Cloudinary CDN\nImage & Media Hosting")]
        Gemini["Google Gemini 1.5/2.0 Flash\n(Primary AI Provider)"]
        OpenAI["OpenAI GPT-4o\n(Automated Fallback Provider)"]
    end

    UI -->|HTTPS REST Request| Middleware
    Middleware --> Limiter
    Limiter --> Router

    Router --> AuthCtrl
    Router --> ChatCtrl
    Router --> VoiceCtrl
    Router --> MediaCtrl

    AuthCtrl -->|SQLAlchemy AsyncPG| NeonDB
    ChatCtrl -->|SQLAlchemy AsyncPG| NeonDB
    MediaCtrl -->|Upload Stream| Cloudinary

    ChatCtrl --> AISvc
    VoiceCtrl --> AISvc

    AISvc -->|Primary Request| Gemini
    AISvc -.->|On 429 / Quota Error| OpenAI
```

---

## 5. Engineering Highlights & Design Decisions

### 1. Why FastAPI instead of Django or Flask?
- **Asynchronous Native Performance:** Built on Starlette and `asyncio`, enabling non-blocking database queries via `asyncpg` and concurrent streaming responses.
- **Pydantic Validation (MVC Views):** Strict automatic schema serialization, deserialization, and request payload validation with zero boilerplate code.
- **Automatic Documentation:** Generates interactive OpenAPI (Swagger) and ReDoc interfaces out of the box at `/docs`.

### 2. Why Next.js 16 (App Router) + React 19 instead of Vite/CRA?
- **Serverless API Routes:** Document parsing logic (`pdf2json`, `mammoth`) executes in Node.js serverless functions, keeping heavy parsing dependencies off the client browser.
- **Turbopack Build Optimization:** Sub-second hot-reloads during development and optimized tree-shaken static production chunks.
- **SEO & Layout Stability:** Nested App Router layouts provide persistent navigation state without unmounting the active audio visualizer or chat session.

### 3. Why SQLAlchemy 2.0 with AsyncPG?
- **Connection Pooling for Serverless:** Eliminates database connection exhaustion issues when talking to serverless PostgreSQL (Neon) via asynchronous connection pooling.
- **Zero Raw SQL Vulnerabilities:** All database queries are fully parameterized, preventing SQL Injection vulnerabilities.

### 4. Resilient Multi-Provider AI Fallback Strategy
```python
# Conceptual flow inside backend/app/services/ai.py:
async def generate_response(prompt, context):
    try:
        # Step 1: Attempt fast, low-cost Google Gemini API
        return await gemini_service.generate(prompt, context)
    except Exception as gemini_err:
        logger.warning(f"Gemini generation error: {gemini_err}. Attempting OpenAI fallback.")
        # Step 2: Gracefully fallback to OpenAI without crashing user session
        if settings.OPENAI_API_KEY:
            return await openai_service.generate(prompt, context)
        raise HTTPException(status_code=500, detail="AI Service temporarily unavailable.")
```

---

## 6. Technology Stack

### Frontend Architecture
- **Framework:** Next.js 16.2.10 (App Router, Turbopack)
- **Library:** React 19.2.4
- **Language:** TypeScript 5.0
- **Styling:** Tailwind CSS 4.0, PostCSS, Tailwind Merge
- **Primitives:** `@base-ui/react`, Lucide React, Framer Motion, Sonner
- **Data Visualization:** Recharts
- **Command Menu:** `cmdk`
- **Markdown & Code:** `react-markdown`, `react-syntax-highlighter`, `remark-gfm`
- **Document Extractors:** `pdf2json`, `mammoth`
- **State Management:** Zustand 5

### Backend Architecture
- **Framework:** FastAPI 0.139.2
- **Language:** Python 3.12 / 3.13
- **ASGI Server:** Uvicorn (multi-worker support)
- **Database Engine:** SQLAlchemy 2.0 (AsyncIO)
- **Database Drivers:** `asyncpg` (primary async driver), `psycopg2-binary` (migration driver)
- **Migrations:** Alembic 1.18.5
- **Rate Limiting:** SlowAPI (token bucket algorithm)
- **Authentication:** `python-jose` (JWT), `passlib` (Bcrypt)
- **Data Validation:** Pydantic 2.13 & Pydantic-Settings

### Database & Cloud Integrations
- **Cloud Database:** Neon Serverless PostgreSQL
- **Primary AI:** Google Generative AI (`google-genai` 0.8.6 / `google.generativeai`)
- **Fallback AI:** OpenAI Python SDK (`openai>=1.50.0`)
- **Media CDN:** Cloudinary Python SDK (`cloudinary 1.45.0`)

---

## 7. Project Directory Structure

```text
VOXA AI 3/
├── README.md                 # Master Project Documentation & Presentation Guide
├── Project_Report.md         # Official Technical Specification Report
│
├── backend/                  # FastAPI Application (MVC Structure)
│   ├── alembic/              # Database schema migrations
│   │   ├── versions/         # Alembic migration revisions
│   │   └── env.py            # Async Alembic execution environment
│   ├── app/
│   │   ├── controllers/      # API Route Handlers (Controllers)
│   │   │   ├── ai_tutor.py   # AI Tutoring session endpoints
│   │   │   ├── analytics.py  # Usage metrics & telemetry endpoints
│   │   │   ├── auth.py       # Authentication, registration & JWT refresh
│   │   │   ├── chat.py       # Chat threads & message streams
│   │   │   ├── documents.py  # User document record management
│   │   │   ├── health.py     # System & database health probes
│   │   │   ├── media.py      # Cloudinary upload handlers
│   │   │   ├── notes.py      # Notes CRUD & folder categorization
│   │   │   ├── notifications.py # Notification alerts
│   │   │   ├── presentations.py # Slide deck generation
│   │   │   ├── settings.py   # User preferences & styling options
│   │   │   └── voice.py      # Voice session state logging
│   │   ├── core/             # Infrastructure & Configuration
│   │   │   ├── config.py     # Pydantic Settings & environment validation
│   │   │   ├── database.py   # Async SQLAlchemy engine & session factory
│   │   │   ├── deps.py       # Dependency injection (get_current_user, get_db)
│   │   │   ├── limiter.py    # SlowAPI rate limiter instance
│   │   │   └── security.py   # Bcrypt password hashing & JWT encoding
│   │   ├── models/           # SQLAlchemy Database Entities (Models)
│   │   │   ├── base.py       # Base declarative class with UUID/Timestamp mixins
│   │   │   ├── user.py       # Users table schema
│   │   │   ├── chat.py       # Chats table schema
│   │   │   ├── message.py    # Messages table schema
│   │   │   ├── document.py   # Documents table schema
│   │   │   ├── note.py       # Notes table schema
│   │   │   ├── setting.py    # User settings schema
│   │   │   ├── voice_session.py # Voice sessions schema
│   │   │   └── folder.py     # Organization folders schema
│   │   ├── services/         # Business Logic & AI Provider Orchestration
│   │   │   ├── ai.py         # Multi-model LLM router (Gemini + OpenAI fallback)
│   │   │   └── gemini.py     # Google Generative AI client wrapper
│   │   ├── views/            # Pydantic Request & Response Schemas (Views)
│   │   └── main.py           # FastAPI Application Entrypoint, Lifespan & CORS
│   ├── .env.example          # Safe backend environment variable template
│   ├── .gitignore            # Git ignore rules (prevents tracking bytecode/secrets)
│   ├── alembic.ini           # Alembic database configuration
│   ├── init_db.py            # Database schema initialization script
│   ├── migrate_db.py         # Incremental column migration script
│   ├── reset_password.py     # Admin CLI password reset tool
│   ├── requirements.txt      # Python dependencies lockfile
│   ├── run.ps1               # PowerShell backend launcher
│   └── start.bat             # Windows batch backend launcher
│
└── frontend/                 # Next.js 16 Web Application
    ├── public/               # Public Static Assets
    │   ├── auth-hero.png     # Login and marketing hero visual asset
    │   ├── border-design.png # Slide deck template background
    │   ├── full-design.png   # Slide deck template background
    │   └── favicon.ico       # Application favicon
    ├── src/
    │   ├── app/              # Next.js App Router (Pages & Layouts)
    │   │   ├── api/          # Serverless Route Handlers
    │   │   │   ├── docs/analyze/   # Server-side PDF/DOCX text extractor
    │   │   │   └── upload-image/   # Cloudinary image upload proxy
    │   │   ├── auth/         # Login & Register views
    │   │   ├── chat/         # Authenticated Application Views
    │   │   │   ├── ai-chat/        # AI Document Q&A interface
    │   │   │   ├── analytics/      # Recharts usage graphs & statistics
    │   │   │   ├── docs/           # Document text analyzer
    │   │   │   ├── files/          # File manager & Cloudinary browser
    │   │   │   ├── history/        # Conversation history
    │   │   │   ├── images/         # Image Studio
    │   │   │   ├── interview/      # Mock interview tool
    │   │   │   ├── notes/          # AI note-taking canvas
    │   │   │   ├── presentations/  # Slide deck generator
    │   │   │   ├── settings/       # User & system preferences
    │   │   │   ├── tutor/          # AI tutoring interface
    │   │   │   ├── voice/          # Voice assistant & 3D robot avatar
    │   │   │   ├── layout.tsx      # Authenticated sidebar layout
    │   │   │   └── page.tsx        # Dashboard home view
    │   │   ├── globals.css   # Tailwind CSS tokens & theme variables
    │   │   ├── layout.tsx    # Root HTML layout with providers
    │   │   └── page.tsx      # Public landing page
    │   ├── components/       # Reusable React Components
    │   │   ├── landing/      # Landing sections (Hero, Navbar, Features, Footer)
    │   │   ├── layout/       # Top navigation bars & theme toggles
    │   │   ├── ui/           # Base UI primitives (button, input, sidebar, sheet, etc.)
    │   │   ├── app-sidebar.tsx     # Navigation sidebar
    │   │   ├── chat-message.tsx    # Markdown chat bubble renderer
    │   │   ├── command-palette.tsx # Global Ctrl+K command bar
    │   │   ├── robot-avatar.tsx    # SVG interactive robot avatar
    │   │   ├── theme-provider.tsx  # Next-themes dark/light mode context
    │   │   └── UsageChart.tsx      # Recharts telemetry visualizer
    │   ├── hooks/            # Custom React hooks (e.g., use-mobile)
    │   ├── lib/              # Client API clients & utilities
    │   │   ├── activityLogger.ts   # Client activity recorder
    │   │   ├── api.ts              # Fetch client with auto JWT attachment
    │   │   └── utils.ts            # ClassName merging utilities
    │   ├── store/            # Client state management (authStore.ts)
    │   └── types/            # TypeScript declarations
    ├── .env.example          # Safe frontend environment variable template
    ├── components.json       # Shadcn UI configuration
    ├── eslint.config.mjs     # ESLint 9 configuration
    ├── next.config.ts        # Next.js build and TypeScript options
    ├── package.json          # Node dependencies and scripts
    └── tsconfig.json         # TypeScript compiler configuration
```

---

## 8. Installation & Setup Guide

### Prerequisites
- **Node.js:** `v18.18.0` or higher (Node 20+ LTS recommended)
- **Python:** `3.12` or `3.13` (64-bit)
- **Package Manager:** `npm` or `pnpm`
- **Database:** PostgreSQL database instance (e.g., [Neon.tech](https://neon.tech) free tier)
- **API Key:** [Google AI Studio](https://aistudio.google.com/) Gemini API Key

---

### Backend Setup (FastAPI)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   - On Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - On Linux / macOS:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Python dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and configure your `DATABASE_URL`, `SECRET_KEY`, and `GEMINI_API_KEY`.*

5. **Initialize database tables:**
   ```bash
   python init_db.py
   ```

6. **Start the backend development server:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *(Or on Windows, simply double-click `start.bat` or run `.\run.ps1`)*

   - API Gateway: **`http://127.0.0.1:8000`**
   - Interactive Swagger API Documentation: **`http://127.0.0.1:8000/docs`**

---

### Frontend Setup (Next.js)

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   *Ensure `NEXT_PUBLIC_API_URL=http://localhost:8000` is set.*

4. **Run the Next.js development server:**
   ```bash
   npm run dev
   ```

   - Web Application: **`http://localhost:3000`**

---

## 9. Environment Variables Reference

### Backend (`backend/.env`)

| Variable Name | Required | Default / Format | Purpose |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://user:pass@host/dbname?ssl=require` | Async connection string for PostgreSQL |
| `SECRET_KEY` | **Yes** | 64-character random hex string | Signs and verifies JWT session tokens |
| `ALGORITHM` | No | `HS256` | JWT cryptographic signature algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` (24 hours) | Token lifetime duration |
| `GEMINI_API_KEY` | **Yes** | `AIzaSy...` | Google Gemini AI authentication key |
| `OPENAI_API_KEY` | No | `sk-proj-...` | Automatic fallback provider if Gemini fails |
| `XAI_API_KEY` | No | `grok_...` | Alternative fallback provider |
| `CLOUDINARY_CLOUD_NAME` | No | String | Cloudinary cloud account name |
| `CLOUDINARY_API_KEY` | No | Numeric string | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | No | String | Cloudinary secret key |
| `ENVIRONMENT` | No | `development` | Deployment environment flag |
| `FRONTEND_URL` | No | `http://localhost:3000` | Whitelisted CORS origin |

### Frontend (`frontend/.env.local`)

| Variable Name | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:8000` | Points client fetch requests to FastAPI backend |

---

## 10. API Specification & Endpoints

All endpoints are self-documenting via FastAPI at `/docs`. Below is the core route mapping:

| Module | Method | Endpoint | Description | Authentication |
| :--- | :---: | :--- | :--- | :---: |
| **Auth** | `POST` | `/api/auth/register` | Register new user account | Public |
| **Auth** | `POST` | `/api/auth/login` | Authenticate and obtain JWT token | Public |
| **Auth** | `GET` | `/api/auth/me` | Fetch active user profile | `Bearer JWT` |
| **Auth** | `PUT` | `/api/auth/me` | Update profile avatar or username | `Bearer JWT` |
| **Chat** | `GET` | `/api/chats` | List all conversation threads | `Bearer JWT` |
| **Chat** | `POST` | `/api/chats` | Create a new chat session | `Bearer JWT` |
| **Chat** | `GET` | `/api/chats/{chat_id}` | Retrieve messages for a specific session | `Bearer JWT` |
| **Chat** | `DELETE`| `/api/chats/{chat_id}` | Delete a chat thread | `Bearer JWT` |
| **Chat** | `POST` | `/api/chats/message` | Send prompt to AI & persist response | `Bearer JWT` |
| **Media** | `POST` | `/api/media/upload` | Upload multipart image to Cloudinary CDN | `Bearer JWT` |
| **Docs** | `GET` | `/api/documents` | Retrieve user-uploaded document records | `Bearer JWT` |
| **Tutor** | `POST` | `/api/tutor/session` | Create new AI learning session | `Bearer JWT` |
| **Voice** | `POST` | `/api/voice/session` | Start voice session & log telemetry | `Bearer JWT` |
| **Slides**| `POST` | `/api/presentations/generate` | Generate multi-slide deck from prompt | `Bearer JWT` |
| **Notes** | `GET` | `/api/notes` | List saved notes with tags | `Bearer JWT` |
| **Notes** | `POST` | `/api/notes` | Create a new note | `Bearer JWT` |
| **Metrics**| `GET` | `/api/analytics/summary`| Retrieve user token usage analytics | `Bearer JWT` |
| **Health**| `GET` | `/health` | Live probe checking PostgreSQL status | Public |

## 11. Troubleshooting & Diagnostics

| Symptom | Probable Cause | Exact Solution |
| :--- | :--- | :--- |
| **`Database connection error` on startup** | Incorrect URI scheme or SSL disabled. | Ensure `DATABASE_URL` in `backend/.env` starts with `postgresql+asyncpg://` and ends with `?ssl=require` if using Neon or Supabase. |
| **`Network Error` / `Failed to fetch` in browser** | Backend server inactive or CORS blocked. | Ensure `uvicorn` is running on port `8000`. Verify `FRONTEND_URL=http://localhost:3000` is set in `backend/.env`. |
| **`No valid AI API key found`** | Missing Gemini API Key. | Add a valid key from Google AI Studio into `GEMINI_API_KEY` in `backend/.env`. |
| **TypeScript build errors during `npm run build`** | TypeScript type mismatches. | Run `npx tsc --noEmit` in `frontend/` to pinpoint any type issues. (Verified passing with 0 errors). |
| **`Media uploads will be limited` warning in logs** | Cloudinary keys omitted. | This is a non-blocking warning. If image storage is needed, add Cloudinary credentials to `.env`. |

---

n.

---

# 12. Academic & Project Metadata

- **Project Title:** VOXA AI — Next-Generation Conversational AI Platform
- **Organization / Developed By:** Meander Software Private Limited
- **Acknowledgements:** [FastAPI](https://fastapi.tiangolo.com/), [Next.js](https://nextjs.org/), [SQLAlchemy](https://www.sqlalchemy.org/), [Tailwind CSS](https://tailwindcss.com/), [Google Generative AI](https://ai.google.dev/).
