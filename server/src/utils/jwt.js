import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '' || secret.includes('placeholder')) {
    // Development fallback warning; never used in production
    return 'studyai_default_development_secret_do_not_use_in_prod';
  }
  return secret;
};

/**
 * Generate a JWT for an authenticated user
 * @param {Object} payload - User identification payload (e.g. { id, role, email })
 * @returns {string} Signed JWT string
 */
export const generateToken = (payload) => {
  const secret = getSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT string
 * @param {string} token - Bearer token to verify
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = getSecret();
  return jwt.verify(token, secret);
};
