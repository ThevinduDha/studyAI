# StudyAI — REST API Specification

This document details the planned REST API routes, HTTP verbs, payload structures, and response conventions for **StudyAI**.

> [!NOTE]
> **Phase 1 Baseline**: Only `GET /api/health` is active in this phase. The remaining endpoints will be incrementally developed in future phases.

---

## 1. Global API Conventions

- **Base URL**: `/api`
- **Content Type**: `application/json` (except file upload endpoints: `multipart/form-data`)
- **Authentication**: Bearer Token in `Authorization` header (`Bearer <JWT>`) for protected routes.
- **Standard Success Envelope**:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Optional descriptive status"
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Validation failed on email field"
    }
  }
  ```

---

## 2. Active Endpoints (Phase 1 & Phase 2)

### 2.1 System Health
- **`GET /api/health`**
  - **Auth**: Public
  - **Description**: Returns server operational status and server timestamp.
  - **Response `200 OK`**:
    ```json
    {
      "status": "ok",
      "message": "StudyAI API is running",
      "timestamp": "2026-09-07T18:45:00.000Z",
      "environment": "development"
    }
    ```

### 2.2 Authentication (`/api/auth`)
- **`POST /api/auth/register`**
  - **Auth**: Public
  - **Body**: `{ "name": "...", "email": "...", "password": "...", "role": "student" | "admin" }`
  - **Response `201 Created`**: Returns `{ success: true, data: { user, token } }`
- **`POST /api/auth/login`**
  - **Auth**: Public
  - **Body**: `{ "email": "...", "password": "..." }`
  - **Response `200 OK`**: Returns `{ success: true, data: { user, token } }`
- **`GET /api/auth/me`**
  - **Auth**: `Bearer <token>` (Student or Admin)
  - **Response `200 OK`**: Returns `{ success: true, data: { user } }` (populated enrolled modules)

### 2.3 Course Modules (`/api/modules`)
- **`GET /api/modules`**
  - **Auth**: `Bearer <token>` (Student or Admin)
  - **Query Params**: `search` (optional)
  - **Response `200 OK`**: Returns `{ success: true, data: { modules: [...] } }`
- **`GET /api/modules/enrolled`**
  - **Auth**: `Bearer <token>` (Student only)
  - **Response `200 OK`**: Returns `{ success: true, data: { enrolledModules: [...] } }`
- **`GET /api/modules/:id`**
  - **Auth**: `Bearer <token>` (Student or Admin)
  - **Response `200 OK`**: Returns `{ success: true, data: { module: {...} } }`
- **`POST /api/modules`**
  - **Auth**: `Bearer <token>` (Admin only)
  - **Body**: `{ "moduleCode": "...", "moduleName": "...", "description": "...", "lecturer": "...", "semester": "...", "year": 2026 }`
  - **Response `201 Created`**: Returns `{ success: true, data: { module: {...} } }`
- **`PUT /api/modules/:id`**
  - **Auth**: `Bearer <token>` (Admin only)
  - **Body**: Updated module fields
  - **Response `200 OK`**: Returns `{ success: true, data: { module: {...} } }`
- **`DELETE /api/modules/:id`**
  - **Auth**: `Bearer <token>` (Admin only)
  - **Response `200 OK`**: Cascades deletion across student enrollment arrays.
- **`POST /api/modules/:id/enroll`**
  - **Auth**: `Bearer <token>` (Student only)
  - **Response `200 OK`**: Enrolls student in module. Returns `400 Bad Request` if duplicate.
- **`DELETE /api/modules/:id/enroll`**
  - **Auth**: `Bearer <token>` (Student only)
  - **Response `200 OK`**: Unenrolls student from module.

---

### 2.4 Document Management (`/api/documents` — Phase 3 Active)
- **`POST /api/documents`**
  - **Auth**: `Bearer <token>` (Admin only)
  - **Content-Type**: `multipart/form-data`
  - **Form Fields**:
    - `moduleId`: Target module ObjectId (required)
    - `file` or `document`: PDF file binary (max 25MB, application/pdf only)
  - **Response `201 Created`**:
    ```json
    {
      "success": true,
      "message": "Document uploaded successfully and queued for processing",
      "data": {
        "document": {
          "_id": "67cc...",
          "module": "67cb...",
          "uploadedBy": "67ca...",
          "originalName": "Lecture1_Algorithms.pdf",
          "storedName": "doc-1788799269743-eea94f82d6c871a2.pdf",
          "mimeType": "application/pdf",
          "fileSize": 1048576,
          "pageCount": 0,
          "extractedText": "",
          "status": "uploaded",
          "createdAt": "2026-09-07T18:45:00.000Z"
        }
      }
    }
    ```
- **`GET /api/documents`**
  - **Auth**: `Bearer <token>` (Student or Admin)
  - **Query Params**: `moduleId` or `module` (optional filter)
  - **Authorization Scoping**: Students can only access documents belonging to enrolled modules. Querying an unenrolled module yields `403 Forbidden`. Admins have universal visibility.
  - **Response `200 OK`**: Returns `{ success: true, data: { documents: [...] } }`
- **`GET /api/documents/:id`**
  - **Auth**: `Bearer <token>` (Student or Admin)
  - **Authorization Scoping**: Enforces module enrollment for students.
  - **Response `200 OK`**: Returns `{ success: true, data: { document: { ... } } }`
- **`DELETE /api/documents/:id`**
  - **Auth**: `Bearer <token>` (Admin only)
  - **Description**: Deletes document metadata from MongoDB, deletes all corresponding `DocumentChunk` records, and safely unlinks the physical PDF file from the disk.
  - **Response `200 OK`**: Returns `{ success: true, message: "Document '...' deleted successfully", data: { document } }`
- **`GET /api/documents/:id/chunks`**
  - **Auth**: `Bearer <token>` (Student or Admin — Phase 4 Active)
  - **Query Params**:
    - `page`: Page number (integer >= 1, default: `1`)
    - `limit`: Chunks per page (integer 1-100, default: `20`)
  - **Authorization Scoping**: Students can only access chunks from documents belonging to modules they are actively enrolled in (`403 Forbidden` if not enrolled). Admins have universal access across all modules.
  - **Response `200 OK`**:
    ```json
    {
      "success": true,
      "data": {
        "chunks": [
          {
            "_id": "67ce123...",
            "document": "67cd456...",
            "module": "67cc789...",
            "chunkIndex": 0,
            "text": "Distributed systems are computing environments...",
            "characterCount": 1129,
            "tokenCount": 187,
            "metadata": {
              "originalName": "cs401_lecture1.pdf",
              "pageStart": null,
              "pageEnd": null,
              "sectionHeading": null,
              "sourceType": "pdf"
            },
            "createdAt": "2026-09-07T22:30:00.000Z"
          }
        ],
        "pagination": {
          "total": 12,
          "page": 1,
          "limit": 20,
          "totalPages": 1
        }
      }
    }
