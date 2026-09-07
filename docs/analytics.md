# StudyAI — Student Performance Analytics & Weak-Topic Intelligence Documentation (Phase 11)

## 1. System Overview

The **Student Performance Analytics & Weak-Topic Intelligence System** provides deterministic, grounded academic insights for university students based on real completed `QuizAttempt` and `Question` records in MongoDB.

### Core Architectural Principles
1. **Deterministic by Default**: Core metrics (accuracy, question counts, difficulty breakdown, module performance, topic classifications, and trend detection) are calculated from trusted database records. Gemini is NOT called on dashboard load.
2. **Strict Student Isolation**: Students can only access their own attempt records and enrolled module performance. Parameter manipulation (e.g. `?studentId=...`) is strictly disregarded for non-admin accounts.
3. **Zero Division & Edge Case Safety**: All formulas feature defensive guards for 0 completed quizzes, 0 attempted questions, missing documents, and deleted question records.
4. **Lightweight Interactive Visualizations**: Performance trends are rendered using pure, zero-dependency SVG charts in React and Tailwind CSS, fully compatible with React 19.

---

## 2. End-to-End Analytics Data Flow

```
+-----------------------------+
|    Completed QuizAttempts   |  (Filtered: status='completed', student=user._id)
+-----------------------------+
               │
               ▼
+-----------------------------+
|   Populate Question Meta    |  (topic, difficulty, questionType, module, document)
+-----------------------------+
               │
               ▼
+-----------------------------+
|  Deterministic Calculations |  (Overall, Trend, Modules, Topics, Difficulty, Types)
+-----------------------------+
               │
               ▼
+-----------------------------+
|   Weak-Topic Intelligence   |  (Priority scoring formula + revision recommendations)
+-----------------------------+
               │
               ▼
+-----------------------------+
|    REST API Serialization   |  (GET /api/analytics/overview, module, topic)
+-----------------------------+
               │
               ▼
+-----------------------------+
|  React Analytics Dashboard  |  (Overview cards, SVG trend, topic badges, missed questions)
+-----------------------------+
```

---

## 3. Mathematical Formulas & Classification Thresholds

### 3.1 Overall Metrics
- **Overall Accuracy**:
  $$\text{Accuracy} = \frac{\sum \text{correctAnswers}}{\sum \text{totalQuestions}} \times 100$$
- **Average Quiz Score**:
  $$\text{Average Score} = \frac{\sum \text{score}}{N}$$
- **Average Quiz Percentage**:
  $$\text{Average Percentage} = \frac{\sum \text{percentage}}{N}$$
- **Pacing**:
  $$\text{Time Per Question} = \frac{\sum \text{timeSpentSeconds}}{\sum \text{questionsAttempted}}$$

### 3.2 Trend Detection Algorithm
Let $N = \text{number of completed attempts}$ in chronological order:
- **$N < 3$**: Returns `'insufficient_data'`.
- **$N \ge 6$**:
  - Recent window: Last 3 attempts ($A_{N-3}, A_{N-2}, A_{N-1}$)
  - Baseline window: 3 attempts prior ($A_{N-6}, A_{N-5}, A_{N-4}$)
- **$3 \le N < 6$**:
  - $mid = \lfloor N / 2 \rfloor$
  - Baseline window: First $mid$ attempts ($A_0, \dots, A_{mid-1}$)
  - Recent window: Last $mid$ attempts ($A_{N-mid}, \dots, A_{N-1}$)
- **$\Delta = \text{Mean}_{\text{recent}} - \text{Mean}_{\text{baseline}}$**:
  - $\Delta \ge +5\%$: `'improving'`
  - $\Delta \le -5\%$: `'declining'`
  - $-5\% < \Delta < +5\%$: `'stable'`

### 3.3 Topic Metadata & Classification Principles

- **Source of Truth**: Topic performance relies exclusively on the verified `topic` field stored in `Question` records from Phase 9.
- **No Synthetic Topic Extraction**: The system strictly **does not invent** topic labels or parse question text using regex or NLP heuristics, preventing hallucinated or misleading topic intelligence.
- **Limitation & Fallback**: If question records omit topic metadata or share a default category (such as `'Core Concept'`), the engine aggregates under that existing category. When sample size is insufficient, the system classifies the topic status as `INSUFFICIENT_DATA`.

