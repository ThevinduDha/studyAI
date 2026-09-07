import fs from 'node:fs/promises';
import Document from '../../models/document.model.js';
import Module from '../../models/module.model.js';
import User from '../../models/user.model.js';
import { processDocument } from './documentProcessing.service.js';

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

  // Delete database record
  await Document.findByIdAndDelete(id);

  return document;
};

export default {
  createDocument,
  getDocuments,
  getDocumentById,
  deleteDocument
};
