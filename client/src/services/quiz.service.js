import api from './api.js';

/**
 * StudyAI — Quiz Client Service (Phase 10)
 * Connects frontend UI to backend /api/quizzes endpoints.
 */

export const quizService = {
  /**
   * Creates a new quiz from Question Bank records
   * @param {Object} params - { moduleId, documentId, questionType, difficulty, count, randomized, timeLimitSeconds }
   * @returns {Promise<{ quiz: Object, questions: Array<Object> }>}
   */
  createQuiz: async (params) => {
    const response = await api.post('/quizzes', params);
    return response.data;
  },

  /**
   * Retrieves quiz metadata and secure question payloads
   * @param {string} quizId
   * @returns {Promise<{ quiz: Object, questions: Array<Object> }>}
   */
  getQuiz: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  },

  /**
   * Starts or resumes a quiz attempt
   * @param {string} quizId
   * @returns {Promise<{ attempt: Object, questions: Array<Object>, isResumed: boolean }>}
   */
  startQuiz: async (quizId) => {
    const response = await api.post(`/quizzes/${quizId}/start`);
    return response.data;
  },

  /**
   * Submits student answers and performs server-side evaluation
   * @param {string} attemptId
   * @param {Array<{ questionId: string, selectedAnswer: string }>} answers
   * @returns {Promise<Object>}
   */
  submitQuiz: async (attemptId, answers) => {
    const response = await api.post(`/quizzes/attempts/${attemptId}/submit`, { answers });
    return response.data;
  },

  /**
   * Retrieves past quiz attempt history
   * @param {Object} [params] - { moduleId, documentId, status }
   * @returns {Promise<Array<Object>>}
   */
  getAttemptHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.moduleId) queryParams.append('moduleId', params.moduleId);
    if (params.documentId) queryParams.append('documentId', params.documentId);
    if (params.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const url = `/quizzes/attempts${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Retrieves detailed attempt info
   * @param {string} attemptId
   * @returns {Promise<Object>}
   */
  getAttempt: async (attemptId) => {
    const response = await api.get(`/quizzes/attempts/${attemptId}`);
    return response.data;
  },

  /**
   * Abandons an in-progress quiz attempt
   * @param {string} attemptId
   * @returns {Promise<Object>}
   */
  abandonAttempt: async (attemptId) => {
    const response = await api.post(`/quizzes/attempts/${attemptId}/abandon`);
    return response.data;
  },

  /**
   * Deletes a quiz (admin only)
   * @param {string} quizId
   * @returns {Promise<Object>}
   */
  deleteQuiz: async (quizId) => {
    const response = await api.delete(`/quizzes/${quizId}`);
    return response;
  }
};

export default quizService;
