import * as retrievalService from '../services/ai/retrieval.service.js';

/**
 * @route   POST /api/retrieval/search
 * @desc    Perform semantic vector search on course document chunks
 * @access  Private (Student: enrolled modules only; Admin: global or scoped)
 */
export const search = async (req, res, next) => {
  try {
    const { question, moduleId, documentId, topK } = req.body;

    const result = await retrievalService.searchChunks({
      question,
      moduleId,
      documentId,
      topK,
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

export default {
  search
};
