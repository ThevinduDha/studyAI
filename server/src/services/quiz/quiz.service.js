import mongoose from 'mongoose';
import Quiz from '../../models/quiz.model.js';
import QuizAttempt from '../../models/quizAttempt.model.js';
import Question from '../../models/question.model.js';
import Module from '../../models/module.model.js';
import Document from '../../models/document.model.js';

/**
 * StudyAI — Quiz Service (Phase 10)
 *
 * Coordinates interactive AI quiz creation, attempts, and server-side evaluation.
 * STRICT SECURITY PRINCIPLES:
 * 1. The client NEVER receives correctAnswer, explanation, examClue, or commonTrap during an active quiz.
 * 2. The server calculates all scores, percentages, and elapsed time. Client scores are completely rejected.
 * 3. Reuses existing validated Question Bank records from Phase 9 without redundant Gemini invocations.
 * 4. Preserves comprehensive attempt metrics for Phase 11 Learning Analytics.
 */

/**
 * Strips sensitive solution data to produce a secure, quiz-safe question payload
 *
 * @param {Object} question - Raw Question model or lean object
 * @param {boolean} [randomizeOptions=true] - Whether to randomize option order
 * @returns {Object} Sanitized question object
 */
export const toQuizQuestion = (question, randomizeOptions = true) => {
  if (!question) return null;

  let options = Array.isArray(question.options) ? [...question.options] : [];
  if (randomizeOptions && options.length > 0 && question.questionType !== 'TRUE_FALSE') {
    // Deterministic/safe shuffle of option presentation for student
    options = options.sort(() => Math.random() - 0.5);
  }

  return {
    id: question._id ? question._id.toString() : question.id,
    questionText: question.questionText,
    options,
    questionType: question.questionType,
    difficulty: question.difficulty,
    topic: question.topic || 'General',
    document: question.document,
    documentName: question.sourceChunks?.[0]?.documentName || null
  };
};

/**
 * Normalizes answer text for safe deterministic comparison
 *
 * @param {string} text
 * @returns {string}
 */
export const normalizeAnswer = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Creates a new Quiz from existing validated Question Bank records
 *
 * @param {Object} params - { moduleId, documentId, questionType, difficulty, count, randomized, timeLimitSeconds, user }
 * @returns {Promise<{ quiz: Object, questions: Array<Object> }>}
 */
