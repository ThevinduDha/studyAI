import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/user.model.js';
import Module from '../models/module.model.js';
import Document from '../models/document.model.js';
import { generateToken } from '../utils/jwt.js';
import connectDB, { isDbConnected } from '../config/db.js';

let server;
const PORT = 5098; // Isolated test port
const baseUrl = `http://localhost:${PORT}/api`;

const logPass = (title) => console.log(`  \x1b[32m✔ PASS:\x1b[0m ${title}`);
const logFail = (title, err) => console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${title} - ${err?.message || err}`);
const logInfo = (msg) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`);

/**
 * Creates a minimal valid PDF Buffer containing extractable text
 */
function createValidPdfBuffer(customText = 'StudyAI Phase 3 Automated Verification Document. Artificial Intelligence and Neural Networks.') {
  const streamContent = `BT\n/F1 18 Tf\n50 720 Td\n(${customText}) Tj\nET`;
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
450
%%EOF`;

  return Buffer.from(pdf);
}

async function runPhase3Tests() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 3 — AUTOMATED VERIFICATION SUITE');
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
  let uploadedDocA = null;

  try {
    // 0. Ensure DB connection
    logInfo('Connecting to test database environment...');
    await connectDB();
    if (!isDbConnected()) {
      throw new Error('Database is not connected');
    }
    logPass('MongoDB connection verified');
    passed++;

    // Start isolated test server
    server = app.listen(PORT);
    logInfo(`Test HTTP server listening on port ${PORT}`);

    // Clean up past test fixtures if any
    await User.deleteMany({ email: /phase3_test.*@studyai\.edu/i });
    await Module.deleteMany({ moduleCode: /TEST30[12]/i });
    await Document.deleteMany({ originalName: /.*phase3.*|.*lecture.*/i });

    // 1. Create Test Users & Tokens
    adminUser = await User.create({
      name: 'Phase3 Admin',
      email: 'phase3_test_admin@studyai.edu',
      password: 'SecurePassword123!',
      role: 'admin'
    });
    adminToken = generateToken({ id: adminUser._id.toString(), role: adminUser.role, email: adminUser.email });

    student1User = await User.create({
      name: 'Phase3 Student 1 (Enrolled in Mod A)',
      email: 'phase3_test_student1@studyai.edu',
      password: 'SecurePassword123!',
      role: 'student'
    });
    student1Token = generateToken({ id: student1User._id.toString(), role: student1User.role, email: student1User.email });

    student2User = await User.create({
      name: 'Phase3 Student 2 (Unenrolled)',
      email: 'phase3_test_student2@studyai.edu',
      password: 'SecurePassword123!',
      role: 'student'
    });
    student2Token = generateToken({ id: student2User._id.toString(), role: student2User.role, email: student2User.email });

    logPass('Created test fixtures (Admin, Enrolled Student, Unenrolled Student)');
    passed++;

    // 2. Create Test Modules
    moduleA = await Module.create({
      moduleCode: 'TEST301',
      moduleName: 'Advanced Machine Learning',
      description: 'Foundations of Deep Learning and Neural Architectures',
      semester: 'Semester 1',
      year: 2026,
      lecturer: 'Prof. Turing',
      enrolledStudents: [student1User._id]
    });

    student1User.enrolledModules = [moduleA._id];
    await student1User.save();

    moduleB = await Module.create({
      moduleCode: 'TEST302',
      moduleName: 'Quantum Computing Fundamentals',
      description: 'Qubits, Superposition, and Quantum Algorithms',
      semester: 'Semester 2',
      year: 2026,
      lecturer: 'Prof. Feynman',
      enrolledStudents: [] // Student 1 is NOT enrolled here
    });

    logPass('Created test modules (TEST301 with Student 1 enrolled; TEST302 without Student 1)');
    passed++;

    // 3. TEST: Upload without Authentication fails (401)
    try {
      const form = new FormData();
      const pdfBuf = createValidPdfBuffer();
      form.append('document', new Blob([pdfBuf], { type: 'application/pdf' }), 'test.pdf');
      form.append('moduleId', moduleA._id.toString());

      const res = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        body: form
      });
      if (res.status === 401) {
        logPass('PDF upload requires authentication (returned 401 Unauthorized)');
        passed++;
      } else {
        throw new Error(`Expected status 401, got ${res.status}`);
      }
    } catch (err) {
      logFail('PDF upload authentication check', err);
      failed++;
    }

    // 4. TEST: Non-PDF files are rejected (400)
    try {
      const form = new FormData();
      form.append('document', new Blob(['console.log("hello")'], { type: 'text/javascript' }), 'script.js');
      form.append('moduleId', moduleA._id.toString());

      const res = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form
      });
      const data = await res.json();
      if (res.status === 400 && (data.message?.includes('PDF') || data.error?.message?.includes('PDF'))) {
        logPass('Non-PDF file upload correctly rejected with 400 Bad Request');
        passed++;
      } else {
        throw new Error(`Expected 400 with PDF warning, got ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      logFail('Non-PDF file rejection check', err);
      failed++;
    }

    // 5. TEST: Missing Module ID rejected (400)
    try {
      const form = new FormData();
      const pdfBuf = createValidPdfBuffer();
      form.append('document', new Blob([pdfBuf], { type: 'application/pdf' }), 'test.pdf');

      const res = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form
      });
      if (res.status === 400) {
        logPass('Upload without module ID rejected with 400');
        passed++;
      } else {
        throw new Error(`Expected 400, got ${res.status}`);
      }
    } catch (err) {
      logFail('Missing module ID validation check', err);
      failed++;
    }

    // 6. TEST: Valid PDF creates Document record & triggers processing
    try {
      const form = new FormData();
      const sampleText = 'StudyAI Phase 3 automated verification document content. Machine learning principles and neural nets.';
      const pdfBuf = createValidPdfBuffer(sampleText);
      form.append('document', new Blob([pdfBuf], { type: 'application/pdf' }), 'phase3_lecture1.pdf');
      form.append('moduleId', moduleA._id.toString());

      const res = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form
      });
      const data = await res.json();

      if (res.status === 201 && (data.data?.document?._id || data.data?._id)) {
        uploadedDocA = data.data.document || data.data;
        if (uploadedDocA.originalName !== 'phase3_lecture1.pdf') {
          throw new Error(`originalName mismatch: ${uploadedDocA.originalName}`);
        }
        if (!['uploaded', 'processing', 'processed'].includes(uploadedDocA.status)) {
          throw new Error(`Unexpected initial status: ${uploadedDocA.status}`);
        }
        logPass('Valid PDF creates Document record in MongoDB with status "uploaded"/"processing"');
        passed++;
      } else {
        throw new Error(`Upload failed with status ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      logFail('Valid PDF upload test', err);
      failed++;
    }

    // 7. TEST: Asynchronous text extraction succeeds and transitions to "processed"
    try {
      let docRecord = null;
      // Wait up to 5 seconds for in-process async text extraction to complete
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        docRecord = await Document.findById(uploadedDocA._id);
        if (docRecord && docRecord.status === 'processed') {
          break;
        }
      }

      if (!docRecord) throw new Error('Document not found in database');
      if (docRecord.status !== 'processed') {
        throw new Error(`Document status is "${docRecord.status}", processingError: ${docRecord.processingError}`);
      }
      if (!docRecord.extractedText || docRecord.extractedText.length === 0) {
        throw new Error('Extracted text is empty');
      }
      if (typeof docRecord.pageCount !== 'number' || docRecord.pageCount < 1) {
        throw new Error(`Invalid pageCount: ${docRecord.pageCount}`);
      }

      logPass(`Document text extraction completed: status="processed", pageCount=${docRecord.pageCount}, extractedText length=${docRecord.extractedText.length}`);
      passed++;
    } catch (err) {
      logFail('Document processing and text extraction check', err);
      failed++;
    }

    // 8. TEST: Student 1 (Enrolled in Module A) can view documents
    try {
      const res = await fetch(`${baseUrl}/documents?module=${moduleA._id}`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      const data = await res.json();
      const docs = data.data?.documents || data.data;
      if (res.status === 200 && Array.isArray(docs) && docs.length > 0) {
        const found = docs.some((d) => d._id === uploadedDocA._id);
        if (!found) throw new Error('Uploaded document not present in student module document list');
        logPass('Authorized student can view documents for enrolled module');
        passed++;
      } else {
        throw new Error(`Expected 200 with document list, got ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      logFail('Authorized student document access check', err);
      failed++;
    }

    // 9. TEST: Student 1 (NOT enrolled in Module B) cannot view Module B documents (403)
    try {
      const res = await fetch(`${baseUrl}/documents?module=${moduleB._id}`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      if (res.status === 403) {
        logPass('Student cannot access documents from modules they are not enrolled in (403 Forbidden)');
        passed++;
      } else {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    } catch (err) {
      logFail('Unenrolled student authorization check', err);
      failed++;
    }

    // 10. TEST: Student 2 (Unenrolled) cannot access Document A directly by ID (403)
    try {
      const res = await fetch(`${baseUrl}/documents/${uploadedDocA._id}`, {
        headers: { Authorization: `Bearer ${student2Token}` }
      });
      if (res.status === 403) {
        logPass('Unenrolled student cannot access document by ID (403 Forbidden)');
        passed++;
      } else {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    } catch (err) {
      logFail('Unenrolled student direct document access check', err);
      failed++;
    }

    // 11. TEST: Students cannot upload documents (RBAC: admin/faculty only -> 403)
    try {
      const form = new FormData();
      const pdfBuf = createValidPdfBuffer();
      form.append('document', new Blob([pdfBuf], { type: 'application/pdf' }), 'student_doc.pdf');
      form.append('moduleId', moduleA._id.toString());

      const res = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${student1Token}` },
        body: form
      });
      if (res.status === 403) {
        logPass('Students cannot upload documents (403 Forbidden for non-admin/faculty)');
        passed++;
      } else {
        throw new Error(`Expected 403, got ${res.status}`);
      }
    } catch (err) {
      logFail('Student upload restriction check', err);
      failed++;
    }

    // 12. TEST: Students cannot delete documents (403)
    try {
      const res = await fetch(`${baseUrl}/documents/${uploadedDocA._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      if (res.status === 403) {
        logPass('Students cannot delete documents (403 Forbidden)');
        passed++;
      } else {
        throw new Error(`Expected 403, got ${res.status}`);
      }
    } catch (err) {
      logFail('Student delete restriction check', err);
      failed++;
    }

    // 13. TEST: Invalid document ID handling (400 Bad Request)
    try {
      const res = await fetch(`${baseUrl}/documents/not-a-valid-object-id`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.status === 400) {
        logPass('Invalid document ID format correctly rejected with 400');
        passed++;
      } else {
        throw new Error(`Expected 400, got ${res.status}`);
      }
    } catch (err) {
      logFail('Invalid document ID format check', err);
      failed++;
    }

    // 14. TEST: Non-existent document ID handling (404 Not Found)
    try {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await fetch(`${baseUrl}/documents/${fakeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.status === 404) {
        logPass('Non-existent document ID correctly returns 404 Not Found');
        passed++;
      } else {
        throw new Error(`Expected 404, got ${res.status}`);
      }
    } catch (err) {
      logFail('Non-existent document ID check', err);
      failed++;
    }

    // 15. TEST: Document Deletion & Physical File Cleanup
    try {
      // Find physical file path
      const docBeforeDelete = await Document.findById(uploadedDocA._id);
      if (!docBeforeDelete) throw new Error('Document record missing before delete');
      const physicalFilePath = docBeforeDelete.filePath;

      if (!fs.existsSync(physicalFilePath)) {
        throw new Error(`Expected physical file to exist at ${physicalFilePath}`);
      }

      // Delete via API
      const res = await fetch(`${baseUrl}/documents/${uploadedDocA._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();

      if (res.status === 200 && (data.status === 'success' || data.success === true)) {
        // Verify DB record deleted
        const docAfterDelete = await Document.findById(uploadedDocA._id);
        if (docAfterDelete) throw new Error('Document record still exists in database');

        // Verify physical file deleted
        if (fs.existsSync(physicalFilePath)) {
          throw new Error('Physical file still exists on disk after document deletion');
        }

        logPass('Document deletion successfully removed database record and physical disk file');
        passed++;
      } else {
        throw new Error(`Delete failed with status ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      logFail('Document deletion and cleanup test', err);
      failed++;
    }

    // 16. TEST: Cascade Cleanup on Module Deletion
    try {
      // Upload document to Module B
      const form = new FormData();
      const pdfBuf = createValidPdfBuffer('Quantum Computing Lecture 1. Qubit superposition and entangled states.');
      form.append('document', new Blob([pdfBuf], { type: 'application/pdf' }), 'quantum_lecture1.pdf');
      form.append('moduleId', moduleB._id.toString());

      const uploadRes = await fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: form
      });
      const uploadData = await uploadRes.json();
      const docB = uploadData.data?.document || uploadData.data;

      // Verify physical file exists
      const docBRecord = await Document.findById(docB._id);
      const docBFilePath = docBRecord.filePath;
      if (!fs.existsSync(docBFilePath)) {
        throw new Error(`Doc B physical file missing at ${docBFilePath}`);
      }

      // Delete Module B via Module API
      const deleteModRes = await fetch(`${baseUrl}/modules/${moduleB._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (deleteModRes.status !== 200) {
        throw new Error(`Module delete failed: status ${deleteModRes.status}`);
      }

      // Verify Document record for Module B is deleted
      const docBAfterModDelete = await Document.findById(docB._id);
      if (docBAfterModDelete) {
        throw new Error('Cascade delete failed: Document record still exists in database');
      }

      // Verify physical file is deleted
      if (fs.existsSync(docBFilePath)) {
        throw new Error('Cascade delete failed: Physical file still exists on disk');
      }

      logPass('Cascade cleanup: Deleting module removed all associated documents and physical files');
      passed++;
    } catch (err) {
      logFail('Cascade module cleanup test', err);
      failed++;
    }

    // 17. TEST: Phase 2 Authentication & Module endpoints regression check
    try {
      // Verify login
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'phase3_test_admin@studyai.edu',
          password: 'SecurePassword123!'
        })
      });
      const loginData = await loginRes.json();
      if (loginRes.status !== 200 || !loginData.data?.token) {
        throw new Error(`Phase 2 login failed: ${JSON.stringify(loginData)}`);
      }

      // Verify /auth/me
      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${loginData.data.token}` }
      });
      const meData = await meRes.json();
      const userObj = meData.data?.user || meData.data;
      if (meRes.status !== 200 || userObj?.email !== 'phase3_test_admin@studyai.edu') {
        throw new Error(`Phase 2 /auth/me failed: ${JSON.stringify(meData)}`);
      }

      // Verify /modules
      const modRes = await fetch(`${baseUrl}/modules`, {
        headers: { Authorization: `Bearer ${loginData.data.token}` }
      });
      const modData = await modRes.json();
      const modulesList = modData.data?.modules || modData.data;
      if (modRes.status !== 200 || !Array.isArray(modulesList)) {
        throw new Error(`Phase 2 /modules failed: ${JSON.stringify(modData)}`);
      }

      logPass('Phase 2 Regression: Authentication, /auth/me, and /modules endpoints fully operational');
      passed++;
    } catch (err) {
      logFail('Phase 2 regression check', err);
      failed++;
    }

  } catch (globalErr) {
    logFail('Global test setup error', globalErr);
    console.error(globalErr.stack);
  } finally {
    // Cleanup fixtures
    try {
      await User.deleteMany({ email: /phase3_test.*@studyai\.edu/i });
      await Module.deleteMany({ moduleCode: /TEST30[12]/i });
      await Document.deleteMany({ originalName: /.*phase3.*|.*quantum.*/i });
    } catch (cleanupErr) {
      console.warn('Cleanup error:', cleanupErr.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logInfo('Test HTTP server closed.');
    }
    // We do not disconnect Mongoose if other connections share it, or close if standalone
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logInfo('Test MongoDB connection closed.');
    }

    console.log('\n==================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runPhase3Tests();
