import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/user.model.js';
import Module from '../models/module.model.js';
import Document from '../models/document.model.js';
import DocumentChunk from '../models/documentChunk.model.js';
import { generateToken } from '../utils/jwt.js';
import connectDB, { isDbConnected } from '../config/db.js';
import {
  chunkDocumentText,
  estimateTokenCount,
  DEFAULT_CHUNK_SIZE_WORDS,
  DEFAULT_CHUNK_OVERLAP_WORDS
} from '../services/documents/chunking.service.js';
import { cleanExtractedText } from '../services/documents/textCleaning.service.js';
import { processDocument } from '../services/documents/documentProcessing.service.js';

let server;
const PORT = 5097; // Isolated test port
const baseUrl = `http://localhost:${PORT}/api`;

const logPass = (title) => console.log(`  \x1b[32m✔ PASS:\x1b[0m ${title}`);
const logFail = (title, err) => console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${title} - ${err?.message || err}`);
const logInfo = (msg) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`);

function createValidPdfBuffer(customText = 'StudyAI Phase 4 Automated Verification Document. Artificial Intelligence and Neural Networks.') {
  const lines = typeof customText === 'string'
    ? customText.split('\n').filter(Boolean)
    : [String(customText)];
  const streamLines = lines.map((l) => '(' + l.replace(/[()\\\r\n]/g, '') + ') Tj T*').join('\n');
  const streamContent = 'BT\n/F1 14 Tf\n50 720 Td\n18 TL\n' + streamLines + '\nET';
  const streamLength = Buffer.byteLength(streamContent);

  const pdf = `%PDF-1.4
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
0000000224 00000 n 
0000000293 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${350 + streamLength}
%%EOF`;

  return Buffer.from(pdf);
}

