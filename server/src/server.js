import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// Initialize Database Connection
connectDB();

const server = app.listen(PORT, () => {
  console.log(`[StudyAI Server] Listening on http://localhost:${PORT}`);
  console.log(`[StudyAI Server] Health endpoint available at http://localhost:${PORT}/api/health`);
  console.log(`[StudyAI Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`\n[StudyAI Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[StudyAI Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default server;

