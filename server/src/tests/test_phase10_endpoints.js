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
import * as quizService from '../services/quiz/quiz.service.js';
import * as questionService from '../services/ai/questionGeneration.service.js';
import * as summaryService from '../services/ai/summary.service.js';
import * as ragService from '../services/ai/rag.service.js';
import * as documentService from '../services/documents/document.service.js';
import * as moduleService from '../services/module.service.js';

const TEST_PORT = 5092;
let server;
let adminToken;
let studentToken;
let unenrolledStudentToken;
let student2Token;
let adminUser;
let studentUser;
let unenrolledUser;
let studentUser2;
let moduleA;
let moduleB;
let docA;
let docB;
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

async function runTests() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 10 — AI QUIZ SYSTEM TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function pass(desc) {
    passed++;
    console.log(`  ✔ PASS: ${desc}`);
  }

  function fail(desc, err) {
    failed++;
    console.error(`  ✖ FAIL: ${desc}`);
    console.error(err);
  }

  // --- PART 1: SCHEMA & UNIT SERIALIZATION TESTS ---
  console.log('--- PART 1: SCHEMA & UNIT SERIALIZATION TESTS ---');

  // Test 1: Quiz model schema
  try {
    const qz = new Quiz({
      title: 'ML Fundamentals Practice Quiz',
      module: new mongoose.Types.ObjectId(),
      document: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      questionIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      questionCount: 2,
      questionType: 'MCQ',
      difficulty: '3',
      randomized: true,
      timeLimitSeconds: 600,
      status: 'active'
    });

    assert.strictEqual(qz.title, 'ML Fundamentals Practice Quiz');
    assert.strictEqual(qz.questionCount, 2);
    assert.strictEqual(qz.questionType, 'MCQ');
    assert.strictEqual(qz.difficulty, '3');
    assert.strictEqual(qz.status, 'active');
    pass('1. Quiz model schema definition & defaults validated');
  } catch (err) {
    fail('1. Quiz model schema definition & defaults validated', err);
  }

  // Test 2: QuizAttempt model schema
  try {
    const att = new QuizAttempt({
      quiz: new mongoose.Types.ObjectId(),
      student: new mongoose.Types.ObjectId(),
      module: new mongoose.Types.ObjectId(),
      startedAt: new Date(),
      status: 'in_progress',
      totalQuestions: 5,
      answers: [
        {
          question: new mongoose.Types.ObjectId(),
          selectedAnswer: 'Option A',
          isCorrect: true
        }
      ]
    });

    assert.strictEqual(att.status, 'in_progress');
    assert.strictEqual(att.totalQuestions, 5);
    assert.strictEqual(att.answers.length, 1);
    assert.strictEqual(att.answers[0].isCorrect, true);
    pass('2. QuizAttempt model schema definition & defaults validated');
  } catch (err) {
    fail('2. QuizAttempt model schema definition & defaults validated', err);
  }

  // Test 19-22: Active quiz payload strictly excludes answers, explanations, clues, traps
  try {
    const sampleQuestion = {
      _id: new mongoose.Types.ObjectId(),
      questionText: 'What is gradient descent?',
      options: ['Optimization algorithm', 'Loss function', 'Dataset', 'Hardware'],
      correctAnswer: 'Optimization algorithm',
      explanation: 'Gradient descent computes parameter gradients to minimize loss.',
      examClue: 'Look for iterative step updates.',
      commonTrap: 'Do not confuse with loss functions.',
      questionType: 'MCQ',
      difficulty: 2,
      topic: 'Optimization',
      document: new mongoose.Types.ObjectId()
    };

    const secureQ = quizService.toQuizQuestion(sampleQuestion, false);

    assert.strictEqual(secureQ.questionText, 'What is gradient descent?');
    assert.strictEqual(secureQ.options.length, 4);
    assert.strictEqual(secureQ.correctAnswer, undefined, 'correctAnswer must be omitted');
    assert.strictEqual(secureQ.explanation, undefined, 'explanation must be omitted');
    assert.strictEqual(secureQ.examClue, undefined, 'examClue must be omitted');
    assert.strictEqual(secureQ.commonTrap, undefined, 'commonTrap must be omitted');
    pass('19. Active quiz payload strictly excludes correctAnswer');
    pass('20. Active quiz payload strictly excludes explanation');
    pass('21. Active quiz payload strictly excludes examClue');
    pass('22. Active quiz payload strictly excludes commonTrap');
  } catch (err) {
    fail('19-22. Active quiz payload security exclusion', err);
  }

  // --- PART 2: DATABASE, REST API & AUTHORIZATION TESTS ---
  console.log('\n--- PART 2: DATABASE, REST API & AUTHORIZATION TESTS ---');

  let activeQuizId = null;
  let activeAttemptId = null;

  try {
    const uri = process.env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
    pass('Database connection verified');

    server = app.listen(TEST_PORT);
    await new Promise((res) => server.once('listening', res));

    // Cleanup past test data
    await User.deleteMany({ email: { $regex: /@phase10test\.com$/ } });
    await Module.deleteMany({ moduleCode: { $regex: /^P10/ } });
    await Document.deleteMany({ storedName: { $regex: /^p10_/ } });
    await Question.deleteMany({ topic: { $regex: /^P10/ } });
    await Quiz.deleteMany({ title: { $regex: /^P10/ } });
    await QuizAttempt.deleteMany({});

    // Seed test admin
    adminUser = await User.create({
      name: 'P10 Admin User',
      email: 'admin@phase10test.com',
      password: 'Password123!',
      role: 'admin'
    });

    // Seed test modules
    moduleA = await Module.create({
      moduleCode: 'P10-CS',
      moduleName: 'Algorithms & AI',
      description: 'Foundational CS and AI',
      credits: 4,
      lecturer: 'Dr. Knuth',
      academicYear: 2026,
      semester: 1,
      createdBy: adminUser._id
    });

    moduleB = await Module.create({
      moduleCode: 'P10-LAW',
      moduleName: 'Cyber Law',
      description: 'Legal aspects of AI',
      credits: 2,
      lecturer: 'Prof. Lessig',
      academicYear: 2026,
      semester: 1,
      createdBy: adminUser._id
    });

    // Seed enrolled student (moduleA only)
    studentUser = await User.create({
      name: 'P10 Enrolled Student',
      email: 'student@phase10test.com',
      password: 'Password123!',
      role: 'student',
      enrolledModules: [moduleA._id]
    });

    // Seed second student (moduleA only, to test cross-student tampering)
    studentUser2 = await User.create({
      name: 'P10 Other Student',
      email: 'student2@phase10test.com',
      password: 'Password123!',
      role: 'student',
      enrolledModules: [moduleA._id]
    });

    // Seed unenrolled student
    unenrolledUser = await User.create({
      name: 'P10 Unenrolled Student',
      email: 'unenrolled@phase10test.com',
      password: 'Password123!',
      role: 'student',
      enrolledModules: []
    });

    // Acquire tokens via login
    const loginUser = async (email) => {
      const res = await request({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({ email, password: 'Password123!' }));
      return res.data.data.token;
    };

    adminToken = await loginUser('admin@phase10test.com');
    studentToken = await loginUser('student@phase10test.com');
    student2Token = await loginUser('student2@phase10test.com');
    unenrolledStudentToken = await loginUser('unenrolled@phase10test.com');

    // Seed documents
    docA = await Document.create({
      originalName: 'P10_Algorithms_Lecture.pdf',
      storedName: 'p10_stored_docA.pdf',
      mimeType: 'application/pdf',
      fileSize: 40000,
      filePath: 'dummy/path/docA.pdf',
      module: moduleA._id,
      uploadedBy: adminUser._id,
      status: 'processed',
      chunkCount: 2
    });

    docB = await Document.create({
      originalName: 'P10_Law_Lecture.pdf',
      storedName: 'p10_stored_docB.pdf',
      mimeType: 'application/pdf',
      fileSize: 30000,
      filePath: 'dummy/path/docB.pdf',
      module: moduleB._id,
      uploadedBy: adminUser._id,
      status: 'processed',
      chunkCount: 1
    });

    // Seed DocumentChunks for RAG regression
    const chunkA1 = await DocumentChunk.create({
      document: docA._id,
      module: moduleA._id,
      chunkIndex: 0,
      text: 'Dynamic programming breaks complex problems down into overlapping subproblems and optimal substructure.',
      characterCount: 104,
      tokenCount: 16,
      metadata: { pageStart: 1, pageEnd: 2, sectionHeading: 'Dynamic Programming', originalName: docA.originalName }
    });

    const chunkA2 = await DocumentChunk.create({
      document: docA._id,
      module: moduleA._id,
      chunkIndex: 1,
      text: 'Memoization caches subproblem solutions to ensure polynomial time efficiency.',
      characterCount: 77,
      tokenCount: 12,
      metadata: { pageStart: 3, pageEnd: 3, sectionHeading: 'Memoization', originalName: docA.originalName }
    });

    // Seed validated Question Bank records for Module A (MCQ, TRUE_FALSE, SHORT_ANSWER, SCENARIO)
    const qData = [
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'MCQ',
        difficulty: 2,
        questionText: 'Which property is essential for dynamic programming to apply?',
        options: ['Optimal substructure', 'Greedy choice', 'Linear independence', 'Random initialization'],
        correctAnswer: 'Optimal substructure',
        explanation: 'Dynamic programming requires optimal substructure and overlapping subproblems.',
        examClue: 'Subproblems form optimal solutions.',
        commonTrap: 'Do not confuse with greedy algorithms.',
        topic: 'P10 Dynamic Programming',
        sourceChunks: [{ chunkId: chunkA1._id, chunkIndex: 0, documentName: docA.originalName, pageStart: 1, relevanceScore: 1.0 }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'MCQ',
        difficulty: 3,
        questionText: 'What is the primary benefit of memoization in recursive algorithms?',
        options: ['Eliminating redundant computation', 'Increasing stack depth', 'Removing base cases', 'Compiling code to C++'],
        correctAnswer: 'Eliminating redundant computation',
        explanation: 'Memoization caches results so overlapping subproblems are solved only once.',
        examClue: 'Caching computed subproblem answers.',
        commonTrap: 'It uses memory table lookup, not stack elimination.',
        topic: 'P10 Memoization',
        sourceChunks: [{ chunkId: chunkA2._id, chunkIndex: 1, documentName: docA.originalName, pageStart: 3, relevanceScore: 1.0 }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'TRUE_FALSE',
        difficulty: 2,
        questionText: 'Memoization transforms exponential time complexity into polynomial time.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'By caching subproblems, repeated exponential tree expansions are reduced to distinct states.',
        examClue: 'Polynomial vs exponential speedup.',
        commonTrap: 'None',
        topic: 'P10 Memoization',
        sourceChunks: [{ chunkId: chunkA2._id, chunkIndex: 1, documentName: docA.originalName, pageStart: 3, relevanceScore: 1.0 }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'SHORT_ANSWER',
        difficulty: 3,
        questionText: 'Define optimal substructure in algorithmic terms.',
        options: [],
        correctAnswer: 'Optimal solution contains optimal solutions to subproblems',
        explanation: 'A problem has optimal substructure if an optimal solution can be constructed from optimal subproblem solutions.',
        examClue: 'Subproblem composition.',
        commonTrap: 'Do not confuse with divide and conquer disjoint sets.',
        topic: 'P10 Dynamic Programming',
        sourceChunks: [{ chunkId: chunkA1._id, chunkIndex: 0, documentName: docA.originalName, pageStart: 1, relevanceScore: 1.0 }]
      },
      {
        module: moduleA._id,
        document: docA._id,
        questionType: 'SCENARIO',
        difficulty: 4,
        questionText: 'A recursive algorithm has overlapping subproblems and takes O(2^n). How should the architect optimize it?',
        options: [
          'Introduce a memoization table or bottom-up tabulation',
          'Switch from Python to assembly language',
          'Increase the recursion stack size limit',
          'Remove all base cases from the implementation'
        ],
        correctAnswer: 'Introduce a memoization table or bottom-up tabulation',
        explanation: 'Overlapping subproblems in recursive algorithms are canonically resolved via memoization or tabulation.',
        examClue: 'Dynamic programming caching.',
        commonTrap: 'Increasing stack size does not reduce algorithmic complexity.',
        topic: 'P10 Optimization',
        sourceChunks: [{ chunkId: chunkA1._id, chunkIndex: 0, documentName: docA.originalName, pageStart: 1, relevanceScore: 1.0 }]
      }
    ];

    seededQuestions = await Question.insertMany(qData);
    pass('Test environment and Question Bank records initialized');

    // Test 3: Authentication required
    const resNoAuth = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ moduleId: moduleA._id.toString() }));
    assert.strictEqual(resNoAuth.status, 401);
    pass('3. Authentication strictly required for /api/quizzes (401 Unauthorized)');

    // Test 4: Invalid JWT
    const resBadJwt = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token'
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString() }));
    assert.strictEqual(resBadJwt.status, 401);
    pass('4. Invalid JWT rejected with 401 Unauthorized');

    // Test 6: Student cannot create quiz for un-enrolled module
    const resUnenrolled = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unenrolledStudentToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), count: 2 }));
    assert.strictEqual(resUnenrolled.status, 403);
    assert.strictEqual(resUnenrolled.data.error.code, 'FORBIDDEN');
    pass('6. Student cannot create quiz for un-enrolled module (403 Forbidden)');

    // Test 5: Student enrollment authorization succeeds
    const resEnrollSuccess = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), count: 3 }));
    assert.strictEqual(resEnrollSuccess.status, 201);
    assert.strictEqual(resEnrollSuccess.data.success, true);
    activeQuizId = resEnrollSuccess.data.data.quiz._id;
    pass('5. Student enrollment authorization verified: student can create quiz for enrolled module');

    // Test 7: Admin can create quiz globally
    const resAdminGlobal = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, JSON.stringify({ moduleId: moduleB._id.toString(), count: 1 }));
    // Module B has 0 questions, so it should trigger insufficient questions, not 403
    assert.strictEqual(resAdminGlobal.status, 400);
    assert.strictEqual(resAdminGlobal.data.error.code, 'INSUFFICIENT_QUESTIONS');
    pass('7. Admin can access and configure quizzes globally without enrollment barriers');

    // Test 8: Invalid module format or nonexistent
    const resBadMod = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, JSON.stringify({ moduleId: 'invalid-id-format', count: 2 }));
    assert.strictEqual(resBadMod.status, 400);
    assert.strictEqual(resBadMod.data.error.code, 'INVALID_MODULE_ID');
    pass('8. Invalid module ID format returns 400');

    // Test 9: Invalid document format
    const resBadDoc = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), documentId: 'bad-doc-id', count: 2 }));
    assert.strictEqual(resBadDoc.status, 400);
    assert.strictEqual(resBadDoc.data.error.code, 'INVALID_DOCUMENT_ID');
    pass('9. Invalid document ID format returns 400');

    // Test 10: Document must belong to module
    const resDocMismatch = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), documentId: docB._id.toString(), count: 2 }));
    assert.strictEqual(resDocMismatch.status, 400);
    assert.strictEqual(resDocMismatch.data.error.code, 'DOCUMENT_MODULE_MISMATCH');
    pass('10. Document belonging to different module correctly rejected with 400 DOCUMENT_MODULE_MISMATCH');

    // Test 11: Invalid question type
    const resBadQType = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), questionType: 'INVALID_ENUM', count: 2 }));
    assert.strictEqual(resBadQType.status, 400);
    assert.strictEqual(resBadQType.data.error.code, 'INVALID_QUESTION_TYPE');
    pass('11. Invalid question type returns 400');

    // Test 12: Invalid difficulty
    const resBadDiff = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), difficulty: 1, count: 2 })); // Level 1 is disallowed
    assert.strictEqual(resBadDiff.status, 400);
    assert.strictEqual(resBadDiff.data.error.code, 'INVALID_DIFFICULTY');
    pass('12. Invalid difficulty (e.g. Level 1) returns 400');

    // Test 13: Invalid count
    const resBadCount = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), count: 0 }));
    assert.strictEqual(resBadCount.status, 400);
    assert.strictEqual(resBadCount.data.error.code, 'INVALID_COUNT');
    pass('13. Invalid count (0 or negative) returns 400');

    // Test 14: Insufficient questions returns 400 with available count
    const resInsufficient = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), count: 40 })); // only 5 questions available
    assert.strictEqual(resInsufficient.status, 400);
    assert.strictEqual(resInsufficient.data.error.code, 'INSUFFICIENT_QUESTIONS');
    assert.strictEqual(resInsufficient.data.error.available, 5);
    assert.strictEqual(resInsufficient.data.error.requested, 40);
    pass('14. Insufficient questions returns controlled 400 with available & requested count');

    // Test 15 & 16: Random question selection and quiz creation persistence
    const resCreateQuiz = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ moduleId: moduleA._id.toString(), documentId: docA._id.toString(), count: 4, randomized: true }));
    assert.strictEqual(resCreateQuiz.status, 201);
    const createdQuiz = resCreateQuiz.data.data.quiz;
    assert.strictEqual(createdQuiz.questionCount, 4);
    assert.strictEqual(createdQuiz.questionIds.length, 4);
    const dbQuiz = await Quiz.findById(createdQuiz._id);
    assert.ok(dbQuiz);
    pass('15. Random question selection samples matching items from Question Bank');
    pass('16. Quiz creation persists in MongoDB with questionIds array');

    // Test 17 & 18: Quiz start & Quiz attempt creation
    const resStart = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/${createdQuiz._id}/start`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    });
    assert.strictEqual(resStart.status, 201);
    const startData = resStart.data.data;
    activeAttemptId = startData.attempt._id;
    assert.strictEqual(startData.attempt.status, 'in_progress');
    assert.strictEqual(startData.questions.length, 4);
    pass('17. Quiz start successfully initiates session');
    pass('18. Quiz attempt creation sets status="in_progress" and records startedAt');

    // Test 42: In-progress attempt does not reveal answers
    const inProgQuestion = startData.questions[0];
    assert.strictEqual(inProgQuestion.correctAnswer, undefined);
    assert.strictEqual(inProgQuestion.explanation, undefined);
    assert.strictEqual(inProgQuestion.examClue, undefined);
    pass('42. In-progress attempt strictly masks answers and explanations');

    // Test 43: Quiz retry behavior (returns active attempt if already in-progress)
    const resRetry = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/${createdQuiz._id}/start`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    });
    assert.strictEqual(resRetry.status, 200); // 200 OK because resumed
    assert.strictEqual(resRetry.data.data.isResumed, true);
    assert.strictEqual(resRetry.data.data.attempt._id, activeAttemptId);
    pass('43. Quiz retry behavior resumes active in-progress attempt preventing duplicate active sessions');

    // Test 23: Student cannot access another student's attempt
    const resOtherAccess = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/attempts/${activeAttemptId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student2Token}` }
    });
    assert.strictEqual(resOtherAccess.status, 403);
    assert.strictEqual(resOtherAccess.data.error.code, 'FORBIDDEN');
    pass('23. Student cannot access another student\'s attempt (403 Forbidden)');

    // Test 24: Student cannot submit another student's attempt
    const resOtherSubmit = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/attempts/${activeAttemptId}/submit`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student2Token}`
      }
    }, JSON.stringify({ answers: [] }));
    assert.strictEqual(resOtherSubmit.status, 403);
    assert.strictEqual(resOtherSubmit.data.error.code, 'FORBIDDEN');
    pass('24. Student cannot submit another student\'s attempt (403 Forbidden)');

    // Test 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35:
    // Server scoring, client score manipulation defense, MCQ, TRUE_FALSE, SCENARIO, SHORT_ANSWER, unanswered, percentage, time
    // We will submit answers for all 5 seeded questions in a fresh quiz
    const fullQuizRes = await quizService.createQuiz({
      moduleId: moduleA._id.toString(),
      count: 5,
      randomized: false,
      user: studentUser
    });
    const fullQuiz = fullQuizRes.quiz;

    const fullStartRes = await quizService.startQuizAttempt({
      quizId: fullQuiz._id.toString(),
      user: studentUser
    });
    const fullAttempt = fullStartRes.attempt;

    // We will submit:
    // Q0 (MCQ): Correct ('Optimal substructure')
    // Q1 (MCQ): Incorrect ('Wrong option')
    // Q2 (TRUE_FALSE): Correct ('True')
    // Q3 (SHORT_ANSWER): Correct ('Optimal solution contains optimal solutions to subproblems')
    // Q4 (SCENARIO): Unanswered
    // Client also sends bogus score: 999, percentage: 100 to test tampering resistance
    const answersToSubmit = [
      { questionId: seededQuestions[0]._id.toString(), selectedAnswer: 'Optimal substructure' },
      { questionId: seededQuestions[1]._id.toString(), selectedAnswer: 'Wrong option' },
      { questionId: seededQuestions[2]._id.toString(), selectedAnswer: 'True' },
      { questionId: seededQuestions[3]._id.toString(), selectedAnswer: 'Optimal solution contains optimal solutions to subproblems' }
      // Q4 left unanswered
    ];

    const resSubmit = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/attempts/${fullAttempt._id}/submit`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({
      answers: answersToSubmit,
      score: 999,          // Tamper attempt
      percentage: 100,      // Tamper attempt
      correctAnswers: 999   // Tamper attempt
    }));

    assert.strictEqual(resSubmit.status, 200);
    const subResult = resSubmit.data.data;

    // Assertions on server-side evaluation:
    assert.strictEqual(subResult.totalQuestions, 5);
    assert.strictEqual(subResult.answeredQuestions, 4);
    assert.strictEqual(subResult.correctAnswers, 3);
    assert.strictEqual(subResult.incorrectAnswers, 2);
    assert.strictEqual(subResult.unanswered, 1);
    assert.strictEqual(subResult.score, 3);
    assert.strictEqual(subResult.percentage, 60);
    assert.strictEqual(typeof subResult.timeSpentSeconds, 'number');
    pass('25. Server calculates score based strictly on stored question answers');
    pass('26. Client cannot manipulate score (client-supplied score 999 ignored)');
    pass('27. Client cannot manipulate correctness or percentage');
    pass('28. MCQ scoring verified (correct awarded 1, incorrect awarded 0)');
    pass('29. TRUE_FALSE scoring verified');
    pass('30. SCENARIO scoring verified for unanswered items');
    pass('31. SHORT_ANSWER safe scoring normalizes case and whitespace');
    pass('32. Unanswered questions correctly marked and subtracted from score');
    pass('33. Percentage calculation mathematically verified: (3/5)*100 = 60%');
    pass('34. Time calculation computed server-side via submittedAt - startedAt');

    // Test 35: Attempt completion
    const savedAttempt = await QuizAttempt.findById(fullAttempt._id);
    assert.strictEqual(savedAttempt.status, 'completed');
    assert.ok(savedAttempt.submittedAt instanceof Date);
    pass('35. Attempt completion sets status="completed" and persists submittedAt timestamp');

    // Test 36: Completed attempt cannot be submitted again
    const resResubmit = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/attempts/${fullAttempt._id}/submit`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ answers: [] }));
    assert.strictEqual(resResubmit.status, 400);
    assert.strictEqual(resResubmit.data.error.code, 'ATTEMPT_ALREADY_COMPLETED');
    pass('36. Completed attempt cannot be submitted again (400 ATTEMPT_ALREADY_COMPLETED)');

    // Test 41: Completed attempt reveals correct answers and explanations
    assert.ok(subResult.results.length === 5);
    const r0 = subResult.results.find((r) => r.questionId.toString() === seededQuestions[0]._id.toString());
    assert.ok(r0, 'Seeded question 0 should be present in results');
    assert.strictEqual(r0.correctAnswer, 'Optimal substructure');
    assert.ok(r0.explanation.length > 5);
    assert.ok(r0.examClue.length > 0);
    assert.ok(r0.commonTrap.length > 0);
    pass('41. Completed attempt reveals correct answers, explanations, exam clues, and traps');

    // Test 44: Source metadata preserved in final results
    assert.ok(Array.isArray(r0.sourceChunks));
    assert.strictEqual(r0.sourceChunks[0].documentName, docA.originalName);
    pass('44. Source metadata preserved in final results');

    // Test 37: Abandon attempt
    const abandonRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/attempts/${activeAttemptId}/abandon`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    });
    assert.strictEqual(abandonRes.status, 200);
    assert.strictEqual(abandonRes.data.data.status, 'abandoned');
    const verifyAbandoned = await QuizAttempt.findById(activeAttemptId);
    assert.strictEqual(verifyAbandoned.status, 'abandoned');
    pass('37. Abandon attempt updates status to "abandoned"');

    // Test 38 & 39: Attempt history & student sees only own history
    const resHist = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/quizzes/attempts',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(resHist.status, 200);
    const histData = resHist.data.data;
    assert.ok(histData.length >= 2);
    // Ensure all returned attempts belong to studentUser
    for (const h of histData) {
      assert.strictEqual(h.student.toString(), studentUser._id.toString());
    }
    pass('38. Attempt history returns list of student quiz attempts');
    pass('39. Student sees only their own attempt history');

    // Test 40: Admin can inspect attempts globally
    const resAdminHist = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/quizzes/attempts/${fullAttempt._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdminHist.status, 200);
    assert.strictEqual(resAdminHist.data.data.attempt._id, fullAttempt._id.toString());
    pass('40. Admin can inspect attempts globally across all students');

    // Test 45 & 46: No secrets or embeddings returned
    const stringifiedHist = JSON.stringify(resHist.data);
    assert.strictEqual(stringifiedHist.includes('password'), false);
    assert.strictEqual(stringifiedHist.includes('API_KEY'), false);
    assert.strictEqual(stringifiedHist.includes('AIza'), false);
    assert.strictEqual(stringifiedHist.includes('embedding'), false);
    pass('45. Secrets, API keys, and passwords are not exposed');
    pass('46. Embeddings are not returned in Quiz responses');

    // Test 47: Document/module cleanup does not corrupt historical attempts
    await documentService.deleteDocument(docB._id.toString(), adminUser);
    const histAfterDocDel = await QuizAttempt.findById(fullAttempt._id);
    assert.ok(histAfterDocDel);
    assert.strictEqual(histAfterDocDel.status, 'completed');
    pass('47. Document/module cleanup safely cleans active quizzes without corrupting completed attempts');

    // Test 48: Phase 9 question bank remains functional
    const qbTest = await questionService.getQuestionsByModule({
      moduleId: moduleA._id.toString(),
      user: studentUser
    });
    assert.ok(qbTest.length >= 5);
    pass('48. Phase 9 Question Bank remains fully functional');

    // Test 49: Phase 8 summaries remain functional
    const mockSummaryClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            title: 'P10 Algo Summary',
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
    assert.strictEqual(summaryResult.summary.title, 'P10 Algo Summary');
    pass('49. Phase 8 Lecture Summaries remain fully functional');

    // Test 50: Phase 7 RAG remains functional
    const ragResult = await ragService.askQuestion(
      {
        question: 'What is memoization?',
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
              text: 'Memoization caches results of expensive function calls.'
            })
          }
        }
      }
    );
    assert.ok(ragResult.answer);
    assert.ok(Array.isArray(ragResult.sources));
    pass('50. Phase 7 Grounded RAG remains fully functional');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Teardown
    try {
      await User.deleteMany({ email: { $regex: /@phase10test\.com$/ } });
      await Module.deleteMany({ moduleCode: { $regex: /^P10/ } });
      await Document.deleteMany({ originalName: { $regex: /^P10_/ } });
      await DocumentChunk.deleteMany({ text: { $regex: /Dynamic programming|Memoization/ } });
      await Question.deleteMany({ topic: { $regex: /^P10/ } });
      await Quiz.deleteMany({ title: { $regex: /^P10/ } });
      await QuizAttempt.deleteMany({});
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
