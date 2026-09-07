/**
 * StudyAI — Context Builder Service (Phase 7)
 *
 * Converts retrieved DocumentChunks into a bounded, structured context block
 * for the Google Gemini generative model.
 *
 * Enforces:
 * - Clear source boundaries ([SOURCE 1], [SOURCE 2], etc.)
 * - Bounded context character limit (RAG_MAX_CONTEXT_CHARS, default 12,000)
 * - Relevance threshold filtering (RAG_MIN_RELEVANCE_SCORE)
 * - Authoritative application-generated citation objects
 * - Strict exclusion of vector arrays and internal trace data
 */

const DEFAULT_MAX_CONTEXT_CHARS = 12000;
const DEFAULT_MIN_RELEVANCE_SCORE = 0.0;

/**
 * Builds a formatted, bounded context string and citations array from retrieved chunks
 *
 * @param {Array<Object>} chunks - Array of ranked chunk objects from retrieval.service
 * @param {Object} [options] - Options { maxChars, minScore }
 * @returns {{ contextString: string, citations: Array<Object>, includedCount: number, totalRetrieved: number }}
 */
export const buildGroundedContext = (chunks = [], options = {}) => {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return {
      contextString: '',
      citations: [],
      includedCount: 0,
      totalRetrieved: 0
    };
  }

  const maxChars =
    typeof options.maxChars === 'number' && options.maxChars > 0
      ? options.maxChars
      : parseInt(process.env.RAG_MAX_CONTEXT_CHARS, 10) || DEFAULT_MAX_CONTEXT_CHARS;

  const minScore =
    typeof options.minScore === 'number'
      ? options.minScore
      : parseFloat(process.env.RAG_MIN_RELEVANCE_SCORE) || DEFAULT_MIN_RELEVANCE_SCORE;

  // Filter chunks below minimum score threshold if applicable
  const qualifiedChunks = chunks.filter((c) => {
    if (typeof c.score === 'number' && minScore > 0) {
      return c.score >= minScore;
    }
    return true;
  });

  const contextBlocks = [];
  const citations = [];
  let currentChars = 0;

  for (let i = 0; i < qualifiedChunks.length; i++) {
    const chunk = qualifiedChunks[i];
    const sourceNum = i + 1;

    // Format page range
    let pageStr = 'Not specified';
    if (chunk.metadata?.pageStart !== null && chunk.metadata?.pageStart !== undefined) {
      if (
        chunk.metadata?.pageEnd !== null &&
        chunk.metadata?.pageEnd !== undefined &&
        chunk.metadata.pageEnd !== chunk.metadata.pageStart
      ) {
        pageStr = `${chunk.metadata.pageStart}–${chunk.metadata.pageEnd}`;
      } else {
        pageStr = `${chunk.metadata.pageStart}`;
      }
    }

    const sectionStr = chunk.metadata?.sectionHeading || 'General';
    const moduleStr = chunk.moduleCode
      ? `${chunk.moduleCode} — ${chunk.moduleName || 'Course'}`
      : chunk.moduleName || 'Course Module';

    // Construct source header
    const header = `[SOURCE ${sourceNum}]\nDocument: ${chunk.documentName || 'Document'}\nModule: ${moduleStr}\nPages: ${pageStr}\nSection: ${sectionStr}\nChunk: ${chunk.chunkIndex}\n\nContent:\n`;
    const chunkText = chunk.text || '';
    const fullBlock = `${header}${chunkText}\n\n`;

    // Check budget
    if (currentChars + fullBlock.length > maxChars) {
      // If we haven't added any chunks yet, truncate chunkText to fit within budget
      if (contextBlocks.length === 0) {
        const availableTextChars = Math.max(100, maxChars - header.length - 10);
        const truncatedText = chunkText.slice(0, availableTextChars) + '... [truncated]';
        contextBlocks.push(`${header}${truncatedText}\n\n`);
        citations.push(createCitationObject(chunk));
        currentChars += header.length + truncatedText.length + 4;
      }
      // Budget reached; stop adding lower-ranked chunks
      break;
    }

    contextBlocks.push(fullBlock);
    citations.push(createCitationObject(chunk));
    currentChars += fullBlock.length;
  }

  return {
    contextString: contextBlocks.join('----------------------------------------\n\n').trim(),
    citations,
    includedCount: citations.length,
    totalRetrieved: chunks.length
  };
};

/**
 * Creates an authoritative application citation from a chunk record
 *
 * @param {Object} chunk
 * @returns {Object} Clean citation object
 */
export const createCitationObject = (chunk) => {
  return {
    documentId: chunk.documentId ? chunk.documentId.toString() : null,
    documentName: chunk.documentName || chunk.metadata?.originalName || 'Document',
    moduleId: chunk.moduleId ? chunk.moduleId.toString() : null,
    moduleCode: chunk.moduleCode || '',
    chunkIndex: typeof chunk.chunkIndex === 'number' ? chunk.chunkIndex : 0,
    pageStart: chunk.metadata?.pageStart ?? null,
    pageEnd: chunk.metadata?.pageEnd ?? null,
    sectionHeading: chunk.metadata?.sectionHeading || null,
    score: typeof chunk.score === 'number' ? chunk.score : null
  };
};

export default {
  buildGroundedContext,
  createCitationObject
};
