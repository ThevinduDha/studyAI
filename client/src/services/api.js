/**
 * Centralized API Client
 * Manages base URL, JWT authentication headers, request dispatching, and unified error handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, statusCode, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('studyai_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    // Parse JSON if available
    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      // If 401 Unauthorized, notify listeners
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('studyai:unauthorized'));
      }

      const errorMessage = data?.error?.message || data?.message || `Request failed with status ${res.status}`;
      const errorCode = data?.error?.code || 'HTTP_ERROR';
      throw new ApiError(errorMessage, res.status, errorCode);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network connection failed', 0, 'NETWORK_ERROR');
  }
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' })
};

export default api;