- **`GET /api/documents/:id/embedding-status`**
  - **Auth**: `Bearer <token>` (Admin only — Phase 5 Active)
  - **Description**: Returns embedding generation status, chunk counts, model, and dimensions without exposing raw vector arrays.
  - **Response `200 OK`**:
    ```json
    {
      "success": true,
      "data": {
        "documentId": "67ce123...",
        "originalName": "cs401_lecture1.pdf",
        "totalChunks": 12,
        "embeddedChunks": 12,
        "failedChunks": 0,
        "status": "completed",
        "model": "gemini-embedding-2",
        "dimensions": 768
      }
    }
    ```
- **`POST /api/documents/:id/re-embed`**
  - **Auth**: `Bearer <token>` (Admin only — Phase 5 Active)
  - **Description**: Regenerates dense 768-dimensional embeddings for all existing chunks of a document without re-extracting the PDF.
  - **Response `200 OK`**:
    ```json
    {
      "success": true,
      "message": "Document chunks successfully re-embedded",
      "data": {
        "documentId": "67ce123...",
        "totalChunks": 12,
        "embeddedChunks": 12,
        "status": "completed",
        "model": "gemini-embedding-2",
        "dimensions": 768
      }
    }
    ```

### 2.5 Semantic Retrieval (`/api/retrieval` — Phase 6 Active)
- **`POST /api/retrieval/search`**
  - **Auth**: `Bearer <token>` (Student: enrolled modules only; Admin: global or scoped)
  - **Description**: Executes vector similarity search against MongoDB Atlas Vector Search using `gemini-embedding-2` (`RETRIEVAL_QUERY`, 768d) with cosine similarity and authorization pre-filtering.
  - **Request Body**:
    ```json
    {
      "question": "What is the difference between supervised and unsupervised learning?",
      "moduleId": "67ce123...",
      "documentId": "67ce456...",
      "topK": 5
    }
    ```
    - `question` *(string, required)*: Max 2000 characters.
    - `moduleId` *(string, optional)*: MongoDB ObjectId. Enforces enrollment check for students.
    - `documentId` *(string, optional)*: MongoDB ObjectId. Enforces module enrollment check for students.
    - `topK` *(number, optional)*: Integer between 1 and 20. Default: 5.
  - **Response `200 OK`**:
    ```json
    {
      "success": true,
      "data": {
        "question": "What is the difference between supervised and unsupervised learning?",
        "results": [
          {
            "chunkId": "67ce789...",
            "documentId": "67ce456...",
            "documentName": "Lecture-03-ML.pdf",
            "moduleId": "67ce123...",
            "moduleCode": "CS401",
            "moduleName": "Machine Learning",
            "chunkIndex": 3,
            "text": "Supervised learning relies on labeled training pairs...",
            "characterCount": 420,
            "tokenCount": 70,
            "score": 0.8742,
            "metadata": {
              "originalName": "Lecture-03-ML.pdf",
              "pageStart": 4,
              "pageEnd": 5,
              "sectionHeading": "Supervised vs Unsupervised",
              "sourceType": "pdf"
            }
          }
        ],
        "count": 1
      }
    }
    ```
  - **Error Responses**:
    - `400 Bad Request`: Empty question, invalid `topK`, invalid ObjectId format, or document/module mismatch.
    - `401 Unauthorized`: Missing or invalid JWT.
    - `403 Forbidden`: Student attempting to query a non-enrolled module or document.
    - `404 Not Found`: Specified `moduleId` or `documentId` does not exist.
    - `503 Service Unavailable`: `GEMINI_API_KEY` not configured.

