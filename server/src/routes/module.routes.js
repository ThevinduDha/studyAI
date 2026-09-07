import { Router } from 'express';
import {
  getModules,
  getEnrolled,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  enroll,
  unenroll
} from '../controllers/module.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validateObjectId } from '../middleware/validateId.js';

const router = Router();

// All module routes require authentication
router.use(requireAuth);

// Student enrolled modules list (placed before /:id)
router.get('/enrolled', requireRole('student'), getEnrolled);

// Module list (both student and admin)
router.get('/', getModules);

// Single module view (both student and admin)
router.get('/:id', validateObjectId('id'), getModule);

// Admin-only module management
router.post('/', requireRole('admin'), createModule);
router.put('/:id', requireRole('admin'), validateObjectId('id'), updateModule);
router.delete('/:id', requireRole('admin'), validateObjectId('id'), deleteModule);

// Student enrollment actions
router.post('/:id/enroll', requireRole('student'), validateObjectId('id'), enroll);
router.delete('/:id/enroll', requireRole('student'), validateObjectId('id'), unenroll);

export default router;
