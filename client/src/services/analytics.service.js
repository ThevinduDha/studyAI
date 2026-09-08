import api from './api.js';

/**
 * StudyAI — Performance Analytics Client Service (Phase 11)
 * Connects frontend UI to backend /api/analytics endpoints.
 */

export const analyticsService = {
  /**
   * Retrieves overall student performance analytics & weak-topic intelligence
   * @param {string} [studentId] - Optional student ID for admin inspection
   * @returns {Promise<Object>}
   */
  getOverview: async (studentId) => {
    const url = studentId ? `/analytics/overview?studentId=${studentId}` : '/analytics/overview';
    const response = await api.get(url);
    return response;
  },

  /**
   * Retrieves scoped performance analytics for a specific module
   * @param {string} moduleId
   * @returns {Promise<Object>}
   */
  getModuleAnalytics: async (moduleId) => {
    const response = await api.get(`/analytics/module/${moduleId}`);
    return response;
  },

  /**
   * Retrieves scoped performance analytics for a specific topic
   * @param {string} topic
   * @returns {Promise<Object>}
   */
  getTopicAnalytics: async (topic) => {
    const response = await api.get(`/analytics/topic/${encodeURIComponent(topic)}`);
    return response;
  },

  /**
   * Requests AI-powered strategic study advice grounded in current analytics
   * @param {Object} summaryData
   * @returns {Promise<Object>}
   */
  getAIInsight: async (summaryData) => {
    const response = await api.post('/analytics/ai-insight', { summaryData });
    return response;
  }
};

export default analyticsService;
