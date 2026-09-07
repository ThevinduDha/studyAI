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

### 3.2 Text Cleaning & Normalization
- Removes repeated running headers, slide numbers, copyright footers, and redundant line breaks.
- Normalizes unicode characters, standardizes bullet points, and cleans whitespace while preserving sentence boundaries and paragraph structures.

### 3.3 Semantic Chunking Strategy
- **Chunk Size**: Target ~500 to 800 tokens (~2,000 to 3,200 characters).
- **Chunk Overlap**: ~100 tokens (~400 characters) sliding overlap.
  - *Why Overlap?* Prevents vital definitions, theorems, or contextual statements from being arbitrarily truncated across chunk boundaries.
- **Metadata Association**: Each chunk retains:
  - `documentId`: Link to parent document.
  - `moduleId`: Link to university subject.
  - `pageNumber`: The source page from which the chunk originated.
  - `chunkIndex`: Positional order in the document.

### 3.4 Embedding Generation
- **Model**: Google Gemini `text-embedding-004` (or latest stable Google embedding model).
- **Format**: High-dimensional vector array.
- **Batching**: Chunks are processed in batches respecting Gemini API rate limits with exponential backoff retry handling.

### 3.5 Vector Storage & Semantic Search
- Chunk text, vector embeddings, and metadata are persisted in the MongoDB `chunks` collection.
- Vector search can leverage MongoDB Atlas Vector Search (using cosine or dot-product metrics) or an in-memory cosine similarity engine for localized execution.
- Query filter: Scoped by `userId` and `moduleId` to guarantee strong multi-tenant data isolation.

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
