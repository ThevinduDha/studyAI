import * as questionService from '../services/ai/questionGeneration.service.js';

/**
 * StudyAI — Question Controller (Phase 9)
 * Handles REST endpoints for exam question generation, retrieval, and management.
 */

/**
 * POST /api/questions/generate
 * Generates exam-focused questions for a document
 */
export const generateQuestions = async (req, res, next) => {
  try {
    const { documentId, questionType, difficulty, count } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DOCUMENT_ID',
          message: 'documentId is required in the request body'
        }
      });
    }

    const result = await questionService.generateQuestions({
      documentId,
      user: req.user,
      questionType: questionType !== undefined ? questionType : 'MCQ',
      difficulty: difficulty !== undefined ? difficulty : 3,
      count: count !== undefined ? count : 5
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
 * GET /api/questions/document/:documentId
 * Retrieves active questions for a document
 */
export const getQuestionsByDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { questionType, difficulty, hideAnswers } = req.query;

    const questions = await questionService.getQuestionsByDocument({
      documentId,
      user: req.user,
      questionType,
      difficulty,
      hideAnswers: hideAnswers === 'true'
    });

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/questions/module/:moduleId
 * Retrieves active questions for an entire module
 */
export const getQuestionsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { questionType, difficulty, hideAnswers } = req.query;

    const questions = await questionService.getQuestionsByModule({
      moduleId,
      user: req.user,
      questionType,
      difficulty,
      hideAnswers: hideAnswers === 'true'
    });

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/questions/:questionId
 * Retrieves a single question by its ID
 */
export const getQuestionById = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { hideAnswers } = req.query;

    const question = await questionService.getQuestionById({
      questionId,
      user: req.user,
      hideAnswers: hideAnswers === 'true'
    });

    return res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/questions/:questionId
 * Admin-only: Deletes a single question
 */
export const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const deleted = await questionService.deleteQuestion({
      questionId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};
