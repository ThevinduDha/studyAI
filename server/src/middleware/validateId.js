import mongoose from 'mongoose';

/**
 * Middleware to validate MongoDB ObjectId parameters
 * @param {string} paramName - Name of route param to validate, defaults to 'id'
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: `Invalid ID format for parameter: ${paramName}`
        }
      });
    }
    next();
  };
};