export const createQuiz = async ({
  moduleId,
  documentId,
  questionType = 'ALL',
  difficulty = 'ALL',
  count = 10,
  randomized = true,
  timeLimitSeconds,
  user
}) => {
  // 1. Authenticate user
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  // 2. Validate moduleId
  if (!moduleId || typeof moduleId !== 'string' || !mongoose.Types.ObjectId.isValid(moduleId)) {
    const error = new Error('Invalid module ID format');
    error.code = 'INVALID_MODULE_ID';
    error.statusCode = 400;
    throw error;
  }

  const courseModule = await Module.findById(moduleId);
  if (!courseModule) {
    const error = new Error('Module not found');
    error.code = 'MODULE_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // 3. Check student module enrollment authorization
  if (user.role === 'student') {
    const enrolled = user.enrolledModules || [];
    const isEnrolled = enrolled.some((id) => id.toString() === moduleId.toString());
    if (!isEnrolled) {
      const error = new Error('Access denied: You are not enrolled in this module');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }
  }

  // 4. Validate documentId if provided
  let docObj = null;
  if (documentId) {
    if (typeof documentId !== 'string' || !mongoose.Types.ObjectId.isValid(documentId)) {
      const error = new Error('Invalid document ID format');
      error.code = 'INVALID_DOCUMENT_ID';
      error.statusCode = 400;
      throw error;
    }

    docObj = await Document.findById(documentId);
    if (!docObj) {
      const error = new Error('Document not found');
      error.code = 'DOCUMENT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (docObj.module.toString() !== moduleId.toString()) {
      const error = new Error('Document does not belong to the specified module');
      error.code = 'DOCUMENT_MODULE_MISMATCH';
      error.statusCode = 400;
      throw error;
    }
  }

  // 5. Validate question count
  const numCount = Number(count);
  if (!Number.isInteger(numCount) || numCount < 1 || numCount > 50) {
    const error = new Error('Invalid count. Must be an integer between 1 and 50.');
    error.code = 'INVALID_COUNT';
    error.statusCode = 400;
    throw error;
  }

  // 6. Validate questionType and difficulty
  const allowedTypes = ['ALL', 'MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'SCENARIO'];
  if (!allowedTypes.includes(questionType)) {
    const error = new Error(`Invalid questionType. Allowed values: ${allowedTypes.join(', ')}`);
    error.code = 'INVALID_QUESTION_TYPE';
    error.statusCode = 400;
    throw error;
  }

  const validDiffs = ['ALL', '2', '3', '4', 2, 3, 4];
  if (!validDiffs.includes(difficulty)) {
    const error = new Error('Invalid difficulty. Allowed values: ALL, 2, 3, 4.');
    error.code = 'INVALID_DIFFICULTY';
    error.statusCode = 400;
    throw error;
  }

  // 7. Query active Question Bank records
  const questionQuery = {
    module: moduleId,
    isActive: true
  };

  if (documentId) {
    questionQuery.document = documentId;
  }

  if (questionType && questionType !== 'ALL') {
    questionQuery.questionType = questionType;
  }

  if (difficulty && difficulty !== 'ALL') {
    questionQuery.difficulty = Number(difficulty);
  }

  const matchingQuestions = await Question.find(questionQuery).lean();

  if (matchingQuestions.length < numCount) {
    const error = new Error(
      `Not enough questions available. Requested ${numCount}, but only ${matchingQuestions.length} are available.`
    );
    error.code = 'INSUFFICIENT_QUESTIONS';
    error.statusCode = 400;
    error.available = matchingQuestions.length;
    error.requested = numCount;
    throw error;
  }

  // 8. Randomly select questions
  const selectedQuestions = [...matchingQuestions]
    .sort(() => Math.random() - 0.5)
    .slice(0, numCount);

  const questionIds = selectedQuestions.map((q) => q._id);

  // 9. Generate title
  const targetName = docObj ? docObj.originalName : courseModule.moduleCode;
  const title = `${targetName} Quiz (${selectedQuestions.length} Questions)`;

  // 10. Persist Quiz record
  const quiz = await Quiz.create({
    title,
    module: courseModule._id,
    document: docObj ? docObj._id : null,
    createdBy: user._id,
    questionIds,
    questionCount: selectedQuestions.length,
    questionType: questionType || 'ALL',
    difficulty: difficulty ? difficulty.toString() : 'ALL',
    randomized: Boolean(randomized),
    timeLimitSeconds: timeLimitSeconds ? Number(timeLimitSeconds) : null,
    status: 'active'
  });

  // 11. Secure serialization (EXCLUDES correct answers and explanations)
  const secureQuestions = selectedQuestions.map((q) => toQuizQuestion(q, randomized));

  return {
    quiz,
    questions: secureQuestions
  };
};

/**
 * Retrieves a Quiz by ID with secure question payloads
 *
 * @param {Object} params - { quizId, user }
 * @returns {Promise<{ quiz: Object, questions: Array<Object> }>}
 */
export const getQuizById = async ({ quizId, user }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  if (!quizId || typeof quizId !== 'string' || !mongoose.Types.ObjectId.isValid(quizId)) {
    const error = new Error('Invalid quiz ID format');
    error.code = 'INVALID_QUIZ_ID';
    error.statusCode = 400;
    throw error;
  }

  const quiz = await Quiz.findById(quizId)
    .populate('module', 'moduleCode moduleName')
    .populate('document', 'originalName');

  if (!quiz) {
    const error = new Error('Quiz not found');
    error.code = 'QUIZ_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Check enrollment
  if (user.role === 'student') {
    const enrolled = user.enrolledModules || [];
    const modId = quiz.module?._id || quiz.module;
    const isEnrolled = enrolled.some((id) => id.toString() === modId.toString());
    if (!isEnrolled) {
      const error = new Error('Access denied: You are not enrolled in this module');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }
  }

  const rawQuestions = await Question.find({
    _id: { $in: quiz.questionIds },
    isActive: true
  }).lean();

  const secureQuestions = rawQuestions.map((q) => toQuizQuestion(q, quiz.randomized));

  return {
    quiz,
    questions: secureQuestions
  };
};

/**
 * Starts or resumes a quiz attempt for a student
 * Prevents accidental duplicate concurrent active attempts.
 *
 * @param {Object} params - { quizId, user }
 * @returns {Promise<{ attempt: Object, questions: Array<Object>, isResumed: boolean }>}
 */
export const startQuizAttempt = async ({ quizId, user }) => {
  const { quiz, questions } = await getQuizById({ quizId, user });

  // Check for an existing in_progress attempt
  const existingAttempt = await QuizAttempt.findOne({
    quiz: quiz._id,
    student: user._id,
    status: 'in_progress'
  });

  if (existingAttempt) {
    return {
      attempt: existingAttempt,
      questions,
      isResumed: true
    };
  }

  // Create new QuizAttempt
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student: user._id,
    module: quiz.module?._id || quiz.module,
    document: quiz.document?._id || quiz.document,
    startedAt: new Date(),
    status: 'in_progress',
    totalQuestions: quiz.questionCount
  });

  return {
    attempt,
    questions,
    isResumed: false
  };
};

/**
 * Submits answers for a quiz attempt and performs rigorous server-side evaluation
 *
 * @param {Object} params - { attemptId, answers, user }
 * @returns {Promise<Object>} Evaluated quiz result payload
 */
export const submitQuizAttempt = async ({ attemptId, answers = [], user }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  if (!attemptId || typeof attemptId !== 'string' || !mongoose.Types.ObjectId.isValid(attemptId)) {
    const error = new Error('Invalid attempt ID format');
    error.code = 'INVALID_ATTEMPT_ID';
    error.statusCode = 400;
    throw error;
  }

  const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
  if (!attempt) {
    const error = new Error('Quiz attempt not found');
    error.code = 'ATTEMPT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Check student ownership: Only attempt owner can submit
  if (attempt.student.toString() !== user._id.toString()) {
    const error = new Error('Access denied: You cannot submit another student\'s quiz attempt');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  // Ensure attempt is in_progress
  if (attempt.status === 'completed') {
    const error = new Error('Completed quiz attempts cannot be submitted again');
    error.code = 'ATTEMPT_ALREADY_COMPLETED';
    error.statusCode = 400;
    throw error;
  }

  if (attempt.status === 'abandoned') {
    const error = new Error('Abandoned quiz attempts cannot be submitted');
    error.code = 'ATTEMPT_ABANDONED';
    error.statusCode = 400;
    throw error;
  }

  const quiz = attempt.quiz;
  if (!quiz) {
    const error = new Error('Associated quiz definition not found');
    error.code = 'QUIZ_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Load actual Question records from MongoDB for authoritative server-side scoring
  const rawQuestions = await Question.find({
    _id: { $in: quiz.questionIds }
  }).lean();

  const questionMap = new Map();
  for (const q of rawQuestions) {
    questionMap.set(q._id.toString(), q);
  }

  const submittedList = Array.isArray(answers) ? answers : [];
  const submittedMap = new Map();
  for (const item of submittedList) {
    if (item && item.questionId) {
      submittedMap.set(item.questionId.toString(), item.selectedAnswer);
    }
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let answeredCount = 0;

  const recordedAnswers = [];
  const detailedResults = [];

  for (const qIdObj of quiz.questionIds) {
    const qIdStr = qIdObj.toString();
    const question = questionMap.get(qIdStr);
    if (!question) continue;

    const rawSelected = submittedMap.get(qIdStr);
    const selectedAnswer = typeof rawSelected === 'string' ? rawSelected.trim() : '';

    let isCorrect = false;
    let requiresReview = false;

    if (selectedAnswer.length > 0) {
      answeredCount++;

      // Server-side scoring according to questionType
      if (question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE') {
        if (selectedAnswer.toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
          isCorrect = true;
        }
      } else if (question.questionType === 'SHORT_ANSWER') {
        const normSelected = normalizeAnswer(selectedAnswer);
        const normExpected = normalizeAnswer(question.correctAnswer);
        if (normSelected === normExpected) {
          isCorrect = true;
        } else {
          requiresReview = false;
        }
      } else if (question.questionType === 'SCENARIO') {
        if (Array.isArray(question.options) && question.options.length > 0) {
          if (selectedAnswer.toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
            isCorrect = true;
          }
        } else {
          const normSelected = normalizeAnswer(selectedAnswer);
          const normExpected = normalizeAnswer(question.correctAnswer);
          if (normSelected === normExpected) {
            isCorrect = true;
          }
        }
      }

      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    } else {
      // Unanswered question counts as incorrect
      incorrectCount++;
    }

    recordedAnswers.push({
      question: question._id,
      selectedAnswer,
      isCorrect,
      requiresReview,
      answeredAt: new Date()
    });

    // Detailed result revealed strictly AFTER submission
    detailedResults.push({
      questionId: question._id,
      questionText: question.questionText,
      options: question.options,
      questionType: question.questionType,
      difficulty: question.difficulty,
      selectedAnswer,
      correctAnswer: question.correctAnswer, // REVEALED HERE
      isCorrect,
      requiresReview,
      explanation: question.explanation,     // REVEALED HERE
      examClue: question.examClue,           // REVEALED HERE
      commonTrap: question.commonTrap,       // REVEALED HERE
      topic: question.topic,
      sourceChunks: question.sourceChunks
    });
  }

  const totalQuestions = quiz.questionCount || quiz.questionIds.length;
  const score = correctCount;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const now = new Date();
  const timeSpentSeconds = Math.max(0, Math.round((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000));

  // Update and finalize QuizAttempt
  attempt.status = 'completed';
  attempt.submittedAt = now;
  attempt.totalQuestions = totalQuestions;
  attempt.answeredQuestions = answeredCount;
  attempt.correctAnswers = correctCount;
  attempt.incorrectAnswers = totalQuestions - correctCount;
  attempt.score = score;
  attempt.percentage = percentage;
  attempt.timeSpentSeconds = timeSpentSeconds;
  attempt.answers = recordedAnswers;
  await attempt.save();

  return {
    attemptId: attempt._id,
    totalQuestions,
    answeredQuestions: answeredCount,
    correctAnswers: correctCount,
    incorrectAnswers: totalQuestions - correctCount,
    unanswered: totalQuestions - answeredCount,
    score,
    percentage,
    timeSpentSeconds,
    results: detailedResults
  };
};

/**
 * Retrieves past quiz attempts for a student
 *
 * @param {Object} params - { user, moduleId, documentId, status }
 * @returns {Promise<Array<Object>>}
 */
export const getQuizAttemptHistory = async ({ user, moduleId, documentId, status }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  const filter = {
    student: user._id
  };

  if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
    filter.module = moduleId;
  }

  if (documentId && mongoose.Types.ObjectId.isValid(documentId)) {
    filter.document = documentId;
  }

  if (status && ['in_progress', 'completed', 'abandoned'].includes(status)) {
    filter.status = status;
  }

  const attempts = await QuizAttempt.find(filter)
    .sort({ createdAt: -1 })
    .populate('quiz', 'title questionCount questionType difficulty')
    .populate('module', 'moduleCode moduleName')
    .populate('document', 'originalName')
    .lean();

  return attempts;
};

/**
 * Retrieves a single quiz attempt by ID
 * For completed attempts: returns detailed results including explanations and answers.
 * For in-progress attempts: strictly returns quiz-safe questions without answers.
 *
 * @param {Object} params - { attemptId, user }
 * @returns {Promise<Object>}
 */
export const getQuizAttemptById = async ({ attemptId, user }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  if (!attemptId || typeof attemptId !== 'string' || !mongoose.Types.ObjectId.isValid(attemptId)) {
    const error = new Error('Invalid attempt ID format');
    error.code = 'INVALID_ATTEMPT_ID';
    error.statusCode = 400;
    throw error;
  }

  const attempt = await QuizAttempt.findById(attemptId)
    .populate('quiz')
    .populate('module', 'moduleCode moduleName')
    .populate('document', 'originalName');

  if (!attempt) {
    const error = new Error('Quiz attempt not found');
    error.code = 'ATTEMPT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: Students can view only their own attempts; Admin has global inspection
  if (user.role === 'student' && attempt.student.toString() !== user._id.toString()) {
    const error = new Error('Access denied: You cannot view another student\'s quiz attempt');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  // If completed, reconstruct detailed review
  if (attempt.status === 'completed') {
    const rawQuestions = await Question.find({
      _id: { $in: attempt.quiz.questionIds }
    }).lean();

    const qMap = new Map();
    for (const q of rawQuestions) {
      qMap.set(q._id.toString(), q);
    }

    const recordedMap = new Map();
    for (const ans of attempt.answers || []) {
      recordedMap.set(ans.question.toString(), ans);
    }

    const results = [];
    for (const qId of attempt.quiz.questionIds) {
      const q = qMap.get(qId.toString());
      if (!q) continue;

      const userAns = recordedMap.get(qId.toString());

      results.push({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        questionType: q.questionType,
        difficulty: q.difficulty,
        selectedAnswer: userAns?.selectedAnswer || '',
        correctAnswer: q.correctAnswer, // REVEALED IN COMPLETED ATTEMPT
        isCorrect: userAns?.isCorrect ?? false,
        requiresReview: userAns?.requiresReview ?? false,
        explanation: q.explanation,     // REVEALED IN COMPLETED ATTEMPT
        examClue: q.examClue,           // REVEALED IN COMPLETED ATTEMPT
        commonTrap: q.commonTrap,       // REVEALED IN COMPLETED ATTEMPT
        topic: q.topic,
        sourceChunks: q.sourceChunks
      });
    }

    return {
      attempt,
      results
    };
  }

  // If in_progress: NEVER expose correct answers!
  if (attempt.status === 'in_progress') {
    const rawQuestions = await Question.find({
      _id: { $in: attempt.quiz.questionIds },
      isActive: true
    }).lean();

    const secureQuestions = rawQuestions.map((q) => toQuizQuestion(q, attempt.quiz.randomized));

    return {
      attempt,
      questions: secureQuestions
    };
  }

  // Abandoned
  return {
    attempt
  };
};

/**
 * Abandons an in-progress quiz attempt
 *
 * @param {Object} params - { attemptId, user }
 * @returns {Promise<Object>} Updated attempt
 */
export const abandonQuizAttempt = async ({ attemptId, user }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  if (!attemptId || typeof attemptId !== 'string' || !mongoose.Types.ObjectId.isValid(attemptId)) {
    const error = new Error('Invalid attempt ID format');
    error.code = 'INVALID_ATTEMPT_ID';
    error.statusCode = 400;
    throw error;
  }

  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    const error = new Error('Quiz attempt not found');
    error.code = 'ATTEMPT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'student' && attempt.student.toString() !== user._id.toString()) {
    const error = new Error('Access denied: You cannot abandon another student\'s quiz attempt');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  if (attempt.status !== 'in_progress') {
    const error = new Error('Only in-progress quiz attempts can be abandoned');
    error.code = 'CANNOT_ABANDON';
    error.statusCode = 400;
    throw error;
  }

  attempt.status = 'abandoned';
  await attempt.save();

  return attempt;
};

/**
 * Deletes a Quiz (Admin only)
 *
 * @param {Object} params - { quizId, user }
 * @returns {Promise<Object>} Deleted quiz
 */
export const deleteQuiz = async ({ quizId, user }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  if (user.role !== 'admin') {
    const error = new Error('Access denied: Only administrators can delete quizzes');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  if (!quizId || typeof quizId !== 'string' || !mongoose.Types.ObjectId.isValid(quizId)) {
    const error = new Error('Invalid quiz ID format');
    error.code = 'INVALID_QUIZ_ID';
    error.statusCode = 400;
    throw error;
  }

  const quiz = await Quiz.findByIdAndDelete(quizId);
  if (!quiz) {
    const error = new Error('Quiz not found');
    error.code = 'QUIZ_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  // Clean up in-progress attempts for this deleted quiz
  await QuizAttempt.deleteMany({ quiz: quizId, status: 'in_progress' });

  return quiz;
};
