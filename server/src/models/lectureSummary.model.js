import mongoose from 'mongoose';

/**
 * StudyAI — LectureSummary Model (Phase 8)
 *
 * Stores structured, exam-oriented lecture summaries generated from DocumentChunks.
 * Includes versioning for tracking regenerations and application-generated source attribution.
 */
const keyConceptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Key concept title is required'],
      trim: true
    },
    explanation: {
      type: String,
      required: [true, 'Key concept explanation is required'],
      trim: true
    }
  },
  { _id: false }
);

const definitionSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: [true, 'Definition term is required'],
      trim: true
    },
    definition: {
      type: String,
      required: [true, 'Definition explanation is required'],
      trim: true
    }
  },
  { _id: false }
);

const sourceChunkSchema = new mongoose.Schema(
  {
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentChunk',
      default: null
    },
    chunkIndex: {
      type: Number,
      default: 0
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    documentName: {
      type: String,
      default: ''
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
      default: null
    },
    relevanceScore: {
      type: Number,
      default: null
    }
  },
  { _id: false }
);

const lectureSummarySchema = new mongoose.Schema(
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
      required: [true, 'Parent module reference is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Summary title is required'],
      trim: true
    },
    overview: {
      type: String,
      required: [true, 'Summary overview is required'],
      trim: true
    },
    keyConcepts: {
      type: [keyConceptSchema],
      default: []
    },
    importantPoints: {
      type: [String],
      default: []
    },
    examFocus: {
      type: [String],
      default: []
    },
    definitions: {
      type: [definitionSchema],
      default: []
    },
    examples: {
      type: [String],
      default: []
    },
    sourceChunks: {
      type: [sourceChunkSchema],
      default: []
    },
    model: {
      type: String,
      default: 'gemini-3.8-flash',
      trim: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1,
      min: [1, 'Version must be at least 1']
    },
    status: {
      type: String,
      enum: {
        values: ['generated', 'failed'],
        message: 'Summary status must be either generated or failed'
      },
      default: 'generated',
      index: true
    },
    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index to quickly fetch the latest version of a document's summary
lectureSummarySchema.index({ document: 1, version: -1 });

// Optimize module-scoped queries
lectureSummarySchema.index({ module: 1, document: 1 });

const LectureSummary = mongoose.model('LectureSummary', lectureSummarySchema);

export default LectureSummary;
