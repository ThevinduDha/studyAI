import { GoogleGenAI } from '@google/genai';

/**
 * StudyAI — Gemini Embedding Service (Phase 5)
 *
 * Handles generating dense vector embeddings for document chunks using the official
 * Google GenAI SDK (@google/genai).
 *
 * Current Model: gemini-embedding-2 (Default)
 * Default Output Dimensionality: 768
 * Default Task Type: RETRIEVAL_DOCUMENT
 */

const DEFAULT_MODEL = 'gemini-embedding-2';
const DEFAULT_DIMENSIONS = 768;
const DEFAULT_TASK_TYPE = 'RETRIEVAL_DOCUMENT';
const DEFAULT_BATCH_SIZE = 20;

/**
 * Checks if the Gemini API is configured in the environment
 * @returns {boolean}
 */
export const isConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0 && key !== 'your_gemini_api_key_placeholder';
};

/**
 * Returns safe public embedding configuration (without exposing secrets)
 * @returns {{ model: string, dimensions: number, isConfigured: boolean }}
 */
export const getEmbeddingConfig = () => {
  return {
    model: process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_MODEL,
    dimensions: parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || DEFAULT_DIMENSIONS,
    isConfigured: isConfigured()
  };
};

/**
 * Initializes and returns a GoogleGenAI client
 * @param {string} [apiKey] - Optional override for testing
 * @returns {GoogleGenAI}
 */
export const getClient = (apiKey = null) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key || typeof key !== 'string' || !key.trim() || key === 'your_gemini_api_key_placeholder') {
    const error = new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in server/.env');
    error.code = 'GEMINI_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }

  return new GoogleGenAI({ apiKey: key.trim() });
};

/**
 * Validates vector dimensionality and numeric values
 * @param {Array<number>} vector - Generated embedding vector
 * @param {number} expectedDimensions - Expected vector length
 * @returns {Array<number>}
 */
export const validateVector = (vector, expectedDimensions) => {
  if (!Array.isArray(vector) || vector.length === 0) {
    const error = new Error('Embedding generation returned empty or malformed vector');
    error.code = 'INVALID_EMBEDDING_RESPONSE';
    throw error;
  }

  if (vector.length !== expectedDimensions) {
    const error = new Error(
      `Embedding dimension mismatch: expected ${expectedDimensions} dimensions, received ${vector.length}`
    );
    error.code = 'EMBEDDING_DIMENSION_MISMATCH';
    throw error;
  }

  // Ensure all values are finite numbers
  const hasInvalidNumbers = vector.some((val) => typeof val !== 'number' || !Number.isFinite(val));
  if (hasInvalidNumbers) {
    const error = new Error('Embedding vector contains non-numeric or infinite values');
    error.code = 'INVALID_EMBEDDING_VALUES';
    throw error;
  }

  return vector;
};

/**
 * Generates an embedding vector for a single text string
 *
 * @param {string} text - Input text content to embed
 * @param {Object} [options] - Options { model, dimensions, taskType, client }
 * @returns {Promise<Array<number>>} - Validated numeric embedding vector
 */
export const generateEmbedding = async (text, options = {}) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    const error = new Error('Text is required to generate an embedding');
    error.code = 'INVALID_INPUT';
    error.statusCode = 400;
    throw error;
  }

  const model = options.model || process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_MODEL;
  const dimensions = options.dimensions || parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || DEFAULT_DIMENSIONS;
  const taskType = options.taskType || DEFAULT_TASK_TYPE;

  const client = options.client || getClient(options.apiKey);

  try {
    const response = await client.models.embedContent({
      model,
      contents: text.trim(),
      config: {
        taskType,
        outputDimensionality: dimensions
      }
    });

    // Extract vector from SDK response format
    const vector =
      response?.embeddings?.[0]?.values ||
      response?.embedding?.values ||
      (Array.isArray(response?.values) ? response.values : null);

    return validateVector(vector, dimensions);
  } catch (err) {
    if (err.code === 'EMBEDDING_DIMENSION_MISMATCH' || err.code === 'INVALID_INPUT') {
      throw err;
    }

    // Sanitize error: never leak API keys or internal stack traces to callers
    const sanitizedError = new Error(err.message ? `Embedding generation failed: ${err.message}` : 'Embedding generation failed');
    sanitizedError.code = err.code || 'EMBEDDING_GENERATION_FAILED';
    sanitizedError.statusCode = err.statusCode || 502;
    throw sanitizedError;
  }
};

/**
 * Generates embeddings for multiple texts in batches
 * Maintains exact input/output order.
 *
 * @param {Array<string>} texts - Array of text segments
 * @param {Object} [options] - Options { model, dimensions, taskType, batchSize, client }
 * @returns {Promise<Array<Array<number>>>} - Array of validated embedding vectors
 */
