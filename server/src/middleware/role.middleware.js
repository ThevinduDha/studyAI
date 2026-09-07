/**
 * Role-Based Authorization Middleware
 * Verifies that the authenticated user possesses one of the authorized roles.
 * Must be mounted after requireAuth middleware.
 *
 * @param  {...string} allowedRoles - List of allowed roles (e.g. 'admin', 'student')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required prior to role verification'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`
        }
      });
    }

    next();
  };
};