### 2.6 Grounded RAG Question Answering (`/api/rag` — Phase 7 Active)
- **`POST /api/rag/ask`**
  - **Auth**: `Bearer <token>` (Student: enrolled modules only; Admin: global or scoped)
  - **Description**: Submits an academic question to the grounded StudyAI RAG pipeline. Retrievable course chunks from MongoDB Atlas Vector Search are injected as reference context into Google Gemini (`gemini-2.0-flash`). Gemini answers strictly from the context, and verified application citations are returned.
  - **Request Body**:
    ```json
    {
      "question": "What is state machine replication?",
      "moduleId": "67ce123...",
      "documentId": "67ce456...",
      "topK": 5
    }
    ```
  - **Response `200 OK`**:
    ```json
    {
      "success": true,
      "data": {
        "question": "What is state machine replication?",
        "answer": "According to the provided lecture notes, state machine replication is a technique where multiple nodes maintain identical states by executing a deterministic sequence of commands...",
        "sources": [
          {
            "documentId": "67ce456...",
            "documentName": "lecture_consensus.pdf",
            "moduleId": "67ce123...",
            "moduleCode": "CS401",
            "chunkIndex": 0,
            "pageStart": 2,
            "pageEnd": 3,
            "sectionHeading": "Consensus Basics",
            "score": 0.8842
          }
        ],
        "retrieval": {
          "count": 1
        }
      }
    }
    ```
  - **Zero-Context / Knowledge-Gap Response `200 OK`**:
    ```json
    {
      "success": true,
      "data": {
        "question": "What is the capital of Mars?",
        "answer": "I couldn't find enough information about this in the provided study materials.",
        "sources": [],
        "retrieval": {
          "count": 0
        }
      }
    }
    ```
  - **Error Responses**:
    - `400 Bad Request`: Missing question, whitespace question, question > 2000 chars, or invalid `topK`.
    - `401 Unauthorized`: Missing or invalid JWT session.
    - `403 Forbidden`: Student attempting to query a non-enrolled module or document.
    - `502 Bad Gateway`: AI generation failure (sanitized error message).
