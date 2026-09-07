import mongoose from 'mongoose';

/**
 * StudyAI — Quiz Model (Phase 10)
 *
 * Represents an interactive quiz generated from existing validated Question Bank records.
 * Securely references selected question IDs without duplicating question contents.
 */

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Parent module reference is required'],
      index: true
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user reference is required'],
      index: true
    },
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      }
    ],
    questionCount: {
      type: Number,
      required: [true, 'Question count is required'],
      min: [1, 'Quiz must contain at least 1 question']
    },
    questionType: {
      type: String,
      enum: {
        values: ['ALL', 'MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'SCENARIO'],
        message: 'Question type must be ALL, MCQ, TRUE_FALSE, SHORT_ANSWER, or SCENARIO'
      },
      default: 'ALL'
    },
    difficulty: {
      type: String,
      enum: {
        values: ['ALL', '2', '3', '4'],
        message: 'Difficulty must be ALL, 2, 3, or 4'
      },
      default: 'ALL'
    },
    randomized: {
      type: Boolean,
      default: true
    },
    timeLimitSeconds: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'abandoned'],
        message: 'Status must be active, completed, or abandoned'
      },
      default: 'active',
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

// Compound indexes for optimal performance
quizSchema.index({ module: 1, status: 1, createdAt: -1 });
quizSchema.index({ document: 1, status: 1, createdAt: -1 });
quizSchema.index({ createdBy: 1, createdAt: -1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
