# StudyAI — AI Quiz System Documentation (Phase 10)

## 1. System Overview

The **StudyAI AI Quiz System** provides an interactive, secure, production-quality testing environment for students built directly upon the validated **Question Bank** established in Phase 9.

### Key Tenets
1. **Zero Client Trust**: Correct answers, explanations, exam clues, and common traps are NEVER sent to the client during an active quiz.
2. **No Redundant AI Calls**: Quizzes sample existing, validated question bank records from MongoDB rather than calling Google Gemini for each attempt.
3. **Server-Side Scoring**: The server independently verifies answers, calculates score, percentage, elapsed time, and status. Client-supplied scores, correctness flags, or timestamps are strictly rejected.
4. **Phase 11 Analytics Foundation**: Every attempt retains per-question answers, correctness, timing, difficulty, and topic references necessary for future learning analytics, weak-area detection, and mastery trends.

---

## 2. End-to-End Quiz Lifecycle Flow

```
+---------------------------+
|  Validated Question Bank  |  (Phase 9 MongoDB records)
+---------------------------+
              │
              ▼
+---------------------------+
|    Quiz Configuration     |  Module, Lecture, Question Type, Difficulty, Count, Timer
+---------------------------+
              │
              ▼
+---------------------------+
|    Question Selection     |  MongoDB sampling, availability verification
+---------------------------+
              │
              ▼
+---------------------------+
|   Secure Quiz Payload     |  toQuizQuestion() strips correctAnswer, explanation, clues, traps
+---------------------------+
              │
              ▼
+---------------------------+
|      Student Answers      |  Client records answers locally during active attempt
+---------------------------+
              │
              ▼
+---------------------------+
|      Quiz Submission      |  POST /api/quizzes/attempts/:attemptId/submit
+---------------------------+
              │
              ▼
+---------------------------+
|   Server-Side Scoring     |  Deterministic evaluation, normalized matching, score computation
+---------------------------+
              │
              ▼
+---------------------------+
|   Persist QuizAttempt     |  Saved to MongoDB with status="completed", timestamp, score
+---------------------------+
              │
              ▼
+---------------------------+
|    Quiz Result & Review   |  Full review revealed: answers, explanations, clues, source chunks
+---------------------------+
              │
              ▼
+---------------------------+
| Phase 11 Learning Trends  |  Aggregated mastery, accuracy trends, weak-topic analytics
+---------------------------+
```

---

## 3. Data Models

### 3.1 Quiz Model (`server/src/models/quiz.model.js`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | String | Yes | Human-readable title (e.g. "AIML Lecture 3 Quiz") |
| `module` | ObjectId (ref: Module) | Yes | Associated course module |
| `document` | ObjectId (ref: Document) | No | Optional scoped lecture document |
| `createdBy` | ObjectId (ref: User) | Yes | Student or admin who generated the quiz |
| `questionIds` | [ObjectId] (ref: Question) | Yes | Array of Question references included in the quiz |
| `questionCount` | Number | Yes | Total number of questions in quiz |
| `questionType` | String (enum) | Yes | `ALL`, `MCQ`, `TRUE_FALSE`, `SHORT_ANSWER`, `SCENARIO` |
| `difficulty` | Mixed (enum) | Yes | `ALL`, `2`, `3`, `4` |
| `randomized` | Boolean | Yes | Whether question order was randomized (default: `true`) |
| `timeLimitSeconds` | Number | No | Optional client time limit |
| `status` | String (enum) | Yes | `active`, `completed`, `abandoned` |

**Indexes**:
- `{ module: 1, createdBy: 1, createdAt: -1 }`
- `{ document: 1, createdAt: -1 }`
- `{ status: 1 }`

### 3.2 QuizAttempt Model (`server/src/models/quizAttempt.model.js`)

| Field | Type | Required | Description |
|---|---|---|---|
| `quiz` | ObjectId (ref: Quiz) | Yes | Reference to Quiz |
| `student` | ObjectId (ref: User) | Yes | Authenticated student attempting quiz |
| `module` | ObjectId (ref: Module) | Yes | Module ID for fast scoping & analytics |
| `document` | ObjectId (ref: Document) | No | Scoped document ID |
| `startedAt` | Date | Yes | Server timestamp when attempt started |
| `submittedAt` | Date | No | Server timestamp when attempt submitted |
| `status` | String (enum) | Yes | `in_progress`, `completed`, `abandoned` |
| `totalQuestions` | Number | Yes | Total question count |
| `answeredQuestions` | Number | No | Number of answered questions |
| `correctAnswers` | Number | No | Number of correct answers |
| `incorrectAnswers` | Number | No | Number of incorrect answers |
| `score` | Number | No | Server-calculated score |
| `percentage` | Number | No | Server-calculated percentage (0–100) |
| `timeSpentSeconds` | Number | No | Server-computed time: `(submittedAt - startedAt) / 1000` |
| `answers` | [AnswerSchema] | Yes | Array of student answers |

