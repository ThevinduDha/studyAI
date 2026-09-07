import api from './api.js';

/**
 * Executes semantic vector search across course materials
 *
 * @param {Object} params - { question, moduleId, documentId, topK }
 * @returns {Promise<{ question: string, results: Array, count: number }>}
 */
export const searchRetrieval = async ({ question, moduleId, documentId, topK }) => {
  const payload = { question };
  if (moduleId) payload.moduleId = moduleId;
  if (documentId) payload.documentId = documentId;
  if (topK !== undefined && topK !== null) payload.topK = Number(topK);

  const res = await api.post('/retrieval/search', payload);
  return res.data;
};

export default {
  searchRetrieval
};
