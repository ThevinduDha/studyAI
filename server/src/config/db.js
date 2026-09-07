import mongoose from 'mongoose';

/**
 * MongoDB Connection Handler
 * Manages database lifecycle events, error handling, and connection state.
 */

// Prevent buffering queries indefinitely when database is disconnected
mongoose.set('bufferTimeoutMS', 2500);

let isConnected = false;


export const connectDB = async () => {
  // If already connected, reuse existing connection
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '' || mongoUri.includes('placeholder')) {
    console.warn('\n[StudyAI Database] WARNING: MONGODB_URI is not configured in server/.env.');
    console.warn('[StudyAI Database] Database operations requiring MongoDB will be unavailable until a valid connection string is provided.');
    console.warn('[StudyAI Database] Please add your MongoDB connection string to server/.env (e.g., MONGODB_URI=mongodb://localhost:27017/studyai)\n');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[StudyAI Database] MongoDB connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // If DNS SRV query failed (common on Windows local networks), retry using public DNS resolvers
    if (error.message && error.message.includes('querySrv')) {
      try {
        const dns = await import('node:dns');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`[StudyAI Database] MongoDB connected successfully via DNS fallback to host: ${conn.connection.host}`);
        return conn;
      } catch (retryErr) {
        isConnected = false;
        console.error(`[StudyAI Database] MongoDB connection error: ${retryErr.message}`);
        return null;
      }
    }

    isConnected = false;
    console.error(`[StudyAI Database] MongoDB connection error: ${error.message}`);
    // Do not exit the process immediately so development server can still serve health status and static assets
    return null;
  }

};

// Handle connection lifecycle events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[StudyAI Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error(`[StudyAI Database] MongoDB runtime error: ${err.message}`);
});

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
