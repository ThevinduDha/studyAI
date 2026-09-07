import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

/**
 * Phase 11 — Student Performance Analytics Routes
 */

// All analytics endpoints require authentication
router.use(requireAuth);

// GET /api/analytics/overview — Comprehensive student performance overview
router.get('/overview', analyticsController.getOverview);

// GET /api/analytics/module/:moduleId — Scoped module analytics
router.get('/module/:moduleId', analyticsController.getModuleAnalytics);

// GET /api/analytics/topic/:topic — Scoped topic analytics
router.get('/topic/:topic', analyticsController.getTopicAnalytics);

// POST /api/analytics/ai-insight — Optional AI study advice
router.post('/ai-insight', analyticsController.getAIInsight);

export default router;
