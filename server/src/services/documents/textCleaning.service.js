/**
 * StudyAI — Text Cleaning & Normalization Service (Phase 4)
 *
 * Sanitizes raw text extracted from PDF documents before semantic chunking.
 * Fixes common PDF extraction artifacts while faithfully preserving document
 * meaning, structure, and academic punctuation.
 */

/**
 * Normalizes raw extracted text from PDF documents
 *
 * @param {string} rawText - Raw text from PDF text extraction
 * @returns {string} Cleaned, normalized text
 */
export const cleanExtractedText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let cleaned = rawText;

  // 1. Standardize line endings to \n
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Normalize form feeds and common PDF page separator artifacts
  cleaned = cleaned.replace(/\f/g, '\n\n');
  cleaned = cleaned.replace(/^[ \t]*--\s*\d+\s+of\s+\d+\s*--[ \t]*$/gm, '\n');
  cleaned = cleaned.replace(/^[ \t]*Page\s+\d+(\s+of\s+\d+)?[ \t]*$/gmi, '\n');

  // 3. Replace non-breaking spaces and exotic space characters with standard space
  cleaned = cleaned.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

  // 4. Collapse consecutive horizontal whitespace (spaces & tabs) to a single space
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  // 5. Rejoin hyphenated line breaks (e.g. "com-\nputer" -> "computer")
  cleaned = cleaned.replace(/([a-zA-Z]{2,})-\n([a-zA-Z]{2,})/g, '$1$2');

  // 6. Connect accidental soft line breaks within sentences while keeping paragraph breaks
  // If line ends without sentence punctuation (. ! ? : ;) and next line begins with lowercase
  cleaned = cleaned.replace(/([^\n.!?:\n])\n([a-z])/g, '$1 $2');

  // 7. Trim individual lines
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // 8. Collapse 3+ consecutive newlines to double newline (paragraph boundary)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

export default {
  cleanExtractedText
};
