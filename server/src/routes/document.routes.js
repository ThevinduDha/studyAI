import { Router } from 'express';
import {
  upload,
  getDocuments,
  getDocument,
  deleteDocument
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

// Delete document (Admin only)
router.delete('/:id', validateObjectId('id'), requireRole('admin'), deleteDocument);

export default router;
