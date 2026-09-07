import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Normalizes raw extracted text from a PDF document
 * @param {string} rawText
 * @returns {string}
 */
const normalizeText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Collapse horizontal spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

/**
 * Extracts plain text and page metadata from a PDF file on disk
 * @param {string} filePath - Absolute or relative path to PDF
 * @returns {Promise<{ extractedText: string, pageCount: number }>}
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);

    let rawText = '';
    let pageCount = 1;

    if (pdfParse?.PDFParse) {
      // pdf-parse v2+ class API
      const parser = new pdfParse.PDFParse({ data: dataBuffer });
      try {
        const textResult = await parser.getText();
        rawText = textResult.text || '';
        pageCount = textResult.total || (textResult.pages ? textResult.pages.length : 1);
      } finally {
        await parser.destroy().catch(() => {});
      }
    } else if (typeof pdfParse === 'function') {
      // pdf-parse v1 function API
      const parsedData = await pdfParse(dataBuffer);
      rawText = parsedData.text || '';
      pageCount = parsedData.numpages || 1;
    } else if (typeof pdfParse?.default === 'function') {
      const parsedData = await pdfParse.default(dataBuffer);
      rawText = parsedData.text || '';
      pageCount = parsedData.numpages || 1;
    } else {
      throw new Error('Unsupported pdf-parse interface');
    }

    const extractedText = normalizeText(rawText);

    return {
      extractedText,
      pageCount
    };
  } catch (err) {
    const error = new Error(`PDF text extraction failed: ${err.message}`);
    error.code = 'EXTRACTION_ERROR';
    throw error;
  }
};

export default {
  extractTextFromPDF
};