### 2.7 Lecture Summaries (`/api/summaries`)
- **`POST /api/summaries/generate`**
  - **Auth**: Required (`student` or `admin`)
  - **Description**: Generates an exam-oriented structured summary for a document based on its chunks.
  - **Body**:
    ```json
    {
      "documentId": "65f1a2b3c4d5e6f7a8b9c0d1"
    }
    ```
  - **Response `201 Created`**:
    ```json
    {
      "success": true,
      "data": {
        "summary": {
          "_id": "675000000000000000000099",
          "document": "65f1a2b3c4d5e6f7a8b9c0d1",
          "module": "65f1a2b3c4d5e6f7a8b9c010",
          "title": "Machine Learning Fundamentals",
          "overview": "Comprehensive executive summary...",
          "keyConcepts": [
            { "title": "Supervised Learning", "explanation": "..." }
          ],
          "importantPoints": ["..."],
          "examFocus": ["..."],
          "definitions": [
            { "term": "Gradient Descent", "definition": "..." }
          ],
          "examples": ["..."],
          "version": 1,
          "model": "gemini-3.8-flash",
          "status": "generated",
          "generatedAt": "2026-09-07T18:40:00.000Z"
        },
        "sources": [
          {
            "chunkId": "...",
            "chunkIndex": 0,
            "document": "...",
            "documentName": "Lecture 01.pdf",
            "pageStart": 1,
            "pageEnd": 2,
            "sectionHeading": "Introduction",
            "relevanceScore": 1.0
          }
        ]
      }
    }
    ```

- **`GET /api/summaries/document/:documentId`**
  - **Auth**: Required (`student` or `admin`)
  - **Description**: Retrieves the latest generated summary version for the document.
  - **Response `200 OK`**: Returns `{ success: true, data: { ...summary } }`
  - **Response `404 Not Found`**: Returned if no summary has been generated yet for the document (`SUMMARY_NOT_FOUND`).

- **`POST /api/summaries/document/:documentId/regenerate`**
  - **Auth**: Required (`student` or `admin`)
  - **Description**: Regenerates the lecture summary, incrementing its `version` field (e.g. `v1 -> v2`).
  - **Response `200 OK`**: Returns `{ success: true, data: { summary, sources } }`

- **`DELETE /api/summaries/document/:documentId`**
  - **Auth**: Admin only
  - **Description**: Deletes all generated summary records associated with the document.
  - **Response `200 OK`**: Returns `{ success: true, message: "Summary deleted successfully", data: { deletedCount: 1 } }`

### 2.8 Exam-Focused Question Generator (`/api/questions`)
- **`POST /api/questions/generate`**
  - **Auth**: Required (`student` enrolled in module, or `admin`)
  - **Description**: Generates exam-focused questions from lecture document chunks, validates schema, checks duplicates, and attaches source citations.
  - **Body**:
    ```json
    {
      "documentId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "questionType": "MCQ",
      "difficulty": 3,
      "count": 5
    }
    ```
  - **Response `201 Created`**:
    ```json
    {
      "success": true,
      "data": {
        "requested": 5,
        "generated": 5,
        "questions": [
          {
            "_id": "675000000000000000000101",
            "module": "65f1a2b3c4d5e6f7a8b9c010",
            "document": "65f1a2b3c4d5e6f7a8b9c0d1",
            "questionType": "MCQ",
            "difficulty": 3,
            "questionText": "What is the primary role of a loss function?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "A",
            "explanation": "...",
            "examClue": "...",
            "commonTrap": "...",
            "topic": "Optimization",
            "sourceChunks": [...],
            "generationModel": "gemini-3.8-flash",
            "generationVersion": 1,
            "isActive": true
          }
        ]
      }
    }
    ```

- **`GET /api/questions/document/:documentId`**
  - **Auth**: Required (`student` enrolled in module, or `admin`)
  - **Query Params**: `questionType`, `difficulty`, `hideAnswers=true|false`
  - **Description**: Retrieves active questions for a document.

- **`GET /api/questions/module/:moduleId`**
  - **Auth**: Required (`student` enrolled in module, or `admin`)
  - **Query Params**: `questionType`, `difficulty`, `hideAnswers=true|false`
  - **Description**: Retrieves active questions across an entire module.

- **`GET /api/questions/:questionId`**
  - **Auth**: Required (`student` enrolled in module, or `admin`)
  - **Description**: Retrieves a single question by ID.

- **`DELETE /api/questions/:questionId`**
  - **Auth**: Admin only
  - **Description**: Deletes a question record. Returns 403 Forbidden for students.

---

### 2.8 AI Quizzes & Attempts (`/api/quizzes` — Phase 10 Active)

- **`POST /api/quizzes`**
  - **Auth**: Required (`student` enrolled in module, or `admin`)
  - **Body**:
    ```json
    {
      "moduleId": "6a9f07a74abd88ccd0eaf471",
      "documentId": "6a9f07a74abd88ccd0eaf472",
      "questionType": "ALL",
      "difficulty": "ALL",
      "count": 10,
      "randomized": true,
      "timeLimitSeconds": 600
    }
    ```
  - **Description**: Samples existing Question Bank records from MongoDB and creates a Quiz. Fails with 400 `INSUFFICIENT_QUESTIONS` if fewer questions exist.
  - **Response `201 Created`**: Returns quiz metadata and sanitized question payload (`correctAnswer`, `explanation`, etc. are omitted).

