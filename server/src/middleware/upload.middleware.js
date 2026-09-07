import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Ensure uploads/documents directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with unique randomized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeName = `doc-${Date.now()}-${randomHex}.pdf`;
    cb(null, safeName);
  }
});

// File validation filter (PDF only)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = ext === '.pdf';

  if (!isPdfMime || !isPdfExt) {
    const error = new Error('Invalid file type. Only PDF documents are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

// 25 MB max size
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

/**
 * Express middleware wrapper to intercept Multer errors and format standard responses
 */
export const uploadDocumentMiddleware = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (!err) {
      if (req.files) {
        if (req.files.file && req.files.file[0]) {
          req.file = req.files.file[0];
        } else if (req.files.document && req.files.document[0]) {
          req.file = req.files.document[0];
        }
      }
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File exceeds maximum limit of 25MB'
          }
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          code: err.code || 'UPLOAD_ERROR',
          message: err.message
        }
      });
    }

    // Custom fileFilter error
    return res.status(err.statusCode || 400).json({
      success: false,
      error: {
        code: err.code || 'INVALID_UPLOAD',
        message: err.message || 'File upload failed'
      }
    });
  });
};

export default uploadDocumentMiddleware;
