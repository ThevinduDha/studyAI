import * as quizService from '../services/quiz/quiz.service.js';

/**
 * StudyAI — Quiz Controller (Phase 10)
 * Handles REST endpoints for interactive AI quizzes and server-side attempt evaluation.
 */

/**
 * POST /api/quizzes
 * Creates a new quiz from Question Bank records
 */
export const createQuiz = async (req, res, next) => {
  try {
    const { moduleId, documentId, questionType, difficulty, count, randomized, timeLimitSeconds } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MODULE_ID',
          message: 'moduleId is required in the request body'
        }
      });
    }

    const result = await quizService.createQuiz({
      moduleId,
      documentId,
      questionType: questionType || 'ALL',
      difficulty: difficulty !== undefined ? difficulty : 'ALL',
      count: count !== undefined ? Number(count) : 10,
      randomized: randomized !== undefined ? Boolean(randomized) : true,
      timeLimitSeconds,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/quizzes/:quizId
 * Retrieves quiz metadata and secure question payloads (no solutions)
 */
export const getQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const result = await quizService.getQuizById({
      quizId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/quizzes/:quizId/start
 * Starts or resumes a quiz attempt for a student
 */
export const startQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const result = await quizService.startQuizAttempt({
      quizId,
      user: req.user
    });

    const statusCode = result.isResumed ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/quizzes/attempts/:attemptId/submit
 * Submits student answers and performs authoritative server-side scoring
 */
export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;

    const result = await quizService.submitQuizAttempt({
      attemptId,
      answers,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/quizzes/attempts
 * Retrieves attempt history for the authenticated student
 */
export const getQuizAttempts = async (req, res, next) => {
  try {
    const { moduleId, documentId, status } = req.query;

    const attempts = await quizService.getQuizAttemptHistory({
      user: req.user,
      moduleId,
      documentId,
      status
    });

    return res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/quizzes/attempts/:attemptId
 * Retrieves detailed attempt info (reveals answers only if completed)
 */
export const getQuizAttemptById = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const result = await quizService.getQuizAttemptById({
      attemptId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/quizzes/attempts/:attemptId/abandon
 * Abandons an in-progress attempt
 */
export const abandonQuizAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await quizService.abandonQuizAttempt({
      attemptId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Quiz attempt abandoned successfully',
      data: attempt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/quizzes/:quizId
 * Admin-only: Deletes a quiz
 */
export const deleteQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const result = await quizService.deleteQuiz({
      quizId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
