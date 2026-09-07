import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import moduleRoutes from './routes/module.routes.js';
import documentRoutes from './routes/document.routes.js';
import retrievalRoutes from './routes/retrieval.routes.js';
import ragRoutes from './routes/rag.routes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Standard middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/retrieval', retrievalRoutes);
app.use('/api/rag', ragRoutes);



// Fallback & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);


export default app;

