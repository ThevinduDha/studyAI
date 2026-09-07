import api from './api.js';

/**
 * StudyAI — Exam Question Generator Client Service (Phase 9)
 * Connects frontend UI to backend /api/questions endpoints.
 */

export const questionService = {
  /**
   * Generates exam questions for a specific document
   * @param {Object} params - { documentId, questionType, difficulty, count }
   * @returns {Promise<{ requested: number, generated: number, questions: Array<Object> }>}
   */
  generateQuestions: async ({ documentId, questionType = 'MCQ', difficulty = 3, count = 5 }) => {
    const response = await api.post('/questions/generate', {
      documentId,
      questionType,
      difficulty,
      count
    });
    return response.data;
  },

  /**
   * Fetches active questions for a document
   * @param {string} documentId
   * @param {Object} [params] - { questionType, difficulty }
   * @returns {Promise<Array<Object>>}
   */
  getQuestionsByDocument: async (documentId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.questionType) queryParams.append('questionType', params.questionType);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);

    const queryString = queryParams.toString();
    const url = `/questions/document/${documentId}${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Fetches active questions for an entire module
   * @param {string} moduleId
   * @param {Object} [params] - { questionType, difficulty }
   * @returns {Promise<Array<Object>>}
   */
  getQuestionsByModule: async (moduleId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.questionType) queryParams.append('questionType', params.questionType);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);

    const queryString = queryParams.toString();
    const url = `/questions/module/${moduleId}${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Fetches a single question by ID
   * @param {string} questionId
   * @returns {Promise<Object>}
   */
  getQuestion: async (questionId) => {
    const response = await api.get(`/questions/${questionId}`);
    return response.data;
  },

  /**
   * Deletes a question (admin only)
   * @param {string} questionId
   * @returns {Promise<Object>}
   */
  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/questions/${questionId}`);
    return response;
  }
};

export default questionService;
