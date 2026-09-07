# StudyAI — Database Schema & Data Modeling

This document specifies the MongoDB collections, schemas, foreign key references, and indexing strategies for the **StudyAI** platform.

> [!NOTE]
> **Phase 2 Status**: The `users` and `modules` schemas are actively implemented using Mongoose with bcryptjs password hashing, JWT authentication, and enrollment relationships. Future phase schemas (`documents`, `chunks`, `questions`, etc.) are planned for subsequent phases.

---

## 1. Entity-Relationship Overview

```
 [Users]
    │ 1 (creator)
    ├──────< [Modules]
    │           │ 1
    │           ├───< [Documents] (extensible sub-schema in Phase 2)
    │           │         │ 1
    │           │         └───< [Chunks]
    │           │
    │           ├───< [Questions]
    │           ├───< [QuizAttempts]
    │           └───< [StudySessions]
    │
    │ N (enrolledModules)
    └──────> [Modules]
```

---

## 2. Active MongoDB Collections (Phase 2 Implemented)

### 2.1 `users` (`server/src/models/user.model.js`)
Stores student and administrator accounts, credentials, and module enrollments.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `name` | String | Full name of the user | Required, trimmed, minlength: 2 |
| `email` | String | User's university or personal email | Required, unique, indexed, lowercase, regex validated |
| `password` | String | Salted bcrypt hash (10 rounds) | Required, minlength: 6, excluded by default in `toJSON()` |
| `role` | String | Access tier (`student`, `admin`) | Default: `student` |
| `enrolledModules` | Array<ObjectId> | References to `Module._id` | Array of ObjectIds referencing `Module` |
| `createdAt` | Date | Timestamp of account registration | Managed by Mongoose `timestamps: true` |
| `updatedAt` | Date | Timestamp of last profile update | Managed by Mongoose `timestamps: true` |

### 2.2 `modules` (`server/src/models/module.model.js`)
Represents an academic course module offered at the university.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `moduleCode` | String | Official module code (e.g. "CS2040") | Required, unique, uppercase, trimmed, indexed |
| `moduleName` | String | Name of the course / module | Required, trimmed, minlength: 2 |
| `description`| String | Course overview and learning objectives | Optional |
| `lecturer` | String | Assigned faculty lecturer / instructor | Optional, trimmed |
| `semester` | String | Academic term (e.g. "Semester 1") | Default: `Semester 1` |
| `year` | Number | Academic year | Default: current calendar year |
| `documents` | Array<Subdocument>| Embedded document descriptors (extensible for RAG)| Title, fileUrl, fileType, pageCount, status |
| `createdBy` | ObjectId | Reference to `User._id` (admin creator) | Reference to `User` |
| `createdAt` | Date | Creation timestamp | Managed by Mongoose `timestamps: true` |
| `updatedAt` | Date | Last modification timestamp | Managed by Mongoose `timestamps: true` |

*Index*: Compound index on `{ moduleCode: 1, moduleName: 1 }` for search acceleration.


---

### 2.3 `documents` (`server/src/models/document.model.js` — Phase 3 Active)
Metadata, file storage references, and raw extracted text for uploaded course literature.

> [!NOTE]
> Binary PDF data is stored safely on the filesystem (`server/uploads/documents/`), **never** inside MongoDB. MongoDB strictly stores document metadata and extracted text.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `module` | ObjectId | Reference to `Module._id` | Required, indexed |
| `uploadedBy` | ObjectId | Reference to `User._id` | Required |
| `originalName`| String | Original client-side filename | Required, trimmed |
| `storedName` | String | Collision-free unique filename on disk | Required |
| `filePath` | String | Filesystem path on server | Required |
| `mimeType` | String | MIME type (`application/pdf`) | Required |
| `fileSize` | Number | File size in bytes | Required, max 25MB |
| `pageCount` | Number | Total extracted pages from PDF | Optional, default: 0 |
| `extractedText`| String | Cleaned, normalized plain text extracted from PDF | Optional, default: `""` |
| `status` | String | Lifecycle state (`uploaded`, `processing`, `processed`, `failed`) | Enum, default: `uploaded`, indexed |
| `processingError`| String | Error message if extraction failed | Optional |
| `createdAt` | Date | Upload timestamp | Auto-managed timestamp |
| `updatedAt` | Date | Ingestion timestamp | Auto-managed timestamp |

