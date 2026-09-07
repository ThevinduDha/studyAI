import * as moduleService from '../services/module.service.js';

/**
 * @route   GET /api/modules
 * @desc    Get all available modules
 * @access  Private (Student & Admin)
 */
export const getModules = async (req, res, next) => {
  try {
    const modules = await moduleService.getAllModules(req.query);
    return res.status(200).json({
      success: true,
      data: {
        modules
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/modules/enrolled
 * @desc    Get all enrolled modules for the authenticated student
 * @access  Private (Student only)
 */
export const getEnrolled = async (req, res, next) => {
  try {
    const enrolledModules = await moduleService.getEnrolledModulesForStudent(req.user._id);
    return res.status(200).json({
      success: true,
      data: {
        enrolledModules
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/modules/:id
 * @desc    Get module by ID
 * @access  Private (Student & Admin)
 */
export const getModule = async (req, res, next) => {
  try {
    const module = await moduleService.getModuleById(req.params.id);
    return res.status(200).json({
      success: true,
      data: {
        module
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/modules
 * @desc    Create a new course module
 * @access  Private (Admin only)
 */
export const createModule = async (req, res, next) => {
  try {
    const { moduleCode, moduleName, description, lecturer, semester, year } = req.body;

    if (!moduleCode || moduleCode.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Module code is required (e.g. CS101)'
        }
      });
    }

    if (!moduleName || moduleName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Module name is required'
        }
      });
    }

    const newModule = await moduleService.createModule(
      { moduleCode, moduleName, description, lecturer, semester, year },
      req.user._id
    );

    return res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: {
        module: newModule
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/modules/:id
 * @desc    Update a module by ID
 * @access  Private (Admin only)
 */
export const updateModule = async (req, res, next) => {
  try {
    const updated = await moduleService.updateModule(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: {
        module: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/modules/:id
 * @desc    Delete a module by ID
 * @access  Private (Admin only)
 */
export const deleteModule = async (req, res, next) => {
  try {
    const deleted = await moduleService.deleteModule(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Module '${deleted.moduleCode}' deleted successfully`,
      data: {
        module: deleted
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/modules/:id/enroll
 * @desc    Enroll authenticated student in a module
 * @access  Private (Student only)
 */
export const enroll = async (req, res, next) => {
  try {
    const result = await moduleService.enrollStudentInModule(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: `Successfully enrolled in ${result.module.moduleCode}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/modules/:id/enroll
 * @desc    Unenroll authenticated student from a module
 * @access  Private (Student only)
 */
export const unenroll = async (req, res, next) => {
  try {
    const result = await moduleService.unenrollStudentFromModule(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from module',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