export const generateEmbeddings = async (texts, options = {}) => {
  if (!Array.isArray(texts)) {
    const error = new Error('texts must be an array');
    error.code = 'INVALID_INPUT';
    throw error;
  }

  if (texts.length === 0) {
    return [];
  }

  const model = options.model || process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_MODEL;
  const dimensions = options.dimensions || parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || DEFAULT_DIMENSIONS;
  const taskType = options.taskType || DEFAULT_TASK_TYPE;
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;

  const client = options.client || getClient(options.apiKey);
  const results = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batchTexts = texts.slice(i, i + batchSize);

    // Validate inputs in batch
    for (const t of batchTexts) {
      if (!t || typeof t !== 'string' || t.trim().length === 0) {
        const error = new Error('Cannot embed empty text segment in batch');
        error.code = 'INVALID_INPUT';
        throw error;
      }
    }

    try {
      // Pass batch array to SDK
      const response = await client.models.embedContent({
        model,
        contents: batchTexts.map((t) => t.trim()),
        config: {
          taskType,
          outputDimensionality: dimensions
        }
      });

      const embeddings = response?.embeddings || [];
      if (embeddings.length !== batchTexts.length) {
        // Fall back to single processing if batch response length doesn't match
        for (const singleText of batchTexts) {
          const singleVector = await generateEmbedding(singleText, {
            model,
            dimensions,
            taskType,
            client
          });
          results.push(singleVector);
        }
      } else {
        for (let b = 0; b < embeddings.length; b++) {
          const vector = embeddings[b]?.values;
          validateVector(vector, dimensions);
          results.push(vector);
        }
      }
    } catch (batchErr) {
      // If batch call fails with non-validation error, attempt individual items or propagate
      if (batchErr.code === 'EMBEDDING_DIMENSION_MISMATCH' || batchErr.code === 'INVALID_INPUT') {
        throw batchErr;
      }

      // Try sequential fallback for this batch to isolate or fulfill
      try {
        for (const singleText of batchTexts) {
          const singleVector = await generateEmbedding(singleText, {
            model,
            dimensions,
            taskType,
            client
          });
          results.push(singleVector);
        }
      } catch (singleErr) {
        const sanitizedError = new Error(
          singleErr.message ? `Batch embedding generation failed: ${singleErr.message}` : 'Batch embedding generation failed'
        );
        sanitizedError.code = singleErr.code || 'EMBEDDING_GENERATION_FAILED';
        sanitizedError.statusCode = singleErr.statusCode || 502;
        throw sanitizedError;
      }
    }
  }

  return results;
};

const QUERY_TASK_TYPE = 'RETRIEVAL_QUERY';
const DEFAULT_MAX_QUERY_LENGTH = 2000;

/**
 * Generates an embedding vector for a search query/question (Phase 6)
 * Uses taskType: 'RETRIEVAL_QUERY' and enforces 768 dimensions.
 *
 * @param {string} question - User question string
 * @param {Object} [options] - Options { model, dimensions, client, apiKey }
 * @returns {Promise<Array<number>>} - Validated 768-dimensional query vector
 */
export const generateQueryEmbedding = async (question, options = {}) => {
  if (!question || typeof question !== 'string') {
    const error = new Error('Question is required and must be a string');
    error.code = 'INVALID_INPUT';
    error.statusCode = 400;
    throw error;
  }

  const trimmed = question.trim();
  if (trimmed.length === 0) {
    const error = new Error('Question cannot be empty or whitespace only');
    error.code = 'INVALID_INPUT';
    error.statusCode = 400;
    throw error;
  }

  const maxLen = parseInt(process.env.RETRIEVAL_MAX_QUERY_LENGTH, 10) || DEFAULT_MAX_QUERY_LENGTH;
  if (trimmed.length > maxLen) {
    const error = new Error(`Question exceeds maximum allowed length of ${maxLen} characters`);
    error.code = 'QUERY_TOO_LONG';
    error.statusCode = 400;
    throw error;
  }

  const model = options.model || process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_MODEL;
  const dimensions = options.dimensions || parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || DEFAULT_DIMENSIONS;
  const client = options.client || getClient(options.apiKey);

  try {
    const response = await client.models.embedContent({
      model,
      contents: trimmed,
      config: {
        taskType: QUERY_TASK_TYPE,
        outputDimensionality: dimensions
      }
    });

    const vector =
      response?.embeddings?.[0]?.values ||
      response?.embedding?.values ||
      (Array.isArray(response?.values) ? response.values : null);

    return validateVector(vector, dimensions);
  } catch (err) {
    if (
      err.code === 'EMBEDDING_DIMENSION_MISMATCH' ||
      err.code === 'INVALID_INPUT' ||
      err.code === 'QUERY_TOO_LONG' ||
      err.code === 'INVALID_EMBEDDING_RESPONSE' ||
      err.code === 'INVALID_EMBEDDING_VALUES'
    ) {
      throw err;
    }

    const sanitizedError = new Error(
      err.message ? `Query embedding generation failed: ${err.message}` : 'Query embedding generation failed'
    );
    sanitizedError.code = err.code || 'EMBEDDING_GENERATION_FAILED';
    sanitizedError.statusCode = err.statusCode || 502;
    throw sanitizedError;
  }
};

export default {
  isConfigured,
  getEmbeddingConfig,
  getClient,
  validateVector,
  generateEmbedding,
  generateEmbeddings,
  generateQueryEmbedding
};

