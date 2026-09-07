import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('studyai_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('studyai_token');
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  // Fetch current user if token is present
  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('studyai_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const profile = await authService.getMe();
      setUser(profile);
      return profile;
    } catch (err) {
      console.warn('[StudyAI Auth] Session invalid or expired:', err.message);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();

    // Listen for unauthorized 401 events dispatched by API client
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('studyai:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('studyai:unauthorized', handleUnauthorized);
    };
  }, [refreshUser, logout]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('studyai_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const data = await authService.register(userData);
      localStorage.setItem('studyai_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
