import * as ragService from '../services/ai/rag.service.js';

/**
 * @route   POST /api/rag/ask
 * @desc    Ask a study question grounded in authorized course materials
 * @access  Private (Student: enrolled modules only; Admin: global or scoped)
 */
export const ask = async (req, res, next) => {
  try {
    const { question, moduleId, documentId, topK } = req.body;

    const result = await ragService.askQuestion({
      user: req.user,
      question,
      moduleId,
      documentId,
      topK
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
  ask
};
