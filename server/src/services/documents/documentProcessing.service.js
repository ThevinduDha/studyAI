import Document from '../../models/document.model.js';
import DocumentChunk from '../../models/documentChunk.model.js';
import { extractTextFromPDF } from './pdfTextExtractor.service.js';
import { cleanExtractedText } from './textCleaning.service.js';
import { chunkDocumentText } from './chunking.service.js';
import * as embeddingService from '../ai/embedding.service.js';

/**
 * StudyAI — Document Ingestion & Processing Pipeline (Phase 5)
 *
 * Pipeline Flow:
 * PDF
 *  ↓
 * Text Extraction (pdf-parse)
 *  ↓
 * Text Cleaning & Normalization (textCleaning.service)
 *  ↓
 * Semantic Chunking (chunking.service)
 *  ↓
 * Reprocessing Cleanup (DocumentChunk.deleteMany)
 *  ↓
 * Vector Embeddings Generation (embedding.service - gemini-embedding-2, 768 dims)
 *  ↓
 * Store DocumentChunks with Embeddings
 *  ↓
 * Document status = 'processed'
 *
 * @param {string} documentId - MongoDB ObjectId of the Document record
 * @param {Object} [options] - Optional processing options (e.g. mock embeddingClient for tests)
 */
export const processDocument = async (documentId, options = {}) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      console.warn(`[StudyAI Ingestion] Document not found for ID: ${documentId}`);
      return;
    }

    // Update status to processing
    document.status = 'processing';
    document.embeddingStatus = 'processing';
    document.processingError = null;
    await document.save();

    console.log(`[StudyAI Ingestion] Processing document: "${document.originalName}" (${document._id})`);

    // 1. Extract raw text and page count from PDF
    const { extractedText: rawText, pageCount } = await extractTextFromPDF(document.filePath);

    // 2. Clean and normalize extracted text
    const cleanedText = cleanExtractedText(rawText);

    // 3. Generate structured overlapping chunks
    const chunks = chunkDocumentText(cleanedText, {
      metadata: {
        originalName: document.originalName,
        pageStart: 1,
        pageEnd: pageCount || 1,
        sourceType: 'pdf'
      }
    });

    // 4. Reprocessing safety: Remove any old chunks belonging to this document
    await DocumentChunk.deleteMany({ document: document._id });

    const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
    const embeddingDimensions = parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || 768;

    // 5. Generate embeddings and prepare chunk records
    if (chunks.length > 0) {
      const hasClient = Boolean(options.embeddingClient);
      const isAiConfigured = embeddingService.isConfigured() || hasClient;

      if (!isAiConfigured) {
        // When AI key is not configured locally, persist chunks with 'pending' status
        console.warn(
          `[StudyAI Ingestion] GEMINI_API_KEY is not configured. Saving ${chunks.length} chunks with embeddingStatus="pending".`
        );

        const chunkRecords = chunks.map((chunk) => ({
          document: document._id,
          module: document.module,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          characterCount: chunk.characterCount,
          tokenCount: chunk.tokenCount,
          metadata: chunk.metadata,
          embeddingModel,
          embeddingDimensions,
          embeddingStatus: 'pending'
        }));

        await DocumentChunk.insertMany(chunkRecords);

        document.extractedText = cleanedText;
        document.pageCount = pageCount;
        document.chunkCount = chunks.length;
        document.embeddedChunkCount = 0;
        document.embeddingStatus = 'pending';
        document.status = 'processed';
        document.processingError = null;
        await document.save();

        console.log(
          `[StudyAI Ingestion] Processed: "${document.originalName}" (${pageCount} pages, ${cleanedText.length} chars, ${chunks.length} chunks, embeddings pending)`
        );
        return;
      }

      console.log(
        `[StudyAI Ingestion] Generating ${embeddingDimensions}-dim embeddings for ${chunks.length} chunks using "${embeddingModel}"...`
      );

      const chunkTexts = chunks.map((c) => c.text);
      const vectors = await embeddingService.generateEmbeddings(chunkTexts, {
        model: embeddingModel,
        dimensions: embeddingDimensions,
        client: options.embeddingClient
      });

      if (vectors.length !== chunks.length) {
        const mismatchError = new Error(
          `Embedding count mismatch: expected ${chunks.length} vectors, received ${vectors.length}`
        );
        mismatchError.code = 'EMBEDDING_COUNT_MISMATCH';
        throw mismatchError;
      }

      const now = new Date();
      const chunkRecords = chunks.map((chunk, idx) => ({
        document: document._id,
        module: document.module,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        characterCount: chunk.characterCount,
        tokenCount: chunk.tokenCount,
        metadata: chunk.metadata,
        embedding: vectors[idx],
        embeddingModel,
        embeddingDimensions,
        embeddingStatus: 'completed',
        embeddingGeneratedAt: now
      }));

      await DocumentChunk.insertMany(chunkRecords);

      document.embeddedChunkCount = chunkRecords.length;
      document.embeddingStatus = 'completed';
    } else {
      document.embeddedChunkCount = 0;
      document.embeddingStatus = 'completed';
    }

    // 6. Update Document record with cleaned text, chunkCount, and processed status
    document.extractedText = cleanedText;
    document.pageCount = pageCount;
    document.chunkCount = chunks.length;
    document.status = 'processed';
    document.processingError = null;
    await document.save();

    console.log(
      `[StudyAI Ingestion] Successfully processed: "${document.originalName}" (${pageCount} pages, ${cleanedText.length} chars, ${chunks.length} chunks, ${document.embeddedChunkCount} embeddings)`
    );
  } catch (err) {
    console.error(`[StudyAI Ingestion] Document processing failed for ID ${documentId}:`, err.message);

    try {
      // Reprocessing safety: Clean up any partial chunks if processing failed
      await DocumentChunk.deleteMany({ document: documentId });

      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        embeddingStatus: 'failed',
        embeddedChunkCount: 0,
        processingError: err.message || 'Document text extraction, chunking, or embedding failed'
      });
    } catch (saveErr) {
      console.error('[StudyAI Ingestion] Failed to record error state:', saveErr.message);
    }
  }
};

export default {
  processDocument
};
