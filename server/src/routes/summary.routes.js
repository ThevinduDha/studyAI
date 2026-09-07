import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import * as summaryController from '../controllers/summary.controller.js';

const router = express.Router();

/**
 * Phase 8 — Lecture Summary Endpoints
 * All endpoints require authentication.
 */
router.post('/generate', requireAuth, summaryController.generateSummary);
router.get('/document/:documentId', requireAuth, summaryController.getSummaryByDocument);
router.post('/document/:documentId/regenerate', requireAuth, summaryController.regenerateSummary);
router.delete('/document/:documentId', requireAuth, requireRole('admin'), summaryController.deleteSummary);

export default router;
