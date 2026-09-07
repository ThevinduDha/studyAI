import api from './api.js';

/**
 * StudyAI — Lecture Summary Client Service (Phase 8)
 * Connects frontend UI to backend /api/summaries endpoints.
 */

export const summaryService = {
  /**
   * Generates a new lecture summary for the specified document
   * @param {string} documentId
   * @returns {Promise<{ summary: Object, sources: Array<Object> }>}
   */
  generateSummary: async (documentId) => {
    const response = await api.post('/summaries/generate', { documentId });
    return response.data;
  },

  /**
   * Fetches the latest generated summary for a document
   * @param {string} documentId
   * @returns {Promise<Object>}
   */
  getSummary: async (documentId) => {
    const response = await api.get(`/summaries/document/${documentId}`);
    return response.data;
  },

  /**
   * Regenerates a summary for a document, incrementing its version
   * @param {string} documentId
   * @returns {Promise<{ summary: Object, sources: Array<Object> }>}
   */
  regenerateSummary: async (documentId) => {
    const response = await api.post(`/summaries/document/${documentId}/regenerate`);
    return response.data;
  },

  /**
   * Deletes all summaries for a document (admin only)
   * @param {string} documentId
   * @returns {Promise<Object>}
   */
  deleteSummary: async (documentId) => {
    const response = await api.delete(`/summaries/document/${documentId}`);
    return response;
  }
};

export default summaryService;
