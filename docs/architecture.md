# StudyAI — System Architecture Documentation

## 1. Executive Summary & Vision

**StudyAI** is a modern, AI-powered university learning platform designed to help tertiary students master complex academic material. Students can organize university modules, ingest lecture slides and academic PDFs, ask contextual questions against their course literature, generate flashcards, practice exam-style multiple-choice questions (MCQs), produce synthesized study notes, and track mastery through automated progress analytics.

The core philosophy of StudyAI is **grounded intelligence**: the AI model prioritizes the student's verified syllabus and lecture content through Retrieval-Augmented Generation (RAG) rather than relying on ungrounded general-purpose AI outputs.

---

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|   React (Vite) + Tailwind CSS + Lucide React + Recharts + React Router  |
+-------------------------------------------------------------------------+
                                     |
                                     | HTTPS / JSON REST API
                                     v
+-------------------------------------------------------------------------+
|                              SERVER TIER                                |
|               Node.js + Express.js Application Server                   |
|                                                                         |
|  [ Middleware ] -> [ Controllers ] -> [ Services ] -> [ Data Models ]   |
|   - CORS            - Auth              - Document       - Mongoose     |
|   - JWT Auth        - Modules             Extraction       Schemas      |
|   - Multer          - Quizzes           - Chunking                      |
|   - Error Handler   - Study Plan        - Vector/RAG                    |
+-------------------------------------------------------------------------+
           |                                             |
           v                                             v
+-----------------------+              +----------------------------------+
|     DATABASE TIER     |              |             AI TIER              |
|   MongoDB Database    |              |        Google Gemini API         |
|                       |              |                                  |
| - Users & Modules     |              | - Text Embeddings                |
| - Documents & Chunks  |              |   (text-embedding-004)           |
| - Questions & Quizzes |              | - Generative Reasoning           |
| - Study Progress      |              |   (gemini-1.5-pro / flash)       |
+-----------------------+              +----------------------------------+
```

---

## 3. Tiered Architectural Breakdown

### 3.1 Frontend Tier (`client/`)

- **Framework & Build System**: React 18+ with Vite for fast Hot Module Replacement (HMR) and optimized static production builds.
- **Styling Architecture**: Tailwind CSS configured with a dark-first color scheme, balanced contrast, and a modern AI SaaS visual hierarchy.
- **Routing**: React Router for single-page application navigation, separating public views (Landing, Features, Login, Register) from protected app spaces (Dashboard, Modules, AI Chat, Quizzes, Study Planner).
- **State & Service Layer**:
  - Centralized Axios instance with base configuration, automatic authorization headers, and unified error interceptors.
  - Dedicated API service modules (`auth.service.js`, `module.service.js`, `document.service.js`, `ai.service.js`) decoupling UI components from network logic.
  - React Context for cross-cutting states: Authentication state, Theme preferences, Active Module selection.
- **Data Visualization**: Recharts for visualizing quiz accuracy, topic mastery, and study streak analytics.

### 3.2 Backend Tier (`server/`)

- **Runtime & Framework**: Node.js with Express.js.
- **Clean Architectural Layers**:
  - **Routes (`routes/`)**: Pure routing declarations, input validation bindings, and middleware attachments. No business logic.
  - **Controllers (`controllers/`)**: Request parsing, response serialization, and dispatching calls to services.
  - **Services (`services/`)**: The core domain layer containing business rules, orchestrations, external API calls, and transaction boundaries.
    - `services/documents/`: File validation, storage management, text extraction.
    - `services/rag/`: Chunking algorithms, vector similarity search, context assembler.
    - `services/ai/`: Gemini API clients for generation, prompt formatting, token budgeting.
    - `services/quiz/`: Scoring calculation, weak-area identification algorithms.
  - **Middleware (`middleware/`)**: Authentication guards, rate limiting, request validation schemas, file upload sanitization, and global uncaught error management.
  - **Models (`models/`)**: Mongoose schemas enforcing database integrity and indexing.

### 3.3 AI & RAG Tier

- **Primary Provider**: Google Gemini API via official SDK.
- **Embedding Model**: Google text-embedding models (high dimensionality, semantic nuance across academic subjects).
- **Generative Models**:
  - Gemini Flash: High-speed query handling, flashcard generation, quiz question generation.
  - Gemini Pro: In-depth academic synthesis, complex technical problem explanations, structured study plan synthesis.
- **Retrieval Architecture**: Semantic similarity search across document chunks stored with their embedding vectors, injecting top-k ranked chunks into prompt contexts alongside explicit citations (document name, page number).

---

## 4. End-to-End Data Flows

### 4.1 Document Ingestion & Vector Indexing Flow

```
[Student Uploads PDF]
       │
       ▼
[Multer Upload Handler] ──> Store document metadata (Status: PROCESSING)
       │
       ▼
[Text Extraction Engine] ──> Extract text page-by-page preserving page numbers
       │
       ▼
[Text Cleaning & Normalization] ──> Remove excessive whitespace, artifacts, headers/footers
       │
       ▼
