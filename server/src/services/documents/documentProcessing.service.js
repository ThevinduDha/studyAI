import Document from '../../models/document.model.js';
import { extractTextFromPDF } from './pdfTextExtractor.service.js';

/**
 * Asynchronously processes an uploaded PDF document:
 * 1. Sets status to 'processing'
 * 2. Extracts plain text and page metadata
 * 3. Sets status to 'processed' and saves extractedText
 * 4. In case of failure, sets status to 'failed' with safe error message
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

    // Extract text from PDF
    const { extractedText, pageCount } = await extractTextFromPDF(document.filePath);

    // Update status to processed
    document.extractedText = extractedText;
    document.pageCount = pageCount;
    document.status = 'processed';
    document.processingError = null;
    await document.save();

    console.log(`[StudyAI Ingestion] Successfully processed: "${document.originalName}" (${pageCount} pages, ${extractedText.length} chars)`);
  } catch (err) {
    console.error(`[StudyAI Ingestion] Document processing failed for ID ${documentId}:`, err.message);

    try {
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        processingError: err.message || 'Text extraction failed for this PDF'
      });
    } catch (saveErr) {
      console.error('[StudyAI Ingestion] Failed to record error state:', saveErr.message);
    }
  }
};

export default {
  processDocument
};
