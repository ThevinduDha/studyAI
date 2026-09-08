import * as authService from '../services/auth.service.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student or admin account
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, adminPasscode } = req.body;

    // Field validations
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name is required'
        }
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address'
        }
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long'
        }
      });
    }

    const { user, token } = await authService.registerUser({
      name,
      email,
      password,
      role,
      adminPasscode
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Both email and password are required'
        }
      });
    }

    const { user, token } = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Authenticated)
 */
export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getMeProfile(req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: profile
      }
    });
  } catch (error) {
    next(error);
  }
};