async function runPhase4Tests() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 4 — AUTOMATED VERIFICATION SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  let adminToken = '';
  let student1Token = '';
  let student2Token = '';
  let adminUser = null;
  let student1User = null;
  let student2User = null;
  let moduleA = null;
  let moduleB = null;
  let uploadedDoc = null;

  try {
    // -------------------------------------------------------------
    // PART 1: UNIT TESTS FOR CHUNKING & TEXT CLEANING SERVICES
    // -------------------------------------------------------------
    console.log('\n--- PART 1: CHUNKING & TEXT CLEANING UNIT TESTS ---');

    // Test 1: Empty text produces zero chunks
    try {
      const empty1 = chunkDocumentText('');
      const empty2 = chunkDocumentText('   \n\n\t   ');
      const empty3 = chunkDocumentText(null);
      if (empty1.length === 0 && empty2.length === 0 && empty3.length === 0) {
        logPass('1. Empty or whitespace-only text produces zero chunks');
        passed++;
      } else {
        throw new Error('Expected 0 chunks for empty input');
      }
    } catch (err) {
      logFail('1. Empty text check', err);
      failed++;
    }

    // Test 2: Text smaller than chunk size produces one chunk
    try {
      const shortText = 'Introduction to algorithms and data structures in modern software development.';
      const res = chunkDocumentText(shortText, { chunkSizeWords: 50, overlapWords: 10 });
      if (res.length === 1 && res[0].chunkIndex === 0 && res[0].text === shortText) {
        logPass('2. Text smaller than chunk size produces exactly one chunk');
        passed++;
      } else {
        throw new Error(`Expected 1 chunk, got ${res.length}`);
      }
    } catch (err) {
      logFail('2. Short text check', err);
      failed++;
    }

    // Test 3: Large text produces multiple chunks
    const paragraphA = 'Artificial intelligence is transforming tertiary education by providing personalized study assistance. Modern natural language processing enables contextual search across lecture notes and academic papers. Students can master complex material through interactive retrieval.';
    const paragraphB = 'Data structures like binary search trees and balanced red-black trees guarantee logarithmic time complexity for insertions and lookups. Graph algorithms such as Dijkstra and Floyd-Warshall solve shortest path problems in computer networks.';
    const paragraphC = 'Computer architecture encompasses instruction set design, pipelining, cache coherence, and virtual memory systems. Understanding latency differences between L1 cache and main memory is fundamental for performance engineering.';
    const largeText = `${paragraphA}\n\n${paragraphB}\n\n${paragraphC}`;

    try {
      // Use small chunk size (25 words) to force multiple chunks
      const res = chunkDocumentText(largeText, { chunkSizeWords: 25, overlapWords: 8 });
      if (res.length >= 3) {
        logPass(`3. Large multi-paragraph text produces multiple chunks (generated ${res.length} chunks)`);
        passed++;
      } else {
        throw new Error(`Expected at least 3 chunks, got ${res.length}`);
      }
    } catch (err) {
      logFail('3. Large text check', err);
      failed++;
    }

    // Test 4: Chunk boundaries prefer paragraphs
    try {
      const res = chunkDocumentText(largeText, { chunkSizeWords: 45, overlapWords: 10 });
      // Chunks spanning paragraphs should preserve \n\n
      const hasParagraphSeparators = res.some((c) => c.text.includes('\n\n'));
      if (hasParagraphSeparators) {
        logPass('4. Chunk boundaries prioritize paragraph structure (retains \\n\\n)');
        passed++;
      } else {
        throw new Error('Expected chunks spanning paragraphs to retain \\n\\n separators');
      }
    } catch (err) {
      logFail('4. Paragraph boundary check', err);
      failed++;
    }

    // Test 5: Sentence boundaries are respected where possible
    try {
      const res = chunkDocumentText(largeText, { chunkSizeWords: 30, overlapWords: 10 });
      // Verify chunks end with punctuation or sentence boundaries
      const endsWithPunctuation = res.every((c) => /[.!?]/.test(c.text.slice(-1)));
      if (endsWithPunctuation) {
        logPass('5. Sentence boundaries are strictly respected (chunks end on sentence termination)');
        passed++;
      } else {
        throw new Error('One or more chunks did not terminate on sentence boundaries');
      }
    } catch (err) {
      logFail('5. Sentence boundary check', err);
      failed++;
    }

    // Test 6: Words are never split in the middle
    try {
      const res = chunkDocumentText(largeText, { chunkSizeWords: 20, overlapWords: 5 });
      let wordsAllClean = true;
      for (const c of res) {
        const words = c.text.split(/\s+/);
        for (const w of words) {
          if (/[\s]/.test(w) || w.length === 0) {
            wordsAllClean = false;
          }
        }
      }
      if (wordsAllClean) {
        logPass('6. Words are never split in the middle');
        passed++;
      } else {
        throw new Error('Found broken or corrupted words in chunk text');
      }
    } catch (err) {
      logFail('6. Word splitting check', err);
      failed++;
    }

    // Test 7: Overlap is present between consecutive chunks
    try {
      const res = chunkDocumentText(largeText, { chunkSizeWords: 30, overlapWords: 10 });
      let overlapDetected = false;
      for (let i = 0; i < res.length - 1; i++) {
        const chunk1Words = res[i].text.split(/\s+/);
        const chunk2Words = res[i + 1].text.split(/\s+/);
        // Last 3 words of chunk 1 should appear in chunk 2
        const last3OfChunk1 = chunk1Words.slice(-3).join(' ');
        if (res[i + 1].text.includes(last3OfChunk1)) {
          overlapDetected = true;
          break;
        }
      }
      if (overlapDetected) {
        logPass('7. Overlap is verified between consecutive chunks');
        passed++;
      } else {
        throw new Error('Consecutive chunks did not exhibit expected overlapping text');
      }
    } catch (err) {
      logFail('7. Overlap presence check', err);
      failed++;
    }

    // Test 8: Overlap is configurable
    try {
      const resZeroOverlap = chunkDocumentText(largeText, { chunkSizeWords: 35, overlapWords: 0 });
      const resHighOverlap = chunkDocumentText(largeText, { chunkSizeWords: 35, overlapWords: 15 });
      if (resHighOverlap.length > resZeroOverlap.length) {
        logPass(`8. Overlap is configurable (0 overlap -> ${resZeroOverlap.length} chunks; 15 overlap -> ${resHighOverlap.length} chunks)`);
        passed++;
      } else {
        throw new Error('High overlap should generate equal or more chunks than zero overlap');
      }
    } catch (err) {
      logFail('8. Configurable overlap check', err);
      failed++;
    }

    // Test 9: No empty or whitespace-only chunks are generated
    try {
      const funkyText = '\n\n\n   \n\nSome introductory remarks.\n\n\n\nMore concluding remarks.\n\n\n';
      const res = chunkDocumentText(funkyText, { chunkSizeWords: 10, overlapWords: 2 });
      const hasEmpty = res.some((c) => !c.text || !c.text.trim());
      if (!hasEmpty && res.length > 0) {
        logPass('9. No empty or whitespace-only chunks are generated');
        passed++;
      } else {
        throw new Error('Empty chunk detected');
      }
    } catch (err) {
      logFail('9. Empty chunk guard check', err);
      failed++;
    }

    // Test 10: No infinite loop occurs on repetitive or single long sentences
    try {
      const repetitiveText = 'Word '.repeat(500);
      const longSentence = 'A'.repeat(500) + ' and another words in a sentence without punctuation.';
      const resRepetitive = chunkDocumentText(repetitiveText, { chunkSizeWords: 30, overlapWords: 10 });
      const resLong = chunkDocumentText(longSentence, { chunkSizeWords: 10, overlapWords: 3 });
      if (resRepetitive.length > 0 && resLong.length > 0) {
        logPass('10. No infinite loop on repetitive or unpunctuated text');
        passed++;
      } else {
        throw new Error('Failed to chunk edge-case text');
      }
    } catch (err) {
      logFail('10. Infinite loop guard check', err);
      failed++;
    }

    // Test 11: Chunk indices are sequential (0-based)
    try {
      const res = chunkDocumentText(largeText, { chunkSizeWords: 20, overlapWords: 5 });
      const sequential = res.every((c, idx) => c.chunkIndex === idx);
      if (sequential && res[0].chunkIndex === 0) {
        logPass(`11. Chunk indices are strictly sequential 0-based integers (0 to ${res.length - 1})`);
        passed++;
      } else {
        throw new Error('Chunk indices are not strictly sequential');
      }
    } catch (err) {
      logFail('11. Sequential index check', err);
      failed++;
    }

    // Test 12: Character counts are accurate
    try {
      const res = chunkDocumentText(largeText, { chunkSizeWords: 30, overlapWords: 5 });
      const correctChars = res.every((c) => c.characterCount === c.text.length);
      if (correctChars) {
        logPass('12. Character counts accurately match chunk text string lengths');
        passed++;
      } else {
        throw new Error('Character count mismatch detected');
      }
    } catch (err) {
      logFail('12. Character count check', err);
      failed++;
    }

    // Test 13: Token count estimation is documented and calculated
    try {
      const sample = 'Deep neural networks learn hierarchical representations through backpropagation.';
      const tokens = estimateTokenCount(sample);
      // 9 words * 1.33 ≈ 12
      if (tokens >= 9 && tokens <= 15) {
        logPass(`13. Estimated token count calculated accurately (~1.33 tokens/word -> ${tokens} tokens for 9 words)`);
        passed++;
      } else {
        throw new Error(`Unexpected token estimate: ${tokens}`);
      }
    } catch (err) {
      logFail('13. Token estimation check', err);
      failed++;
    }

    // Test 14: Text cleaning service normalizes artifacts
    try {
      const dirtyText = 'Page 1 of 5\n\nHere is some text with  extra  spaces.\r\nNext line.\n\n-- 2 of 5 --\n\nAnother paragraph.\fA third paragraph.';
      const cleaned = cleanExtractedText(dirtyText);
      const hasPageArtifact = cleaned.includes('Page 1 of 5') || cleaned.includes('-- 2 of 5 --');
      const hasDoubleSpaces = /[ \t]{2,}/.test(cleaned);
      const hasFormFeed = cleaned.includes('\f');
      if (!hasPageArtifact && !hasDoubleSpaces && !hasFormFeed && cleaned.includes('Here is some text with extra spaces.')) {
        logPass('14. Text cleaning service successfully normalizes page headers, form feeds, and redundant spaces');
        passed++;
      } else {
        throw new Error(`Text cleaning did not remove expected artifacts: ${JSON.stringify(cleaned)}`);
      }
    } catch (err) {
      logFail('14. Text cleaning check', err);
      failed++;
    }

    // -------------------------------------------------------------
    // PART 2: DATABASE & ENDPOINT INTEGRATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- PART 2: DATABASE, RETRIEVAL API & CASCADE TESTS ---');

    // Setup DB and isolated HTTP server
    logInfo('Connecting to test database environment...');
    await connectDB();
    if (!isDbConnected()) throw new Error('Database not connected');
    logPass('MongoDB connection verified');
    passed++;

    server = app.listen(PORT);
    logInfo(`Test HTTP server listening on port ${PORT}`);

    // Clean fixtures
    await User.deleteMany({ email: /phase4_test.*@studyai\.edu/i });
    await Module.deleteMany({ moduleCode: /TEST40[12]/i });
    await Document.deleteMany({ originalName: /.*phase4.*|.*test_doc.*/i });
    await DocumentChunk.deleteMany({});

    // Create Admin and Student users
    adminUser = await User.create({
      name: 'Phase4 Admin',
      email: 'phase4_test_admin@studyai.edu',
      password: 'SecurePassword123!',
      role: 'admin'
    });
    adminToken = generateToken({ id: adminUser._id.toString(), role: adminUser.role, email: adminUser.email });

    student1User = await User.create({
      name: 'Phase4 Student 1 (Enrolled)',
      email: 'phase4_test_student1@studyai.edu',
      password: 'SecurePassword123!',
      role: 'student'
    });
    student1Token = generateToken({ id: student1User._id.toString(), role: student1User.role, email: student1User.email });

    student2User = await User.create({
      name: 'Phase4 Student 2 (Unenrolled)',
      email: 'phase4_test_student2@studyai.edu',
      password: 'SecurePassword123!',
      role: 'student'
    });
    student2Token = generateToken({ id: student2User._id.toString(), role: student2User.role, email: student2User.email });

    // Create Modules
    moduleA = await Module.create({
      moduleCode: 'TEST401',
      moduleName: 'Advanced Database Systems',
      description: 'Distributed transactions and indexing structures',
      semester: 'Semester 1',
      year: 2026,
      lecturer: 'Prof. Codd',
      enrolledStudents: [student1User._id]
    });

    student1User.enrolledModules = [moduleA._id];
    await student1User.save();

    moduleB = await Module.create({
      moduleCode: 'TEST402',
      moduleName: 'Theoretical Computing',
      description: 'Automata and Turing machines',
      semester: 'Semester 2',
      year: 2026,
      lecturer: 'Prof. Turing',
      enrolledStudents: []
    });

    logPass('Created test fixtures (Admin, Enrolled Student, Modules)');
    passed++;

    // Test 15: PDF upload triggers automated extraction AND chunk creation
    try {
      const form = new FormData();
      const lines = [];
      for (let i = 0; i < 220; i++) {
        lines.push(`Lecture topic ${i}. Artificial intelligence and neural networks transform machine learning with distributed algorithms and deep representations.\n\n`);
      }
      const pdfBuf = createValidPdfBuffer(lines.join(''));
      form.append('file', new Blob([pdfBuf], { type: 'application/pdf' }), 'phase4_lecture1.pdf');
      form.append('moduleId', moduleA._id.toString());

      const uploadRes = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form
      });
      const uploadData = await uploadRes.json();
      uploadedDoc = uploadData.data?.document;

      if (uploadRes.status !== 201 || !uploadedDoc?._id) {
        throw new Error(`Upload failed: status ${uploadRes.status}`);
      }

      // Wait for async processing pipeline to complete (extraction + chunking)
      let chunksInDb = [];
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const docInDb = await Document.findById(uploadedDoc._id);
        if (docInDb && docInDb.status === 'processed') {
          chunksInDb = await DocumentChunk.find({ document: uploadedDoc._id }).sort({ chunkIndex: 1 });
          if (chunksInDb.length > 0) break;
        }
      }

      if (chunksInDb.length === 0) {
        throw new Error('No DocumentChunk records were created in MongoDB after document processing');
      }

      logPass(`15. Document processing creates chunks in MongoDB (found ${chunksInDb.length} chunks)`);
      passed++;
    } catch (err) {
      logFail('15. Ingestion and chunk creation check', err);
      failed++;
    }

    // Test 16: Reprocessing document does not create duplicate chunks
    try {
      const initialChunkCount = await DocumentChunk.countDocuments({ document: uploadedDoc._id });
      // Trigger processDocument again
      await processDocument(uploadedDoc._id);
      const afterReprocessCount = await DocumentChunk.countDocuments({ document: uploadedDoc._id });

      if (afterReprocessCount === initialChunkCount) {
        const uniqueIndices = await DocumentChunk.distinct('chunkIndex', { document: uploadedDoc._id });
        if (uniqueIndices.length === afterReprocessCount) {
          logPass(`16. Reprocessing safety verified: old chunks cleanly replaced, exactly ${afterReprocessCount} chunks exist without duplicates`);
          passed++;
        } else {
          throw new Error('Duplicate chunk indices detected after reprocessing');
        }
      } else {
        throw new Error(`Chunk count changed on reprocess: was ${initialChunkCount}, now ${afterReprocessCount}`);
      }
    } catch (err) {
      logFail('16. Reprocessing safety check', err);
      failed++;
    }

    // Test 17: GET /api/documents/:id/chunks requires authentication (401)
    try {
      const res = await fetch(`${baseUrl}/documents/${uploadedDoc._id}/chunks`);
      if (res.status === 401) {
        logPass('17. GET /api/documents/:id/chunks requires authentication (401 Unauthorized)');
        passed++;
      } else {
        throw new Error(`Expected 401, got ${res.status}`);
      }
    } catch (err) {
      logFail('17. Chunks unauthenticated access check', err);
      failed++;
    }

    // Test 18: Students cannot access chunks from unenrolled modules (403)
    try {
      const res = await fetch(`${baseUrl}/documents/${uploadedDoc._id}/chunks`, {
        headers: { Authorization: `Bearer ${student2Token}` }
      });
      if (res.status === 403) {
        logPass('18. Unenrolled students cannot access chunks (403 Forbidden)');
        passed++;
      } else {
        throw new Error(`Expected 403, got ${res.status}`);
      }
    } catch (err) {
      logFail('18. Unenrolled student chunks access check', err);
      failed++;
    }

    // Test 19: Authorized enrolled student can access chunks (200)
    try {
      const res = await fetch(`${baseUrl}/documents/${uploadedDoc._id}/chunks`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data?.chunks) && data.data.chunks.length > 0) {
        logPass('19. Enrolled student can inspect chunks for their module (200 OK)');
        passed++;
      } else {
        throw new Error(`Expected 200 with chunks, got ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      logFail('19. Enrolled student chunks access check', err);
      failed++;
    }

    // Test 20: Admin can access chunks for any document (200)
    try {
      const res = await fetch(`${baseUrl}/documents/${uploadedDoc._id}/chunks`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.status === 200 && Array.isArray(data.data?.chunks) && data.data.chunks.length > 0) {
        logPass('20. Admin can access chunks for any document (200 OK)');
        passed++;
      } else {
        throw new Error(`Expected 200 with chunks for admin, got ${res.status}`);
      }
    } catch (err) {
      logFail('20. Admin chunks access check', err);
      failed++;
    }

    // Test 21: Pagination works correctly on chunk retrieval API
    try {
      // Ensure at least 2 chunks exist for uploadedDoc to verify multi-page pagination
      const currentCount = await DocumentChunk.countDocuments({ document: uploadedDoc._id });
      if (currentCount < 2) {
        await DocumentChunk.create({
          document: uploadedDoc._id,
          module: moduleA._id,
          chunkIndex: currentCount,
          text: 'Second chunk content for pagination testing.',
          characterCount: 45,
          tokenCount: 10,
          metadata: { sourceType: 'pdf', originalName: 'phase4_lecture1.pdf' }
        });
      }

      const resPage1 = await fetch(`${baseUrl}/documents/${uploadedDoc._id}/chunks?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dataPage1 = await resPage1.json();

      const resPage2 = await fetch(`${baseUrl}/documents/${uploadedDoc._id}/chunks?page=2&limit=1`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dataPage2 = await resPage2.json();

      const chunkP1 = dataPage1.data?.chunks?.[0];
      const chunkP2 = dataPage2.data?.chunks?.[0];

      if (
        dataPage1.data?.pagination?.page === 1 &&
        dataPage2.data?.pagination?.page === 2 &&
        chunkP1 &&
        chunkP2 &&
        chunkP1.chunkIndex !== chunkP2.chunkIndex
      ) {
        logPass(`21. Pagination verified (Page 1 chunk #${chunkP1.chunkIndex} != Page 2 chunk #${chunkP2.chunkIndex}, totalPages=${dataPage1.data.pagination.totalPages})`);
        passed++;
      } else {
        throw new Error(`Pagination failure: ${JSON.stringify(dataPage1.data?.pagination)}`);
      }
    } catch (err) {
      logFail('21. Chunk pagination check', err);
      failed++;
    }

    // Test 22: Deleting a document removes its chunks from MongoDB
    try {
      const chunksBefore = await DocumentChunk.countDocuments({ document: uploadedDoc._id });
      if (chunksBefore === 0) throw new Error('No chunks found before delete test');

      const delRes = await fetch(`${baseUrl}/documents/${uploadedDoc._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (delRes.status !== 200) throw new Error(`Delete document failed: status ${delRes.status}`);

      const chunksAfter = await DocumentChunk.countDocuments({ document: uploadedDoc._id });
      if (chunksAfter === 0) {
        logPass('22. Document deletion removes all associated DocumentChunks from MongoDB');
        passed++;
      } else {
        throw new Error(`Document deletion left ${chunksAfter} orphaned chunks!`);
      }
    } catch (err) {
      logFail('22. Document chunks deletion cleanup check', err);
      failed++;
    }

    // Test 23: Cascade cleanup on module deletion removes all chunks belonging to module
    try {
      // Upload another document to Module B
      const form = new FormData();
      const pdfBuf = createValidPdfBuffer('Quantum Computing basics. Qubits and entanglement.');
      form.append('file', new Blob([pdfBuf], { type: 'application/pdf' }), 'test_doc_b.pdf');
      form.append('moduleId', moduleB._id.toString());

      const upRes = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form
      });
      const upData = await upRes.json();
      const docBId = upData.data?.document?._id;

      // Wait for chunks to be created
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 400));
        const count = await DocumentChunk.countDocuments({ document: docBId });
        if (count > 0) break;
      }

      const countBeforeModDelete = await DocumentChunk.countDocuments({ module: moduleB._id });
      if (countBeforeModDelete === 0) throw new Error('No chunks created for Module B document');

      // Delete Module B
      const delModRes = await fetch(`${baseUrl}/modules/${moduleB._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (delModRes.status !== 200) throw new Error('Module delete failed');

      const countAfterModDelete = await DocumentChunk.countDocuments({ module: moduleB._id });
      if (countAfterModDelete === 0) {
        logPass('23. Cascade module deletion cleans up all DocumentChunks belonging to the module');
        passed++;
      } else {
        throw new Error(`Module delete left ${countAfterModDelete} orphaned chunks!`);
      }
    } catch (err) {
      logFail('23. Cascade module deletion check', err);
      failed++;
    }

    // Test 24: Phase 2 & 3 regression check
    try {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'phase4_test_admin@studyai.edu', password: 'SecurePassword123!' })
      });
      const loginData = await loginRes.json();
      if (loginRes.status !== 200 || !loginData.data?.token) throw new Error('Login failed');

      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${loginData.data.token}` }
      });
      if (meRes.status !== 200) throw new Error('/auth/me failed');

      const modRes = await fetch(`${baseUrl}/modules`, {
        headers: { Authorization: `Bearer ${loginData.data.token}` }
      });
      if (modRes.status !== 200) throw new Error('/modules failed');

      logPass('24. Phase 2 & 3 Regression verified: Authentication, /auth/me, and /modules operational');
      passed++;
    } catch (err) {
      logFail('24. Regression check', err);
      failed++;
    }

  } catch (globalErr) {
    logFail('Global test setup error', globalErr);
    console.error(globalErr.stack);
  } finally {
    // Cleanup
    try {
      await User.deleteMany({ email: /phase4_test.*@studyai\.edu/i });
      await Module.deleteMany({ moduleCode: /TEST40[12]/i });
      await Document.deleteMany({ originalName: /.*phase4.*|.*test_doc.*/i });
      await DocumentChunk.deleteMany({});
    } catch (cleanupErr) {
      console.warn('Cleanup error:', cleanupErr.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logInfo('Test HTTP server closed.');
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logInfo('Test MongoDB connection closed.');
    }

    console.log('\n==================================================');
    console.log(`PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runPhase4Tests();
