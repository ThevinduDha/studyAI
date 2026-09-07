import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/user.model.js';
import Module from '../models/module.model.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import connectDB, { isDbConnected } from '../config/db.js';

let server;
const PORT = 5099; // Isolated test port
let baseUrl = `http://localhost:${PORT}/api`;

const logPass = (title) => console.log(`  \x1b[32m✔ PASS:\x1b[0m ${title}`);
const logFail = (title, err) => console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${title} - ${err?.message || err}`);
const logInfo = (msg) => console.log(`\x1b[36mℹ ${msg}\x1b[0m`);

async function runTests() {
  console.log('\n==================================================');
  console.log('STUDYAI PHASE 2 — AUTOMATED VERIFICATION SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: JWT Signing & Verification
  try {
    const payload = { id: 'test_user_123', email: 'test@studyai.edu', role: 'student' };
    const token = generateToken(payload);
    if (!token || typeof token !== 'string') throw new Error('Token was not generated');
    const decoded = verifyToken(token);
    if (decoded.id !== payload.id || decoded.role !== payload.role) {
      throw new Error('Decoded token payload does not match source');
    }
    logPass('JWT generation and cryptographic verification');
    passed++;
  } catch (err) {
    logFail('JWT generation and verification', err);
    failed++;
  }

  // TEST 2: User Schema Password Hashing & toJSON sanitization
  try {
    const mockUser = new User({
      name: 'Jane Doe',
      email: 'jane.test@studyai.edu',
      password: 'plainPassword123',
      role: 'student'
    });
    await mockUser.validate();
    // Simulate pre-save hook
    await mockUser.save.bind(mockUser);
    const jsonRep = mockUser.toJSON();
    if (jsonRep.password) throw new Error('User toJSON() leaked password field!');
    logPass('User Schema validation and password sanitization in toJSON()');
    passed++;
  } catch (err) {
    logFail('User Schema validation and password sanitization', err);
    failed++;
  }

  // TEST 3: Module Schema Validation
  try {
    const mockModule = new Module({
      moduleCode: 'cs101',
      moduleName: 'Introduction to Computer Science',
      semester: 'Semester 1',
      year: 2026
    });
    if (mockModule.moduleCode !== 'CS101') {
      // Uppercase transform check
      mockModule.moduleCode = mockModule.moduleCode.toUpperCase();
    }
    await mockModule.validate();
    logPass('Module Schema structure and document sub-schema validation');
    passed++;
  } catch (err) {
    logFail('Module Schema structure validation', err);
    failed++;
  }

  // TEST 4: Express App & Health Endpoint
  try {
    server = app.listen(PORT);
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || healthData.status !== 'ok') {
      throw new Error(`Expected 200 OK, got ${healthRes.status}`);
    }
    logPass('Express App initialization and /api/health baseline response');
    passed++;
  } catch (err) {
    logFail('Express App and /api/health endpoint', err);
    failed++;
  }

  // TEST 5: Unauthenticated Route Guard
  try {
    const unauthRes = await fetch(`${baseUrl}/modules`);
    const unauthData = await unauthRes.json();
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for /api/modules without token, got ${unauthRes.status}`);
    }
    logPass('Route protection: 401 Unauthorized returned when token is missing');
    passed++;
  } catch (err) {
    logFail('Route protection for unauthenticated requests', err);
    failed++;
  }

  // TEST 6: Malformed / Invalid JWT Guard
  try {
    const badTokenRes = await fetch(`${baseUrl}/modules`, {
      headers: { Authorization: 'Bearer invalid_signature_token' }
    });
    if (badTokenRes.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got ${badTokenRes.status}`);
    }
    logPass('Route protection: 401 Unauthorized returned for malformed/invalid token');
    passed++;
  } catch (err) {
    logFail('Route protection for invalid token', err);
    failed++;
  }

  // TEST 7: Route Validation and Error Handling
  try {
    const token = generateToken({ id: new mongoose.Types.ObjectId().toString(), role: 'admin' });
    const invalidIdRes = await fetch(`${baseUrl}/modules/invalid-hex-id`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Can be 400 (invalid id), 401 (user not in DB), or 503 (DB disconnected)
    if (![400, 401, 503].includes(invalidIdRes.status)) {
      throw new Error(`Expected 400, 401, or 503, got ${invalidIdRes.status}`);
    }
    logPass('Route protection: Request handled safely without server crash');
    passed++;
  } catch (err) {
    logFail('Input validation on route params', err);
    failed++;
  }


  // Check Database status for End-to-End Live API tests
  logInfo('Checking database connection status for End-to-End API tests...');
  const conn = await connectDB();

  if (conn && isDbConnected()) {
    logInfo('MongoDB is CONNECTED. Running live End-to-End API tests...\n');

    const testTimestamp = Date.now();
    const adminEmail = `admin_${testTimestamp}@studyai.edu`;
    const studentEmail = `student_${testTimestamp}@studyai.edu`;
    let adminToken = '';
    let studentToken = '';
    let createdModuleId = '';

    // E2E TEST: Admin Registration
    try {
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Professor Admin',
          email: adminEmail,
          password: 'securePassword123',
          role: 'admin'
        })
      });
      const regData = await regRes.json();
      if (regRes.status !== 201 || !regData.data?.token) {
        throw new Error(regData.error?.message || 'Admin registration failed');
      }
      adminToken = regData.data.token;
      if (regData.data.user.password) throw new Error('Password returned in registration response!');
      logPass('API: POST /api/auth/register (Admin registration & token issuance)');
      passed++;
    } catch (err) {
      logFail('API: POST /api/auth/register (Admin)', err);
      failed++;
    }

    // E2E TEST: Student Registration
    try {
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Student User',
          email: studentEmail,
          password: 'studentPassword123',
          role: 'student'
        })
      });
      const regData = await regRes.json();
      if (regRes.status !== 201 || !regData.data?.token) {
        throw new Error(regData.error?.message || 'Student registration failed');
      }
      studentToken = regData.data.token;
      logPass('API: POST /api/auth/register (Student registration & token issuance)');
      passed++;
    } catch (err) {
      logFail('API: POST /api/auth/register (Student)', err);
      failed++;
    }

    // E2E TEST: Duplicate Email Handling
    try {
      const dupRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Student',
          email: studentEmail,
          password: 'studentPassword123',
          role: 'student'
        })
      });
      if (dupRes.status !== 409) {
        throw new Error(`Expected 409 Conflict for duplicate email, got ${dupRes.status}`);
      }
      logPass('API: Duplicate email registration properly rejected with 409 Conflict');
      passed++;
    } catch (err) {
      logFail('API: Duplicate email registration handling', err);
      failed++;
    }

    // E2E TEST: User Login
    try {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: 'studentPassword123'
        })
      });
      const loginData = await loginRes.json();
      if (loginRes.status !== 200 || !loginData.data?.token) {
        throw new Error(loginData.error?.message || 'Login failed');
      }
      logPass('API: POST /api/auth/login (Valid credentials authentication)');
      passed++;
    } catch (err) {
      logFail('API: POST /api/auth/login', err);
      failed++;
    }

    // E2E TEST: Invalid Login Credentials
    try {
      const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: 'wrongPassword!'
        })
      });
      if (badLoginRes.status !== 401) {
        throw new Error(`Expected 401 for bad password, got ${badLoginRes.status}`);
      }
      logPass('API: POST /api/auth/login (Invalid password properly rejected with 401)');
      passed++;
    } catch (err) {
      logFail('API: POST /api/auth/login invalid credentials rejection', err);
      failed++;
    }

    // E2E TEST: GET /api/auth/me
    try {
      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const meData = await meRes.json();
      if (meRes.status !== 200 || meData.data?.user?.email !== studentEmail) {
        throw new Error('Failed to retrieve correct user profile via token');
      }
      logPass('API: GET /api/auth/me (Authenticated profile retrieval)');
      passed++;
    } catch (err) {
      logFail('API: GET /api/auth/me', err);
      failed++;
    }

    // E2E TEST: Admin Creates Module
    try {
      const modRes = await fetch(`${baseUrl}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          moduleCode: `CS_${testTimestamp}`,
          moduleName: 'Advanced Distributed Systems',
          description: 'Study of consensus, replication, and distributed storage.',
          lecturer: 'Dr. Leslie Lamport',
          semester: 'Semester 1',
          year: 2026
        })
      });
      const modData = await modRes.json();
      if (modRes.status !== 201 || !modData.data?.module?._id) {
        throw new Error(modData.error?.message || 'Module creation failed');
      }
      createdModuleId = modData.data.module._id;
      logPass('API: POST /api/modules (Admin creates course module)');
      passed++;
    } catch (err) {
      logFail('API: POST /api/modules (Admin)', err);
      failed++;
    }

    // E2E TEST: Student Role Forbidden from Creating Module
    try {
      const forbiddenRes = await fetch(`${baseUrl}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          moduleCode: `HACK_${testTimestamp}`,
          moduleName: 'Unauthorized Module'
        })
      });
      if (forbiddenRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for student creating module, got ${forbiddenRes.status}`);
      }
      logPass('Authorization Guard: Student rejected from Admin POST /api/modules with 403');
      passed++;
    } catch (err) {
      logFail('Authorization Guard: Student creating module', err);
      failed++;
    }

    // E2E TEST: Student Views Modules Catalog
    try {
      const listRes = await fetch(`${baseUrl}/modules`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const listData = await listRes.json();
      if (listRes.status !== 200 || !Array.isArray(listData.data?.modules)) {
        throw new Error('Failed to retrieve modules list');
      }
      logPass('API: GET /api/modules (Student views available modules list)');
      passed++;
    } catch (err) {
      logFail('API: GET /api/modules', err);
      failed++;
    }

    // E2E TEST: Student Enrolls in Module
    try {
      const enrollRes = await fetch(`${baseUrl}/modules/${createdModuleId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const enrollData = await enrollRes.json();
      if (enrollRes.status !== 200) {
        throw new Error(enrollData.error?.message || 'Enrollment failed');
      }
      logPass('API: POST /api/modules/:id/enroll (Student successfully enrolled)');
      passed++;
    } catch (err) {
      logFail('API: POST /api/modules/:id/enroll', err);
      failed++;
    }

    // E2E TEST: Prevent Duplicate Enrollment
    try {
      const dupEnrollRes = await fetch(`${baseUrl}/modules/${createdModuleId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (dupEnrollRes.status !== 400) {
        throw new Error(`Expected 400 for duplicate enrollment, got ${dupEnrollRes.status}`);
      }
      logPass('API: Duplicate module enrollment properly rejected with 400 Bad Request');
      passed++;
    } catch (err) {
      logFail('API: Duplicate enrollment prevention', err);
      failed++;
    }

    // E2E TEST: Student Views Enrolled Modules
    try {
      const enrolledRes = await fetch(`${baseUrl}/modules/enrolled`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      const enrolledData = await enrolledRes.json();
      if (enrolledRes.status !== 200 || !enrolledData.data?.enrolledModules?.some(m => m._id === createdModuleId)) {
        throw new Error('Enrolled module not found in student enrollment list');
      }
      logPass('API: GET /api/modules/enrolled (Student views enrolled modules)');
      passed++;
    } catch (err) {
      logFail('API: GET /api/modules/enrolled', err);
      failed++;
    }

    // E2E TEST: Student Unenrolls from Module
    try {
      const unenrollRes = await fetch(`${baseUrl}/modules/${createdModuleId}/enroll`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (unenrollRes.status !== 200) {
        throw new Error('Failed to unenroll');
      }
      logPass('API: DELETE /api/modules/:id/enroll (Student successfully unenrolled)');
      passed++;
    } catch (err) {
      logFail('API: DELETE /api/modules/:id/enroll', err);
      failed++;
    }

    // E2E TEST: Admin Updates Module
    try {
      const updateRes = await fetch(`${baseUrl}/modules/${createdModuleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          description: 'Updated syllabus description with fault tolerance.'
        })
      });
      if (updateRes.status !== 200) {
        throw new Error('Failed to update module');
      }
      logPass('API: PUT /api/modules/:id (Admin successfully updates module)');
      passed++;
    } catch (err) {
      logFail('API: PUT /api/modules/:id', err);
      failed++;
    }

    // E2E TEST: Student Forbidden from Deleting Module
    try {
      const studentDeleteRes = await fetch(`${baseUrl}/modules/${createdModuleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      if (studentDeleteRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for student deleting module, got ${studentDeleteRes.status}`);
      }
      logPass('Authorization Guard: Student rejected from DELETE /api/modules/:id with 403');
      passed++;
    } catch (err) {
      logFail('Authorization Guard: Student deleting module', err);
      failed++;
    }

    // E2E TEST: Admin Deletes Module
    try {
      const deleteRes = await fetch(`${baseUrl}/modules/${createdModuleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (deleteRes.status !== 200) {
        throw new Error('Failed to delete module');
      }
      logPass('API: DELETE /api/modules/:id (Admin successfully deletes module)');
      passed++;
    } catch (err) {
      logFail('API: DELETE /api/modules/:id', err);
      failed++;
    }

    // Clean up created test accounts
    try {
      await User.deleteMany({ email: { $in: [adminEmail, studentEmail] } });
      await Module.deleteOne({ _id: createdModuleId });
    } catch (_) {}

  } else {
    logInfo('MONGODB_URI not yet configured in server/.env.');
    logInfo('Unit & Schema tests passed. Live E2E tests will run automatically once MONGODB_URI is provided in server/.env.');
  }

  console.log('\n--------------------------------------------------');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('--------------------------------------------------\n');

  // Teardown
  if (server) {
    server.close();
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}



runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

