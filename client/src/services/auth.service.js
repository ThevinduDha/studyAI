import api from './api.js';

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { name, email, password, role }
   */
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  /**
   * Log in user with credentials
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.user;
  }
};

export default authService;
