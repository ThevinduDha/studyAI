import mongoose from 'mongoose';

/**
 * StudyAI — DocumentChunk Model (Phase 4)
 *
 * Represents an individual semantic passage segmented from a parent Document.
 * Designed to be independently retrievable and formatted for vector embedding
 * in Phase 5 without requiring schema migration.
 */
const documentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Parent document reference is required'],
      index: true
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module reference is required for scoping'],
      index: true
    },
    chunkIndex: {
      type: Number,
      required: [true, 'Zero-based chunk index is required'],
      min: [0, 'Chunk index cannot be negative']
    },
    text: {
      type: String,
      required: [true, 'Chunk text content is required'],
      trim: true
    },
    characterCount: {
      type: Number,
      required: [true, 'Character count is required']
    },
    tokenCount: {
      type: Number,
      default: 0,
      description: 'Estimated token count (~wordCount * 1.33)'
    },
    metadata: {
      originalName: {
        type: String,
        trim: true
      },
      pageStart: {
        type: Number,
        default: null
      },
      pageEnd: {
        type: Number,
        default: null
      },
      sectionHeading: {
        type: String,
        default: null,
        trim: true
      },
      sourceType: {
        type: String,
        default: 'pdf',
        trim: true
      }
    },
    embedding: {
      type: [Number],
      required: false,
      select: false
    },
    embeddingModel: {
      type: String,
      default: null,
      trim: true
    },
    embeddingDimensions: {
      type: Number,
      default: null
    },
    embeddingStatus: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: 'Embedding status must be pending, processing, completed, or failed'
      },
      default: 'pending',
      index: true
    },
    embeddingGeneratedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.embedding;
        return ret;
      }
    }
  }
);

// Prevent duplicate chunk indices for the same document
documentChunkSchema.index({ document: 1, chunkIndex: 1 }, { unique: true });

// Optimize module-scoped chunk queries for future vector retrieval
documentChunkSchema.index({ module: 1, document: 1 });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);

export default DocumentChunk;
