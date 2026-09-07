import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as ragController from '../controllers/rag.controller.js';

const router = Router();

/**
 * @route   POST /api/rag/ask
 * @desc    Submit an academic question to the grounded StudyAI RAG pipeline
 * @access  Private (Authenticated users: Students enrolled-only, Admins global/scoped)
 */
router.post('/ask', requireAuth, ragController.ask);

export default router;