- **`GET /api/quizzes/:quizId`**
  - **Auth**: Required (`student` enrolled in module, or `admin`)
  - **Description**: Retrieves quiz metadata and secure question payload.

- **`POST /api/quizzes/:quizId/start`**
  - **Auth**: Required (`student` enrolled in module, or `admin`)
  - **Description**: Starts an attempt or resumes an existing `in_progress` attempt to avoid duplicate sessions.
  - **Response `201 Created` / `200 OK`**: Returns `{ attempt, quiz, questions }` with answers masked.

- **`POST /api/quizzes/attempts/:attemptId/submit`**
  - **Auth**: Required (`student` owner)
  - **Body**:
    ```json
    {
      "answers": [
        { "questionId": "6a9f...", "selectedAnswer": "Optimal substructure" }
      ]
    }
    ```
  - **Description**: Server grades answers against stored Question records, computes accuracy, elapsed time, updates attempt to `completed`, and reveals full question review with answers and explanations.

- **`GET /api/quizzes/attempts`**
  - **Auth**: Required (Student receives own history; Admin inspects globally)
  - **Query Params**: `moduleId`, `documentId`, `status`
  - **Description**: Returns chronological list of quiz attempts.

- **`GET /api/quizzes/attempts/:attemptId`**
  - **Auth**: Required (Student owner or Admin)
  - **Description**: Retrieves single attempt. Returns masked questions while `in_progress`; reveals complete review once `completed`.

- **`POST /api/quizzes/attempts/:attemptId/abandon`**
  - **Auth**: Required (Student owner)
  - **Description**: Abandons an active `in_progress` quiz attempt.

- **`DELETE /api/quizzes/:quizId`**
  - **Auth**: Admin only
  - **Description**: Deletes a quiz and cleans associated in-progress attempts.

---

### 2.9 Student Performance Analytics & Weak-Topic Intelligence (`/api/analytics` — Phase 11 Active)

- **`GET /api/analytics/overview`**
  - **Auth**: Required (Student receives own analytics; Admin can query `?studentId=...`)
  - **Description**: Computes deterministic performance metrics across all completed quizzes: overall accuracy, average score, pacing, chronological trend, module mastery, topic strengths/weaknesses (`STRONG`, `AVERAGE`, `WEAK`, `INSUFFICIENT_DATA`), difficulty levels (2, 3, 4), question types, priority-ranked weak topics, and frequently missed questions (without answer keys).

- **`GET /api/analytics/module/:moduleId`**
  - **Auth**: Required (Student must be enrolled in module; Admin has global access)
  - **Description**: Retrieves scoped performance analytics for a specific course module, including topic breakdown, difficulty mastery, and recent completed quizzes.

- **`GET /api/analytics/topic/:topic`**
  - **Auth**: Required
  - **Description**: Retrieves scoped analytics for a specific topic, including total questions, accuracy, difficulty breakdown, and frequently missed questions.

- **`POST /api/analytics/ai-insight`**
  - **Auth**: Required
  - **Body**: `{ "summaryData": { ... } }`
  - **Description**: Optional strategic study advice generation powered by Gemini 3.8 Flash, grounded in the provided sanitized analytical summary with prompt injection defenses and deterministic fallback.

---

## 3. Planned Future Endpoints (Phase 12+)

### 3.8 Study Plans (`/api/study-plans` — Phase 12)
- **`POST /api/study-plans/generate`** — Generate an AI-recommended daily/weekly study schedule based on Phase 11 weak spots and upcoming deadlines.
- **`GET /api/study-plans`** — Get scheduled study tasks for today or this week.
- **`PATCH /api/study-plans/:id/tasks/:taskId`** — Mark a study task as completed.

### 3.7 Flashcards (`/api/flashcards`)
- **`POST /api/flashcards/generate`** — Generate front/back flashcard decks from lecture chunks.
- **`GET /api/flashcards/module/:moduleId`** — Retrieve flashcard decks for spaced repetition revision.
- **`PATCH /api/flashcards/:id/review`** — Record review confidence (easy, medium, hard).
