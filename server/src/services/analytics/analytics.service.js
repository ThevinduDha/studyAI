import mongoose from 'mongoose';
import QuizAttempt from '../../models/quizAttempt.model.js';
import Module from '../../models/module.model.js';
import Question from '../../models/question.model.js';
import { getClient } from '../ai/embedding.service.js';

const GENERATION_MODEL = process.env.GEMINI_GENERATION_MODEL || 'gemini-3.8-flash';

/**
 * StudyAI — Student Performance Analytics & Weak-Topic Intelligence Service (Phase 11)
 *
 * Deterministic analytics engine operating on trusted MongoDB QuizAttempt and Question records.
 * Provides:
 * - Overall performance metrics & trends
 * - Module-level mastery
 * - Topic-level strengths & weaknesses
 * - Difficulty & Question Type breakdowns
 * - Priority-scored weak topic ranking
 * - Rule-based revision recommendations
 * - Frequently missed question analysis
 * - Optional AI study advice
 */

// Classification Thresholds
export const THRESHOLDS = {
  STRONG_ACCURACY: 80,
  AVERAGE_ACCURACY: 60,
  MIN_ATTEMPTS_FOR_STATS: 3,
  TREND_DELTA_THRESHOLD: 5
};

/**
 * Helper: Safely calculate percentage with zero-division guard
 */
const safePercentage = (numerator, denominator) => {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
};

/**
 * Helper: Calculate performance trend across chronological attempts
 *
 * Algorithm:
 * - If N < 3: insufficient_data
 * - If N >= 6: compare last 3 attempts against previous 3 attempts
 * - If 3 <= N < 6: compare last floor(N/2) attempts against first floor(N/2) attempts
 * - Delta = recentAverage - baselineAverage
 * - Delta >= +5%: improving
 * - Delta <= -5%: declining
 * - Else: stable
 */
export const calculateTrend = (completedAttempts) => {
  const n = completedAttempts.length;
  if (n < THRESHOLDS.MIN_ATTEMPTS_FOR_STATS) {
    return {
      trend: 'insufficient_data',
      delta: 0,
      recentAverage: 0,
      baselineAverage: 0,
      reason: 'Complete at least 3 quizzes to determine performance trend'
    };
  }

  let baselineWindow = [];
  let recentWindow = [];

  if (n >= 6) {
    baselineWindow = completedAttempts.slice(n - 6, n - 3);
    recentWindow = completedAttempts.slice(n - 3);
  } else {
    const mid = Math.floor(n / 2);
    baselineWindow = completedAttempts.slice(0, mid);
    recentWindow = completedAttempts.slice(n - mid);
  }

  const baselineSum = baselineWindow.reduce((acc, a) => acc + (a.percentage || 0), 0);
  const baselineAverage = Math.round(baselineSum / (baselineWindow.length || 1));

  const recentSum = recentWindow.reduce((acc, a) => acc + (a.percentage || 0), 0);
  const recentAverage = Math.round(recentSum / (recentWindow.length || 1));

  const delta = recentAverage - baselineAverage;

  if (delta >= THRESHOLDS.TREND_DELTA_THRESHOLD) {
    return {
      trend: 'improving',
      delta,
      recentAverage,
      baselineAverage,
      reason: `Recent quiz accuracy has improved by ${delta}% compared to baseline.`
    };
  }

  if (delta <= -THRESHOLDS.TREND_DELTA_THRESHOLD) {
    return {
      trend: 'declining',
      delta,
      recentAverage,
      baselineAverage,
      reason: `Recent quiz accuracy has dropped by ${Math.abs(delta)}% compared to baseline.`
    };
  }

  return {
    trend: 'stable',
    delta,
    recentAverage,
    baselineAverage,
    reason: `Performance remains consistent (${delta >= 0 ? '+' : ''}${delta}% delta).`
  };
};

/**
 * Helper: Classify accuracy status based on thresholds
 */
