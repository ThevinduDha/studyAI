# StudyAI — AI-Powered University Learning Platform

> A production-grade university study companion powered by the MERN stack and Google Gemini AI, featuring Grounded Retrieval-Augmented Generation (RAG) over university lecture materials.

---

## 1. Project Overview

**StudyAI** is designed to solve the common pitfalls tertiary students face when using generic AI models for university coursework: hallucinations, superficial summaries, and out-of-syllabus answers.

By anchoring AI interactions to the student's own verified course slides, literature, and lecture notes, StudyAI delivers strictly **grounded, cited, and syllabus-aligned intelligence**.

### Key Planned Capabilities
- 📚 **Module & Course Organization**: Structure materials across university modules and semesters.
- 📄 **Lecture PDF Ingestion & Semantic Chunking**: Ingest multi-page lecture slides and academic papers.
- 💬 **Contextual AI Chat & Q&A**: Ask targeted questions answered strictly from course documents with page citations.
- 📝 **Intelligent Synthesis**: Generate executive summaries, comprehensive study notes, and conversational podcast audio scripts.
- 🧠 **Adaptive Revision Tools**: Generate context-accurate Multiple-Choice Questions (MCQs) and spaced-repetition flashcards.
- 📊 **Mastery Analytics**: Track quiz scores, diagnose weak conceptual areas, and log focused study intervals.
- 🗓️ **Personalized Study Planner**: Generate dynamic daily/weekly revision schedules tuned to weak topics and exam schedules.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, React Router, Recharts, Axios |
| **Backend** | Node.js, Express.js, Multer (file uploads), JWT authentication, CORS, Dotenv |
| **Database** | MongoDB & Mongoose (planned schema architecture) |
| **AI / RAG** | Google Gemini API (`text-embedding-004`, `gemini-1.5-flash`, `gemini-1.5-pro`), Cosine Similarity Search |

---

## 3. Current Development Phase

```
[ Phase 1: Foundation ] ──▶ [ Phase 2: Auth & Modules ] ──▶ [ Phase 3: RAG & AI ] ──▶ [ Phase 4: Quizzes & Analytics ]
      (COMPLETED)
```

**Status**: **Phase 1 — Foundation Only** is complete.
- Complete system, database, AI/RAG, and REST API architectural blueprints established under `docs/`.
- Clean Express.js backend structure with operational `GET /api/health` endpoint.
- Dark-first React + Vite + Tailwind CSS frontend dashboard connected to the backend health service.
- Isolated environment configuration templates.
- *Deliberately not implemented yet*: User authentication, database models, PDF parsing, Gemini AI calls, or quiz algorithms (reserved for subsequent phases).

---

## 4. Project Structure

```
studyai/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── assets/             # Media and static graphics
│   │   ├── components/         # Reusable atomic UI components
│   │   ├── context/            # React Context providers (Auth, Theme)
│   │   ├── hooks/              # Custom application hooks
│   │   ├── layouts/            # Page shell wrappers
│   │   ├── pages/              # Primary view pages (Dashboard, Modules, AI)
│   │   ├── services/           # Axios HTTP client and API abstractions
│   │   ├── utils/              # Helper functions and formatters
│   │   ├── App.jsx             # Root application component
│   │   ├── index.css           # Tailwind base styles and theme tokens
│   │   └── main.jsx            # React DOM mounting entry point
│   ├── .env.example            # Client environment template
│   ├── package.json
│   └── vite.config.js          # Vite configuration with Tailwind & dev proxy
│
├── server/                     # Backend REST API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Database and third-party configurations
│   │   ├── controllers/        # Request orchestration and response handlers
│   │   ├── middleware/         # Auth guards, error handlers, and 404 handler
│   │   ├── models/             # Mongoose data schemas
│   │   ├── routes/             # REST endpoint routing definitions
│   │   ├── services/           # Core domain business logic
│   │   │   ├── ai/             # Gemini API generation services
│   │   │   ├── rag/            # Vector chunk retrieval & context assembler
│   │   │   ├── documents/      # PDF extraction and chunking
│   │   │   └── quiz/           # Quiz scoring and mastery algorithms
│   │   ├── utils/              # Utility functions and standard responses
│   │   ├── app.js              # Express app instance and middleware bindings
│   │   └── server.js           # Server entry point and lifecycle manager
│   ├── .env.example            # Server environment template
│   └── package.json
│
├── docs/                       # Architectural & Technical Specifications
│   ├── architecture.md         # System design, data flows, and tech choices
│   ├── database.md             # MongoDB collection schemas & relationship map
│   ├── ai-rag.md               # RAG ingestion, chunking, and citation mechanics
│   └── api.md                  # REST endpoint definitions and contracts
│
├── .gitignore                  # Git tracking exclusions
├── package.json                # Root automation scripts
└── README.md                   # Project documentation
```

---

## 5. Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation

From the project root directory, you can install both client and server dependencies with one command:

```bash
npm run install:all
```

Alternatively, install dependencies inside each workspace separately:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## 6. Environment Variable Configuration

Both `client/` and `server/` have `.env.example` templates.

### Server Configuration (`server/.env`)
Copy the server template:
```bash
cp server/.env.example server/.env
```
*(On Windows PowerShell: `Copy-Item server/.env.example server/.env`)*

Variables included in `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Future Phases (Leave as placeholders for Phase 1)
MONGODB_URI=mongodb://localhost:27017/studyai
JWT_SECRET=your_jwt_secret_placeholder
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_placeholder
```

### Client Configuration (`client/.env`)
Copy the client template:
```bash
cp client/.env.example client/.env
```
*(On Windows PowerShell: `Copy-Item client/.env.example client/.env`)*

Variables included in `client/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Running the Application

### 1. Start the Backend API Server
```bash
# From root
npm run dev:server

# Or from inside server directory
cd server
npm run dev
```
The server will boot at: `http://localhost:5000`
Test the health status at: `http://localhost:5000/api/health`

### 2. Start the Frontend Application
In a separate terminal window:
```bash
# From root
npm run dev:client

# Or from inside client directory
cd client
npm run dev
```
The client will be available at: `http://localhost:5173`

---

## 8. AI & Grounded RAG Pipeline Overview

```
[ Upload PDF ] ──▶ [ Page Text Extraction ] ──▶ [ Semantic Chunking ]
                                                       │
                                                       ▼
[ Grounded Answer + Citations ] ◀── [ Gemini ] ◀── [ Vector Search ]
```

1. **Ingestion & Page Tagging**: Slides/PDFs are extracted page-by-page, retaining page index metadata.
2. **Chunking**: Text is partitioned into 500–800 token passages with a 100-token sliding overlap.
3. **Embeddings**: Chunks are transformed into dense semantic vectors using Google Gemini embedding models and saved with references.
4. **Retrieval**: When a student queries a topic, the query is vectorized and compared against stored module chunks.
5. **Grounded Synthesis**: Top-ranked chunks are passed as context to Gemini with strict citation rules, returning verifiable page references (`[Doc: lecture2.pdf, Page 8]`) directly into the student UI.

For in-depth details, refer to the documentation in [`docs/ai-rag.md`](docs/ai-rag.md).

---

## 9. Development Guidelines & Next Steps

- **Next Planned Phase (Phase 2)**: Database connection setup with MongoDB/Mongoose, User authentication via JWT, and Module management CRUD endpoints.
- Review [docs/architecture.md](docs/architecture.md) for full architectural guidelines.
