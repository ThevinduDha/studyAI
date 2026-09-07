import mongoose from 'mongoose';

/**
 * StudyAI — QuizAttempt Model (Phase 10)
 *
 * Tracks individual student quiz sessions, attempts, answers, and server-evaluated scores.
 * Serves as the primary data foundation for:
 * - Phase 10: Quiz Results & Review
 * - Phase 11: Student Learning Analytics (mastery, topic retention, difficulty trends)
 */

const studentAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: String,
      default: '',
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    requiresReview: {
      type: Boolean,
      default: false
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz reference is required'],
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student user reference is required'],
      index: true
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
    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    submittedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['in_progress', 'completed', 'abandoned'],
        message: 'Status must be in_progress, completed, or abandoned'
      },
      default: 'in_progress',
      index: true
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    answeredQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    incorrectAnswers: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    timeSpentSeconds: {
      type: Number,
      default: 0
    },
    answers: {
      type: [studentAnswerSchema],
      default: []
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

// Compound indexes for optimal retrieval & analytics (Phase 10 & Phase 11)
quizAttemptSchema.index({ student: 1, status: 1, createdAt: -1 });
quizAttemptSchema.index({ quiz: 1, student: 1, status: 1 });
quizAttemptSchema.index({ module: 1, student: 1, createdAt: -1 });
quizAttemptSchema.index({ student: 1, status: 1, submittedAt: -1 });
quizAttemptSchema.index({ student: 1, module: 1, status: 1, submittedAt: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
