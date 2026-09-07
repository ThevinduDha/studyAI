import * as analyticsService from '../services/analytics/analytics.service.js';

/**
 * Controller: GET /api/analytics/overview
 * Retrieve student performance overview, trends, module & topic breakdowns
 */
export const getOverview = async (req, res, next) => {
  try {
    const targetStudentId = req.query.studentId;
    const analytics = await analyticsService.getStudentOverviewAnalytics({
      user: req.user,
      targetStudentId
    });

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: GET /api/analytics/module/:moduleId
 * Retrieve module-specific performance analytics
 */
export const getModuleAnalytics = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const analytics = await analyticsService.getModuleAnalytics({
      moduleId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: GET /api/analytics/topic/:topic
 * Retrieve topic-specific performance analytics
 */
export const getTopicAnalytics = async (req, res, next) => {
  try {
    const { topic } = req.params;
    const analytics = await analyticsService.getTopicAnalytics({
      topic,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: POST /api/analytics/ai-insight
 * Generate concise AI study advice grounded strictly in calculated analytics
 */
export const getAIInsight = async (req, res, next) => {
  try {
    const { summaryData } = req.body;
    const advice = await analyticsService.generateAIStudyAdvice({
      user: req.user,
      summaryData
    });

    return res.status(200).json({
      success: true,
      data: advice
    });
  } catch (err) {
    next(err);
  }
};
