import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateObjectId } from '../middleware/validateId.js';
import * as questionController from '../controllers/question.controller.js';

const router = express.Router();

/**
 * Phase 9 — Exam-Focused Question Generator Endpoints
 * All endpoints require authentication.
 */

// POST /api/questions/generate - Generate questions for document
router.post('/generate', requireAuth, questionController.generateQuestions);

// GET /api/questions/document/:documentId - Get questions for a document
router.get('/document/:documentId', requireAuth, validateObjectId('documentId'), questionController.getQuestionsByDocument);

// GET /api/questions/module/:moduleId - Get questions for an entire module
router.get('/module/:moduleId', requireAuth, validateObjectId('moduleId'), questionController.getQuestionsByModule);

// GET /api/questions/:questionId - Get single question
router.get('/:questionId', requireAuth, validateObjectId('questionId'), questionController.getQuestionById);

// DELETE /api/questions/:questionId - Admin only delete question
router.delete('/:questionId', requireAuth, requireRole('admin'), validateObjectId('questionId'), questionController.deleteQuestion);

export default router;