[Sliding-Window Chunking] ──> 500-1000 tokens per chunk with 10-15% overlap
       │
       ▼
[Gemini Embeddings API] ──> Generate high-dimensional vector per chunk
       │
       ▼
[MongoDB Chunks Collection] ──> Save chunk text + vector embedding + metadata (page, docId)
       │
       ▼
[Document Status Update] ──> Status: READY
```

### 4.2 Grounded RAG Query Flow

```
[Student Asks Question]
       │
       ▼
[Generate Query Embedding] ──> Call Gemini Embedding with student's prompt
       │
       ▼
[Vector Similarity Retrieval] ──> Query chunks collection for top relevant passages
       │
       ▼
[Context Assembly & Filtering] ──> Assemble retrieved passages with page metadata
       │
       ▼
[Grounded Prompt Construction] ──> "Using ONLY the following excerpts, answer the question..."
       │
       ▼
[Gemini Generative API] ──> Synthesize clear, grounded answer
       │
       ▼
[Return Response to Client] ──> Markdown response + explicit source citations (Page #, Excerpt)
```

---

## 5. Technology Choices Rationale

| Layer | Selection | Rationale |
|---|---|---|
| **Frontend Framework** | React + Vite | Lightning-fast development builds, immense ecosystem, predictable state management. |
| **Styling** | Tailwind CSS | Utility-first architecture ensures consistent design system tokens, maintainability, and rapid UI iteration. |
| **Backend Framework** | Express.js on Node.js | Non-blocking asynchronous I/O ideal for streaming AI responses and handling parallel document processing tasks. |
| **Database** | MongoDB + Mongoose | Flexible document schema accommodates heterogeneous academic documents, variable chunk metadata, and evolving quiz structures. |
| **AI Platform** | Google Gemini API | Native large context windows, state-of-the-art multimodal extraction, and cost-effective embedding and inference models. |
| **Authentication** | JWT (Stateless) | Clean client-server separation, scalable across distributed microservices or serverless deployments if required. |

---

## 6. Security, Resilience & Scalability Considerations

1. **API Key Isolation**: Gemini API keys, MongoDB credentials, and JWT secrets reside strictly on the server in non-committed `.env` files; the frontend never has access to external AI keys.
2. **File Upload Security**: Strict MIME-type filtering, file size limits (e.g., max 25MB per lecture), and secure filename generation prevent path traversal or malicious uploads.
3. **Graceful Degradation**: If vector retrieval yields low-confidence matches, the system explicitly alerts the student that the uploaded materials do not contain sufficient information rather than fabricating answers.
4. **Token Budgeting & Rate Limiting**: Centralized AI service manages prompt token lengths to stay comfortably within API quotas and maintain fast response times.

---

## 7. Phase 2: Authentication & Module Management Architecture

### 7.1 Authentication & Authorization Flow
```
[Client (React)] 
      │
      ├─► POST /api/auth/register ──► Validate input ──► Hash with bcrypt (10 rounds) ──► Save User ──► Issue JWT
      ├─► POST /api/auth/login    ──► Validate creds ──► Compare hash with bcrypt    ──► Issue JWT
      │
[Private API Calls]
      │
      ├─► Attach Header: `Authorization: Bearer <token>`
      ▼
[requireAuth Middleware]
      │
      ├─► Verify token signature & expiry via process.env.JWT_SECRET
      ├─► Check MongoDB readiness (returns 503 if DB disconnected)
      ├─► Retrieve user by ID (`-password`), attach to `req.user`
      ▼
[requireRole Middleware]
      │
      ├─► Check `req.user.role` (e.g. 'admin' vs 'student')
      └─► Return 403 Forbidden if role criteria not met
```

### 7.2 Module Management & Enrollment Subsystem
- **Catalog Management**: Administrators can create, update, and delete course modules. Deleting a module triggers cascade removal from all student `enrolledModules` lists.
- **Student Enrollment**: Students can self-enroll into available modules. Duplicate enrollments are checked and rejected with `400 Bad Request`.
- **Identity Isolation**: Enrollment operations strictly use `req.user._id` decoded from the verified JWT payload, preventing students from modifying other users' enrollments.

---

### 8.1 Scope & Incremental Pipeline Boundaries
- **Phase 3 (Complete)**: `PDF Upload` ──► `Text Extraction` ──► `Extracted Text & Page Count Saved in MongoDB`
- **Phase 4 (Current Completed)**: `Extracted Text` ──► `Text Normalization` ──► `Semantic Sliding-Window Chunking` ──► `DocumentChunk Records in MongoDB`
- **Phase 5 (Next Phase)**: `Chunks` ──► `Gemini Vector Embeddings (text-embedding-004)` ──► `Vector Storage / Index`
- **Phase 6+ (Future)**: `Semantic Retrieval` ──► `Context Re-ranking` ──► `LLM Synthesis (Gemini Flash/Pro)`

---

## 9. Phase 4: Document Chunking Architecture & Pipeline

### 9.1 Overview & Responsibilities
Phase 4 transforms extracted plain text into clean, structured, and overlapping semantic chunks stored in a dedicated `DocumentChunk` MongoDB collection. Each chunk is independently indexed and ready for vectorization in Phase 5.

Strict architectural separation of concerns is maintained:
- **`Document` model**: Maintains document metadata, raw extracted text, processing lifecycle status, and total `chunkCount`.
- **`DocumentChunk` model**: Houses individual chunk passages, word/token metrics, positional indexes, and provenance metadata.
- **`textCleaning.service.js`**: Normalizes raw extracted PDF text, removing page-break markers, form feeds, accidental hyphenation, and excessive whitespace while preserving paragraph structure (`\n\n`) and sentence punctuation.
- **`chunking.service.js`**: Splits normalized text into semantically coherent segments using a hierarchical boundary strategy (Paragraph ➔ Sentence ➔ Word), strictly respecting configured chunk size and sliding overlap without splitting words.
- **`documentProcessing.service.js`**: Orchestrates the asynchronous pipeline: `Extraction` ──► `Cleaning` ──► `Chunking` ──► `Atomic Chunk Insertion` ──► `Document Status Update`.
- **`document.controller.js` & `document.routes.js`**: Exposes paginated chunk inspection via `GET /api/documents/:id/chunks`.

### 9.2 End-to-End Ingestion & Chunking Pipeline
```
[POST /api/documents] (Admin)
         │
         ▼
[Multer Upload Handler] ──► Store file in server/uploads/documents/, create Document (status: "uploaded")
         │
         ▼ (Asynchronous background setImmediate)
[Document Processing Service] ──► Status: "processing"
         │
         ▼
[PDF Text Extractor (pdf-parse)] ──► Extract raw text and total pageCount
         │
         ▼
[Text Cleaning Service] ──► Remove page artifacts, clean whitespace, normalize linebreaks
         │
         ▼
[Chunking Service] ──► Split by Paragraph/Sentence/Word boundaries into sliding chunks
         │              Default: ~900 words (~1200 est. tokens), ~150 words (~200 est. tokens) overlap
         │
         ▼
[Reprocessing Cleanup] ──► Delete any existing DocumentChunk records for this document
         │
         ▼
[Bulk Insert Chunks] ──► Insert DocumentChunk records into MongoDB
         │
         ▼
[Finalize Document] ──► Status: "processed", chunkCount: N, extractedText: cleanedText
```

### 9.3 Reprocessing Safety & Cascade Lifecycle
1. **Idempotent Reprocessing**: Before inserting new chunks during re-processing, `DocumentChunk.deleteMany({ document: document._id })` is executed. A compound unique index on `{ document: 1, chunkIndex: 1 }` guarantees that no duplicate chunk indexes can exist.
2. **Failure Isolation**: If text extraction or chunking encounters an error, any partially generated chunks are wiped and the document status transitions to `"failed"`.
3. **Cascade Deletion**:
   - Deleting a document (`DELETE /api/documents/:id`) safely removes all associated `DocumentChunk` records from MongoDB, in addition to unlinking the physical PDF from disk.
   - Deleting a module (`DELETE /api/modules/:id`) cascades across all associated documents and their corresponding `DocumentChunk` records.

### 8.2 Safe Storage & Multer Upload Strategy
- **Path Isolation**: Files are stored strictly outside the source tree in `server/uploads/documents/`.
- **Git Protection**: `server/uploads/` is strictly ignored in `.gitignore`.
- **Path Traversal Prevention**: Client-supplied filenames are never used for filesystem operations. Stored filenames use cryptographic entropy: `doc-${Date.now()}-${randomHex}.pdf`.
- **Validation**:
  - File extension: `.pdf` (case-insensitive).
  - MIME type: `application/pdf`.
  - Max file size: 25MB.
- **Multer Middleware**: Wrapped in `uploadDocumentMiddleware` to return clean, standardized JSON errors rather than Express default error stack traces.

### 8.3 Asynchronous Ingestion Architecture
```
[POST /api/documents] (Admin)
         │
         ▼
[Multer validates & writes to server/uploads/documents/]
         │
         ▼
[Create Document Record (status: "uploaded")] ──► Return 201 Created immediately
         │
         ▼ (Background setImmediate)
[Document Processing Service] ──► Status: "processing"
         │
         ▼
[PDF Text Extractor (pdf-parse)] ──► Extract text & numpages, normalize whitespace
         │
         ├───► Success: Status = "processed", extractedText = "...", pageCount = N
         └───► Failure: Status = "failed", processingError = sanitized message
```

### 8.4 Access Scoping & Cascade Cleanup
- **Role-Based Upload/Delete**: `POST /api/documents` and `DELETE /api/documents/:id` require `admin` role.
- **Enrollment Scoping for Students**: When students request `GET /api/documents` or `GET /api/documents/:id`, access is permitted **only** for modules where the student is actively enrolled in `enrolledModules`. Unenrolled requests receive `403 Forbidden`.
- **Cascade Deletion**: When an administrator deletes a module (`DELETE /api/modules/:id`), all associated Document records and their corresponding physical disk files are unlinked and removed.


