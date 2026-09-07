import mongoose from 'mongoose';

/**
 * StudyAI — Question Model (Phase 9)
 *
 * Represents an exam-oriented study question generated from DocumentChunks.
 * Designed to serve as the foundation for:
 * - Phase 9: Question Bank & Exam Practice
 * - Phase 10: AI Quiz System
 * - Phase 11: Student Learning Analytics
 *
 * NOTE: Embedding vectors are strictly NOT stored inside Question records.
 */

const sourceChunkReferenceSchema = new mongoose.Schema(
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

const questionSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Parent module reference is required'],
      index: true
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Parent document reference is required'],
      index: true
    },
    questionType: {
      type: String,
      enum: {
        values: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'SCENARIO'],
        message: 'Question type must be MCQ, TRUE_FALSE, SHORT_ANSWER, or SCENARIO'
      },
      required: [true, 'Question type is required']
    },
    difficulty: {
      type: Number,
      enum: {
        values: [2, 3, 4],
        message: 'Difficulty must be 2 (Basic Understanding), 3 (Application / Moderate), or 4 (Scenario / Higher-order)'
      },
      required: [true, 'Difficulty is required']
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    options: {
      type: [String],
      default: []
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true
    },
    examClue: {
      type: String,
      default: '',
      trim: true
    },
    commonTrap: {
      type: String,
      default: '',
      trim: true
    },
    topic: {
      type: String,
      default: 'Core Concept',
      trim: true
    },
    sourceChunks: {
      type: [sourceChunkReferenceSchema],
      default: []
    },
    generationModel: {
      type: String,
      default: 'gemini-3.8-flash',
      trim: true
    },
    generationVersion: {
      type: Number,
      default: 1
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

// Compound indexes for optimal retrieval
questionSchema.index({ document: 1, isActive: 1, createdAt: -1 });
questionSchema.index({ module: 1, isActive: 1, createdAt: -1 });
questionSchema.index({ document: 1, questionType: 1, difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);

export default Question;
