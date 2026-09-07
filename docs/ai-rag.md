# StudyAI — AI & RAG Pipeline Specification

This document details the planned Retrieval-Augmented Generation (RAG) architecture, semantic search design, chunking strategy, and source attribution mechanism for **StudyAI**.

---

## 1. Architectural Philosophy: Grounded Intelligence

General-purpose Large Language Models (LLMs) can produce plausible-sounding but factually inaccurate or out-of-syllabus answers when queried about specialized university coursework.

**StudyAI** enforces **strict grounding**:
1. Questions are answered by searching the student's own uploaded course slides, lecture transcripts, and notes.
2. The model synthesizes answers directly from the retrieved context.
3. Every claim in the generated response can be attributed back to specific document names and page numbers.
4. If the uploaded literature does not contain sufficient information to answer the question, the system clearly states this limitation instead of fabricating an answer.

### 1.1 Incremental Roadmap & Architecture Boundaries

```
PHASE 3 (Complete):
PDF ──► Safe Disk Storage ──► Text Extraction (pdf-parse) ──► Saved in MongoDB

PHASE 4 (Complete):
Extracted Text ──► Text Normalization ──► Hierarchical Semantic Chunking ──► DocumentChunk Collection

PHASE 5 (Current Completed):
DocumentChunk ──► Gemini Embeddings (@google/genai, gemini-embedding-2, 768 dims) ──► Atlas Vector Search Index

PHASE 6 (Next Phase):
User Query ──► Query Embedding ──► Atlas Vector Search ($vectorSearch) ──► Semantic Retrieval

PHASE 7+ (Future Phases):
Retrieved Chunks ──► Grounded Prompt Construction ──► Gemini Generative LLM Synthesis
```

> [!IMPORTANT]
> **Phase 5 Boundary**: Phase 5 focuses exclusively on dense vector embedding generation and MongoDB Atlas Vector Search index infrastructure. Absolutely NO query embeddings, semantic retrieval endpoints, `$vectorSearch` query pipelines, top-k ranking, or LLM generative answer calls are implemented in Phase 5.

---

## 2. End-to-End RAG Ingestion & Query Pipeline

```
========================= PHASE A: INGESTION PIPELINE =========================

   [ 1. Document Upload ]
             │
             ▼
   [ 2. Text Extraction ]
             │  Extract raw text per page (preserving page numbers)
             ▼
   [ 3. Text Normalization ]
             │  Remove extraneous line breaks, header/footer boilerplate, OCR artifacts
             ▼
   [ 4. Semantic Chunking ]
             │  Split into sliding-window chunks (approx 500-800 tokens, 100 token overlap)
             ▼
   [ 5. Gemini Embedding Generation ]
             │  Convert text chunks to dense vectors (text-embedding-004)
             ▼
   [ 6. Vector Index Storage ]
                Save chunk record in MongoDB: { documentId, moduleId, content, embedding, pageNumber }


========================= PHASE B: QUERY & INFERENCE =========================

   [ 7. Student Query ]
             │  "Explain the difference between TCP and UDP based on Lecture 3"
             ▼
   [ 8. Query Vectorization ]
             │  Generate query embedding using Gemini Embedding API
             ▼
   [ 9. Semantic Retrieval ]
             │  Compute cosine similarity across document chunks in student's module
             ▼
   [ 10. Context Assembly & Re-ranking ]
             │  Select Top-K (e.g. 3-5) most relevant chunks; format with source citations
             ▼
   [ 11. Grounded Prompt Formulation ]
             │  System instructions + Retrieved Context + Student Question
             ▼
   [ 12. Gemini Generative Synthesis ]
             │  Generate response strictly from context
             ▼
   [ 13. Grounded Answer + Citations ]
                Deliver formatted markdown answer with clickable/page references
```

---

## 3. Pipeline Step Specifications

### 3.1 Document Ingestion & Text Extraction
- **Input**: University lecture PDFs, syllabi, notes.
- **Engine**: Node.js PDF parsing library (e.g., `pdf-parse` / `pdfjs-dist`).
- **Preservation**: The extractor reads the document sequentially and maintains a strict `pageNumber` index for every slice of text extracted.

### 3.2 Text Cleaning & Normalization (`textCleaning.service.js` — Phase 4 Active)
- **Engine**: Dedicated `normalizeExtractedText(rawText)` utility.
- **Normalization Rules**:
  - Removes common PDF pagination lines (e.g. `-- 1 of 12 --`, `Page 3 of 20`).
  - Removes form feed characters (`\f`).
  - Merges soft hyphens broken across lines (e.g. `comput-\ner` ➔ `computer`).
  - Normalizes line breaks (`\r\n` ➔ `\n`).
  - Collapses 3+ consecutive line breaks into standard paragraph breaks (`\n\n`), preserving intended paragraph hierarchy.
  - Collapses multiple horizontal spaces and tabs into a single space while trimming line edges.
  - Preserves legitimate sentence boundaries, parentheses, punctuation, and academic formatting without LLM rewriting.

