/**
 * StudyAI — Document Chunking Service (Phase 4)
 *
 * Segments normalized document text into structured, overlapping semantic passages.
 *
 * Algorithm Strategy:
 * 1. Prioritizes Paragraph boundaries (\n\n).
 * 2. Falls back to Sentence boundaries ([.!?]\s+) within paragraphs.
 * 3. Falls back to Word boundaries (\s+) if an individual sentence exceeds target chunk capacity.
 * 4. Never splits words in the middle.
 * 5. Applies sliding overlap to preserve boundary context across consecutive chunks.
 *
 * Configuration Defaults:
 * - CHUNK_SIZE_WORDS: 900 words (~4,500 characters / ~1,100 estimated tokens).
 * - CHUNK_OVERLAP_WORDS: 150 words (~750 characters / ~200 estimated tokens).
 * - TOKEN_ESTIMATE_RATIO: 1.33 tokens per word (academic NLP heuristic).
 */

export const DEFAULT_CHUNK_SIZE_WORDS = 900;
export const DEFAULT_CHUNK_OVERLAP_WORDS = 150;
export const ESTIMATED_TOKENS_PER_WORD = 1.33;

/**
 * Estimates token count from a string using word heuristics.
 *
 * @param {string} text
 * @returns {number} Estimated token count
 */
export const estimateTokenCount = (text) => {
  if (!text || typeof text !== 'string') return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  return Math.max(1, Math.ceil(words.length * ESTIMATED_TOKENS_PER_WORD));
};

/**
 * Breaks a text into atomic segments (sentences, or word-slices if oversized)
 * while preserving paragraph boundary information.
 *
 * @param {string} text - Cleaned document text
 * @param {number} maxWordsPerSegment - Maximum words allowed in an atomic segment
 * @returns {Array<{ text: string, wordCount: number, isParagraphEnd: boolean }>}
 */
const splitIntoAtomicSegments = (text, maxWordsPerSegment) => {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const segments = [];

  for (const para of paragraphs) {
    // Match sentences ending in [.!?] followed by whitespace or end of line,
    // or capture trailing clause/heading
    const rawSentences = para.match(/[^.!?\n]+(?:[.!?]+(?:\s+|$)|$)/g) || [para];
    const sentences = rawSentences.map((s) => s.trim()).filter(Boolean);

    for (let i = 0; i < sentences.length; i++) {
      const sentenceText = sentences[i];
      const isParaEnd = i === sentences.length - 1;
      const words = sentenceText.split(/\s+/).filter(Boolean);

      if (words.length > maxWordsPerSegment) {
        // Break oversized sentence into word chunks without splitting individual words
        let wordIdx = 0;
        while (wordIdx < words.length) {
          const slice = words.slice(wordIdx, wordIdx + maxWordsPerSegment);
          const isLastSlice = wordIdx + maxWordsPerSegment >= words.length;
          segments.push({
            text: slice.join(' '),
            wordCount: slice.length,
            isParagraphEnd: isLastSlice && isParaEnd
          });
          wordIdx += maxWordsPerSegment;
        }
      } else {
        segments.push({
          text: sentenceText,
          wordCount: words.length,
          isParagraphEnd: isParaEnd
        });
      }
    }
  }

  return segments;
};

/**
 * Chunks normalized document text into structured, overlapping chunks.
 *
 * @param {string} text - Cleaned document text to chunk
 * @param {Object} [options={}] - Configurable chunking options
 * @param {number} [options.chunkSizeWords=900] - Target maximum words per chunk
 * @param {number} [options.overlapWords=150] - Number of words to overlap between consecutive chunks
 * @param {Object} [options.metadata={}] - Default metadata to attach to each chunk
 * @returns {Array<Object>} List of structured chunk objects
 */
export const chunkDocumentText = (text, options = {}) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return [];
  }

  const chunkSizeWords = Math.max(
    5,
    options.chunkSizeWords || options.chunkSize || DEFAULT_CHUNK_SIZE_WORDS
  );
  const requestedOverlap =
    options.overlapWords !== undefined
      ? options.overlapWords
      : options.chunkOverlap !== undefined
        ? options.chunkOverlap
        : DEFAULT_CHUNK_OVERLAP_WORDS;

  // Overlap cannot exceed half of chunk size to prevent stalls
  const overlapWords = Math.max(0, Math.min(requestedOverlap, Math.floor(chunkSizeWords / 2)));
  const baseMetadata = options.metadata || {};

  // 1. Break into sentence/paragraph-aware atomic units
  const segments = splitIntoAtomicSegments(text, chunkSizeWords);
  if (segments.length === 0) {
    return [];
  }

  const chunks = [];
  let startIdx = 0;

  while (startIdx < segments.length) {
    const currentSegments = [];
    let accumulatedWords = 0;
    let endIdx = startIdx;

    // Accumulate segments up to chunkSizeWords
    while (endIdx < segments.length) {
      const seg = segments[endIdx];
      if (accumulatedWords + seg.wordCount > chunkSizeWords && currentSegments.length > 0) {
        break;
      }
      currentSegments.push(seg);
      accumulatedWords += seg.wordCount;
      endIdx++;
    }

    // Reconstruct chunk text preserving paragraph structure
    let chunkText = '';
    for (let i = 0; i < currentSegments.length; i++) {
      const seg = currentSegments[i];
      if (i === 0) {
        chunkText = seg.text;
      } else {
        const prev = currentSegments[i - 1];
        const separator = prev.isParagraphEnd ? '\n\n' : ' ';
        chunkText += separator + seg.text;
      }
    }

    chunkText = chunkText.trim();

    if (chunkText.length > 0) {
      chunks.push({
        chunkIndex: chunks.length,
        text: chunkText,
        characterCount: chunkText.length,
        tokenCount: estimateTokenCount(chunkText),
        metadata: {
          sourceType: 'pdf',
          pageStart: baseMetadata.pageStart || null,
          pageEnd: baseMetadata.pageEnd || null,
          sectionHeading: baseMetadata.sectionHeading || null,
          originalName: baseMetadata.originalName || null,
          ...baseMetadata
        }
      });
    }

    // If all segments were consumed, we're done
    if (endIdx >= segments.length) {
      break;
    }

    // Calculate overlap window by scanning backwards from endIdx
    let overlapAccum = 0;
    let nextStartIdx = endIdx;

    if (overlapWords > 0) {
      for (let i = endIdx - 1; i >= startIdx; i--) {
        nextStartIdx = i;
        overlapAccum += segments[i].wordCount;
        if (overlapAccum >= overlapWords) {
          break;
        }
      }
    }

    // Guarantee strictly forward progress to eliminate infinite loops
    if (nextStartIdx <= startIdx) {
      nextStartIdx = startIdx + 1;
    }
    if (nextStartIdx >= endIdx) {
      nextStartIdx = endIdx;
    }

    startIdx = nextStartIdx;
  }

  return chunks;
};

export default {
  chunkDocumentText,
  estimateTokenCount,
  DEFAULT_CHUNK_SIZE_WORDS,
  DEFAULT_CHUNK_OVERLAP_WORDS,
  ESTIMATED_TOKENS_PER_WORD
};
