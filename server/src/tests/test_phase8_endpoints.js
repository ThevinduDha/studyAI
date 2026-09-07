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
import LectureSummary from '../models/lectureSummary.model.js';
import * as summaryService from '../services/ai/summary.service.js';

const TEST_PORT = 5093;
let server;
let adminToken;
let studentToken;
let unenrolledStudentToken;
let adminUser;
let studentUser;
let unenrolledUser;
let moduleA;
let moduleB;
let docA;
let docEmpty;
let docB;

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

function createMockSummaryClient(mockSummaryData = null) {
  const defaultData = {
    title: 'Lecture 01: Machine Learning Fundamentals',
    overview: 'This lecture introduces foundational machine learning paradigms including supervised and unsupervised learning, loss functions, and optimization.',
    keyConcepts: [
      {
        title: 'Supervised Learning',
        explanation: 'Learning a mapping from input features to target labels using annotated training examples.'
      },
      {
        title: 'Loss Function',
        explanation: 'A mathematical measure quantifying the discrepancy between predicted outputs and ground truth.'
      }
    ],
    importantPoints: [
      'Empirical risk minimization guides parameter updates via gradient descent.',
      'Validation splits prevent model overfitting.'
    ],
    examFocus: [
      'Distinguish between regression (continuous) and classification (discrete) tasks.',
      'Explain the bias-variance tradeoff and how regularization penalizes large weights.'
    ],
    definitions: [
      {
        term: 'Gradient Descent',
        definition: 'An iterative first-order optimization algorithm for finding the local minimum of a differentiable objective function.'
      }
    ],
    examples: [
      'Predicting housing prices based on square footage is a canonical linear regression example.'
    ]
  };

  const payload = mockSummaryData || defaultData;

  return {
    models: {
      generateContent: async () => {
        return {
          text: JSON.stringify(payload)
        };
      }
    }
  };
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 8 — LECTURE SUMMARIES TEST SUITE');
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

  // --- PART 1: UNIT & SCHEMA TESTS ---
  console.log('--- PART 1: UNIT & SCHEMA TESTS ---');

  // Test 1: Validate LectureSummary Schema
  try {
    const summary = new LectureSummary({
      document: new mongoose.Types.ObjectId(),
      module: new mongoose.Types.ObjectId(),
      title: 'Unit Test Summary',
      overview: 'Overview test',
      keyConcepts: [{ title: 'Concept 1', explanation: 'Explanation 1' }],
      importantPoints: ['Point 1'],
      examFocus: ['Focus 1'],
      definitions: [{ term: 'Term 1', definition: 'Def 1' }],
      examples: ['Ex 1']
    });

    assert.strictEqual(summary.version, 1);
    assert.strictEqual(summary.status, 'generated');
    assert.strictEqual(summary.model, 'gemini-3.8-flash');
    assert.strictEqual(summary.keyConcepts.length, 1);
    assert.strictEqual(summary.keyConcepts[0].title, 'Concept 1');
    assert.strictEqual(summary.definitions[0].term, 'Term 1');
    pass('1. LectureSummary model schema definition & defaults validated');
  } catch (err) {
    fail('1. LectureSummary model schema definition & defaults validated', err);
  }

  // Test 2: validateSummaryJson properly cleans valid structured output
  try {
    const raw = {
      title: ' Test Title ',
      overview: ' Test Overview ',
      keyConcepts: [{ title: ' C1 ', explanation: ' E1 ' }],
      importantPoints: [' P1 ', ''],
      examFocus: [' F1 '],
      definitions: [{ term: ' T1 ', definition: ' D1 ' }],
      examples: [' Ex1 ']
    };

    const validated = summaryService.validateSummaryJson(raw);
    assert.strictEqual(validated.title, 'Test Title');
    assert.strictEqual(validated.overview, 'Test Overview');
    assert.strictEqual(validated.keyConcepts[0].title, 'C1');
    assert.strictEqual(validated.keyConcepts[0].explanation, 'E1');
    assert.strictEqual(validated.importantPoints.length, 1);
    assert.strictEqual(validated.importantPoints[0], 'P1');
    assert.strictEqual(validated.definitions[0].term, 'T1');
    assert.strictEqual(validated.examples[0], 'Ex1');
    pass('2. validateSummaryJson sanitizes whitespace and trims structured fields');
  } catch (err) {
    fail('2. validateSummaryJson sanitizes whitespace and trims structured fields', err);
  }

  // Test 3: validateSummaryJson handles missing fields gracefully
  try {
    const rawEmpty = {};
    const validated = summaryService.validateSummaryJson(rawEmpty, 'Fallback Title');
    assert.strictEqual(validated.title, 'Fallback Title');
    assert.strictEqual(typeof validated.overview, 'string');
    assert.deepStrictEqual(validated.keyConcepts, []);
    assert.deepStrictEqual(validated.importantPoints, []);
    assert.deepStrictEqual(validated.examFocus, []);
    assert.deepStrictEqual(validated.definitions, []);
    assert.deepStrictEqual(validated.examples, []);
    pass('3. validateSummaryJson gracefully supplies fallbacks for missing fields');
  } catch (err) {
    fail('3. validateSummaryJson gracefully supplies fallbacks for missing fields', err);
  }

  // Test 4: buildSummaryContext creates bounded context and source chunks
  try {
    const dummyChunks = [
      {
        _id: new mongoose.Types.ObjectId(),
        chunkIndex: 0,
        document: new mongoose.Types.ObjectId(),
        text: 'First chunk text discussing linear regression.',
        metadata: { pageStart: 1, pageEnd: 2, sectionHeading: 'Regression' }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        chunkIndex: 1,
        document: new mongoose.Types.ObjectId(),
        text: 'Second chunk text discussing classification.',
        metadata: { pageStart: 3, pageEnd: 4, sectionHeading: 'Classification' }
      }
    ];

    const { contextString, sourceChunks } = summaryService.buildSummaryContext(
      dummyChunks,
      { documentName: 'Lecture.pdf', moduleCode: 'CS101', moduleName: 'Intro' },
      5000
    );

    assert.ok(contextString.includes('[SOURCE 1]'));
    assert.ok(contextString.includes('[SOURCE 2]'));
    assert.ok(contextString.includes('linear regression'));
    assert.ok(contextString.includes('Classification'));
    assert.strictEqual(sourceChunks.length, 2);
    assert.strictEqual(sourceChunks[0].pageStart, 1);
    assert.strictEqual(sourceChunks[1].sectionHeading, 'Classification');
    pass('4. buildSummaryContext constructs structured source blocks and citation metadata');
  } catch (err) {
    fail('4. buildSummaryContext constructs structured source blocks and citation metadata', err);
  }

  // Test 5: SUMMARY_SYSTEM_INSTRUCTION enforces grounding and prompt injection defenses
  try {
    assert.ok(summaryService.SUMMARY_SYSTEM_INSTRUCTION.includes('untrusted reference DATA'));
    assert.ok(summaryService.SUMMARY_SYSTEM_INSTRUCTION.includes('prompt injection'));
    assert.ok(summaryService.SUMMARY_SYSTEM_INSTRUCTION.includes('Use ONLY the provided lecture context'));
    pass('5. SUMMARY_SYSTEM_INSTRUCTION embeds zero-hallucination and prompt injection directives');
  } catch (err) {
    fail('5. SUMMARY_SYSTEM_INSTRUCTION embeds zero-hallucination and prompt injection directives', err);
  }

  // --- PART 2: DATABASE, AUTHORIZATION & REST API TESTS ---
  console.log('\n--- PART 2: DATABASE, AUTHORIZATION & REST API TESTS ---');

  try {
    const uri = process.env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
    pass('Database connection established');

    server = app.listen(TEST_PORT);
    await new Promise((res) => server.once('listening', res));

    // Clean up past test records
    await User.deleteMany({ email: { $regex: /@phase8test\.com$/ } });
    await Module.deleteMany({ moduleCode: { $regex: /^P8/ } });
    await LectureSummary.deleteMany({ title: { $regex: /Phase 8/ } });

    // Create users
    adminUser = await User.create({
      name: 'Admin Phase 8',
      email: 'admin@phase8test.com',
      password: 'Password123!',
      role: 'admin'
    });

    studentUser = await User.create({
      name: 'Student Phase 8',
      email: 'student@phase8test.com',
      password: 'Password123!',
      role: 'student'
    });

    unenrolledUser = await User.create({
      name: 'Unenrolled Phase 8',
      email: 'unenrolled@phase8test.com',
      password: 'Password123!',
      role: 'student'
    });

    // Login users to acquire tokens
    const adminRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ email: 'admin@phase8test.com', password: 'Password123!' }));
    adminToken = adminRes.data.data.token;

    const studentRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ email: 'student@phase8test.com', password: 'Password123!' }));
    studentToken = studentRes.data.data.token;

    const unenrolledRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ email: 'unenrolled@phase8test.com', password: 'Password123!' }));
    unenrolledStudentToken = unenrolledRes.data.data.token;

    // Create modules
    moduleA = await Module.create({
      moduleCode: 'P8MOD1',
      moduleName: 'Phase 8 Enrolled Module',
      description: 'Enrolled test module',
      createdBy: adminUser._id
    });

    moduleB = await Module.create({
      moduleCode: 'P8MOD2',
      moduleName: 'Phase 8 Unenrolled Module',
      description: 'Unenrolled test module',
      createdBy: adminUser._id
    });

    // Enroll studentUser in moduleA only
    studentUser.enrolledModules.push(moduleA._id);
    await studentUser.save();

    // Create Document A (with chunks) in Module A
    docA = await Document.create({
      module: moduleA._id,
      uploadedBy: adminUser._id,
      originalName: 'Phase 8 Lecture 01 - ML.pdf',
      storedName: 'p8_stored_docA.pdf',
      filePath: 'uploads/p8_docA.pdf',
      mimeType: 'application/pdf',
      fileSize: 10240,
      pageCount: 3,
      chunkCount: 2,
      status: 'processed'
    });

    await DocumentChunk.create([
      {
        document: docA._id,
        module: moduleA._id,
        chunkIndex: 0,
        text: 'Supervised learning trains models on labeled datasets with inputs and targets.',
        characterCount: 75,
        tokenCount: 15,
        metadata: { pageStart: 1, pageEnd: 1, sectionHeading: 'Supervised Learning', originalName: docA.originalName }
      },
      {
        document: docA._id,
        module: moduleA._id,
        chunkIndex: 1,
        text: 'Unsupervised learning discovers latent representations and clustering patterns without ground truth.',
        characterCount: 95,
        tokenCount: 20,
        metadata: { pageStart: 2, pageEnd: 3, sectionHeading: 'Unsupervised Learning', originalName: docA.originalName }
      }
    ]);

    // Create Document with 0 chunks in Module A
    docEmpty = await Document.create({
      module: moduleA._id,
      uploadedBy: adminUser._id,
      originalName: 'Phase 8 Empty Lecture.pdf',
      storedName: 'p8_stored_empty.pdf',
      filePath: 'uploads/p8_empty.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      pageCount: 1,
      chunkCount: 0,
      status: 'processed'
    });

    // Create Document B in Module B (student not enrolled)
    docB = await Document.create({
      module: moduleB._id,
      uploadedBy: adminUser._id,
      originalName: 'Phase 8 Lecture Module B.pdf',
      storedName: 'p8_stored_docB.pdf',
      filePath: 'uploads/p8_docB.pdf',
      mimeType: 'application/pdf',
      fileSize: 10240,
      pageCount: 2,
      chunkCount: 1,
      status: 'processed'
    });

    await DocumentChunk.create({
      document: docB._id,
      module: moduleB._id,
      chunkIndex: 0,
      text: 'Confidential module B lecture content.',
      characterCount: 40,
      tokenCount: 8,
      metadata: { pageStart: 1, pageEnd: 1, sectionHeading: 'Intro', originalName: docB.originalName }
    });

    pass('6. Test fixtures, enrolled modules, and document chunks created');
  } catch (err) {
    fail('6. Setup test fixtures and database environment', err);
  }

  // Test 7: Unauthenticated POST /api/summaries/generate -> 401
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/summaries/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ documentId: docA._id.toString() }));

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.error.code, 'UNAUTHORIZED');
    pass('7. Unauthenticated request to /api/summaries/generate returns 401');
  } catch (err) {
    fail('7. Unauthenticated request to /api/summaries/generate returns 401', err);
  }

  // Test 8: Invalid JWT token -> 401
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/summaries/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.payload'
      }
    }, JSON.stringify({ documentId: docA._id.toString() }));

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.error.code, 'INVALID_TOKEN');
    pass('8. Invalid JWT token returns 401 Invalid Token');
  } catch (err) {
    fail('8. Invalid JWT token returns 401 Invalid Token', err);
  }

  // Test 9: Invalid document ID format -> 400
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/summaries/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ documentId: 'invalid-id' }));

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error.code, 'INVALID_DOCUMENT_ID');
    pass('9. Malformed document ID format returns 400 Bad Request');
  } catch (err) {
    fail('9. Malformed document ID format returns 400 Bad Request', err);
  }

  // Test 10: Nonexistent document ID -> 404
  try {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/summaries/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ documentId: nonExistentId }));

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.data.error.code, 'DOCUMENT_NOT_FOUND');
    pass('10. Nonexistent document ID returns 404 Not Found');
  } catch (err) {
    fail('10. Nonexistent document ID returns 404 Not Found', err);
  }

  // Test 11: Student generating summary for document in non-enrolled module -> 403
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/summaries/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ documentId: docB._id.toString() }));

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
    pass('11. Student attempting to generate summary for non-enrolled module returns 403 Forbidden');
  } catch (err) {
    fail('11. Student attempting to generate summary for non-enrolled module returns 403 Forbidden', err);
  }

  // Test 12: Document with 0 chunks returns 400 NO_USABLE_CONTENT
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/summaries/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    }, JSON.stringify({ documentId: docEmpty._id.toString() }));

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error.code, 'NO_USABLE_CONTENT');
    pass('12. Document without chunks returns controlled error without calling AI');
  } catch (err) {
    fail('12. Document without chunks returns controlled error without calling AI', err);
  }

  // Test 13: Student generating summary for enrolled module succeeds
  let generatedSummaryId;
  try {
    const mockClient = createMockSummaryClient();
    const result = await summaryService.generateLectureSummary(
      { documentId: docA._id.toString(), user: studentUser },
      { client: mockClient }
    );

    assert.ok(result.summary);
    assert.strictEqual(result.summary.version, 1);
    assert.strictEqual(result.summary.status, 'generated');
    assert.strictEqual(result.summary.keyConcepts.length, 2);
    assert.strictEqual(result.summary.importantPoints.length, 2);
    assert.strictEqual(result.summary.examFocus.length, 2);
    assert.strictEqual(result.summary.definitions.length, 1);
    assert.strictEqual(result.summary.examples.length, 1);
    assert.strictEqual(result.sources.length, 2);
    generatedSummaryId = result.summary._id;
    pass('13. Student generates structured summary for enrolled module with version 1');
  } catch (err) {
    fail('13. Student generates structured summary for enrolled module with version 1', err);
  }

  // Test 14: Summary persisted in MongoDB with correct fields
  try {
    const persisted = await LectureSummary.findById(generatedSummaryId).lean();
    assert.ok(persisted);
    assert.strictEqual(persisted.document.toString(), docA._id.toString());
    assert.strictEqual(persisted.module.toString(), moduleA._id.toString());
    assert.strictEqual(persisted.version, 1);
    assert.strictEqual(persisted.keyConcepts[0].title, 'Supervised Learning');
    assert.strictEqual(persisted.sourceChunks.length, 2);
    pass('14. Generated summary successfully verified in MongoDB collection');
  } catch (err) {
    fail('14. Generated summary successfully verified in MongoDB collection', err);
  }

  // Test 15: Source metadata matches DocumentChunk collection
  try {
    const persisted = await LectureSummary.findById(generatedSummaryId).lean();
    const src1 = persisted.sourceChunks[0];
    assert.strictEqual(src1.chunkIndex, 0);
    assert.strictEqual(src1.pageStart, 1);
    assert.strictEqual(src1.sectionHeading, 'Supervised Learning');
    assert.strictEqual(src1.documentName, docA.originalName);
    pass('15. Application-generated source metadata strictly matches chunk records');
  } catch (err) {
    fail('15. Application-generated source metadata strictly matches chunk records', err);
  }

  // Test 16: GET /api/summaries/document/:documentId returns latest summary
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/summaries/document/${docA._id}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.version, 1);
    assert.strictEqual(res.data.data.document._id, docA._id.toString());
    pass('16. GET /api/summaries/document/:documentId returns latest version');
  } catch (err) {
    fail('16. GET /api/summaries/document/:documentId returns latest version', err);
  }

  // Test 17: GET summary for non-enrolled module returns 403 Forbidden
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/summaries/document/${docB._id}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
    pass('17. Student attempting to retrieve summary for non-enrolled document returns 403');
  } catch (err) {
    fail('17. Student attempting to retrieve summary for non-enrolled document returns 403', err);
  }

  // Test 18: Regeneration via regenerateSummary increments version (v1 -> v2)
  try {
    const mockClient = createMockSummaryClient({
      title: 'Regenerated Lecture 01 Summary',
      overview: 'Regenerated overview with updated synthesis.',
      keyConcepts: [{ title: 'Concept V2', explanation: 'Explanation V2' }],
      importantPoints: ['Point V2'],
      examFocus: ['Focus V2'],
      definitions: [{ term: 'Term V2', definition: 'Def V2' }],
      examples: ['Ex V2']
    });

    const regenResult = await summaryService.regenerateSummary(
      { documentId: docA._id.toString(), user: studentUser },
      { client: mockClient }
    );

    assert.ok(regenResult.summary);
    assert.strictEqual(regenResult.summary.version, 2);
    assert.strictEqual(regenResult.summary.title, 'Regenerated Lecture 01 Summary');
    pass('18. Summary regeneration properly increments version counter to 2');
  } catch (err) {
    fail('18. Summary regeneration properly increments version counter to 2', err);
  }

  // Test 19: GET returns version 2 after regeneration
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/summaries/document/${docA._id}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.version, 2);
    assert.strictEqual(res.data.data.title, 'Regenerated Lecture 01 Summary');
    pass('19. GET /api/summaries/document/:documentId returns latest version (v2)');
  } catch (err) {
    fail('19. GET /api/summaries/document/:documentId returns latest version (v2)', err);
  }

  // Test 20: Admin can generate summary for any document globally
  try {
    const mockClient = createMockSummaryClient({
      title: 'Module B Lecture Summary (Admin)',
      overview: 'Global access summary for Module B.',
      keyConcepts: [{ title: 'ModB Concept', explanation: 'Explanation' }],
      importantPoints: ['Admin point'],
      examFocus: ['Admin focus'],
      definitions: [],
      examples: []
    });

    const adminResult = await summaryService.generateLectureSummary(
      { documentId: docB._id.toString(), user: adminUser },
      { client: mockClient }
    );

    assert.ok(adminResult.summary);
    assert.strictEqual(adminResult.summary.document.toString(), docB._id.toString());
    assert.strictEqual(adminResult.summary.version, 1);
    pass('20. Admin can generate summaries across all course documents globally');
  } catch (err) {
    fail('20. Admin can generate summaries across all course documents globally', err);
  }

  // Test 21: Sensitive fields and embeddings are never exposed
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/summaries/document/${docA._id}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    const responseStr = JSON.stringify(res.data);
    assert.ok(!responseStr.includes('"embedding"'));
    assert.ok(!responseStr.includes('"password"'));
    assert.ok(!responseStr.includes('"filePath"'));
    pass('21. Embedding vectors, disk file paths, and passwords are never returned in responses');
  } catch (err) {
    fail('21. Embedding vectors, disk file paths, and passwords are never returned in responses', err);
  }

  // Test 22: Gemini failure handled gracefully with 502 GENERATION_FAILED
  try {
    const failingClient = {
      models: {
        generateContent: async () => {
          throw new Error('Simulated upstream Gemini 503 Overloaded');
        }
      }
    };

    let caught = false;
    try {
      await summaryService.generateLectureSummary(
        { documentId: docA._id.toString(), user: studentUser },
        { client: failingClient }
      );
    } catch (err) {
      caught = true;
      assert.strictEqual(err.code, 'GENERATION_FAILED');
      assert.strictEqual(err.statusCode, 502);
      assert.ok(!err.message.includes('Simulated upstream'));
    }
    assert.ok(caught);
    pass('22. Upstream Gemini generation error is sanitized and returned as 502 GENERATION_FAILED');
  } catch (err) {
    fail('22. Upstream Gemini generation error is sanitized and returned as 502 GENERATION_FAILED', err);
  }

  // Test 23: Student cannot delete summary -> 403
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/summaries/document/${docA._id}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error.code, 'FORBIDDEN');
    pass('23. Student attempting to delete summary returns 403 Forbidden');
  } catch (err) {
    fail('23. Student attempting to delete summary returns 403 Forbidden', err);
  }

  // Test 24: Admin can delete summary -> 200 OK
  try {
    const res = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/summaries/document/${docA._id}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.deletedCount >= 1);

    const count = await LectureSummary.countDocuments({ document: docA._id });
    assert.strictEqual(count, 0);
    pass('24. Admin successfully deletes summaries for document');
  } catch (err) {
    fail('24. Admin successfully deletes summaries for document', err);
  }

  // Clean up
  try {
    await User.deleteMany({ email: { $regex: /@phase8test\.com$/ } });
    await Module.deleteMany({ moduleCode: { $regex: /^P8/ } });
    await Document.deleteMany({ originalName: { $regex: /^Phase 8/ } });
    await DocumentChunk.deleteMany({ text: { $regex: /learning|confidential/i } });
    await LectureSummary.deleteMany({});
    pass('25. Test fixtures cleanly removed from test database');
  } catch (err) {
    fail('25. Cleanup fixtures', err);
  }

  // Close server & DB
  if (server) {
    await new Promise((res) => server.close(res));
  }
  await mongoose.disconnect();
  console.log('ℹ Test server and database connections closed.\n');

  console.log('==================================================');
  console.log(`PHASE 8 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test suite failure:', err);
  process.exit(1);
});
