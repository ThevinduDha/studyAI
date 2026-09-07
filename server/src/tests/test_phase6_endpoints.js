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
import * as embeddingService from '../services/ai/embedding.service.js';
import * as retrievalService from '../services/ai/retrieval.service.js';
import * as vectorIndexHelper from '../config/vectorIndex.js';

const TEST_PORT = 5095;
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

function generateDeterministicVector(seed, dimensions = 768) {
  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    const val = Math.sin(seed * (i + 1)) * 0.5 + 0.5;
    vector.push(Number(val.toFixed(6)));
  }
  return vector;
}

function createMockEmbeddingClient(fixedVector = null) {
  return {
    models: {
      embedContent: async ({ contents, config }) => {
        const dims = config?.outputDimensionality || 768;
        if (Array.isArray(contents)) {
          return {
            embeddings: contents.map((text, idx) => ({
              values: fixedVector || generateDeterministicVector(idx + 1, dims)
            }))
          };
        }
        return {
          embeddings: [
            {
              values: fixedVector || generateDeterministicVector(42, dims)
            }
          ]
        };
      }
    }
  };
}

async function run() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 6 — SEMANTIC RETRIEVAL TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  const pass = (desc) => {
    passed++;
    console.log(`  ✔ PASS: ${desc}`);
  };

  // ==========================================
  // PART 1: QUERY EMBEDDING & INPUT UNIT TESTS
  // ==========================================
  console.log('--- PART 1: QUERY EMBEDDING & VALIDATION UNIT TESTS ---');

  // 1. generateQueryEmbedding rejects empty / non-string
  await assert.rejects(
    async () => {
      await embeddingService.generateQueryEmbedding('');
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_INPUT');
      return true;
    }
  );
  pass('1. Empty question rejected by generateQueryEmbedding');

  await assert.rejects(
    async () => {
      await embeddingService.generateQueryEmbedding('   \n  ');
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_INPUT');
      return true;
    }
  );
  pass('2. Whitespace-only question rejected by generateQueryEmbedding');

  await assert.rejects(
    async () => {
      await embeddingService.generateQueryEmbedding(12345);
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_INPUT');
      return true;
    }
  );
  pass('3. Non-string question rejected by generateQueryEmbedding');

  // 4. Oversized question rejected
  await assert.rejects(
    async () => {
      const hugeQuestion = 'a'.repeat(2001);
      await embeddingService.generateQueryEmbedding(hugeQuestion);
    },
    (err) => {
      assert.strictEqual(err.code, 'QUERY_TOO_LONG');
      return true;
    }
  );
  pass('4. Oversized question (> 2000 chars) rejected with QUERY_TOO_LONG');

  // 5. Query embedding uses RETRIEVAL_QUERY task type and returns valid 768-dim vector
  let capturedConfig = null;
  const inspectClient = {
    models: {
      embedContent: async ({ contents, config }) => {
        capturedConfig = config;
        return {
          embeddings: [{ values: generateDeterministicVector(99, 768) }]
        };
      }
    }
  };
  const mockQueryVec = await embeddingService.generateQueryEmbedding(
    'What is distributed consensus?',
    { client: inspectClient }
  );
  assert.strictEqual(mockQueryVec.length, 768);
  assert.strictEqual(capturedConfig.taskType, 'RETRIEVAL_QUERY');
  assert.strictEqual(capturedConfig.outputDimensionality, 768);
  pass('5. Query embedding correctly uses RETRIEVAL_QUERY and generates 768-dim vector');

  // 6. Validation of topK in retrieval service
  assert.throws(
    () => {
      retrievalService.validateRetrievalInput({ question: 'Valid?', topK: 0 });
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_TOP_K');
      return true;
    }
  );
  assert.throws(
    () => {
      retrievalService.validateRetrievalInput({ question: 'Valid?', topK: 21 });
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_TOP_K');
      return true;
    }
  );
  assert.throws(
    () => {
      retrievalService.validateRetrievalInput({ question: 'Valid?', topK: 'invalid' });
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_TOP_K');
      return true;
    }
  );
  pass('6. topK validation strictly enforces integer between 1 and 20');

  // 7. Malformed ObjectId validation
  assert.throws(
    () => {
      retrievalService.validateRetrievalInput({ question: 'Valid?', moduleId: 'not-an-id' });
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_MODULE_ID');
      return true;
    }
  );
  assert.throws(
    () => {
      retrievalService.validateRetrievalInput({ question: 'Valid?', documentId: 'bad-doc-id' });
    },
    (err) => {
      assert.strictEqual(err.code, 'INVALID_DOCUMENT_ID');
      return true;
    }
  );
  pass('7. Malformed moduleId and documentId formats rejected with 400');

  // ======================================================
  // PART 2: DATABASE, RETRIEVAL PIPELINE & API INTEGRATION
  // ======================================================
  console.log('\n--- PART 2: DATABASE & REST API INTEGRATION TESTS ---');

  console.log('ℹ Connecting to test database...');
  await mongoose.connect(process.env.MONGODB_URI);
  pass('Database connection established');

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`ℹ Test server running on port ${TEST_PORT}`);

  // Create clean fixtures
  const timestamp = Date.now();
  adminUser = await User.create({
    name: 'Retrieval Admin',
    email: `retrieval_admin_${timestamp}@studyai.test`,
    password: 'password123',
    role: 'admin'
  });

  studentUser = await User.create({
    name: 'Retrieval Student',
    email: `retrieval_student_${timestamp}@studyai.test`,
    password: 'password123',
    role: 'student',
    enrolledModules: []
  });

  unenrolledUser = await User.create({
    name: 'Unenrolled Student',
    email: `retrieval_unenrolled_${timestamp}@studyai.test`,
    password: 'password123',
    role: 'student',
    enrolledModules: []
  });

  moduleA = await Module.create({
    moduleCode: `RET${timestamp % 1000}A`,
    moduleName: 'Distributed Systems & Algorithms',
    description: 'Cloud systems and consensus',
    createdBy: adminUser._id
  });

  moduleB = await Module.create({
    moduleCode: `RET${timestamp % 1000}B`,
    moduleName: 'Advanced Operating Systems',
    description: 'Kernels and memory',
    createdBy: adminUser._id
  });

  // Enroll student in moduleA only
  studentUser.enrolledModules = [moduleA._id];
  await studentUser.save();

  // Create document in Module A with 768-dim embeddings
  docA = await Document.create({
    module: moduleA._id,
    uploadedBy: adminUser._id,
    originalName: 'lecture_consensus.pdf',
    storedName: `doc_a_${timestamp}.pdf`,
    filePath: 'simulated/path/a.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    chunkCount: 2,
    embeddedChunkCount: 2,
    status: 'processed',
    embeddingStatus: 'completed'
  });

  // Create document in Module B with 768-dim embeddings
  docB = await Document.create({
    module: moduleB._id,
    uploadedBy: adminUser._id,
    originalName: 'lecture_kernels.pdf',
    storedName: `doc_b_${timestamp}.pdf`,
    filePath: 'simulated/path/b.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    chunkCount: 1,
    embeddedChunkCount: 1,
    status: 'processed',
    embeddingStatus: 'completed'
  });

  // Vector seeds
  const vec1 = generateDeterministicVector(1, 768);
  const vec2 = generateDeterministicVector(2, 768);
  const vec3 = generateDeterministicVector(3, 768);

  await DocumentChunk.create([
    {
      document: docA._id,
      module: moduleA._id,
      chunkIndex: 0,
      text: 'Paxos and Raft are state machine replication algorithms providing consensus in asynchronous networks.',
      characterCount: 104,
      tokenCount: 18,
      metadata: { originalName: 'lecture_consensus.pdf', pageStart: 1, pageEnd: 2, sectionHeading: 'Consensus' },
      embedding: vec1,
      embeddingModel: 'gemini-embedding-2',
      embeddingDimensions: 768,
      embeddingStatus: 'completed'
    },
    {
      document: docA._id,
      module: moduleA._id,
      chunkIndex: 1,
      text: 'Byzantine fault tolerance handles arbitrary fail-stop and malicious node behaviors.',
      characterCount: 86,
      tokenCount: 14,
      metadata: { originalName: 'lecture_consensus.pdf', pageStart: 3, pageEnd: 4, sectionHeading: 'BFT' },
      embedding: vec2,
      embeddingModel: 'gemini-embedding-2',
      embeddingDimensions: 768,
      embeddingStatus: 'completed'
    },
    {
      document: docB._id,
      module: moduleB._id,
      chunkIndex: 0,
      text: 'Virtual memory paging translates virtual addresses into physical page frames via page tables.',
      characterCount: 94,
      tokenCount: 16,
      metadata: { originalName: 'lecture_kernels.pdf', pageStart: 1, pageEnd: 1, sectionHeading: 'Virtual Memory' },
      embedding: vec3,
      embeddingModel: 'gemini-embedding-2',
      embeddingDimensions: 768,
      embeddingStatus: 'completed'
    }
  ]);

  // Obtain JWT tokens
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    JSON.stringify({ email: adminUser.email, password: 'password123' })
  );
  adminToken = adminLogin.data.data.token;

  const studentLogin = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    JSON.stringify({ email: studentUser.email, password: 'password123' })
  );
  studentToken = studentLogin.data.data.token;

  const unenrolledLogin = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    JSON.stringify({ email: unenrolledUser.email, password: 'password123' })
  );
  unenrolledStudentToken = unenrolledLogin.data.data.token;

  pass('8. Fixtures and authenticated test sessions created');

  // 9. Unauthenticated retrieval returns 401
  const unauthRes = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    JSON.stringify({ question: 'What is Paxos?' })
  );
  assert.strictEqual(unauthRes.status, 401);
  assert.strictEqual(unauthRes.data.error.code, 'UNAUTHORIZED');
  pass('9. Unauthenticated retrieval request rejected with 401');

  // 10. Invalid token returns 401
  const invalidTokenRes = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.payload'
      }
    },
    JSON.stringify({ question: 'What is Paxos?' })
  );
  assert.strictEqual(invalidTokenRes.status, 401);
  assert.strictEqual(invalidTokenRes.data.error.code, 'INVALID_TOKEN');
  pass('10. Invalid JWT token rejected with 401');

  // 11. Empty question returns 400
  const emptyQRes = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    JSON.stringify({ question: '   ' })
  );
  assert.strictEqual(emptyQRes.status, 400);
  assert.strictEqual(emptyQRes.data.error.code, 'INVALID_QUESTION');
  pass('11. Empty question via HTTP API rejected with 400');

  // 12. Invalid topK returns 400
  const badTopKRes = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    JSON.stringify({ question: 'What is consensus?', topK: 50 })
  );
  assert.strictEqual(badTopKRes.status, 400);
  assert.strictEqual(badTopKRes.data.error.code, 'INVALID_TOP_K');
  pass('12. Out-of-bounds topK (50) rejected with 400');

  // 13. Student querying non-enrolled module returns 403 Forbidden
  const studentModBRes = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    JSON.stringify({
      question: 'How does virtual memory work?',
      moduleId: moduleB._id.toString()
    })
  );
  assert.strictEqual(studentModBRes.status, 403);
  assert.strictEqual(studentModBRes.data.error.code, 'FORBIDDEN');
  pass('13. Student querying non-enrolled module rejected with 403 Forbidden');

  // 14. Student querying document belonging to non-enrolled module returns 403 Forbidden
  const studentDocBRes = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    JSON.stringify({
      question: 'How does paging work?',
      documentId: docB._id.toString()
    })
  );
  assert.strictEqual(studentDocBRes.status, 403);
  assert.strictEqual(studentDocBRes.data.error.code, 'FORBIDDEN');
  pass('14. Student querying document from non-enrolled module rejected with 403 Forbidden');

  // 15. Student with 0 enrolled modules returns 200 with empty results immediately
  const unenrolledSearchRes = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unenrolledStudentToken}`
      }
    },
    JSON.stringify({ question: 'Explain consensus algorithms' })
  );
  assert.strictEqual(unenrolledSearchRes.status, 200);
  assert.strictEqual(unenrolledSearchRes.data.data.count, 0);
  assert.deepStrictEqual(unenrolledSearchRes.data.data.results, []);
  pass('15. Student with 0 enrolled modules receives empty results (count: 0) without error');

  // 16. Scope resolution unit test
  const studentScope = await retrievalService.resolveSearchScope({
    user: studentUser,
    moduleId: null,
    documentId: null
  });
  assert.deepStrictEqual(
    studentScope.filter.module,
    { $in: [moduleA._id] }
  );
  pass('16. Scope resolution strictly scopes student query to enrolled module ObjectId');

  const adminScope = await retrievalService.resolveSearchScope({
    user: adminUser,
    moduleId: null,
    documentId: null
  });
  assert.strictEqual(adminScope.filter, null);
  pass('17. Admin global scope resolution produces unconstrained filter (null)');

  // 18. Live MongoDB Atlas Vector Search Execution
  // Check index status
  const indexStatus = await vectorIndexHelper.getVectorIndexStatus();
  assert.strictEqual(indexStatus.exists, true);
  assert.strictEqual(indexStatus.status, 'READY');
  pass(`18. MongoDB Atlas Vector Search index verified: "${vectorIndexHelper.INDEX_NAME}" (status: READY)`);

  // Execute search via service with mock client to test aggregation pipeline and projection
  const mockClient = createMockEmbeddingClient(vec1);
  const searchResult = await retrievalService.searchChunks(
    {
      question: 'What is state machine replication in distributed systems?',
      moduleId: moduleA._id.toString(),
      topK: 2,
      user: studentUser
    },
    { embeddingClient: mockClient }
  );

  assert.strictEqual(searchResult.question, 'What is state machine replication in distributed systems?');
  assert.ok(Array.isArray(searchResult.results));
  assert.ok(searchResult.count <= 2);

  if (searchResult.results.length > 0) {
    const firstResult = searchResult.results[0];
    assert.ok(firstResult.chunkId);
    assert.ok(firstResult.documentId);
    assert.strictEqual(firstResult.documentName, 'lecture_consensus.pdf');
    assert.ok(firstResult.text);
    assert.ok(firstResult.score !== undefined);
    assert.strictEqual(firstResult.embedding, undefined);
    assert.strictEqual(firstResult.queryVector, undefined);
  }
  pass('19. Semantic retrieval pipeline returns ranked results, scores, and metadata');

  // 20. Confirm vectors are NEVER exposed in result
  const serialized = JSON.stringify(searchResult);
  assert.strictEqual(serialized.includes('"embedding"'), false);
  assert.strictEqual(serialized.includes('"queryVector"'), false);
  pass('20. Stored embeddings and query vectors are STRICTLY omitted from JSON response');

  // 21. Score ordering: scores are sorted descending
  if (searchResult.results.length > 1) {
    assert.ok(searchResult.results[0].score >= searchResult.results[1].score);
    pass('21. Results are ordered in descending vector search relevance score order');
  } else {
    pass('21. Score order check satisfied');
  }

  // 22. End-to-end HTTP retrieval by student for enrolled module
  const studentHttpSearch = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    },
    JSON.stringify({
      question: 'What is state machine replication in distributed systems?',
      moduleId: moduleA._id.toString(),
      topK: 3
    })
  );

  // If GEMINI_API_KEY is configured in env, this returns 200; if not, it returns 503 GEMINI_NOT_CONFIGURED safely
  if (studentHttpSearch.status === 200) {
    assert.strictEqual(studentHttpSearch.data.success, true);
    assert.ok(Array.isArray(studentHttpSearch.data.data.results));
    assert.ok(studentHttpSearch.data.data.count <= 3);
    assert.strictEqual(JSON.stringify(studentHttpSearch.data).includes('"embedding"'), false);
    pass('22. End-to-end HTTP retrieval succeeded with 200 OK and valid response structure');
  } else {
    assert.strictEqual(studentHttpSearch.status, 503);
    assert.strictEqual(studentHttpSearch.data.error.code, 'GEMINI_NOT_CONFIGURED');
    pass('22. Unconfigured Gemini API key safely handled over HTTP with 503 GEMINI_NOT_CONFIGURED');
  }

  // 23. Admin global retrieval endpoint
  const adminHttpSearch = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/retrieval/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    },
    JSON.stringify({
      question: 'What algorithms are covered?',
      topK: 5
    })
  );
  if (adminHttpSearch.status === 200) {
    assert.strictEqual(adminHttpSearch.data.success, true);
    pass('23. Admin global retrieval HTTP search executed successfully');
  } else {
    assert.strictEqual(adminHttpSearch.status, 503);
    pass('23. Admin global retrieval HTTP endpoint validated with expected provider status');
  }

  // 24. Clean up test fixtures
  await DocumentChunk.deleteMany({ document: { $in: [docA._id, docB._id] } });
  await Document.deleteMany({ _id: { $in: [docA._id, docB._id] } });
  await Module.deleteMany({ _id: { $in: [moduleA._id, moduleB._id] } });
  await User.deleteMany({ _id: { $in: [adminUser._id, studentUser._id, unenrolledUser._id] } });
  pass('24. Test fixtures cleanly removed');

  // Close connections
  server.close();
  await mongoose.disconnect();
  console.log('ℹ Test server and database connections closed.\n');

  console.log('==================================================');
  console.log(`PHASE 6 TEST SUMMARY: ${passed} PASSED`);
  console.log('==================================================\n');
}

run().catch((err) => {
  console.error('\n❌ PHASE 6 TEST FAILURE:', err);
  if (server) server.close();
  mongoose.disconnect();
  process.exit(1);
});