### 3.3 Semantic Chunking Strategy (`chunking.service.js` — Phase 4 Active)
- **Algorithm**: Deterministic hierarchical boundary snapping:
  1. **Paragraphs**: First splits text on double linebreaks (`\n\n+`).
  2. **Sentences**: If a paragraph exceeds the target chunk size, splits into sentences using regex boundary matching (`(?<=[.!?])\s+(?=[A-Z0-9"'])`).
  3. **Words**: If a single sentence exceeds the chunk size, splits by whitespace without ever splitting individual words.
- **Configurable Parameters**:
  - `chunkSizeWords`: Target maximum words per chunk (default: **900 words**, ~1,200 estimated tokens).
  - `overlapWords`: Sliding window context overlap (default: **150 words**, ~200 estimated tokens).
- **Token Estimation**: Clearly documented heuristic estimation: `tokenCount = Math.round(wordCount * 1.33)`. Avoids heavyweight tokenizers until real embedding tokenizers are introduced in Phase 5.
- **Guarantees**:
  - No empty or whitespace-only chunks.
  - Zero word-splitting.
  - Strictly sequential zero-based `chunkIndex`.
  - Non-zero sliding overlap across multi-chunk documents.
  - Idempotent and deterministic: same text produces identical chunks.
- **Metadata Association**:
  - `document`: ObjectId reference to parent `Document`.
  - `module`: ObjectId reference to parent `Module`.
  - `chunkIndex`: 0-based sequential ordering.
  - `characterCount`: Exact UTF-8 character length.
  - `tokenCount`: Estimated token count.
  - `metadata`: `{ originalName, pageStart, pageEnd, sectionHeading, sourceType: 'pdf' }`.

### 3.4 Embedding Generation (`embedding.service.js` — Phase 5 Active)
- **SDK**: Official Google GenAI JavaScript SDK (`@google/genai`).
- **Model**: `gemini-embedding-2` (configured via `process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2'`).
- **Dimensionality**: Strictly validated `768 dimensions` (configured via `process.env.GEMINI_EMBEDDING_DIMENSIONS || 768`).
- **Task Type**: `'RETRIEVAL_DOCUMENT'` for all document chunks.
- **Batching**: Chunks are processed in batches (default: 20 per batch) with order preservation and robust rate-limit retry handling.
- **Dimensionality Validation**: The service asserts that every generated vector array is numeric, finite, and contains exactly 768 elements before saving to MongoDB. Mismatches are rejected with `EMBEDDING_DIMENSION_MISMATCH`.

### 3.5 Vector Storage & Atlas Vector Search Foundation (`vectorIndex.js` — Phase 5 Active)
- **Collection**: `documentchunks` (separate collection, one record per chunk).
- **Field**: `embedding` (`type: [Number]`, `select: false`, stripped from client JSON).
- **Atlas Search Index**: `document_chunks_vector_index`
  - Path: `embedding` (Type: `vector`, `numDimensions: 768`, `similarity: cosine`)
  - Filter Paths: `module` (Type: `filter`), `document` (Type: `filter`)
  - Status: Verified `READY` and `queryable: true` on live MongoDB Atlas cluster.
- **Management & Verification**: Programmatic management via `server/src/config/vectorIndex.js` and JSON definition `server/src/config/vectorSearchIndex.json`.

---

## 4. Grounded Prompt Engineering & Citation Strategy

### 4.1 Grounded Prompt Structure

```
You are StudyAI, an academic tutor assisting a university student.
Your goal is to provide clear, precise, and academically rigorous explanations based SOLELY on the provided lecture excerpts.

RULES:
1. Only use facts directly supported by the context below.
2. If the context does not contain enough information to answer, state: "The uploaded materials do not contain sufficient information to answer this question."
3. Cite the source document and page number for key concepts using [Doc: <filename>, Page: <pageNumber>].

CONTEXT EXCERPTS:
---
Excerpt 1 (Document: "Lecture4_Networking.pdf", Page 12):
TCP is connection-oriented, providing reliable, ordered, and error-checked delivery of a stream of octets...
---
Excerpt 2 (Document: "Lecture4_Networking.pdf", Page 14):
UDP uses a simple connectionless transmission model with a minimum of protocol mechanism...
---

STUDENT QUESTION:
Explain the key differences between TCP and UDP.
```

### 4.2 Citation & Verification UI Return Format

The API response returns both the natural language answer and structured citations:

```json
{
  "answer": "TCP is a connection-oriented protocol ensuring reliable and ordered data transmission [Doc: Lecture4_Networking.pdf, Page: 12], whereas UDP is connectionless with lower overhead suited for real-time applications [Doc: Lecture4_Networking.pdf, Page: 14].",
  "sources": [
    {
      "documentId": "65f1a2...",
      "documentName": "Lecture4_Networking.pdf",
      "pageNumber": 12,
      "snippet": "TCP is connection-oriented, providing reliable, ordered..."
    },
    {
      "documentId": "65f1a2...",
      "documentName": "Lecture4_Networking.pdf",
      "pageNumber": 14,
      "snippet": "UDP uses a simple connectionless transmission model..."
    }
  ]
}
```

This structure empowers the React frontend to display interactive source chips allowing students to quickly verify the exact slide or page corresponding to the answer.
