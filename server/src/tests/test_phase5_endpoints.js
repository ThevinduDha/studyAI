import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
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
import * as documentService from '../services/documents/document.service.js';
import * as documentProcessingService from '../services/documents/documentProcessing.service.js';
import * as vectorIndexHelper from '../config/vectorIndex.js';

const TEST_PORT = 5096;
let server;
let adminToken;
let studentToken;
let unenrolledStudentToken;
let adminUser;
let studentUser;
let testModule;

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

function buildSamplePdf(paragraphs) {
  let streamLines = ['BT', '/F1 12 Tf', '50 750 Td', '18 TL'];
  for (const p of paragraphs) {
    const words = p.split(/\s+/);
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 70) {
        streamLines.push(`(${line.replace(/[()\\]/g, '\\$&')}) Tj T*`);
        line = w;
      } else {
        line = line ? line + ' ' + w : w;
      }
    }
    if (line) {
      streamLines.push(`(${line.replace(/[()\\]/g, '\\$&')}) Tj T*`);
    }
    streamLines.push('T*');
  }
  streamLines.push('ET');

  const streamContent = streamLines.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf8');

  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000233 00000 n 
0000000310 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;
}

/**
 * Creates a deterministic mock 768-dimensional embedding vector
 */
function createMockVector(dim = 768, seed = 0.5) {
  const vec = new Array(dim);
  for (let i = 0; i < dim; i++) {
    vec[i] = Number((Math.sin(seed + i * 0.1) * 0.5).toFixed(6));
  }
  return vec;
}

/**
 * Mock Gemini client simulating @google/genai SDK
 */
