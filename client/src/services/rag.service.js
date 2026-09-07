import api from './api.js';

/**
 * StudyAI — RAG API Client Service (Phase 7)
 *
 * Dispatches authenticated queries to the Grounded RAG backend.
 */
export const ragService = {
  /**
   * Submit an academic question to the grounded RAG pipeline
   *
   * @param {Object} params - { question, moduleId, documentId, topK }
   * @returns {Promise<{ question: string, answer: string, sources: Array<Object>, retrieval: { count: number } }>}
   */
  askQuestion: async ({ question, moduleId, documentId, topK }) => {
    const payload = { question };
    if (moduleId) payload.moduleId = moduleId;
    if (documentId) payload.documentId = documentId;
    if (topK !== undefined && topK !== null) payload.topK = Number(topK);

    const res = await api.post('/rag/ask', payload);
    return res.data;
  }
};

export default ragService;
