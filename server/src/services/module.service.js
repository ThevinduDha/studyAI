import fs from 'node:fs/promises';
import Module from '../models/module.model.js';
import User from '../models/user.model.js';
import Document from '../models/document.model.js';


/**
 * Retrieve all modules
 * @param {Object} query - Optional filter query
 * @returns {Array} List of modules
 */
export const getAllModules = async (query = {}) => {
  const filter = {};
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { moduleCode: searchRegex },
      { moduleName: searchRegex },
      { lecturer: searchRegex }
    ];
  }

  const modules = await Module.find(filter)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');

  return modules;
};

/**
 * Retrieve a single module by its ID
 * @param {string} moduleId
 * @returns {Object} Module document
 */
export const getModuleById = async (moduleId) => {
  const module = await Module.findById(moduleId).populate('createdBy', 'name email');
  if (!module) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    error.code = 'MODULE_NOT_FOUND';
    throw error;
  }
  return module;
};

/**
 * Create a new module (Admin only)
 * @param {Object} moduleData
 * @param {string} adminId
 * @returns {Object} Newly created module
 */
export const createModule = async (moduleData, adminId) => {
  const { moduleCode, moduleName, description, lecturer, semester, year } = moduleData;

  const normalizedCode = (moduleCode || '').trim().toUpperCase();

  // Check duplicate moduleCode
  const existing = await Module.findOne({ moduleCode: normalizedCode });
  if (existing) {
    const error = new Error(`Module with code '${normalizedCode}' already exists`);
    error.statusCode = 409;
    error.code = 'DUPLICATE_MODULE_CODE';
    throw error;
  }

  const newModule = await Module.create({
    moduleCode: normalizedCode,
    moduleName: (moduleName || '').trim(),
    description: (description || '').trim(),
    lecturer: (lecturer || '').trim(),
    semester: (semester || 'Semester 1').trim(),
    year: year ? Number(year) : new Date().getFullYear(),
    createdBy: adminId,
    documents: []
  });

  return newModule;
};

/**
 * Update an existing module (Admin only)
 * @param {string} moduleId
 * @param {Object} updateData
 * @returns {Object} Updated module
 */
export const updateModule = async (moduleId, updateData) => {
  const module = await Module.findById(moduleId);
  if (!module) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    error.code = 'MODULE_NOT_FOUND';
    throw error;
  }

  if (updateData.moduleCode) {
    const normalizedCode = updateData.moduleCode.trim().toUpperCase();
    if (normalizedCode !== module.moduleCode) {
      const existing = await Module.findOne({
        moduleCode: normalizedCode,
        _id: { $ne: moduleId }
      });
      if (existing) {
        const error = new Error(`Module with code '${normalizedCode}' already exists`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_MODULE_CODE';
        throw error;
      }
      module.moduleCode = normalizedCode;
    }
  }

  if (updateData.moduleName !== undefined) module.moduleName = updateData.moduleName.trim();
  if (updateData.description !== undefined) module.description = updateData.description.trim();
  if (updateData.lecturer !== undefined) module.lecturer = updateData.lecturer.trim();
  if (updateData.semester !== undefined) module.semester = updateData.semester.trim();
  if (updateData.year !== undefined) module.year = Number(updateData.year);

  await module.save();
  return module;
};

/**
 * Delete a module and cascade remove from student enrollments and document records (Admin only)
 * @param {string} moduleId
 * @returns {Object} Deleted module
 */
export const deleteModule = async (moduleId) => {
  const module = await Module.findByIdAndDelete(moduleId);
  if (!module) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    error.code = 'MODULE_NOT_FOUND';
    throw error;
  }

  // Cascade unenroll students who have this module in enrolledModules
  await User.updateMany(
    { enrolledModules: moduleId },
    { $pull: { enrolledModules: moduleId } }
  );

  // Cascade delete associated documents and clean up files
  try {
    const documents = await Document.find({ module: moduleId });
    for (const doc of documents) {
      if (doc.filePath) {
        await fs.unlink(doc.filePath).catch(() => {});
      }
    }
    await Document.deleteMany({ module: moduleId });
  } catch (docErr) {
    console.warn(`[StudyAI Ingestion] Notice: Error cleaning up documents for module ${moduleId}:`, docErr.message);
  }

  return module;
};


/**
 * Enroll student into a module
 * @param {string} studentId
 * @param {string} moduleId
 * @returns {Object} Enrolled module & updated list
 */
export const enrollStudentInModule = async (studentId, moduleId) => {
  // Verify module exists
  const module = await Module.findById(moduleId);
  if (!module) {
    const error = new Error('Module not found');
    error.statusCode = 404;
    error.code = 'MODULE_NOT_FOUND';
    throw error;
  }

  const student = await User.findById(studentId);
  if (!student) {
    const error = new Error('Student account not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // Check if already enrolled
  const isAlreadyEnrolled = student.enrolledModules.some(
    (id) => id.toString() === moduleId.toString()
  );

  if (isAlreadyEnrolled) {
    const error = new Error('You are already enrolled in this module');
    error.statusCode = 400;
    error.code = 'ALREADY_ENROLLED';
    throw error;
  }

  student.enrolledModules.push(module._id);
  await student.save();

  return {
    module,
    enrolledModules: student.enrolledModules
  };
};

/**
 * Unenroll student from a module
 * @param {string} studentId
 * @param {string} moduleId
 * @returns {Object} Updated enrolled modules list
 */
export const unenrollStudentFromModule = async (studentId, moduleId) => {
  const student = await User.findById(studentId);
  if (!student) {
    const error = new Error('Student account not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const isEnrolled = student.enrolledModules.some(
    (id) => id.toString() === moduleId.toString()
  );

  if (!isEnrolled) {
    const error = new Error('You are not currently enrolled in this module');
    error.statusCode = 400;
    error.code = 'NOT_ENROLLED';
    throw error;
  }

  student.enrolledModules = student.enrolledModules.filter(
    (id) => id.toString() !== moduleId.toString()
  );

  await student.save();

  return {
    enrolledModules: student.enrolledModules
  };
};

/**
 * Retrieve all modules enrolled by a student
 * @param {string} studentId
 * @returns {Array} List of populated enrolled modules
 */
export const getEnrolledModulesForStudent = async (studentId) => {
  const student = await User.findById(studentId).populate({
    path: 'enrolledModules',
    populate: { path: 'createdBy', select: 'name email' }
  });

  if (!student) {
    const error = new Error('Student account not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return student.enrolledModules || [];
};