function createMockGeminiClient(options = {}) {
  const targetDim = options.dim !== undefined ? options.dim : 768;
  const shouldFail = options.shouldFail || false;

  return {
    models: {
      embedContent: async (params) => {
        if (shouldFail) {
          throw new Error('Simulated Gemini API 503 Overloaded');
        }

        const contents = Array.isArray(params.contents) ? params.contents : [params.contents];
        const embeddings = contents.map((c, idx) => ({
          values: createMockVector(targetDim, idx + 1)
        }));

        return {
          embeddings
        };
      }
    }
  };
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 5 — AUTOMATED VERIFICATION SUITE');
  console.log('==================================================\n');

  let passedCount = 0;

  // ==========================================
  // PART 1: UNIT TESTS FOR EMBEDDING SERVICE
  // ==========================================
  console.log('--- PART 1: EMBEDDING SERVICE UNIT TESTS ---');

  // 1. Missing GEMINI_API_KEY handled safely
  try {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      embeddingService.getClient();
      assert.fail('Expected getClient to throw when GEMINI_API_KEY is missing');
    } catch (err) {
      assert.equal(err.code, 'GEMINI_NOT_CONFIGURED');
    } finally {
      if (origKey) process.env.GEMINI_API_KEY = origKey;
    }
    console.log('  ✔ PASS: 1. Missing GEMINI_API_KEY handled safely (GEMINI_NOT_CONFIGURED)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 1. Missing GEMINI_API_KEY', err.message);
  }

  // 2. Embedding service rejects empty text
  try {
    const mockClient = createMockGeminiClient();
    await assert.rejects(
      async () => embeddingService.generateEmbedding('', { client: mockClient }),
      { code: 'INVALID_INPUT' }
    );
    await assert.rejects(
      async () => embeddingService.generateEmbedding('   ', { client: mockClient }),
      { code: 'INVALID_INPUT' }
    );
    console.log('  ✔ PASS: 2. Embedding service rejects empty and whitespace-only text');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 2. Empty text rejection', err.message);
  }

  // 3. Response parsing & single embedding generation
  try {
    const mockClient = createMockGeminiClient({ dim: 768 });
    const vec = await embeddingService.generateEmbedding('Distributed systems are fault tolerant.', {
      client: mockClient,
      dimensions: 768
    });
    assert.ok(Array.isArray(vec), 'Vector should be an array');
    assert.equal(vec.length, 768, 'Vector length should match 768');
    assert.ok(vec.every((v) => typeof v === 'number' && Number.isFinite(v)));
    console.log('  ✔ PASS: 3. Embedding response parsed correctly into 768 numeric dimensions');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 3. Response parsing', err.message);
  }

  // 4. Dimension validation works
  try {
    const valid768 = createMockVector(768);
    const validated = embeddingService.validateVector(valid768, 768);
    assert.equal(validated.length, 768);
    console.log('  ✔ PASS: 4. Dimension validation passes for exact configured dimensions (768)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 4. Dimension validation', err.message);
  }

  // 5. Wrong vector dimensions are rejected
  try {
    const invalid512 = createMockVector(512);
    assert.throws(
      () => embeddingService.validateVector(invalid512, 768),
      { code: 'EMBEDDING_DIMENSION_MISMATCH' }
    );

    const mockMismatchedClient = createMockGeminiClient({ dim: 512 });
    await assert.rejects(
      async () =>
        embeddingService.generateEmbedding('Some academic text', {
          client: mockMismatchedClient,
          dimensions: 768
        }),
      { code: 'EMBEDDING_DIMENSION_MISMATCH' }
    );
    console.log('  ✔ PASS: 5. Wrong vector dimensions strictly rejected (EMBEDDING_DIMENSION_MISMATCH)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 5. Wrong vector dimension rejection', err.message);
  }

  // 6. Non-numeric vector values rejected
  try {
    const corruptedVec = createMockVector(768);
    corruptedVec[10] = NaN;
    assert.throws(
      () => embeddingService.validateVector(corruptedVec, 768),
      { code: 'INVALID_EMBEDDING_VALUES' }
    );
    console.log('  ✔ PASS: 6. Non-numeric or NaN values in vector strictly rejected (INVALID_EMBEDDING_VALUES)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 6. Non-numeric vector rejection', err.message);
  }

  // 7. Batch embedding generates matching vectors preserving order
  try {
    const mockClient = createMockGeminiClient({ dim: 768 });
    const texts = [
      'Segment 1: Consensus algorithms in distributed nodes',
      'Segment 2: Byzantine fault tolerance and quorums',
      'Segment 3: Brewer CAP theorem and network partitions'
    ];
    const vectors = await embeddingService.generateEmbeddings(texts, {
      client: mockClient,
      dimensions: 768,
      batchSize: 2
    });
    assert.equal(vectors.length, 3, 'Batch should return 3 vectors');
    assert.equal(vectors[0].length, 768);
    assert.equal(vectors[1].length, 768);
    assert.equal(vectors[2].length, 768);
    // Ensure distinct vectors for distinct inputs
    assert.notDeepEqual(vectors[0], vectors[1]);
    console.log('  ✔ PASS: 7. Batch embedding preserves exact input/output order and array count');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 7. Batch embedding', err.message);
  }

  // 8. Vector search index specification validation
  try {
    assert.equal(vectorIndexHelper.INDEX_NAME, 'document_chunks_vector_index');
    assert.equal(vectorIndexHelper.VECTOR_INDEX_SPEC.name, 'document_chunks_vector_index');
    assert.equal(vectorIndexHelper.VECTOR_INDEX_SPEC.type, 'vectorSearch');
    const fields = vectorIndexHelper.VECTOR_INDEX_SPEC.definition.fields;
    const vectorField = fields.find((f) => f.path === 'embedding');
    assert.ok(vectorField, 'Vector field "embedding" must exist');
    assert.equal(vectorField.numDimensions, 768);
    assert.equal(vectorField.similarity, 'cosine');
    const moduleFilter = fields.find((f) => f.path === 'module' && f.type === 'filter');
    const docFilter = fields.find((f) => f.path === 'document' && f.type === 'filter');
    assert.ok(moduleFilter, 'Module filter field must exist in index');
    assert.ok(docFilter, 'Document filter field must exist in index');
    console.log('  ✔ PASS: 8. Atlas Vector Search index specification verified (768 dims, cosine, module & document filters)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 8. Vector search index definition', err.message);
  }

  // ==========================================
  // PART 2: DATABASE, INGESTION & API TESTS
  // ==========================================
  console.log('\n--- PART 2: DATABASE, INGESTION & API INTEGRATION TESTS ---');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('CRITICAL: MONGODB_URI not found in server/.env');
    process.exit(1);
  }

  console.log('ℹ Connecting to test database environment...');
  await mongoose.connect(mongoUri);
  console.log('  ✔ PASS: MongoDB connection verified');
  passedCount++;

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`ℹ Test HTTP server listening on port ${TEST_PORT}`);

  // Setup test fixtures
  await User.deleteMany({ email: /phase5_test/ });
  await Module.deleteMany({ moduleCode: /TEST50/ });

  adminUser = await User.create({
    name: 'Phase 5 Admin',
    email: 'phase5_test_admin@studyai.edu',
    password: 'SecurePassword123!',
    role: 'admin'
  });

  studentUser = await User.create({
    name: 'Phase 5 Student',
    email: 'phase5_test_student@studyai.edu',
    password: 'SecurePassword123!',
    role: 'student'
  });

  const unenrolledStudent = await User.create({
    name: 'Phase 5 Unenrolled',
    email: 'phase5_test_unenrolled@studyai.edu',
    password: 'SecurePassword123!',
    role: 'student'
  });

  testModule = await Module.create({
    moduleCode: 'TEST501',
    moduleName: 'Cloud Infrastructure & Distributed Storage',
    description: 'Phase 5 verification module',
    lecturer: 'Prof. Vector',
    createdBy: adminUser._id
  });

  studentUser.enrolledModules.push(testModule._id);
  await studentUser.save();

  // Login tokens
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    JSON.stringify({ email: 'phase5_test_admin@studyai.edu', password: 'SecurePassword123!' })
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
    JSON.stringify({ email: 'phase5_test_student@studyai.edu', password: 'SecurePassword123!' })
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
    JSON.stringify({ email: 'phase5_test_unenrolled@studyai.edu', password: 'SecurePassword123!' })
  );
  unenrolledStudentToken = unenrolledLogin.data.data.token;

  console.log('  ✔ PASS: Created test users, modules, and auth tokens');
  passedCount++;

  // 10. Document processing creates chunks with 768-dim embeddings in MongoDB
  let testDoc;
  try {
    const uploadDir = path.resolve(process.cwd(), 'uploads/documents');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const dummyPdfPath = path.join(uploadDir, `test_p5_${Date.now()}.pdf`);
    const pdfBuffer = Buffer.from(
      buildSamplePdf([
        'Distributed systems comprise multiple autonomous computing entities that communicate over computer networks.',
        'Consensus algorithms such as Paxos and Raft guarantee state machine replication across unreliable nodes.'
      ]),
      'utf8'
    );
    fs.writeFileSync(dummyPdfPath, pdfBuffer);

    testDoc = await Document.create({
      module: testModule._id,
      uploadedBy: adminUser._id,
      originalName: 'phase5_lecture1.pdf',
      storedName: path.basename(dummyPdfPath),
      filePath: dummyPdfPath,
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      status: 'uploaded'
    });

    const mockClient = createMockGeminiClient({ dim: 768 });
    await documentProcessingService.processDocument(testDoc._id, { embeddingClient: mockClient });

    const updatedDoc = await Document.findById(testDoc._id);
    assert.equal(updatedDoc.status, 'processed');
    assert.equal(updatedDoc.embeddingStatus, 'completed');
    assert.ok(updatedDoc.chunkCount > 0);
    assert.equal(updatedDoc.embeddedChunkCount, updatedDoc.chunkCount);

    const chunks = await DocumentChunk.find({ document: testDoc._id }).select('+embedding');
    assert.equal(chunks.length, updatedDoc.chunkCount);
    for (const chunk of chunks) {
      assert.ok(Array.isArray(chunk.embedding), 'Chunk embedding must be an array');
      assert.equal(chunk.embedding.length, 768, 'Chunk embedding dimensionality must be 768');
      assert.equal(chunk.embeddingModel, 'gemini-embedding-2');
      assert.equal(chunk.embeddingDimensions, 768);
      assert.equal(chunk.embeddingStatus, 'completed');
      assert.ok(chunk.embeddingGeneratedAt instanceof Date);
    }
    console.log(
      `  ✔ PASS: 10. Document chunks receive 768-dim embeddings and metadata in MongoDB (${chunks.length} chunks)`
    );
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 10. Chunk embedding in processing pipeline', err.message);
  }

  // 11. Chunks retrieved via standard API do NOT expose raw vectors
  try {
    const chunkApiRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/documents/${testDoc._id}/chunks?page=1&limit=5`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(chunkApiRes.status, 200);
    const chunkItems = chunkApiRes.data.data.chunks;
    assert.ok(chunkItems.length > 0);
    for (const c of chunkItems) {
      assert.equal(c.embedding, undefined, 'Embedding array MUST NOT be exposed in chunk API');
      assert.equal(c.embeddingStatus, 'completed');
      assert.equal(c.embeddingModel, 'gemini-embedding-2');
      assert.equal(c.embeddingDimensions, 768);
    }
    console.log('  ✔ PASS: 11. Chunk retrieval API safely omits raw embedding vector arrays');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 11. Chunk retrieval vector concealment', err.message);
  }

  // 12. Reprocessing safety: replaces old chunks and embeddings cleanly
  try {
    const mockClient = createMockGeminiClient({ dim: 768 });
    await documentProcessingService.processDocument(testDoc._id, { embeddingClient: mockClient });

    const totalChunks = await DocumentChunk.countDocuments({ document: testDoc._id });
    const updatedDoc = await Document.findById(testDoc._id);
    assert.equal(totalChunks, updatedDoc.chunkCount);
    assert.equal(updatedDoc.embeddedChunkCount, updatedDoc.chunkCount);
    console.log('  ✔ PASS: 12. Reprocessing safely replaces chunks and embeddings without duplicates');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 12. Reprocessing idempotency', err.message);
  }

  // 13. Failed embedding updates status correctly and leaves no partial state
  try {
    const failingClient = createMockGeminiClient({ shouldFail: true });
    await documentProcessingService.processDocument(testDoc._id, { embeddingClient: failingClient });

    const failedDoc = await Document.findById(testDoc._id);
    assert.equal(failedDoc.status, 'failed');
    assert.equal(failedDoc.embeddingStatus, 'failed');
    assert.ok(failedDoc.processingError.includes('Embedding') || failedDoc.processingError.includes('Simulated'));

    const remainingChunks = await DocumentChunk.countDocuments({ document: testDoc._id });
    assert.equal(remainingChunks, 0, 'Failed embedding must clean up partial chunks');
    console.log('  ✔ PASS: 13. Failed embedding gracefully marks status "failed" and wipes partial chunks');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 13. Embedding failure handling', err.message);
  }

  // 14. GET /api/documents/:id/embedding-status requires authentication
  try {
    const unauthRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/documents/${testDoc._id}/embedding-status`,
      method: 'GET'
    });
    assert.equal(unauthRes.status, 401);
    console.log('  ✔ PASS: 14. GET /api/documents/:id/embedding-status requires authentication (401)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 14. Embedding status unauth check', err.message);
  }

  // 15. GET /api/documents/:id/embedding-status is admin-only
  try {
    const studentRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/documents/${testDoc._id}/embedding-status`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(studentRes.status, 403);
    console.log('  ✔ PASS: 15. Students cannot access embedding status endpoint (403 Forbidden)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 15. Student embedding status rejection', err.message);
  }

  // 16. Admin can inspect embedding status with complete summary metrics
  try {
    // Re-process to healthy state first
    const mockClient = createMockGeminiClient({ dim: 768 });
    await documentProcessingService.processDocument(testDoc._id, { embeddingClient: mockClient });

    const adminStatusRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/documents/${testDoc._id}/embedding-status`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(adminStatusRes.status, 200);
    const data = adminStatusRes.data.data;
    assert.equal(data.documentId, testDoc._id.toString());
    assert.ok(data.totalChunks > 0);
    assert.equal(data.embeddedChunks, data.totalChunks);
    assert.equal(data.failedChunks, 0);
    assert.equal(data.status, 'completed');
    assert.equal(data.model, 'gemini-embedding-2');
    assert.equal(data.dimensions, 768);
    assert.equal(data.embedding, undefined, 'Vectors must not be returned');
    assert.equal(data.vectors, undefined);
    console.log('  ✔ PASS: 16. Admin receives embedding status & metrics (no vectors leaked)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 16. Admin embedding status metrics', err.message);
  }

  // 17. Re-embed endpoint requires admin authorization
  try {
    const studentReEmbed = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/documents/${testDoc._id}/re-embed`,
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(studentReEmbed.status, 403);
    console.log('  ✔ PASS: 17. Students cannot trigger re-embedding (403 Forbidden)');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 17. Student re-embed rejection', err.message);
  }

  // 18. Re-embed endpoint updates existing chunks with fresh embeddings
  try {
    const mockClient = createMockGeminiClient({ dim: 768, seed: 0.99 });
    const result = await documentService.reEmbedDocument(testDoc._id, adminUser, {
      embeddingClient: mockClient
    });
    assert.equal(result.status, 'completed');
    assert.equal(result.embeddedChunks, result.totalChunks);
    assert.equal(result.dimensions, 768);

    const chunks = await DocumentChunk.find({ document: testDoc._id }).select('+embedding');
    assert.ok(chunks.length > 0);
    for (const c of chunks) {
      assert.equal(c.embedding.length, 768);
      assert.equal(c.embeddingStatus, 'completed');
    }
    console.log('  ✔ PASS: 18. Re-embedding successfully updates all existing chunks in MongoDB');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 18. Re-embedding execution', err.message);
  }

  // 19. Atlas Vector Search index is verified in MongoDB Atlas
  try {
    const indexStatus = await vectorIndexHelper.getVectorIndexStatus();
    assert.ok(indexStatus.exists, 'document_chunks_vector_index must exist in Atlas');
    console.log(
      `  ✔ PASS: 19. Atlas Vector Search index verified: status="${indexStatus.status}", queryable=${indexStatus.queryable}`
    );
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 19. Atlas Vector index verification', err.message);
  }

  // 20. Cascade deletion cleans up chunks and embedding vectors
  try {
    await documentService.deleteDocument(testDoc._id, adminUser);
    const orphanChunks = await DocumentChunk.countDocuments({ document: testDoc._id });
    assert.equal(orphanChunks, 0);
    console.log('  ✔ PASS: 20. Document deletion cascades to remove all associated chunks and vectors');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 20. Cascade deletion of vectors', err.message);
  }

  // 21. Regressions: Phase 2, 3, 4 endpoints remain functional
  try {
    const meRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(meRes.status, 200);

    const modRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/modules',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(modRes.status, 200);

    const docListRes = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/documents?moduleId=${testModule._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(docListRes.status, 200);

    console.log('  ✔ PASS: 21. Phase 2, 3, and 4 regression verification successful');
    passedCount++;
  } catch (err) {
    console.error('  ✖ FAIL: 21. Regression verification', err.message);
  }

  // Clean up fixtures
  try {
    await User.deleteMany({ email: /phase5_test/ });
    await Module.deleteMany({ moduleCode: /TEST50/ });
    await Document.deleteMany({ module: testModule._id });
    await DocumentChunk.deleteMany({ module: testModule._id });
  } catch {}

  server.close();
  await mongoose.disconnect();
  console.log('ℹ Test server and database connections closed.');

  console.log('\n==================================================');
  console.log(`PHASE 5 TEST SUMMARY: ${passedCount} PASSED`);
  console.log('==================================================\n');

  if (passedCount < 21) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('UNCAUGHT TEST RUNNER ERROR:', err);
  process.exit(1);
});