| Status | Condition | Meaning |
|---|---|---|
| `STRONG` | $\text{Accuracy} \ge 80\%$ and $\text{Attempts} \ge 3$ | Solid mastery |
| `AVERAGE` | $60\% \le \text{Accuracy} < 80\%$ and $\text{Attempts} \ge 3$ | Moderate grasp |
| `WEAK` | $\text{Accuracy} < 60\%$ and $\text{Attempts} \ge 3$ | Critical revision focus |
| `INSUFFICIENT_DATA` | $\text{Attempts} < 3$ | Needs more practice samples |

### 3.4 Weak Topic Priority Scoring Formula

To balance error frequency against difficulty and prevent single-question outliers from distorting priorities, the system computes:

$$\text{PriorityScore} = (\text{ErrorRate} \times 0.5) + (\text{NormalizedMistakes} \times 0.3) + (\text{NormalizedDifficulty} \times 0.2)$$

Both $\text{NormalizedMistakes}$ and $\text{NormalizedDifficulty}$ are **strictly normalized to the range $[0.0, 1.0]$**; raw mistake counts are **never used directly**:

1. **Error Rate ($\text{ErrorRate}$)**:
   $$\text{ErrorRate} = \frac{\text{totalQuestions} - \text{correct}}{\text{totalQuestions}} \in [0.0, 1.0]$$

2. **Normalized Mistakes ($\text{NormalizedMistakes}$)**:
   $$\text{NormalizedMistakes} = \min\left(1.0, \frac{\text{incorrect}}{\text{MistakeScale}}\right) \in [0.0, 1.0]$$
   Where $\text{MistakeScale} = \max(10, \text{cohortMaxMistakes})$. This reference scale prevents a single mistake on an isolated topic from saturating to $1.0$, while accurately scaling recurring mistakes.

3. **Normalized Difficulty ($\text{NormalizedDifficulty}$)**:
   Question difficulties are 2 (Basic), 3 (Moderate), and 4 (Scenario/Higher-order). Normalized to $[0.0, 1.0]$ via:
   $$\text{NormalizedDifficulty} = \max\left(0.0, \min\left(1.0, \frac{\text{avgDifficulty} - 2}{4 - 2}\right)\right) = \frac{\text{avgDifficulty} - 2}{2} \in [0.0, 1.0]$$
   - Level 2 $\rightarrow 0.0$
   - Level 3 $\rightarrow 0.5$
   - Level 4 $\rightarrow 1.0$

**Priority Classification**:
- $\text{PriorityScore} \ge 0.55$: `'HIGH'`
- $\text{PriorityScore} \ge 0.35$: `'MEDIUM'`
- $\text{PriorityScore} < 0.35$: `'LOW'`

---

## 4. REST Endpoints Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/analytics/overview` | Student / Admin | Comprehensive student overview, trend, weak topics, modules, difficulty, and question type performance |
| `GET` | `/api/analytics/module/:moduleId` | Student (enrolled) / Admin | Scoped performance breakdown for a specific module |
| `GET` | `/api/analytics/topic/:topic` | Student / Admin | Scoped performance and frequently missed questions for a specific topic |
| `POST` | `/api/analytics/ai-insight` | Student / Admin | Optional strategic study advice from Gemini 3.8 Flash grounded in analytical summary |

---

## 5. Security & Isolation Model

- **Zero Client Trust**: Score, accuracy, timestamps, and correctness sent by clients are discarded; all analytics derive from database records.
- **Student Scoping**: `req.user._id` always dictates the query scope unless an authenticated `admin` provides an explicit `studentId` query parameter.
- **Answer Key Protection**: Frequently missed questions in analytics summaries display question text and error counts without exposing `correctAnswer` or `explanation`.
- **Sensitive Data Filtering**: Passwords, JWT secrets, Gemini API keys, and embedding vectors are strictly omitted.

---

## 6. Database Indexes & Query Optimization

Added compound indexes to `server/src/models/quizAttempt.model.js`:
- `{ student: 1, status: 1, submittedAt: -1 }`: Fast retrieval of student's completed quiz history in chronological order.
- `{ student: 1, module: 1, status: 1, submittedAt: -1 }`: Fast retrieval of module-specific quiz attempts.

---

## 7. Relationship to Phase 10 & Phase 12

- **Phase 10 Foundation**: Phase 11 consumes the `QuizAttempt` and `Question` records produced by the Quiz System.
- **Phase 12 Foundation**: Phase 11's weak-topic priority scores, accuracy metrics, and frequently missed questions provide the inputs for automated AI Study Plan generation in Phase 12.
