import mongoose from 'mongoose';

/**
 * Health Controller
 * Provides system status and database connectivity check endpoints.
 */

export const getHealthStatus = (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'StudyAI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
};

export const getDatabaseHealth = (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  return res.status(200).json({
    status: 'ok',
    database: isConnected ? 'connected' : 'disconnected'
  });
};