export const classifyStatus = (accuracy, sampleSize) => {
  if (sampleSize < THRESHOLDS.MIN_ATTEMPTS_FOR_STATS) {
    return 'INSUFFICIENT_DATA';
  }
  if (accuracy >= THRESHOLDS.STRONG_ACCURACY) {
    return 'STRONG';
  }
  if (accuracy >= THRESHOLDS.AVERAGE_ACCURACY) {
    return 'AVERAGE';
  }
  return 'WEAK';
};

/**
 * Helper: Calculate weak topic priority score
 *
 * Official Formula:
 * priorityScore = (errorRate * 0.5) + (normalizedMistakes * 0.3) + (normalizedDifficulty * 0.2)
 *
 * Exact Normalization Details:
 * 1. errorRate:
 *    errorRate = (totalQuestions - correct) / totalQuestions
 *    Clamped to [0.0, 1.0]. Represents the proportion of incorrect responses.
 *
 * 2. normalizedMistakes:
 *    Mistakes are normalized to [0.0, 1.0].
 *    If maxMistakes across candidate topics is provided and exceeds the standard reference threshold (10),
 *    normalizedMistakes = Math.min(1.0, Math.max(0.0, incorrect / maxMistakes)).
 *    Otherwise, uses standard reference scale of 10 mistakes: Math.min(1.0, Math.max(0.0, incorrect / 10)).
 *    This ensures single isolated errors do not erroneously saturate to 1.0 while guaranteeing [0.0, 1.0] bounds.
 *
 * 3. normalizedDifficulty:
 *    Question difficulty levels in StudyAI are defined as 2 (Basic), 3 (Moderate), and 4 (Scenario).
 *    normalizedDifficulty = Math.min(1.0, Math.max(0.0, (avgDifficulty - 2) / (4 - 2))) = (avgDifficulty - 2) / 2.
 *    Difficulty 2 maps to 0.0, Difficulty 3 maps to 0.5, Difficulty 4 maps to 1.0.
 *
 * Weighting:
 * - Error rate (50%): primary indicator of struggling comprehension.
 * - Normalized mistake count (30%): accounts for sample size / volume of recurring errors.
 * - Normalized difficulty (20%): weights higher-order conceptual failure.
 */
export const calculateTopicPriority = ({
  accuracy,
  totalQuestions,
  correct,
  incorrect,
  avgDifficulty,
  maxMistakes = null
}) => {
  const errorRate = totalQuestions > 0 ? Math.max(0, Math.min(1, (totalQuestions - correct) / totalQuestions)) : 0;
  const mistakeScale = maxMistakes && maxMistakes > 10 ? maxMistakes : 10;
  const normalizedMistakes = Math.min(1.0, Math.max(0.0, incorrect / mistakeScale));
  const normalizedDifficulty = Math.min(1.0, Math.max(0.0, (avgDifficulty - 2) / 2));

  const priorityScore = Number(
    ((errorRate * 0.5) + (normalizedMistakes * 0.3) + (normalizedDifficulty * 0.2)).toFixed(3)
  );

  let priority = 'LOW';
  if (priorityScore >= 0.55) {
    priority = 'HIGH';
  } else if (priorityScore >= 0.35) {
    priority = 'MEDIUM';
  }

  return {
    priorityScore,
    priority,
    errorRate: Number(errorRate.toFixed(3)),
    normalizedMistakes: Number(normalizedMistakes.toFixed(3)),
    normalizedDifficulty: Number(normalizedDifficulty.toFixed(3))
  };
};

/**
 * Retrieve Overview Analytics for Authenticated Student
 */
