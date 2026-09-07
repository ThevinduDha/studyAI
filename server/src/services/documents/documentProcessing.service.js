import Document from '../../models/document.model.js';
import DocumentChunk from '../../models/documentChunk.model.js';
import { extractTextFromPDF } from './pdfTextExtractor.service.js';
import { cleanExtractedText } from './textCleaning.service.js';
import { chunkDocumentText } from './chunking.service.js';

/**
 * Asynchronously processes an uploaded PDF document:
 * 1. Sets status to 'processing'
 * 2. Extracts plain text and page count from PDF
 * 3. Normalizes and cleans extracted text (removing artifacts)
 * 4. Chunks text into overlapping semantic passages
 * 5. Safely handles reprocessing (replaces previous chunks)
 * 6. Stores DocumentChunk records in MongoDB
 * 7. Updates Document status to 'processed' with chunkCount
 *
 * @param {string} documentId - MongoDB ObjectId of the Document record
 */
export const processDocument = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      console.warn(`[StudyAI Ingestion] Document not found for ID: ${documentId}`);
      return;
    }

    // Update status to processing
    document.status = 'processing';
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

    // 5. Bulk insert new chunk records if any were generated
    if (chunks.length > 0) {
      const chunkRecords = chunks.map((chunk) => ({
        document: document._id,
        module: document.module,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        characterCount: chunk.characterCount,
        tokenCount: chunk.tokenCount,
        metadata: chunk.metadata
      }));

      await DocumentChunk.insertMany(chunkRecords);
    }

    // 6. Update Document record with cleaned text, chunkCount, and processed status
    document.extractedText = cleanedText;
    document.pageCount = pageCount;
    document.chunkCount = chunks.length;
    document.status = 'processed';
    document.processingError = null;
    await document.save();

    console.log(
      `[StudyAI Ingestion] Successfully processed: "${document.originalName}" (${pageCount} pages, ${cleanedText.length} chars, ${chunks.length} chunks)`
    );
  } catch (err) {
    console.error(`[StudyAI Ingestion] Document processing failed for ID ${documentId}:`, err.message);

    try {
      // Reprocessing safety: Clean up any partial chunks if processing failed
      await DocumentChunk.deleteMany({ document: documentId });

      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        processingError: err.message || 'Text extraction or chunking failed for this PDF'
      });
    } catch (saveErr) {
      console.error('[StudyAI Ingestion] Failed to record error state:', saveErr.message);
    }
  }
};

export default {
  processDocument
};
