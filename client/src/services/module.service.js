import api from './api.js';

/**
 * Module & Enrollment API Service
 */
export const moduleService = {
  /**
   * Get all modules, optionally filtered by search
   * @param {string} search
   */
  getAllModules: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await api.get(`/modules${query}`);
    return res.data.modules;
  },

  /**
   * Get student's enrolled modules
   */
  getEnrolledModules: async () => {
    const res = await api.get('/modules/enrolled');
    return res.data.enrolledModules;
  },

  /**
   * Get module details by ID
   * @param {string} id
   */
  getModuleById: async (id) => {
    const res = await api.get(`/modules/${id}`);
    return res.data.module;
  },

  /**
   * Create a module (Admin only)
   * @param {Object} moduleData
   */
  createModule: async (moduleData) => {
    const res = await api.post('/modules', moduleData);
    return res.data.module;
  },

  /**
   * Update a module (Admin only)
   * @param {string} id
   * @param {Object} updateData
   */
  updateModule: async (id, updateData) => {
    const res = await api.put(`/modules/${id}`, updateData);
    return res.data.module;
  },

  /**
   * Delete a module (Admin only)
   * @param {string} id
   */
  deleteModule: async (id) => {
    const res = await api.delete(`/modules/${id}`);
    return res.data.module;
  },

  /**
   * Enroll authenticated student in module
   * @param {string} id
   */
  enroll: async (id) => {
    const res = await api.post(`/modules/${id}/enroll`);
    return res.data;
  },

  /**
   * Unenroll authenticated student from module
   * @param {string} id
   */
  unenroll: async (id) => {
    const res = await api.delete(`/modules/${id}/enroll`);
    return res.data;
  }
};

export default moduleService;
