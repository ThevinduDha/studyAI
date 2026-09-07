import fs from 'node:fs/promises';
import Document from '../../models/document.model.js';
import DocumentChunk from '../../models/documentChunk.model.js';
import Module from '../../models/module.model.js';
import User from '../../models/user.model.js';
import Question from '../../models/question.model.js';
import LectureSummary from '../../models/lectureSummary.model.js';
import { processDocument } from './documentProcessing.service.js';
import * as embeddingService from '../ai/embedding.service.js';

/**
 * Creates a new document record and initiates asynchronous text extraction
 */
export const createDocument = async ({ file, moduleId, user }) => {
  if (!file) {
    const error = new Error('PDF file is required');
    error.code = 'FILE_REQUIRED';
    error.statusCode = 400;
    throw error;
  }

  // Validate module exists
  const module = await Module.findById(moduleId);
  if (!module) {
    // If file was already saved to disk by multer, remove it
    await fs.unlink(file.path).catch(() => {});
    const error = new Error('Module not found');
    error.code = 'MODULE_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // If user is student, ensure they are enrolled in this module
  if (user.role === 'student') {
    const isEnrolled = (user.enrolledModules || []).some(
      (id) => id.toString() === moduleId.toString()
    );
    if (!isEnrolled) {
      await fs.unlink(file.path).catch(() => {});
      const error = new Error('Access denied: You must be enrolled in this module to upload materials');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }
  }

  // Create Document record
  const newDocument = await Document.create({
    module: module._id,
    uploadedBy: user._id,
    originalName: file.originalname,
    storedName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
    status: 'uploaded'
  });

  // Trigger text extraction in background without blocking response
  setImmediate(() => {
    processDocument(newDocument._id).catch((err) => {
      console.error('[StudyAI Ingestion] Unhandled background extraction error:', err.message);
    });
  });

  return newDocument;
};

/**
 * Retrieves documents with authorization scoping
 */
export const getDocuments = async ({ moduleId, user }) => {
  const query = {};

  if (moduleId) {
    // Check module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      const error = new Error('Module not found');
      error.code = 'MODULE_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // If student, enforce enrollment check
    if (user.role === 'student') {
      const isEnrolled = (user.enrolledModules || []).some(
        (id) => id.toString() === moduleId.toString()
      );
      if (!isEnrolled) {
        const error = new Error('Access denied: You are not enrolled in this module');
        error.code = 'FORBIDDEN';
        error.statusCode = 403;
        throw error;
      }
    }

    query.module = moduleId;
  } else {
    // If no moduleId specified:
    // Admin sees all documents
    // Student only sees documents for their enrolled modules
    if (user.role === 'student') {
      const enrolled = user.enrolledModules || [];
      query.module = { $in: enrolled };
    }
  }

  const documents = await Document.find(query)
    .sort({ createdAt: -1 })
    .populate('module', 'moduleCode moduleName')
    .populate('uploadedBy', 'name email role');

  return documents;
};

/**
 * Retrieves a single document by ID with authorization scoping
 */
export const getDocumentById = async (id, user) => {
  const document = await Document.findById(id)
    .populate('module', 'moduleCode moduleName')
    .populate('uploadedBy', 'name email role');

  if (!document) {
    const error = new Error('Document not found');
    error.code = 'DOCUMENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Authorization check for students
  if (user.role === 'student') {
    const isEnrolled = (user.enrolledModules || []).some(
      (modId) => modId.toString() === document.module._id.toString()
    );
    if (!isEnrolled) {
      const error = new Error('Access denied: You are not enrolled in this module');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }
  }

  return document;
};

/**
 * Deletes a document record and removes the physical file from disk
 */
export const deleteDocument = async (id, user) => {
  const document = await Document.findById(id);

  if (!document) {
    const error = new Error('Document not found');
    error.code = 'DOCUMENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Admins can delete any document; students can only delete their own upload if allowed
  if (user.role !== 'admin' && document.uploadedBy.toString() !== user._id.toString()) {
    const error = new Error('Access denied: Only administrators can delete this document');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  // Delete physical file from filesystem
  if (document.filePath) {
    try {
      await fs.unlink(document.filePath);
    } catch (fsErr) {
      console.warn(`[StudyAI Ingestion] Notice: Could not remove physical file ${document.filePath}:`, fsErr.message);
    }
  }

  // Cascade delete associated DocumentChunks, LectureSummaries, and Questions
  await DocumentChunk.deleteMany({ document: id });
  await LectureSummary.deleteMany({ document: id });
  await Question.deleteMany({ document: id });

  // Delete database record
  await Document.findByIdAndDelete(id);

  return document;
};

/**
 * Retrieves paginated chunks for a document with enrollment authorization
 *
 * @param {string} documentId - MongoDB ObjectId of document
 * @param {Object} options - { page = 1, limit = 20, user }
 * @returns {Promise<{ chunks: Array, pagination: Object }>}
 */
export const getDocumentChunks = async (documentId, { page = 1, limit = 20, user }) => {
  const document = await Document.findById(documentId);
  if (!document) {
    const error = new Error('Document not found');
    error.code = 'DOCUMENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Authorization check for students
  if (user.role === 'student') {
    const isEnrolled = (user.enrolledModules || []).some(
      (modId) => modId.toString() === document.module.toString()
    );
    if (!isEnrolled) {
      const error = new Error('Access denied: You are not enrolled in the module this document belongs to');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [chunks, total] = await Promise.all([
    DocumentChunk.find({ document: documentId })
      .sort({ chunkIndex: 1 })
      .skip(skip)
      .limit(limitNum),
    DocumentChunk.countDocuments({ document: documentId })
  ]);

  return {
    chunks,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Retrieves embedding status and metadata for a document (Admin only)
 *
 * @param {string} documentId - MongoDB ObjectId of document
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Safe embedding status summary (no vectors)
 */
export const getEmbeddingStatus = async (documentId, user) => {
  if (user.role !== 'admin') {
    const error = new Error('Access denied: Admin role required');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  const document = await Document.findById(documentId);
  if (!document) {
    const error = new Error('Document not found');
    error.code = 'DOCUMENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  const [totalChunks, embeddedChunks, failedChunks, sampleChunk] = await Promise.all([
    DocumentChunk.countDocuments({ document: documentId }),
    DocumentChunk.countDocuments({ document: documentId, embeddingStatus: 'completed' }),
    DocumentChunk.countDocuments({ document: documentId, embeddingStatus: 'failed' }),
    DocumentChunk.findOne({ document: documentId, embeddingStatus: 'completed' }).select(
      'embeddingModel embeddingDimensions'
    )
  ]);

  const defaultModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
  const defaultDimensions = parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || 768;

  let computedStatus = document.embeddingStatus || 'pending';
  if (totalChunks > 0 && embeddedChunks === totalChunks) {
    computedStatus = 'completed';
  } else if (failedChunks > 0) {
    computedStatus = 'failed';
  }

  return {
    documentId: document._id,
    originalName: document.originalName,
    totalChunks,
    embeddedChunks,
    failedChunks,
    status: computedStatus,
    model: sampleChunk?.embeddingModel || defaultModel,
    dimensions: sampleChunk?.embeddingDimensions || defaultDimensions
  };
};

/**
 * Re-embeds all existing chunks of a document without re-extracting the PDF (Admin only)
 *
 * @param {string} documentId - MongoDB ObjectId of document
 * @param {Object} user - Authenticated user object
 * @param {Object} [options] - Options (e.g. client override for testing)
 * @returns {Promise<Object>} Updated status
 */
export const reEmbedDocument = async (documentId, user, options = {}) => {
  if (user.role !== 'admin') {
    const error = new Error('Access denied: Admin role required');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  const document = await Document.findById(documentId);
  if (!document) {
    const error = new Error('Document not found');
    error.code = 'DOCUMENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  const chunks = await DocumentChunk.find({ document: documentId }).sort({ chunkIndex: 1 });
  if (chunks.length === 0) {
    const error = new Error('No chunks found for this document to embed');
    error.code = 'NO_CHUNKS_FOUND';
    error.statusCode = 400;
    throw error;
  }

  const hasClient = Boolean(options.embeddingClient);
  const isAiConfigured = embeddingService.isConfigured() || hasClient;
  if (!isAiConfigured) {
    const configError = new Error(
      'Embedding generation failed: GEMINI_API_KEY is not configured in server/.env'
    );
    configError.code = 'GEMINI_NOT_CONFIGURED';
    configError.statusCode = 503;
    throw configError;
  }

  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
  const embeddingDimensions = parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || 768;

  document.embeddingStatus = 'processing';
  await document.save();

  try {
    const chunkTexts = chunks.map((c) => c.text);
    const vectors = await embeddingService.generateEmbeddings(chunkTexts, {
      model: embeddingModel,
      dimensions: embeddingDimensions,
      client: options.embeddingClient
    });

    const now = new Date();
    const updateOps = chunks.map((chunk, idx) =>
      DocumentChunk.updateOne(
        { _id: chunk._id },
        {
          $set: {
            embedding: vectors[idx],
            embeddingModel,
            embeddingDimensions,
            embeddingStatus: 'completed',
            embeddingGeneratedAt: now
          }
        }
      )
    );

    await Promise.all(updateOps);

    document.embeddedChunkCount = chunks.length;
    document.embeddingStatus = 'completed';
    document.processingError = null;
    await document.save();

    return {
      documentId: document._id,
      totalChunks: chunks.length,
      embeddedChunks: chunks.length,
      status: 'completed',
      model: embeddingModel,
      dimensions: embeddingDimensions
    };
  } catch (err) {
    document.embeddingStatus = 'failed';
    document.processingError = err.message || 'Re-embedding failed';
    await document.save();
    throw err;
  }
};

export default {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  getDocumentChunks,
  getEmbeddingStatus,
  reEmbedDocument
};

