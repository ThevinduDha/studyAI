import { Router } from 'express';
import {
  upload,
  getDocuments,
  getDocument,
  deleteDocument,
  getDocumentChunks,
  getEmbeddingStatus,
  reEmbed
} from '../controllers/document.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { uploadDocumentMiddleware } from '../middleware/upload.middleware.js';
import { validateObjectId } from '../middleware/validateId.js';

const router = Router();

// All document routes require authentication
router.use(requireAuth);

// Upload PDF document (Admin only)
router.post('/', requireRole('admin'), uploadDocumentMiddleware, upload);

// List documents (scoped by role / enrollment)
router.get('/', getDocuments);

// Single document details & processing status
router.get('/:id', validateObjectId('id'), getDocument);

// Retrieve document chunks (paginated, scoped by enrollment / role)
router.get('/:id/chunks', validateObjectId('id'), getDocumentChunks);

// Embedding generation status & metrics (Admin only)
router.get('/:id/embedding-status', validateObjectId('id'), requireRole('admin'), getEmbeddingStatus);

// Re-embed document chunks (Admin only)
router.post('/:id/re-embed', validateObjectId('id'), requireRole('admin'), reEmbed);

// Delete document (Admin only)
router.delete('/:id', validateObjectId('id'), requireRole('admin'), deleteDocument);

export default router;
