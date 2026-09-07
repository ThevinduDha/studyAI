import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as retrievalController from '../controllers/retrieval.controller.js';

const router = Router();

/**
 * @route   POST /api/retrieval/search
 * @desc    Execute semantic vector search across course document chunks
 * @access  Private (Authenticated users: Students enrolled-only, Admins global/scoped)
 */
router.post('/search', requireAuth, retrievalController.search);

export default router;
