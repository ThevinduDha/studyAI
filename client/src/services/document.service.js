import api from './api.js';

/**
 * Document API Service
 */
export const documentService = {
  /**
   * Upload an academic PDF document for a specific module
   * @param {string} moduleId - MongoDB ObjectId of module
   * @param {File} file - PDF File object from input
   */
  uploadDocument: async (moduleId, file) => {
    const formData = new FormData();
    formData.append('moduleId', moduleId);
    formData.append('file', file);

    const res = await api.upload('/documents', formData);
    return res.data.document;
  },

  /**
   * Get documents, optionally filtered by moduleId
   * @param {string} [moduleId]
   */
  getDocuments: async (moduleId) => {
    const query = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : '';
    const res = await api.get(`/documents${query}`);
    return res.data.documents;
  },

  /**
   * Get single document details & processing status
   * @param {string} id
   */
  getDocument: async (id) => {
    const res = await api.get(`/documents/${id}`);
    return res.data.document;
  },

  /**
   * Delete document by ID
   * @param {string} id
   */
  deleteDocument: async (id) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data.document;
  }
};

export default documentService;