export const getStudentOverviewAnalytics = async ({ user, targetStudentId }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  // Authorization: Student can ONLY view their own data
  let studentId = user._id;
  if (user.role === 'admin' && targetStudentId) {
    if (!mongoose.Types.ObjectId.isValid(targetStudentId)) {
      const error = new Error('Invalid student ID format');
      error.code = 'INVALID_ID';
      error.statusCode = 400;
      throw error;
    }
    studentId = targetStudentId;
  }

  // Query completed attempts only, sorted chronologically
  const attempts = await QuizAttempt.find({
    student: studentId,
    status: 'completed'
  })
    .sort({ submittedAt: 1 })
    .populate('quiz', 'title')
    .populate('module', 'moduleCode moduleName')
    .populate({
      path: 'answers.question',
      select: 'questionText topic difficulty questionType module document sourceChunks'
    })
    .lean();

  const totalQuizzes = attempts.length;

  // Handle empty state gracefully
  if (totalQuizzes === 0) {
    return {
      hasData: false,
      overview: {
        totalQuizzesCompleted: 0,
        totalQuestionsAttempted: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalUnanswered: 0,
        overallAccuracy: 0,
        averageQuizScore: 0,
        averageQuizPercentage: 0,
        bestQuizScore: 0,
        worstQuizScore: 0,
        bestQuizPercentage: 0,
        worstQuizPercentage: 0,
        totalTimeSpent: 0,
        averageTimePerQuestion: 0,
        averageTimePerQuiz: 0
      },
      trend: {
        trend: 'insufficient_data',
        delta: 0,
        recentAverage: 0,
        baselineAverage: 0,
        reason: 'No completed quizzes found'
      },
      recentPerformance: [],
      modulePerformance: [],
      topicPerformance: [],
      difficultyPerformance: [
        { difficulty: 2, label: 'Level 2: Basic Understanding', attempted: 0, total: 0, correct: 0, incorrect: 0, accuracy: 0, status: 'insufficient_data' },
        { difficulty: 3, label: 'Level 3: Application / Moderate', attempted: 0, total: 0, correct: 0, incorrect: 0, accuracy: 0, status: 'insufficient_data' },
        { difficulty: 4, label: 'Level 4: Scenario / Higher-order', attempted: 0, total: 0, correct: 0, incorrect: 0, accuracy: 0, status: 'insufficient_data' }
      ],
      questionTypePerformance: [
        { questionType: 'MCQ', attempted: 0, total: 0, correct: 0, incorrect: 0, accuracy: 0 },
        { questionType: 'TRUE_FALSE', attempted: 0, total: 0, correct: 0, incorrect: 0, accuracy: 0 },
        { questionType: 'SHORT_ANSWER', attempted: 0, total: 0, correct: 0, incorrect: 0, accuracy: 0 },
        { questionType: 'SCENARIO', attempted: 0, total: 0, correct: 0, incorrect: 0, accuracy: 0 }
      ],
      weakestQuestionType: null,
      weakTopics: [],
      frequentlyMissedQuestions: [],
      recommendations: [
        'Complete your first quiz to unlock personalized performance analytics and weak-topic intelligence.'
      ]
    };
  }

  // 1. Calculate Aggregate Overview
  let totalQuestions = 0;
  let totalQuestionsAttempted = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalTimeSpent = 0;
  const scores = [];
  const percentages = [];

  // Data aggregators
  const moduleMap = new Map();
  const topicMap = new Map();
  const diffMap = {
    2: { attempted: 0, total: 0, correct: 0, incorrect: 0 },
    3: { attempted: 0, total: 0, correct: 0, incorrect: 0 },
    4: { attempted: 0, total: 0, correct: 0, incorrect: 0 }
  };
  const typeMap = {
    MCQ: { attempted: 0, total: 0, correct: 0, incorrect: 0 },
    TRUE_FALSE: { attempted: 0, total: 0, correct: 0, incorrect: 0 },
    SHORT_ANSWER: { attempted: 0, total: 0, correct: 0, incorrect: 0 },
    SCENARIO: { attempted: 0, total: 0, correct: 0, incorrect: 0 }
  };
  const questionMissMap = new Map();

  for (const attempt of attempts) {
    totalQuestions += attempt.totalQuestions || 0;
    totalQuestionsAttempted += attempt.answeredQuestions || 0;
    totalCorrect += attempt.correctAnswers || 0;
    totalIncorrect += attempt.incorrectAnswers || 0;
    totalTimeSpent += attempt.timeSpentSeconds || 0;
    scores.push(attempt.score || 0);
    percentages.push(attempt.percentage || 0);

    // Module aggregation
    const modId = attempt.module?._id ? attempt.module._id.toString() : (attempt.module ? attempt.module.toString() : 'unknown');
    if (!moduleMap.has(modId)) {
      moduleMap.set(modId, {
        moduleId: modId,
        moduleCode: attempt.module?.moduleCode || 'MODULE',
        moduleName: attempt.module?.moduleName || 'Course Module',
        quizzesCompleted: 0,
        totalQuestions: 0,
        questionsAttempted: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalScore: 0,
        totalPercentage: 0,
        totalTimeSpent: 0
      });
    }
    const modData = moduleMap.get(modId);
    modData.quizzesCompleted += 1;
    modData.totalQuestions += attempt.totalQuestions || 0;
    modData.questionsAttempted += attempt.answeredQuestions || 0;
    modData.correctAnswers += attempt.correctAnswers || 0;
    modData.incorrectAnswers += attempt.incorrectAnswers || 0;
    modData.totalScore += attempt.score || 0;
    modData.totalPercentage += attempt.percentage || 0;
    modData.totalTimeSpent += attempt.timeSpentSeconds || 0;

    // Inspect individual answers
    const answers = attempt.answers || [];
    for (const ans of answers) {
      const q = ans.question;
      if (!q) continue; // Question might have been deleted

      const topicName = (q.topic || 'Core Concept').trim();
      const difficulty = Number(q.difficulty) || 3;
      const qType = q.questionType || 'MCQ';
      const isAttempted = Boolean(ans.selectedAnswer && ans.selectedAnswer.trim() !== '');
      const isCorrect = Boolean(ans.isCorrect);

      // Topic aggregation
      if (!topicMap.has(topicName)) {
        topicMap.set(topicName, {
          topic: topicName,
          moduleId: attempt.module?._id ? attempt.module._id.toString() : modId,
          moduleCode: attempt.module?.moduleCode || 'MODULE',
          totalQuestions: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          difficultySum: 0,
          questionTypes: new Set()
        });
      }
      const topData = topicMap.get(topicName);
      topData.totalQuestions += 1;
      topData.difficultySum += difficulty;
      topData.questionTypes.add(qType);
      if (isAttempted) {
        topData.attempted += 1;
      }
      if (isCorrect) {
        topData.correct += 1;
      } else {
        topData.incorrect += 1;
      }

      // Difficulty aggregation
      if (diffMap[difficulty]) {
        diffMap[difficulty].total += 1;
        if (isAttempted) diffMap[difficulty].attempted += 1;
        if (isCorrect) diffMap[difficulty].correct += 1;
        else diffMap[difficulty].incorrect += 1;
      }

      // Question Type aggregation
      if (typeMap[qType]) {
        typeMap[qType].total += 1;
        if (isAttempted) typeMap[qType].attempted += 1;
        if (isCorrect) typeMap[qType].correct += 1;
        else typeMap[qType].incorrect += 1;
      }

      // Question error tracking
      const qId = q._id ? q._id.toString() : q.toString();
      if (!questionMissMap.has(qId)) {
        questionMissMap.set(qId, {
          questionId: qId,
          questionText: q.questionText || 'Practice question',
          topic: topicName,
          difficulty,
          questionType: qType,
          moduleCode: attempt.module?.moduleCode || 'MODULE',
          timesAttempted: 0,
          timesCorrect: 0,
          timesIncorrect: 0,
          lastAttemptedAt: attempt.submittedAt
        });
      }
      const missData = questionMissMap.get(qId);
      missData.timesAttempted += 1;
      if (isCorrect) {
        missData.timesCorrect += 1;
      } else {
        missData.timesIncorrect += 1;
      }
      if (new Date(attempt.submittedAt) > new Date(missData.lastAttemptedAt)) {
        missData.lastAttemptedAt = attempt.submittedAt;
      }
    }
  }

  const totalUnanswered = Math.max(0, totalQuestions - totalQuestionsAttempted);
  const overallAccuracy = safePercentage(totalCorrect, totalQuestions);
  const averageQuizScore = Number((scores.reduce((a, b) => a + b, 0) / totalQuizzes).toFixed(1));
  const averageQuizPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / totalQuizzes);
  const bestQuizScore = Math.max(...scores);
  const worstQuizScore = Math.min(...scores);
  const bestQuizPercentage = Math.max(...percentages);
  const worstQuizPercentage = Math.min(...percentages);
  const averageTimePerQuestion = totalQuestionsAttempted > 0 ? Math.round(totalTimeSpent / totalQuestionsAttempted) : 0;
  const averageTimePerQuiz = Math.round(totalTimeSpent / totalQuizzes);

  // 2. Recent Performance
  const recentPerformance = attempts.slice(-10).map((a) => ({
    attemptId: a._id,
    quizId: a.quiz?._id || a.quiz,
    quizTitle: a.quiz?.title || 'Practice Quiz',
    moduleId: a.module?._id || a.module,
    moduleCode: a.module?.moduleCode || 'MODULE',
    moduleName: a.module?.moduleName || 'Course Module',
    score: a.score || 0,
    totalQuestions: a.totalQuestions || 0,
    percentage: a.percentage || 0,
    timeSpentSeconds: a.timeSpentSeconds || 0,
    submittedAt: a.submittedAt
  }));

  // 3. Trend
  const trend = calculateTrend(attempts);

  // 4. Module Performance List
  const modulePerformance = Array.from(moduleMap.values()).map((m) => {
    const accuracy = safePercentage(m.correctAnswers, m.totalQuestions);
    return {
      moduleId: m.moduleId,
      moduleCode: m.moduleCode,
      moduleName: m.moduleName,
      quizzesCompleted: m.quizzesCompleted,
      questionsAttempted: m.questionsAttempted,
      totalQuestions: m.totalQuestions,
      correctAnswers: m.correctAnswers,
      incorrectAnswers: m.incorrectAnswers,
      unanswered: Math.max(0, m.totalQuestions - m.questionsAttempted),
      accuracy,
      averageScore: Number((m.totalScore / m.quizzesCompleted).toFixed(1)),
      averagePercentage: Math.round(m.totalPercentage / m.quizzesCompleted),
      totalTimeSpent: m.totalTimeSpent,
      averageTimePerQuestion: m.questionsAttempted > 0 ? Math.round(m.totalTimeSpent / m.questionsAttempted) : 0,
      status: classifyStatus(accuracy, m.questionsAttempted).toLowerCase()
    };
  }).sort((a, b) => a.accuracy - b.accuracy); // Weakest modules first

  // 5. Topic Performance List
  const allMistakes = Array.from(topicMap.values()).map((t) => t.incorrect);
  const cohortMaxMistakes = allMistakes.length > 0 ? Math.max(...allMistakes) : 10;

  const topicPerformance = Array.from(topicMap.values()).map((t) => {
    const accuracy = safePercentage(t.correct, t.totalQuestions);
    const avgDifficulty = Number((t.difficultySum / (t.totalQuestions || 1)).toFixed(1));
    const status = classifyStatus(accuracy, t.attempted);
    const { priorityScore, priority, errorRate, normalizedMistakes, normalizedDifficulty } = calculateTopicPriority({
      accuracy,
      totalQuestions: t.totalQuestions,
      correct: t.correct,
      incorrect: t.incorrect,
      avgDifficulty,
      maxMistakes: cohortMaxMistakes
    });

    return {
      topic: t.topic,
      moduleId: t.moduleId,
      moduleCode: t.moduleCode,
      totalQuestions: t.totalQuestions,
      attempted: t.attempted,
      correct: t.correct,
      incorrect: t.incorrect,
      unanswered: Math.max(0, t.totalQuestions - t.attempted),
      accuracy,
      averageDifficulty: avgDifficulty,
      questionTypes: Array.from(t.questionTypes),
      status,
      priorityScore,
      priority,
      errorRate,
      normalizedMistakes,
      normalizedDifficulty
    };
  });

  // 6. Weak Topics Intelligence Ranking
  const weakTopics = topicPerformance
    .filter((t) => t.status === 'WEAK' || (t.accuracy < 70 && t.incorrect > 0) || (t.status === 'AVERAGE' && t.incorrect > 0))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5)
    .map((t) => ({
      topic: t.topic,
      moduleCode: t.moduleCode,
      moduleId: t.moduleId,
      accuracy: t.accuracy,
      attempted: t.attempted,
      totalQuestions: t.totalQuestions,
      incorrect: t.incorrect,
      priority: t.priority,
      priorityScore: t.priorityScore,
      normalizedMistakes: t.normalizedMistakes,
      normalizedDifficulty: t.normalizedDifficulty,
      averageDifficulty: t.averageDifficulty,
      reason: `Accuracy is ${t.accuracy}% with ${t.incorrect} mistakes across Level ${Math.round(t.averageDifficulty)} questions.`,
      recommendation: `Revise lecture content for "${t.topic}" and practice targeted Level ${Math.round(t.averageDifficulty)} questions.`
    }));

  // 7. Difficulty Performance Breakdown
  const difficultyPerformance = [
    {
      difficulty: 2,
      label: 'Level 2: Basic Understanding',
      attempted: diffMap[2].attempted,
      total: diffMap[2].total,
      correct: diffMap[2].correct,
      incorrect: diffMap[2].incorrect,
      accuracy: safePercentage(diffMap[2].correct, diffMap[2].total),
      status: classifyStatus(safePercentage(diffMap[2].correct, diffMap[2].total), diffMap[2].attempted).toLowerCase()
    },
    {
      difficulty: 3,
      label: 'Level 3: Application / Moderate',
      attempted: diffMap[3].attempted,
      total: diffMap[3].total,
      correct: diffMap[3].correct,
      incorrect: diffMap[3].incorrect,
      accuracy: safePercentage(diffMap[3].correct, diffMap[3].total),
      status: classifyStatus(safePercentage(diffMap[3].correct, diffMap[3].total), diffMap[3].attempted).toLowerCase()
    },
    {
      difficulty: 4,
      label: 'Level 4: Scenario / Higher-order',
      attempted: diffMap[4].attempted,
      total: diffMap[4].total,
      correct: diffMap[4].correct,
      incorrect: diffMap[4].incorrect,
      accuracy: safePercentage(diffMap[4].correct, diffMap[4].total),
      status: classifyStatus(safePercentage(diffMap[4].correct, diffMap[4].total), diffMap[4].attempted).toLowerCase()
    }
  ];

  // 8. Question Type Performance Breakdown
  const questionTypePerformance = Object.keys(typeMap).map((k) => {
    const item = typeMap[k];
    const accuracy = safePercentage(item.correct, item.total);
    return {
      questionType: k,
      attempted: item.attempted,
      total: item.total,
      correct: item.correct,
      incorrect: item.incorrect,
      accuracy
    };
  });

  // Identify weakest question type with >= 2 total questions
  const validTypes = questionTypePerformance.filter((t) => t.total >= 2);
  const weakestQuestionType = validTypes.length > 0
    ? validTypes.reduce((prev, curr) => (curr.accuracy < prev.accuracy ? curr : prev)).questionType
    : null;

  // 9. Frequently Missed Questions
  const frequentlyMissedQuestions = Array.from(questionMissMap.values())
    .filter((q) => q.timesIncorrect > 0)
    .map((q) => ({
      ...q,
      accuracy: safePercentage(q.timesCorrect, q.timesAttempted)
    }))
    .sort((a, b) => b.timesIncorrect - a.timesIncorrect || a.accuracy - b.accuracy)
    .slice(0, 10);

  // 10. Synthesize Actionable Deterministic Recommendations
  const recommendations = [];
  if (weakTopics.length > 0) {
    recommendations.push(
      `Prioritize revision for "${weakTopics[0].topic}" (${weakTopics[0].accuracy}% accuracy, ${weakTopics[0].priority} Priority).`
    );
  }

  const diff4 = difficultyPerformance.find((d) => d.difficulty === 4);
  if (diff4 && diff4.total >= 2 && diff4.accuracy < 60) {
    recommendations.push(
      `Strengthen Level 4 scenario and higher-order questions (${diff4.accuracy}% accuracy) before attempting high-stakes mock exams.`
    );
  }

  if (weakestQuestionType) {
    const wt = questionTypePerformance.find((t) => t.questionType === weakestQuestionType);
    if (wt && wt.accuracy < 65) {
      recommendations.push(
        `Practice more ${weakestQuestionType} questions (${wt.accuracy}% accuracy) to build consistent examination technique.`
      );
    }
  }

  if (trend.trend === 'declining') {
    recommendations.push(
      `Your recent scores show a downward trend (${trend.reason}). Review previous errors in Quiz History before taking new quizzes.`
    );
  } else if (trend.trend === 'improving') {
    recommendations.push(
      `Great progress! Your recent scores are trending upward (+${trend.delta}%). Keep maintaining steady daily quiz practice.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain consistent study practice across all enrolled modules to sustain high retention.');
  }

  return {
    hasData: true,
    overview: {
      totalQuizzesCompleted: totalQuizzes,
      totalQuestionsAttempted,
      totalQuestions,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
      overallAccuracy,
      averageQuizScore,
      averageQuizPercentage,
      bestQuizScore,
      worstQuizScore,
      bestQuizPercentage,
      worstQuizPercentage,
      totalTimeSpent,
      averageTimePerQuestion,
      averageTimePerQuiz
    },
    trend,
    recentPerformance,
    modulePerformance,
    topicPerformance,
    difficultyPerformance,
    questionTypePerformance,
    weakestQuestionType,
    weakTopics,
    frequentlyMissedQuestions,
    recommendations
  };
};

/**
 * Retrieve Module-Scoped Analytics for Authenticated Student
 */
export const getModuleAnalytics = async ({ moduleId, user }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
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

  // Student enrollment check
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

  // Query completed attempts for this module and user
  const attempts = await QuizAttempt.find({
    student: user._id,
    module: moduleId,
    status: 'completed'
  })
    .sort({ submittedAt: 1 })
    .populate('quiz', 'title')
    .populate({
      path: 'answers.question',
      select: 'questionText topic difficulty questionType module document'
    })
    .lean();

  if (attempts.length === 0) {
    return {
      module: {
        _id: courseModule._id,
        moduleCode: courseModule.moduleCode,
        moduleName: courseModule.moduleName
      },
      hasData: false,
      overview: {
        totalQuizzes: 0,
        totalQuestions: 0,
        accuracy: 0,
        totalTimeSpent: 0
      },
      topicPerformance: [],
      difficultyPerformance: [],
      questionTypePerformance: [],
      weakTopics: [],
      recentQuizzes: [],
      recommendations: [
        `No quizzes completed yet for ${courseModule.moduleCode}. Start your first quiz from the AI Quiz page.`
      ]
    };
  }

  // Re-use core aggregation logic scoped to this module
  const overall = await getStudentOverviewAnalytics({ user });
  const modOverview = overall.modulePerformance.find((m) => m.moduleId === moduleId.toString()) || null;
  const modTopics = overall.topicPerformance.filter((t) => t.moduleId === moduleId.toString());
  const modWeakTopics = overall.weakTopics.filter((w) => w.moduleId === moduleId.toString());

  const recentQuizzes = attempts.slice(-5).map((a) => ({
    attemptId: a._id,
    title: a.quiz?.title || `${courseModule.moduleCode} Quiz`,
    score: a.score,
    totalQuestions: a.totalQuestions,
    percentage: a.percentage,
    timeSpentSeconds: a.timeSpentSeconds,
    submittedAt: a.submittedAt
  }));

  return {
    module: {
      _id: courseModule._id,
      moduleCode: courseModule.moduleCode,
      moduleName: courseModule.moduleName
    },
    hasData: true,
    overview: modOverview,
    topicPerformance: modTopics,
    difficultyPerformance: overall.difficultyPerformance,
    questionTypePerformance: overall.questionTypePerformance,
    weakTopics: modWeakTopics,
    recentQuizzes,
    recommendations: overall.recommendations
  };
};

/**
 * Retrieve Topic-Scoped Analytics for Authenticated Student
 */
export const getTopicAnalytics = async ({ topic, user }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    const error = new Error('Topic query parameter is required');
    error.code = 'INVALID_TOPIC';
    error.statusCode = 400;
    throw error;
  }

  const decodedTopic = decodeURIComponent(topic).trim();

  // Get full overview to extract topic statistics
  const overview = await getStudentOverviewAnalytics({ user });
  const topicData = overview.topicPerformance.find(
    (t) => t.topic.toLowerCase() === decodedTopic.toLowerCase()
  );

  if (!topicData) {
    return {
      topic: decodedTopic,
      hasData: false,
      message: `No practice question attempts recorded yet for topic: "${decodedTopic}".`,
      totalQuestions: 0,
      accuracy: 0,
      status: 'INSUFFICIENT_DATA',
      frequentlyMissedQuestions: [],
      recommendation: `Attempt practice quizzes covering "${decodedTopic}" to track performance.`
    };
  }

  // Filter missed questions for this topic
  const missedForTopic = overview.frequentlyMissedQuestions.filter(
    (q) => q.topic.toLowerCase() === decodedTopic.toLowerCase()
  );

  return {
    topic: topicData.topic,
    hasData: true,
    performance: topicData,
    frequentlyMissedQuestions: missedForTopic,
    recommendation: topicData.status === 'WEAK'
      ? `High priority: Revise notes on "${topicData.topic}" and review previous incorrect solutions.`
      : topicData.status === 'STRONG'
      ? `Strong mastery in "${topicData.topic}". Continue maintenance revision before finals.`
      : `Moderate performance in "${topicData.topic}". Focus on Level ${Math.round(topicData.averageDifficulty)} questions.`
  };
};

/**
 * Optional AI Study Advice Generator (Gemini 3.8 Flash)
 *
 * Grounded strictly in calculated deterministic analytics.
 * Falls back gracefully to deterministic advice if Gemini fails or is unconfigured.
 */
export const generateAIStudyAdvice = async ({ user, summaryData }) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    throw error;
  }

  let client;
  try {
    client = getClient();
  } catch (clientErr) {
    return {
      source: 'deterministic',
      advice: [
        'Focus on high-priority weak topics identified in your dashboard.',
        'Review missed questions in Quiz History to understand correct explanations.',
        'Practice Level 3 and 4 scenario questions to deepen conceptual application.'
      ]
    };
  }

  try {
    // Construct sanitized analytical payload
    const compactSummary = {
      overallAccuracy: summaryData?.overview?.overallAccuracy || 0,
      trend: summaryData?.trend?.trend || 'insufficient_data',
      weakTopics: (summaryData?.weakTopics || []).map((w) => `${w.topic} (${w.accuracy}%)`).slice(0, 3),
      weakestQuestionType: summaryData?.weakestQuestionType || 'None'
    };

    const prompt = `You are StudyAI, an academic study coach.
Analyze the following student performance summary and provide 3 concise, actionable bullet points to improve their study strategy.

RULES:
- Treat the data strictly as analytical facts.
- Do NOT hallucinate scores, topics, or medical diagnoses.
- Keep each bullet point under 25 words.
- Focus on revision, practice techniques, and active recall.

STUDENT METRICS:
Overall Accuracy: ${compactSummary.overallAccuracy}%
Trend: ${compactSummary.trend}
Weak Topics: ${compactSummary.weakTopics.join(', ') || 'None identified'}
Struggling Question Type: ${compactSummary.weakestQuestionType}

Return a clean JSON array of strings:
["advice 1", "advice 2", "advice 3"]`;

    const response = await client.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text.trim());
    if (Array.isArray(parsed) && parsed.length > 0) {
      return {
        source: 'ai',
        advice: parsed
      };
    }
  } catch (err) {
    console.warn('[StudyAI Analytics] AI advice generation fallback notice:', err.message);
  }

  // Graceful fallback to deterministic recommendations
  return {
    source: 'deterministic',
    advice: [
      'Prioritize high-error topics before moving forward to new lecture material.',
      'Review question explanations and traps in your completed Quiz Review screens.',
      'Maintain regular practice quizzes to improve pacing and long-term retention.'
    ]
  };
};
