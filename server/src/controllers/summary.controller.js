import * as summaryService from '../services/ai/summary.service.js';

/**
 * StudyAI — Summary Controller (Phase 8)
 * Handles REST endpoints for lecture summary generation, retrieval, regeneration, and deletion.
 */

/**
 * POST /api/summaries/generate
 * Generates an exam-oriented summary for a specified document
 */
export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DOCUMENT_ID',
          message: 'documentId is required in the request body'
        }
      });
    }

    const result = await summaryService.generateLectureSummary({
      documentId,
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
 * GET /api/summaries/document/:documentId
 * Retrieves the latest generated summary for a document
 */
export const getSummaryByDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const summary = await summaryService.getLatestSummary({
      documentId,
      user: req.user
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUMMARY_NOT_FOUND',
          message: 'No summary has been generated for this document yet'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/summaries/document/:documentId/regenerate
 * Regenerates the summary for a document (increments version)
 */
export const regenerateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const result = await summaryService.regenerateSummary({
      documentId,
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
 * DELETE /api/summaries/document/:documentId
 * Admin-only: Deletes all summaries for a document
 */
export const deleteSummary = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const result = await summaryService.deleteSummary({
      documentId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Summary deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export default {
  generateSummary,
  getSummaryByDocument,
  regenerateSummary,
  deleteSummary
};
