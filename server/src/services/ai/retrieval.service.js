import mongoose from 'mongoose';
import DocumentChunk from '../../models/documentChunk.model.js';
import Document from '../../models/document.model.js';
import Module from '../../models/module.model.js';
import * as embeddingService from './embedding.service.js';
import { INDEX_NAME } from '../../config/vectorIndex.js';

/**
 * StudyAI — Semantic Retrieval Service (Phase 6)
 *
 * Implements dense vector similarity retrieval against MongoDB Atlas Vector Search.
 * Strictly enforces user enrollment scoping:
 * - Students can only retrieve chunks from modules they are enrolled in.
 * - Admins can query globally or filter by specific module/document.
 * - Raw embedding vectors and query vectors are NEVER returned to callers.
 *
 * Strict Phase 6 boundary: Does NOT generate answers or synthesize RAG prompts.
 */

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;
const DEFAULT_MAX_QUERY_LENGTH = 2000;
const DEFAULT_NUM_CANDIDATES = 50;

/**
 * Validates and normalizes the retrieval search query and parameters
 *
 * @param {Object} params - { question, moduleId, documentId, topK }
 * @returns {Object} Normalized parameters
 */
export const validateRetrievalInput = ({ question, moduleId, documentId, topK }) => {
  if (!question || typeof question !== 'string') {
    const error = new Error('Question is required and must be a string');
    error.code = 'INVALID_QUESTION';
    error.statusCode = 400;
    throw error;
  }

  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length === 0) {
    const error = new Error('Question cannot be empty or whitespace only');
    error.code = 'INVALID_QUESTION';
    error.statusCode = 400;
    throw error;
  }

  const maxLen = parseInt(process.env.RETRIEVAL_MAX_QUERY_LENGTH, 10) || DEFAULT_MAX_QUERY_LENGTH;
  if (trimmedQuestion.length > maxLen) {
    const error = new Error(`Question exceeds maximum allowed length of ${maxLen} characters`);
    error.code = 'QUERY_TOO_LONG';
    error.statusCode = 400;
    throw error;
  }

  // Validate topK
  let effectiveTopK = parseInt(process.env.RETRIEVAL_DEFAULT_TOP_K, 10) || DEFAULT_TOP_K;
  if (topK !== undefined && topK !== null) {
    const parsed = Number(topK);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_TOP_K) {
      const error = new Error(`topK must be an integer between 1 and ${MAX_TOP_K}`);
      error.code = 'INVALID_TOP_K';
      error.statusCode = 400;
      throw error;
    }
    effectiveTopK = parsed;
  }

  // Validate moduleId format if present
  if (moduleId !== undefined && moduleId !== null && moduleId !== '') {
    if (typeof moduleId !== 'string' || !mongoose.Types.ObjectId.isValid(moduleId)) {
      const error = new Error('Invalid module ID format');
      error.code = 'INVALID_MODULE_ID';
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate documentId format if present
  if (documentId !== undefined && documentId !== null && documentId !== '') {
    if (typeof documentId !== 'string' || !mongoose.Types.ObjectId.isValid(documentId)) {
      const error = new Error('Invalid document ID format');
      error.code = 'INVALID_DOCUMENT_ID';
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    trimmedQuestion,
    effectiveTopK,
    validatedModuleId: moduleId ? moduleId.trim() : null,
    validatedDocumentId: documentId ? documentId.trim() : null
  };
};

/**
 * Resolves authorization and constructs the $vectorSearch filter
 *
 * @param {Object} params - { user, moduleId, documentId }
 * @returns {Promise<{ filter: Object|null, emptyEnrollment: boolean }>}
 */
export const resolveSearchScope = async ({ user, moduleId, documentId }) => {
  if (!user) {
    const error = new Error('Authentication required prior to retrieval scoping');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  const isStudent = user.role === 'student';
  const enrolledModules = user.enrolledModules || [];

  // Check module if specified
  if (moduleId) {
    const module = await Module.findById(moduleId);
    if (!module) {
      const error = new Error('Module not found');
      error.code = 'MODULE_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (isStudent) {
      const isEnrolled = enrolledModules.some((id) => id.toString() === moduleId.toString());
      if (!isEnrolled) {
        const error = new Error('Access denied: You are not enrolled in this module');
        error.code = 'FORBIDDEN';
        error.statusCode = 403;
        throw error;
      }
    }
  }

  // Check document if specified
  if (documentId) {
    const document = await Document.findById(documentId);
    if (!document) {
      const error = new Error('Document not found');
      error.code = 'DOCUMENT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (isStudent) {
      const isEnrolled = enrolledModules.some(
        (id) => id.toString() === document.module.toString()
      );
      if (!isEnrolled) {
        const error = new Error('Access denied: You are not enrolled in the module this document belongs to');
        error.code = 'FORBIDDEN';
        error.statusCode = 403;
        throw error;
      }
    }

    // If both moduleId and documentId are provided, verify association
    if (moduleId && document.module.toString() !== moduleId.toString()) {
      const error = new Error('Document does not belong to the specified module');
      error.code = 'DOCUMENT_MODULE_MISMATCH';
      error.statusCode = 400;
      throw error;
    }
  }

  // Construct $vectorSearch filter using indexed filter fields ("module", "document")
  if (documentId) {
    const filter = { document: new mongoose.Types.ObjectId(documentId) };
    if (moduleId) {
      filter.module = new mongoose.Types.ObjectId(moduleId);
    }
    return { filter, emptyEnrollment: false };
  }

  if (moduleId) {
    return {
      filter: { module: new mongoose.Types.ObjectId(moduleId) },
      emptyEnrollment: false
    };
  }

  // Neither moduleId nor documentId provided
  if (isStudent) {
    if (enrolledModules.length === 0) {
      // Student has no enrolled modules; return empty result indicator
      return { filter: null, emptyEnrollment: true };
    }

    const enrolledObjectIds = enrolledModules.map((id) => new mongoose.Types.ObjectId(id));
    return {
      filter: { module: { $in: enrolledObjectIds } },
      emptyEnrollment: false
    };
  }

  // Admin global search — no filter
  return { filter: null, emptyEnrollment: false };
};

/**
 * Performs semantic vector search on DocumentChunks
 *
 * @param {Object} params - { question, moduleId, documentId, topK, user }
 * @param {Object} [options] - Options (embeddingClient override for testing)
 * @returns {Promise<{ question: string, results: Array, count: number }>}
 */
export const searchChunks = async ({ question, moduleId, documentId, topK, user }, options = {}) => {
  // 1. Validate inputs
  const {
    trimmedQuestion,
    effectiveTopK,
    validatedModuleId,
    validatedDocumentId
  } = validateRetrievalInput({ question, moduleId, documentId, topK });

  // 2. Resolve authorization and filter scope
  const { filter, emptyEnrollment } = await resolveSearchScope({
    user,
    moduleId: validatedModuleId,
    documentId: validatedDocumentId
  });

  // If student is enrolled in 0 modules and searched globally, return 0 results safely without calling Gemini
  if (emptyEnrollment) {
    return {
      question: trimmedQuestion,
      results: [],
      count: 0
    };
  }

  // 3. Generate query embedding (768-dim, RETRIEVAL_QUERY)
  const queryVector = await embeddingService.generateQueryEmbedding(trimmedQuestion, {
    client: options.embeddingClient
  });

  // 4. Determine candidates
  const configuredCandidates =
    parseInt(process.env.RETRIEVAL_NUM_CANDIDATES, 10) || DEFAULT_NUM_CANDIDATES;
  const numCandidates = Math.max(configuredCandidates, effectiveTopK * 5);

  // 5. Construct MongoDB Atlas $vectorSearch aggregation pipeline
  const vectorSearchStage = {
    index: INDEX_NAME,
    path: 'embedding',
    queryVector,
    numCandidates,
    limit: effectiveTopK
  };

  if (filter && Object.keys(filter).length > 0) {
    vectorSearchStage.filter = filter;
  }

  const pipeline = [
    { $vectorSearch: vectorSearchStage },
    {
      $lookup: {
        from: 'modules',
        localField: 'module',
        foreignField: '_id',
        as: 'moduleDoc'
      }
    },
    {
      $lookup: {
        from: 'documents',
        localField: 'document',
        foreignField: '_id',
        as: 'documentDoc'
      }
    },
    {
      $project: {
        _id: 1,
        document: 1,
        module: 1,
        chunkIndex: 1,
        text: 1,
        characterCount: 1,
        tokenCount: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
        moduleDoc: { $arrayElemAt: ['$moduleDoc', 0] },
        documentDoc: { $arrayElemAt: ['$documentDoc', 0] }
      }
    }
  ];

  let rawResults = [];
  try {
    rawResults = await DocumentChunk.aggregate(pipeline);
  } catch (err) {
    console.error('[StudyAI Retrieval] Atlas Vector Search error:', err.message);
    const searchError = new Error(`Vector search retrieval failed: ${err.message}`);
    searchError.code = 'VECTOR_SEARCH_ERROR';
    searchError.statusCode = 500;
    throw searchError;
  }

  // 6. Map and normalize results
  // Note: embedding and queryVector are NEVER included in response
  const results = rawResults.map((item) => ({
    chunkId: item._id,
    documentId: item.document,
    documentName: item.documentDoc?.originalName || item.metadata?.originalName || 'Document',
    moduleId: item.module,
    moduleCode: item.moduleDoc?.moduleCode || '',
    moduleName: item.moduleDoc?.moduleName || '',
    chunkIndex: item.chunkIndex,
    text: item.text,
    characterCount: item.characterCount,
    tokenCount: item.tokenCount,
    score: typeof item.score === 'number' ? Number(item.score.toFixed(4)) : item.score,
    metadata: {
      originalName: item.metadata?.originalName || item.documentDoc?.originalName || '',
      pageStart: item.metadata?.pageStart ?? null,
      pageEnd: item.metadata?.pageEnd ?? null,
      sectionHeading: item.metadata?.sectionHeading || null,
      sourceType: item.metadata?.sourceType || 'pdf'
    }
  }));

  return {
    question: trimmedQuestion,
    results,
    count: results.length
  };
};

export default {
  validateRetrievalInput,
  resolveSearchScope,
  searchChunks
};