*Index*: Compound index on `{ module: 1, createdAt: -1 }` for fast module document feeds.

---

### 2.4 `chunks`
Discrete, segmented text passages extracted from documents for vector similarity search.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `documentId` | ObjectId | Reference to `documents._id` | Required, indexed (cascade delete) |
| `moduleId` | ObjectId | Reference to `modules._id` | Required, indexed |
| `content` | String | The actual text passage content | Required |
| `embedding` | Array<Number> | High-dimensional vector generated by Gemini | Vector index / Cosine similarity |
| `pageNumber` | Number | Source page number from the original document | Required for citations |
| `metadata` | Object | Token count, chunk index, headings, section info | Optional |

*Index*: Compound index on `{ moduleId: 1, documentId: 1 }` and Vector Search index on `embedding`.

---

### 2.5 `questions`
AI-generated or curated multiple-choice questions (MCQs) for module revision.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `userId` | ObjectId | Reference to `users._id` | Required, indexed |
| `moduleId` | ObjectId | Reference to `modules._id` | Required, indexed |
| `documentId` | ObjectId | Reference to `documents._id` | Optional (source material link) |
| `question` | String | The question prompt text | Required |
| `options` | Array<String> | 4 distinct multiple-choice options | Required, min 2, standard 4 |
| `correctAnswer`| Number | Index of the correct option (0-3) | Required |
| `explanation` | String | Grounded explanation justifying the answer | Required |
| `difficulty` | String | Question tier (`EASY`, `MEDIUM`, `HARD`) | Default: `MEDIUM` |

---

### 2.6 `quizAttempts`
Student test attempts, storing submitted answers, score results, and timing.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `userId` | ObjectId | Reference to `users._id` | Required, indexed |
| `moduleId` | ObjectId | Reference to `modules._id` | Required, indexed |
| `score` | Number | Number of correct questions | Required |
| `totalQuestions`| Number | Total questions in attempt | Required |
| `answers` | Array<Object> | Array of `{ questionId, selectedAnswer, isCorrect }` | Detailed record |
| `completedAt` | Date | Timestamp of submission | Required, indexed |

---

### 2.7 `studySessions`
Tracks active study intervals, focus topics, and duration for analytics and habit tracking.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `userId` | ObjectId | Reference to `users._id` | Required, indexed |
| `moduleId` | ObjectId | Reference to `modules._id` | Required, indexed |
| `topic` | String | Specific lecture or concept revised | Required |
| `duration` | Number | Active study duration in seconds | Required |
| `startedAt` | Date | Session start timestamp | Required |
| `completedAt` | Date | Session finish timestamp | Required |

---

### 2.8 `studyPlans`
AI-generated or student-customized daily/weekly study agendas.

| Field | Type | Description | Constraints & Indexing |
|---|---|---|---|
| `_id` | ObjectId | Primary Key | Auto-generated |
| `userId` | ObjectId | Reference to `users._id` | Required, indexed |
| `date` | Date | Scheduled target date | Required, indexed |
| `tasks` | Array<Object> | List of `{ taskId, title, moduleId, estimatedMinutes, completed }` | Structured checklist |
| `priority` | String | Overall plan priority (`LOW`, `MEDIUM`, `HIGH`) | Default: `MEDIUM` |
| `completed` | Boolean | Whether all tasks are completed | Default: `false` |

---

## 3. Data Integrity & Lifecycle Rules

1. **Cascade Deletion Policy**:
   - When a `module` is deleted, all associated `documents`, `chunks`, `questions`, and `quizAttempts` must be purged or soft-deleted to prevent orphaned embeddings.
   - When a `document` is removed, all its corresponding records in `chunks` must be removed synchronously.
2. **Access Isolation**:
   - Every read and write query must enforce ownership validation using `userId` extracted from the authenticated JWT session.
