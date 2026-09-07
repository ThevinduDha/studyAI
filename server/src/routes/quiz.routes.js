import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateObjectId } from '../middleware/validateId.js';
import * as quizController from '../controllers/quiz.controller.js';

const router = express.Router();

/**
 * Phase 10 — AI Quiz System Endpoints
 * All endpoints require authentication.
 */

// POST /api/quizzes - Create quiz from Question Bank
router.post('/', requireAuth, quizController.createQuiz);

// GET /api/quizzes/attempts - Get student attempt history
router.get('/attempts', requireAuth, quizController.getQuizAttempts);

// GET /api/quizzes/attempts/:attemptId - Get attempt details (reveals answers only if completed)
router.get('/attempts/:attemptId', requireAuth, validateObjectId('attemptId'), quizController.getQuizAttemptById);

// POST /api/quizzes/attempts/:attemptId/submit - Submit answers & perform server scoring
router.post('/attempts/:attemptId/submit', requireAuth, validateObjectId('attemptId'), quizController.submitQuizAttempt);

// POST /api/quizzes/attempts/:attemptId/abandon - Abandon in-progress attempt
router.post('/attempts/:attemptId/abandon', requireAuth, validateObjectId('attemptId'), quizController.abandonQuizAttempt);

// GET /api/quizzes/:quizId - Get quiz metadata and secure questions
router.get('/:quizId', requireAuth, validateObjectId('quizId'), quizController.getQuiz);

// POST /api/quizzes/:quizId/start - Start or resume quiz attempt
router.post('/:quizId/start', requireAuth, validateObjectId('quizId'), quizController.startQuiz);

// DELETE /api/quizzes/:quizId - Admin-only quiz deletion
router.delete('/:quizId', requireAuth, requireRole('admin'), validateObjectId('quizId'), quizController.deleteQuiz);

export default router;