**Per-Answer Schema**:
```javascript
{
  question: ObjectId,       // ref: Question
  selectedAnswer: String,   // Student's answer string
  isCorrect: Boolean,       // Server-evaluated correctness
  requiresReview: Boolean,  // Flag for ambiguous short answers
  answeredAt: Date          // Answer timestamp
}
```

**Indexes**:
- `{ student: 1, module: 1, createdAt: -1 }`
- `{ student: 1, status: 1 }`
- `{ quiz: 1, student: 1 }`
- `{ module: 1, status: 1 }`

---

## 4. Secure Question Payload Serialization

To prevent cheating or inspection of network responses, all active quiz payloads pass through `toQuizQuestion()`:

```javascript
export const toQuizQuestion = (q, options = {}) => {
  return {
    _id: q._id,
    id: q._id,
    questionText: q.questionText,
    options: Array.isArray(q.options) ? [...q.options] : [],
    questionType: q.questionType,
    difficulty: q.difficulty,
    topic: q.topic,
    document: q.document,
    module: q.module
    // STRICTLY EXCLUDED:
    // - correctAnswer
    // - explanation
    // - examClue
    // - commonTrap
    // - sourceChunks
  };
};
```

---

## 5. Server-Side Scoring Logic

When a student submits answers to `POST /api/quizzes/attempts/:attemptId/submit`:
1. Server verifies attempt ownership and ensures `status === 'in_progress'`.
2. Questions are fetched directly from MongoDB via `Question.find({ _id: { $in: questionIds } })`.
3. Scoring rules:
   - **MCQ**: Strict case-insensitive trimmed equality (`submitted === stored`). Award 1 point.
   - **TRUE_FALSE**: Normalized boolean/string check (`true`/`false`). Award 1 point.
   - **SCENARIO**: Evaluated against expected answer string. Award 1 point.
   - **SHORT_ANSWER**: Normalized text matching (lowercased, spaces condensed, punctuation stripped). If exact match, award 1 point. If unresolvable, mark `requiresReview: true` without awarding arbitrary marks.
   - **Unanswered**: Award 0 points, counted in `incorrectAnswers` and `unanswered`.
4. Server computes:
   - `totalQuestions`: Total questions in quiz
   - `answeredQuestions`: Count of non-empty submissions
   - `correctAnswers`: Count of correct answers
   - `incorrectAnswers`: `totalQuestions - correctAnswers`
   - `score`: Total points awarded
   - `percentage`: `Math.round((score / totalQuestions) * 100)`
   - `timeSpentSeconds`: `Math.max(0, Math.floor((submittedAt - startedAt) / 1000))`

---

## 6. Attempt Lifecycle & Edge Cases

### 6.1 Resuming & Preventing Duplicate Active Attempts
- If a student requests `POST /api/quizzes/:quizId/start` while an existing attempt for that quiz is still `in_progress`, the service resumes and returns the existing attempt (`isResumed: true`).
- This prevents duplicate in-progress attempts while preserving progress.

### 6.2 Attempt Abandonment
- A student can abandon an active attempt via `POST /api/quizzes/attempts/:attemptId/abandon`.
- Status is updated to `abandoned`. Abandoned attempts are not scored and cannot be submitted.

### 6.3 Cascade Cleanup Safety
- **Document Deletion**: Associated quizzes and active `in_progress` attempts are removed. Completed attempts are preserved with document metadata intact to preserve historical student analytics.
- **Module Deletion**: Associated quizzes and active `in_progress` attempts are removed. Completed attempts are preserved for institutional audit records.

---

## 7. REST Endpoints Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/quizzes` | Student (enrolled) / Admin | Create quiz from Question Bank |
| `GET` | `/api/quizzes/:quizId` | Student (enrolled) / Admin | Get quiz metadata and secure questions |
| `POST` | `/api/quizzes/:quizId/start` | Student (enrolled) / Admin | Start or resume active quiz attempt |
| `POST` | `/api/quizzes/attempts/:attemptId/submit` | Student (owner) | Submit answers and receive server score |
| `GET` | `/api/quizzes/attempts` | Student / Admin | Get student's attempt history |
| `GET` | `/api/quizzes/attempts/:attemptId` | Student (owner) / Admin | Get attempt details (secure before submit, full after) |
| `POST` | `/api/quizzes/attempts/:attemptId/abandon` | Student (owner) | Abandon an active attempt |
| `DELETE` | `/api/quizzes/:quizId` | Admin only | Delete quiz record |

---

## 8. Phase 11 Learning Analytics Compatibility

The `QuizAttempt` collection is indexed and populated to enable the following Phase 11 analytics without schema migrations:
- **Accuracy Trend**: `percentage` over sequential `submittedAt` timestamps.
- **Topic Mastery**: Aggregating correctness across `answers.question` linked to `Question.topic`.
- **Difficulty Performance**: Accuracy segmented by `Question.difficulty` (Level 2 vs Level 3 vs Level 4).
- **Question Type Strengths**: Score comparison between MCQ, TRUE_FALSE, SCENARIO, and SHORT_ANSWER.
- **Pacing & Time Management**: `timeSpentSeconds / totalQuestions` average per module.
- **Study Effort**: Number of completed attempts per module and document.
