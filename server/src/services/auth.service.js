import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 * @returns {Object} { user, token }
 */
export const registerUser = async ({ name, email, password, role, adminPasscode }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // Secure role resolution: Public registration cannot arbitrarily escalate to admin
  let userRole = 'student';
  if (role === 'admin') {
    const expectedAdminKey = process.env.ADMIN_REGISTRATION_KEY || 'studyai-admin-secret-2026';
    if (!adminPasscode || typeof adminPasscode !== 'string' || adminPasscode.trim() !== expectedAdminKey) {
      const error = new Error('Unauthorized: A valid administrator registration key is required to register an administrator account.');
      error.statusCode = 403;
      error.code = 'UNAUTHORIZED_ADMIN_REGISTRATION';
      throw error;
    }
    userRole = 'admin';
  }

  // Create user record
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: userRole
  });

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role
  });

  return {
    user: user.toJSON(),
    token
  };
};

/**
 * Authenticate user with credentials
 * @param {Object} credentials - { email, password }
 * @returns {Object} { user, token }
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    error.code = 'MISSING_CREDENTIALS';
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role
  });

  return {
    user: user.toJSON(),
    token
  };
};

/**
 * Get current user profile with populated enrolled modules
 * @param {string} userId
 * @returns {Object} Safe user document
 */
export const getMeProfile = async (userId) => {
  const user = await User.findById(userId)
    .select('-password')
    .populate('enrolledModules');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return user.toJSON();
};
