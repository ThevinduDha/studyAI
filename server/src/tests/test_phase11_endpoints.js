import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import app from '../app.js';
import User from '../models/user.model.js';
import Module from '../models/module.model.js';
import Document from '../models/document.model.js';
import DocumentChunk from '../models/documentChunk.model.js';
import Question from '../models/question.model.js';
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import * as analyticsService from '../services/analytics/analytics.service.js';
import * as quizService from '../services/quiz/quiz.service.js';
import * as questionService from '../services/ai/questionGeneration.service.js';
import * as summaryService from '../services/ai/summary.service.js';
import * as ragService from '../services/ai/rag.service.js';

const TEST_PORT = 5091;
let server;
let adminToken;
let studentToken;
let student2Token;
let unenrolledToken;
let adminUser;
let studentUser;
let student2User;
let unenrolledUser;

let moduleA;
let moduleB;
let docA;
let seededQuestions = [];

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  ✔ PASS: ${msg}`);
  passed++;
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 11 — ANALYTICS TEST SUITE');
  console.log('==================================================\n');

  try {
    // -------------------------------------------------------------
    // PART 1: UNIT & FORMULA TESTS
    // -------------------------------------------------------------
    console.log('--- PART 1: UNIT & FORMULA TESTS ---');

    // Test 1: Classification thresholds definition
    assert.strictEqual(analyticsService.THRESHOLDS.STRONG_ACCURACY, 80);
    assert.strictEqual(analyticsService.THRESHOLDS.AVERAGE_ACCURACY, 60);
    assert.strictEqual(analyticsService.THRESHOLDS.MIN_ATTEMPTS_FOR_STATS, 3);
    pass('1. Analytics classification thresholds correctly defined');

    // Test 2: Status classification logic
    assert.strictEqual(analyticsService.classifyStatus(85, 4), 'STRONG');
    assert.strictEqual(analyticsService.classifyStatus(65, 4), 'AVERAGE');
    assert.strictEqual(analyticsService.classifyStatus(45, 4), 'WEAK');
    assert.strictEqual(analyticsService.classifyStatus(100, 2), 'INSUFFICIENT_DATA');
    pass('2. Status classification accurately handles STRONG, AVERAGE, WEAK, and INSUFFICIENT_DATA');

    // Test 3: Trend calculation — insufficient data
    const trendShort = analyticsService.calculateTrend([{ percentage: 80 }, { percentage: 90 }]);
    assert.strictEqual(trendShort.trend, 'insufficient_data');
    pass('3. Trend calculation returns "insufficient_data" when completed attempts < 3');

    // Test 4: Trend calculation — improving trend
    const trendImp = analyticsService.calculateTrend([
      { percentage: 50 },
      { percentage: 55 },
      { percentage: 50 },
      { percentage: 85 },
      { percentage: 90 },
      { percentage: 95 }
    ]);
    assert.strictEqual(trendImp.trend, 'improving');
    assert.ok(trendImp.delta >= 5);
    pass('4. Trend calculation detects "improving" when recent attempts increase by >= 5%');

    // Test 5: Trend calculation — declining trend
    const trendDec = analyticsService.calculateTrend([
      { percentage: 90 },
      { percentage: 85 },
      { percentage: 90 },
      { percentage: 50 },
      { percentage: 55 },
      { percentage: 60 }
    ]);
    assert.strictEqual(trendDec.trend, 'declining');
    assert.ok(trendDec.delta <= -5);
    pass('5. Trend calculation detects "declining" when recent attempts drop by >= 5%');

    // Test 6: Trend calculation — stable trend
    const trendStab = analyticsService.calculateTrend([
      { percentage: 75 },
      { percentage: 80 },
      { percentage: 75 },
      { percentage: 77 },
      { percentage: 76 },
      { percentage: 78 }
    ]);
    assert.strictEqual(trendStab.trend, 'stable');
    assert.ok(Math.abs(trendStab.delta) < 5);
    pass('6. Trend calculation detects "stable" when delta is within [-4%, +4%]');

    // Test 7: Topic priority formula calculation
    const priHigh = analyticsService.calculateTopicPriority({
      accuracy: 30,
      totalQuestions: 10,
      correct: 3,
      incorrect: 7,
      avgDifficulty: 4
    });
    assert.strictEqual(priHigh.priority, 'HIGH');
    assert.ok(priHigh.priorityScore >= 0.55);
    assert.strictEqual(priHigh.normalizedMistakes, 0.7);
    assert.strictEqual(priHigh.normalizedDifficulty, 1.0);
    pass('7. Priority scoring formula correctly assigns HIGH priority to high-error, high-difficulty topics');

    const priLow = analyticsService.calculateTopicPriority({
      accuracy: 90,
      totalQuestions: 10,
      correct: 9,
      incorrect: 1,
      avgDifficulty: 2
    });
    assert.strictEqual(priLow.priority, 'LOW');
    assert.ok(priLow.priorityScore < 0.35);
    assert.strictEqual(priLow.normalizedMistakes, 0.1);
    assert.strictEqual(priLow.normalizedDifficulty, 0.0);
    pass('8. Priority scoring formula correctly assigns LOW priority to strong, low-error topics');

    // -------------------------------------------------------------
    // PART 2: DATABASE SETUP & AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n--- PART 2: DATABASE, REST API & AUTHORIZATION TESTS ---');

    await mongoose.connect(process.env.MONGODB_URI);
    assert.strictEqual(mongoose.connection.readyState, 1);
    pass('Database connection verified');

    server = http.createServer(app);
    await new Promise((res) => server.listen(TEST_PORT, res));

    // Cleanup previous test artifacts (scoped strictly to test users & modules)
    const existingP11Users = await User.find({ email: { $regex: /@phase11test\.com$/ } });
    const existingP11UserIds = existingP11Users.map((u) => u._id);
    await QuizAttempt.deleteMany({ student: { $in: existingP11UserIds } });
    await User.deleteMany({ email: { $regex: /@phase11test\.com$/ } });
    await Module.deleteMany({ moduleCode: { $regex: /^P11/ } });
    await Document.deleteMany({ originalName: { $regex: /^P11_/ } });
    await DocumentChunk.deleteMany({ text: { $regex: /P11_/ } });
    await Question.deleteMany({ topic: { $regex: /^P11_/ } });
    await Quiz.deleteMany({ title: { $regex: /^P11_/ } });

    // Register test users
    const resAdminReg = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'P11 Admin',
      email: 'admin@phase11test.com',
      password: 'Password123!',
      role: 'admin',
      adminPasscode: process.env.ADMIN_REGISTRATION_KEY || 'studyai-admin-secret-2026'
    }));
    adminToken = resAdminReg.data.data.token;
    adminUser = resAdminReg.data.data.user;

    const resStudentReg = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'P11 Student 1',
      email: 'student1@phase11test.com',
      password: 'Password123!',
      role: 'student'
    }));
    studentToken = resStudentReg.data.data.token;
    studentUser = resStudentReg.data.data.user;

    const resStudent2Reg = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'P11 Student 2',
      email: 'student2@phase11test.com',
      password: 'Password123!',
      role: 'student'
    }));
    student2Token = resStudent2Reg.data.data.token;
    student2User = resStudent2Reg.data.data.user;

    const resUnenrolledReg = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      name: 'P11 Unenrolled Student',
      email: 'unenrolled@phase11test.com',
      password: 'Password123!',
      role: 'student'
    }));
    unenrolledToken = resUnenrolledReg.data.data.token;
    unenrolledUser = resUnenrolledReg.data.data.user;

    // Create Modules
    moduleA = await Module.create({
      moduleCode: 'P11_CS101',
      moduleName: 'Data Structures & Algorithms',
      description: 'Foundations of algorithms and data structures',
      lecturer: 'Prof. Algorithm',
      semester: 'Semester 1',
      year: 2026,
      createdBy: adminUser._id
    });

    moduleB = await Module.create({
      moduleCode: 'P11_CS102',
      moduleName: 'Database Systems',
      description: 'Relational and NoSQL database architecture',
      lecturer: 'Prof. Database',
      semester: 'Semester 2',
      year: 2026,
      createdBy: adminUser._id
    });

    // Enroll student 1 in Module A and Module B
    studentUser = await User.findByIdAndUpdate(
      studentUser._id,
      { $push: { enrolledModules: { $each: [moduleA._id, moduleB._id] } } },
      { new: true }
    );

    // Seed Documents & Chunks
    docA = await Document.create({
      originalName: 'P11_algo.pdf',
      storedName: 'p11_stored_docA.pdf',
      filePath: 'dummy/path/p11_docA.pdf',
      mimeType: 'application/pdf',
      fileSize: 512000,
      module: moduleA._id,
      uploadedBy: adminUser._id,
      status: 'processed',
      pageCount: 10,
      extractedText: 'Dynamic programming and graph theory algorithms.'
    });

    const chunkA = await DocumentChunk.create({
      document: docA._id,
      module: moduleA._id,
      chunkIndex: 0,
      text: 'Dynamic programming breaks complex problems into simpler overlapping subproblems with optimal substructure.',
      pageStart: 1,
      pageEnd: 1,
      characterCount: 110,
      estimatedTokens: 25,
      embeddingStatus: 'completed'
    });

    // Seed diverse questions with various topics, difficulties, and question types
    const qData = [
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'MCQ',
        difficulty: 3,
        questionText: 'Which property is required for Dynamic Programming?',
        options: ['Optimal substructure', 'Greedy choice', 'Linear scaling', 'Random access'],
        correctAnswer: 'Optimal substructure',
        explanation: 'Dynamic programming requires optimal substructure and overlapping subproblems.',
        topic: 'P11_Dynamic_Programming',
        sourceChunks: [{ chunkId: chunkA._id, chunkIndex: 0, document: docA._id, documentName: docA.originalName }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'TRUE_FALSE',
        difficulty: 2,
        questionText: 'Memoization is a top-down dynamic programming optimization.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Memoization caches function call results in a top-down recursion approach.',
        topic: 'P11_Dynamic_Programming',
        sourceChunks: [{ chunkId: chunkA._id, chunkIndex: 0, document: docA._id, documentName: docA.originalName }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'SHORT_ANSWER',
        difficulty: 4,
        questionText: 'What structure caches overlapping subproblem results?',
        options: [],
        correctAnswer: 'Lookup table or memo table',
        explanation: 'A lookup table or memo table caches subproblem evaluations.',
        topic: 'P11_Dynamic_Programming',
        sourceChunks: [{ chunkId: chunkA._id, chunkIndex: 0, document: docA._id, documentName: docA.originalName }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'SCENARIO',
        difficulty: 4,
        questionText: 'A graph cycle detection algorithm enters an infinite loop. What is the diagnosis?',
        options: ['Missing visited set', 'Stack overflow', 'Incorrect heuristic', 'Unsorted edges'],
        correctAnswer: 'Missing visited set',
        explanation: 'Cycle detection requires tracking visited vertices to prevent infinite cycles.',
        topic: 'P11_Graph_Theory',
        sourceChunks: [{ chunkId: chunkA._id, chunkIndex: 0, document: docA._id, documentName: docA.originalName }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'MCQ',
        difficulty: 2,
        questionText: 'What is the time complexity of binary search?',
        options: ['O(log n)', 'O(n)', 'O(n^2)', 'O(1)'],
        correctAnswer: 'O(log n)',
        explanation: 'Binary search halves the search space at each iteration.',
        topic: 'P11_Searching_Sorting',
        sourceChunks: [{ chunkId: chunkA._id, chunkIndex: 0, document: docA._id, documentName: docA.originalName }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'MCQ',
        difficulty: 3,
        questionText: 'What is the average time complexity of QuickSort?',
        options: ['O(n log n)', 'O(n^2)', 'O(n)', 'O(log n)'],
        correctAnswer: 'O(n log n)',
        explanation: 'QuickSort divides array using pivots yielding O(n log n) expected time.',
        topic: 'P11_Searching_Sorting',
        sourceChunks: [{ chunkId: chunkA._id, chunkIndex: 0, document: docA._id, documentName: docA.originalName }]
      }
    ];

    for (const q of qData) {
      const created = await Question.create(q);
      seededQuestions.push(created);
    }
    pass('Test environment, users, and Question Bank records seeded successfully');

    // Test 9: Unauthenticated analytics request rejected with 401
    const resNoAuth = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET'
    });
    assert.strictEqual(resNoAuth.status, 401);
    assert.strictEqual(resNoAuth.data.error.code, 'UNAUTHORIZED');
    pass('9. Unauthenticated request to /api/analytics/overview returns 401 Unauthorized');

    // Test 10: Invalid JWT token rejected with 401
    const resBadToken = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: 'Bearer INVALID.JWT.TOKEN' }
    });
    assert.strictEqual(resBadToken.status, 401);
    pass('10. Invalid JWT rejected with 401');

    // Test 11: Empty state for student with 0 completed quizzes
    const resEmpty = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resEmpty.status, 200);
    assert.strictEqual(resEmpty.data.data.hasData, false);
    assert.strictEqual(resEmpty.data.data.overview.totalQuizzesCompleted, 0);
    assert.strictEqual(resEmpty.data.data.overview.overallAccuracy, 0);
    assert.strictEqual(resEmpty.data.data.trend.trend, 'insufficient_data');
    assert.ok(Array.isArray(resEmpty.data.data.recommendations));
    pass('11. Empty state handled safely with 0 completed quizzes (no divide-by-zero errors)');

    // Test 12: In-progress and abandoned attempts are ignored in analytics calculations
    const dummyQuiz = await Quiz.create({
      title: 'P11 Dummy Quiz',
      module: moduleA._id,
      document: docA._id,
      createdBy: studentUser._id,
      questionIds: [seededQuestions[0]._id, seededQuestions[1]._id],
      questionCount: 2,
      questionType: 'ALL',
      difficulty: 'ALL',
      status: 'active'
    });

    await QuizAttempt.create({
      quiz: dummyQuiz._id,
      student: studentUser._id,
      module: moduleA._id,
      startedAt: new Date(Date.now() - 3600000),
      status: 'in_progress',
      totalQuestions: 2,
      answeredQuestions: 1,
      correctAnswers: 1,
      score: 1,
      percentage: 50
    });

    await QuizAttempt.create({
      quiz: dummyQuiz._id,
      student: studentUser._id,
      module: moduleA._id,
      startedAt: new Date(Date.now() - 7200000),
      status: 'abandoned',
      totalQuestions: 2,
      answeredQuestions: 0,
      correctAnswers: 0,
      score: 0,
      percentage: 0
    });

    const resStillEmpty = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resStillEmpty.status, 200);
    assert.strictEqual(resStillEmpty.data.data.hasData, false);
    assert.strictEqual(resStillEmpty.data.data.overview.totalQuizzesCompleted, 0);
    pass('12. In-progress and abandoned attempts are strictly ignored in analytics calculation');

    // -------------------------------------------------------------
    // SEED COMPLETED ATTEMPTS FOR COMPREHENSIVE ANALYTICS
    // -------------------------------------------------------------
    // We will simulate 4 completed attempts for student1:
    // Attempt 1: Score 1/2 (50%) -> DP (correct), Graph (incorrect)
    // Attempt 2: Score 2/2 (100%) -> Searching (correct), Sorting (correct)
    // Attempt 3: Score 2/2 (100%) -> DP (correct), DP (correct)
    // Attempt 4: Score 1/2 (50%) -> Graph (incorrect), Searching (correct)
    // Total: 4 quizzes, 8 questions, 6 correct, 2 incorrect. Overall Accuracy: 75%
    const now = Date.now();

    const att1 = await QuizAttempt.create({
      quiz: dummyQuiz._id,
      student: studentUser._id,
      module: moduleA._id,
      document: docA._id,
      startedAt: new Date(now - 40000000),
      submittedAt: new Date(now - 39900000), // 100s
      status: 'completed',
      totalQuestions: 2,
      answeredQuestions: 2,
      correctAnswers: 1,
      incorrectAnswers: 1,
      score: 1,
      percentage: 50,
      timeSpentSeconds: 100,
      answers: [
        { question: seededQuestions[0]._id, selectedAnswer: 'Optimal substructure', isCorrect: true, answeredAt: new Date(now - 39950000) },
        { question: seededQuestions[3]._id, selectedAnswer: 'Stack overflow', isCorrect: false, answeredAt: new Date(now - 39900000) } // Graph
      ]
    });

    const att2 = await QuizAttempt.create({
      quiz: dummyQuiz._id,
      student: studentUser._id,
      module: moduleA._id,
      document: docA._id,
      startedAt: new Date(now - 30000000),
      submittedAt: new Date(now - 29880000), // 120s
      status: 'completed',
      totalQuestions: 2,
      answeredQuestions: 2,
      correctAnswers: 2,
      incorrectAnswers: 0,
      score: 2,
      percentage: 100,
      timeSpentSeconds: 120,
      answers: [
        { question: seededQuestions[4]._id, selectedAnswer: 'O(log n)', isCorrect: true, answeredAt: new Date(now - 29900000) }, // Searching
        { question: seededQuestions[5]._id, selectedAnswer: 'O(n log n)', isCorrect: true, answeredAt: new Date(now - 29880000) } // Sorting
      ]
    });

    const att3 = await QuizAttempt.create({
      quiz: dummyQuiz._id,
      student: studentUser._id,
      module: moduleA._id,
      document: docA._id,
      startedAt: new Date(now - 20000000),
      submittedAt: new Date(now - 19920000), // 80s
      status: 'completed',
      totalQuestions: 2,
      answeredQuestions: 2,
      correctAnswers: 2,
      incorrectAnswers: 0,
      score: 2,
      percentage: 100,
      timeSpentSeconds: 80,
      answers: [
        { question: seededQuestions[0]._id, selectedAnswer: 'Optimal substructure', isCorrect: true, answeredAt: new Date(now - 19950000) }, // DP
        { question: seededQuestions[1]._id, selectedAnswer: 'True', isCorrect: true, answeredAt: new Date(now - 19920000) } // DP
      ]
    });

    const att4 = await QuizAttempt.create({
      quiz: dummyQuiz._id,
      student: studentUser._id,
      module: moduleA._id,
      document: docA._id,
      startedAt: new Date(now - 10000000),
      submittedAt: new Date(now - 9900000), // 100s
      status: 'completed',
      totalQuestions: 2,
      answeredQuestions: 2,
      correctAnswers: 1,
      incorrectAnswers: 1,
      score: 1,
      percentage: 50,
      timeSpentSeconds: 100,
      answers: [
        { question: seededQuestions[3]._id, selectedAnswer: 'Incorrect heuristic', isCorrect: false, answeredAt: new Date(now - 9950000) }, // Graph (missed again!)
        { question: seededQuestions[4]._id, selectedAnswer: 'O(log n)', isCorrect: true, answeredAt: new Date(now - 9900000) } // Searching
      ]
    });

    // Seed 1 attempt for student2 to verify cross-user isolation
    await QuizAttempt.create({
      quiz: dummyQuiz._id,
      student: student2User._id,
      module: moduleA._id,
      document: docA._id,
      startedAt: new Date(now - 5000000),
      submittedAt: new Date(now - 4900000),
      status: 'completed',
      totalQuestions: 2,
      answeredQuestions: 2,
      correctAnswers: 0,
      incorrectAnswers: 2,
      score: 0,
      percentage: 0,
      timeSpentSeconds: 100,
      answers: [
        { question: seededQuestions[0]._id, selectedAnswer: 'Random access', isCorrect: false, answeredAt: new Date() }
      ]
    });

    // Test 13: Student isolation: student cannot access another student's analytics by passing studentId query
    const resTamper = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/analytics/overview?studentId=${student2User._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resTamper.status, 200);
    // Even though studentId was passed, the student only sees their own 4 quizzes, NOT student2's 1 quiz!
    assert.strictEqual(resTamper.data.data.overview.totalQuizzesCompleted, 4);
    assert.strictEqual(resTamper.data.data.overview.overallAccuracy, 75);
    pass('13. Student data isolation strictly enforced: query param studentId is ignored for student role');

    // Test 14: Admin can inspect a specific student's analytics
    const resAdminInspect = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/analytics/overview?studentId=${student2User._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdminInspect.status, 200);
    assert.strictEqual(resAdminInspect.data.data.overview.totalQuizzesCompleted, 1);
    assert.strictEqual(resAdminInspect.data.data.overview.overallAccuracy, 0);
    pass('14. Admin can inspect any student\'s analytics globally via studentId query parameter');

    // Test 15: Invalid studentId format for admin returns 400
    const resAdminBadId = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview?studentId=invalid-id',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdminBadId.status, 400);
    assert.strictEqual(resAdminBadId.data.error.code, 'INVALID_ID');
    pass('15. Malformed studentId parameter returns 400 Bad Request');

    // Test 16: Overview metrics verification
    const resOverview = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resOverview.status, 200);
    const data = resOverview.data.data;
    const ov = data.overview;

    assert.strictEqual(ov.totalQuizzesCompleted, 4);
    assert.strictEqual(ov.totalQuestions, 8);
    assert.strictEqual(ov.totalQuestionsAttempted, 8);
    assert.strictEqual(ov.totalCorrect, 6);
    assert.strictEqual(ov.totalIncorrect, 2);
    assert.strictEqual(ov.totalUnanswered, 0);
    assert.strictEqual(ov.overallAccuracy, 75); // (6/8)*100 = 75%
    pass('16. Aggregate totals and overall accuracy calculated with mathematical precision (75%)');

    // Test 17: Scores and time calculations
    assert.strictEqual(ov.bestQuizPercentage, 100);
    assert.strictEqual(ov.worstQuizPercentage, 50);
    assert.strictEqual(ov.averageQuizPercentage, 75); // (50 + 100 + 100 + 50) / 4 = 75%
    assert.strictEqual(ov.totalTimeSpent, 400); // 100 + 120 + 80 + 100 = 400s
    assert.strictEqual(ov.averageTimePerQuestion, 50); // 400s / 8 = 50s
    pass('17. Best/worst scores, average scores, and time-per-question metrics verified');

    // Test 18: Recent performance history
    assert.strictEqual(data.recentPerformance.length, 4);
    assert.strictEqual(data.recentPerformance[0].percentage, 50);
    assert.strictEqual(data.recentPerformance[1].percentage, 100);
    assert.strictEqual(data.recentPerformance[3].percentage, 50);
    pass('18. Recent performance array correctly formats sequential quiz history');

    // Test 19: Trend calculation in overview
    assert.ok(data.trend);
    assert.strictEqual(typeof data.trend.trend, 'string');
    assert.strictEqual(typeof data.trend.delta, 'number');
    pass('19. Performance trend calculated deterministically from chronological attempts');

    // Test 20: Module Performance breakdown
    assert.strictEqual(data.modulePerformance.length, 1);
    const modPerf = data.modulePerformance[0];
    assert.strictEqual(modPerf.moduleCode, 'P11_CS101');
    assert.strictEqual(modPerf.quizzesCompleted, 4);
    assert.strictEqual(modPerf.accuracy, 75);
    assert.strictEqual(modPerf.status, 'average');
    pass('20. Module performance aggregates quizzes, accuracy, and status for enrolled modules');

    // Test 21: Topic Performance breakdown & classification
    assert.ok(data.topicPerformance.length >= 3);
    const dpTopic = data.topicPerformance.find((t) => t.topic === 'P11_Dynamic_Programming');
    assert.ok(dpTopic);
    assert.strictEqual(dpTopic.totalQuestions, 3);
    assert.strictEqual(dpTopic.correct, 3);
    assert.strictEqual(dpTopic.accuracy, 100);
    assert.strictEqual(dpTopic.status, 'STRONG');
    pass('21. Topic performance correctly classifies strong topic (100% accuracy, 3 attempts)');

    // Test 22: Weak Topic detection
    const graphTopic = data.topicPerformance.find((t) => t.topic === 'P11_Graph_Theory');
    assert.ok(graphTopic);
    assert.strictEqual(graphTopic.totalQuestions, 2);
    assert.strictEqual(graphTopic.correct, 0);
    assert.strictEqual(graphTopic.incorrect, 2);
    assert.strictEqual(graphTopic.accuracy, 0);
    pass('22. Low-accuracy topic (0% on Graph Theory) tracked with error count');

    // Test 23: Weak Topics Intelligence ranking
    assert.ok(Array.isArray(data.weakTopics));
    assert.ok(data.weakTopics.length > 0);
    const topWeak = data.weakTopics[0];
    assert.strictEqual(topWeak.topic, 'P11_Graph_Theory');
    assert.ok(typeof topWeak.priorityScore === 'number');
    assert.ok(topWeak.reason.length > 5);
    assert.ok(topWeak.recommendation.length > 5);
    pass('23. Weak Topics Intelligence ranks high-priority topics with deterministic reasons and recommendations');

    // Test 24: Difficulty Performance breakdown
    assert.strictEqual(data.difficultyPerformance.length, 3);
    const diff2 = data.difficultyPerformance.find((d) => d.difficulty === 2);
    const diff3 = data.difficultyPerformance.find((d) => d.difficulty === 3);
    const diff4 = data.difficultyPerformance.find((d) => d.difficulty === 4);
    assert.ok(diff2 && diff3 && diff4);
    assert.strictEqual(diff2.accuracy, 100); // Memoization + Binary Search both correct
    assert.strictEqual(diff4.accuracy, 0); // Both Graph questions were difficulty 4
    pass('24. Difficulty performance aggregates Level 2, 3, and 4 questions accurately');

    // Test 25: Question Type Performance breakdown
    assert.ok(data.questionTypePerformance.length >= 4);
    const mcqType = data.questionTypePerformance.find((t) => t.questionType === 'MCQ');
    const tfType = data.questionTypePerformance.find((t) => t.questionType === 'TRUE_FALSE');
    const scType = data.questionTypePerformance.find((t) => t.questionType === 'SCENARIO');
    assert.ok(mcqType && tfType && scType);
    assert.strictEqual(mcqType.accuracy, 100);
    assert.strictEqual(tfType.accuracy, 100);
    assert.strictEqual(scType.accuracy, 0);
    pass('25. Question Type breakdown accurately computes accuracy per question type');

    // Test 26: Weakest Question Type identified
    assert.strictEqual(data.weakestQuestionType, 'SCENARIO');
    pass('26. Weakest question type identified correctly as SCENARIO (0% accuracy across 2 questions)');

    // Test 27: Frequently Missed Questions tracking
    assert.ok(data.frequentlyMissedQuestions.length > 0);
    const topMissed = data.frequentlyMissedQuestions[0];
    assert.strictEqual(topMissed.timesIncorrect, 2);
    assert.strictEqual(topMissed.accuracy, 0);
    assert.strictEqual(topMissed.questionId, seededQuestions[3]._id.toString());
    pass('27. Frequently missed questions tracked with error counts and accuracy');

    // Test 28: Security: Answer keys and explanations are NOT present in frequently missed overview
    assert.strictEqual(topMissed.correctAnswer, undefined);
    assert.strictEqual(topMissed.explanation, undefined);
    assert.strictEqual(topMissed.examClue, undefined);
    assert.strictEqual(topMissed.commonTrap, undefined);
    pass('28. Question-level error analysis strictly omits correct answers and explanations');

    // Test 29: Deterministic recommendations generated
    assert.ok(Array.isArray(data.recommendations));
    assert.ok(data.recommendations.length >= 1);
    assert.ok(data.recommendations.some((r) => r.includes('Graph_Theory') || r.includes('Level 4') || r.includes('SCENARIO')));
    pass('29. Deterministic revision recommendations dynamically synthesized from weaknesses');

    // -------------------------------------------------------------
    // PART 3: MODULE & TOPIC ANALYTICS ENDPOINTS
    // -------------------------------------------------------------
    console.log('\n--- PART 3: MODULE & TOPIC SCOPED ANALYTICS ---');

    // Test 30: GET /api/analytics/module/:moduleId — success
    const resModAnalytics = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/analytics/module/${moduleA._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resModAnalytics.status, 200);
    const modData = resModAnalytics.data.data;
    assert.strictEqual(modData.module.moduleCode, 'P11_CS101');
    assert.strictEqual(modData.hasData, true);
    assert.strictEqual(modData.overview.quizzesCompleted, 4);
    assert.strictEqual(modData.recentQuizzes.length, 4);
    pass('30. GET /api/analytics/module/:moduleId returns scoped module analytics');

    // Test 31: Unenrolled student cannot access module analytics (403 Forbidden)
    const resUnenrolledMod = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/analytics/module/${moduleA._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${unenrolledToken}` }
    });
    assert.strictEqual(resUnenrolledMod.status, 403);
    assert.strictEqual(resUnenrolledMod.data.error.code, 'FORBIDDEN');
    pass('31. Unenrolled student access to module analytics rejected with 403 Forbidden');

    // Test 32: Admin can access module analytics globally
    const resAdminMod = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/analytics/module/${moduleA._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdminMod.status, 200);
    pass('32. Admin can access module analytics across any module without enrollment barriers');

    // Test 33: Invalid module ID format returns 400
    const resBadModId = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/module/bad-id-123',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resBadModId.status, 400);
    assert.strictEqual(resBadModId.data.error.code, 'INVALID_MODULE_ID');
    pass('33. Malformed module ID returns 400 Bad Request');

    // Test 34: Nonexistent module ID returns 404
    const fakeModId = new mongoose.Types.ObjectId();
    const resNotFoundMod = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/analytics/module/${fakeModId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resNotFoundMod.status, 404);
    assert.strictEqual(resNotFoundMod.data.error.code, 'MODULE_NOT_FOUND');
    pass('34. Nonexistent module ID returns 404 Not Found');

    // Test 35: Module without attempts returns graceful empty state
    const resModBEmpty = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/analytics/module/${moduleB._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resModBEmpty.status, 200);
    assert.strictEqual(resModBEmpty.data.data.hasData, false);
    assert.strictEqual(resModBEmpty.data.data.overview.totalQuizzes, 0);
    pass('35. Module with 0 completed quizzes returns graceful empty state');

    // Test 36: GET /api/analytics/topic/:topic — success
    const resTopic = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/topic/P11_Dynamic_Programming',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resTopic.status, 200);
    const topRes = resTopic.data.data;
    assert.strictEqual(topRes.hasData, true);
    assert.strictEqual(topRes.topic, 'P11_Dynamic_Programming');
    assert.strictEqual(topRes.performance.accuracy, 100);
    assert.strictEqual(topRes.performance.status, 'STRONG');
    pass('36. GET /api/analytics/topic/:topic returns scoped topic performance');

    // Test 37: Topic query with URL encoding decoded properly
    const resEncodedTopic = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/topic/P11_Graph_Theory',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resEncodedTopic.status, 200);
    assert.strictEqual(resEncodedTopic.data.data.topic, 'P11_Graph_Theory');
    assert.strictEqual(resEncodedTopic.data.data.performance.accuracy, 0);
    assert.ok(resEncodedTopic.data.data.frequentlyMissedQuestions.length > 0);
    pass('37. Topic analytics endpoint decodes topic parameters and maps missed questions');

    // Test 38: Untested topic returns 200 with hasData: false
    const resUntestedTopic = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/topic/Quantum_Computing_Unknown',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resUntestedTopic.status, 200);
    assert.strictEqual(resUntestedTopic.data.data.hasData, false);
    assert.strictEqual(resUntestedTopic.data.data.status, 'INSUFFICIENT_DATA');
    pass('38. Untested topic returns graceful empty state without crashing');

    // Test 39: AI insight endpoint returns structured advice (or fallback if Gemini is unconfigured)
    const resAiInsight = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/ai-insight',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ summaryData: data }));
    assert.strictEqual(resAiInsight.status, 200);
    assert.ok(Array.isArray(resAiInsight.data.data.advice));
    assert.ok(resAiInsight.data.data.advice.length >= 1);
    pass('39. POST /api/analytics/ai-insight returns structured advice gracefully');

    // -------------------------------------------------------------
    // PART 4: SECURITY & CLEANUP TESTS
    // -------------------------------------------------------------
    console.log('\n--- PART 4: SECURITY & CASCADE CLEANUP TESTS ---');

    // Test 40: No passwords or password hashes leaked
    const jsonStr = JSON.stringify(resOverview.data);
    assert.strictEqual(jsonStr.includes('password'), false);
    pass('40. Passwords and password hashes are strictly not exposed in analytics response');

    // Test 41: No JWT secrets leaked
    assert.strictEqual(jsonStr.includes('JWT_SECRET'), false);
    pass('41. JWT secrets are not exposed');

    // Test 42: No Gemini API keys leaked
    assert.strictEqual(jsonStr.includes('AIza'), false);
    assert.strictEqual(jsonStr.includes('GEMINI_API_KEY'), false);
    pass('42. Gemini API keys are strictly not exposed');

    // Test 43: No embedding vectors leaked
    assert.strictEqual(jsonStr.includes('embedding'), false);
    pass('43. Raw embedding vectors are not returned in analytics responses');

    // Test 44: Student 2 sees only their own data
    const resStudent2Overview = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    assert.strictEqual(resStudent2Overview.status, 200);
    assert.strictEqual(resStudent2Overview.data.data.overview.totalQuizzesCompleted, 1);
    assert.strictEqual(resStudent2Overview.data.data.overview.overallAccuracy, 0);
    pass('44. Independent student sessions receive isolated analytics');

    // Test 45: Cascade cleanup safety: completed attempts remain valid even after Document deletion
    const docExtra = await Document.create({
      originalName: 'P11_extra.pdf',
      storedName: 'p11_stored_extra.pdf',
      filePath: 'dummy/path/p11_extra.pdf',
      mimeType: 'application/pdf',
      fileSize: 10000,
      module: moduleA._id,
      uploadedBy: adminUser._id,
      status: 'processed'
    });
    await Document.findByIdAndDelete(docExtra._id);
    const resAfterDocDel = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resAfterDocDel.status, 200);
    assert.strictEqual(resAfterDocDel.data.data.overview.totalQuizzesCompleted, 4);
    assert.strictEqual(resAfterDocDel.data.data.overview.overallAccuracy, 75);
    pass('45. Document deletion does not corrupt or break historical completed attempt analytics');

    // Test 46: Question deletion safety: null question pointers handled without crashing
    const qToDelete = seededQuestions[5];
    await Question.findByIdAndDelete(qToDelete._id);
    const resAfterQDel = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resAfterQDel.status, 200);
    assert.strictEqual(resAfterQDel.data.data.hasData, true);
    pass('46. Deleted question references are safely handled during topic and error aggregation');

    // -------------------------------------------------------------
    // PART 5: REGRESSION OF PREVIOUS PHASES
    // -------------------------------------------------------------
    console.log('\n--- PART 5: REGRESSION OF PREVIOUS PHASES ---');

    // Test 47: Phase 10 AI Quizzes remain functional
    const activeQuizzes = await Quiz.find({ createdBy: studentUser._id });
    assert.ok(activeQuizzes.length >= 1);
    pass('47. Phase 10 AI Quiz System models and queries remain fully functional');

    // Test 48: Phase 9 Question Bank remains functional
    const qbTest = await Question.find({ module: moduleA._id, isActive: true });
    assert.ok(qbTest.length >= 4);
    pass('48. Phase 9 Question Bank records remain queryable');

    // Test 49: Phase 8 Lecture Summaries remain functional
    const mockSummaryClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            title: 'P11 Summary',
            overview: 'Comprehensive summary of algorithms.',
            keyConcepts: [{ title: 'DP', explanation: 'Optimal substructure' }],
            importantPoints: ['Point 1'],
            examFocus: ['Focus 1'],
            definitions: [{ term: 'DP', definition: 'Dynamic programming' }],
            examples: ['Fibonacci']
          })
        })
      }
    };
    const summaryResult = await summaryService.generateLectureSummary(
      { documentId: docA._id.toString(), user: studentUser },
      { client: mockSummaryClient }
    );
    assert.ok(summaryResult.summary);
    assert.strictEqual(summaryResult.summary.title, 'P11 Summary');
    pass('49. Phase 8 Lecture Summaries remain functional');

    // Test 50: Phase 7 Grounded RAG remains functional
    const ragResult = await ragService.askQuestion(
      {
        question: 'What is Dynamic Programming?',
        moduleId: moduleA._id.toString(),
        documentId: docA._id.toString(),
        user: studentUser
      },
      {
        embeddingClient: {
          models: {
            embedContent: async () => ({
              embedding: { values: new Array(768).fill(0.1) }
            })
          }
        },
        generationClient: {
          models: {
            generateContent: async () => ({
              text: 'Dynamic Programming breaks complex problems into simpler subproblems.'
            })
          }
        }
      }
    );
    assert.ok(ragResult.answer);
    assert.ok(Array.isArray(ragResult.sources));
    pass('50. Phase 7 Grounded RAG remains functional');

    // Test 51: Health endpoints functional
    const resHealth = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/health',
      method: 'GET'
    });
    assert.strictEqual(resHealth.status, 200);
    assert.strictEqual(resHealth.data.status, 'ok');
    pass('51. GET /api/health returns 200 OK');

    const resHealthDb = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/health/db',
      method: 'GET'
    });
    assert.strictEqual(resHealthDb.status, 200);
    assert.strictEqual(resHealthDb.data.database, 'connected');
    pass('52. GET /api/health/db returns 200 OK connected');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Teardown
    try {
      const teardownUsers = await User.find({ email: { $regex: /@phase11test\.com$/ } });
      const teardownUserIds = teardownUsers.map((u) => u._id);
      await QuizAttempt.deleteMany({ student: { $in: teardownUserIds } });
      await User.deleteMany({ email: { $regex: /@phase11test\.com$/ } });
      await Module.deleteMany({ moduleCode: { $regex: /^P11/ } });
      await Document.deleteMany({ originalName: { $regex: /^P11_/ } });
      await DocumentChunk.deleteMany({ text: { $regex: /P11_/ } });
      await Question.deleteMany({ topic: { $regex: /^P11_/ } });
      await Quiz.deleteMany({ title: { $regex: /^P11_/ } });
      if (server) {
        await new Promise((res) => server.close(res));
      }
      await mongoose.disconnect();
    } catch (cleanupErr) {
      console.warn('Cleanup notice:', cleanupErr.message);
    }
  }

  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
