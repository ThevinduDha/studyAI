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
    ```

---

## 3. Planned Future Endpoints (Phase 5+)

### 3.5 AI & RAG (`/api/ai`)
- **`POST /api/ai/chat`** — Submit a contextual question scoped to a module or document.
  - **Body**: `{ "moduleId": "...", "documentId": "...", "query": "Explain Theorem 3" }`
  - **Response**: `{ "answer": "...", "sources": [{ "documentName": "...", "pageNumber": 5 }] }`
- **`POST /api/ai/summarize`** — Generate an executive summary or study notes for an uploaded lecture.
- **`POST /api/ai/podcast-script`** — Generate an audio-ready conversational study dialogue script between two hosts.

### 3.6 Quizzes (`/api/quizzes`)
- **`POST /api/quizzes/generate`** — Generate AI MCQs from a document or module with specified difficulty.
- **`GET /api/quizzes/module/:moduleId`** — Retrieve practice questions for a module.
- **`POST /api/quizzes/submit`** — Submit an attempt (`moduleId`, answers array); returns score, answer explanations, and weak-area diagnosis.
- **`GET /api/quizzes/history`** — Retrieve past quiz attempts and historical scores.

### 3.7 Flashcards (`/api/flashcards`)
- **`POST /api/flashcards/generate`** — Generate front/back flashcard decks from lecture chunks.
- **`GET /api/flashcards/module/:moduleId`** — Retrieve flashcard decks for spaced repetition revision.
- **`PATCH /api/flashcards/:id/review`** — Record review confidence (easy, medium, hard).

### 3.8 Study Plans (`/api/study-plans`)
- **`POST /api/study-plans/generate`** — Generate an AI-recommended daily/weekly study schedule based on quiz weak spots and upcoming deadlines.
- **`GET /api/study-plans`** — Get scheduled study tasks for today or this week.
- **`PATCH /api/study-plans/:id/tasks/:taskId`** — Mark a study task as completed.

### 3.9 Progress & Analytics (`/api/progress`)
- **`GET /api/progress/dashboard`** — Consolidated metrics: overall mastery score, study streaks, hours spent, weak topics across all modules.
- **`GET /api/progress/module/:moduleId`** — Module-specific mastery breakdown and topic retention trends.
- **`POST /api/progress/session`** — Log a completed study session duration.
