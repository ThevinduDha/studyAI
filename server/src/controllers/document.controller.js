import * as documentService from '../services/documents/document.service.js';

/**
 * @route   POST /api/documents
 * @desc    Upload an academic PDF file for a module
 * @access  Private (Admin or Enrolled Student)
 */
export const upload = async (req, res, next) => {
  try {
    const { moduleId } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MODULE_REQUIRED',
          message: 'Module ID is required to upload a document'
        }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'PDF file is required'
        }
      });
    }

    const document = await documentService.createDocument({
      file: req.file,
      moduleId,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and queued for processing',
      data: {
        document
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents
 * @desc    Get documents (scoped by enrollment for students; all for admin)
 * @access  Private
 */
export const getDocuments = async (req, res, next) => {
  try {
    const moduleId = req.query.moduleId || req.query.module;
    const documents = await documentService.getDocuments({
      moduleId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: {
        documents
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/:id
 * @desc    Get document details and processing status
 * @access  Private
 */
export const getDocument = async (req, res, next) => {
  try {
    const document = await documentService.getDocumentById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      data: {
        document
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document record and file from disk
 * @access  Private (Admin or Uploader)
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const document = await documentService.deleteDocument(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: `Document '${document.originalName}' deleted successfully`,
      data: {
        document
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/:id/chunks
 * @desc    Get paginated chunks for a document
 * @access  Private (Admin or Enrolled Student)
 */
export const getDocumentChunks = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await documentService.getDocumentChunks(req.params.id, {
      page,
      limit,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/documents/:id/embedding-status
 * @desc    Get embedding generation status and metrics for a document
 * @access  Private (Admin only)
 */
export const getEmbeddingStatus = async (req, res, next) => {
  try {
    const status = await documentService.getEmbeddingStatus(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/documents/:id/re-embed
 * @desc    Regenerate embeddings for all existing chunks of a document
 * @access  Private (Admin only)
 */
export const reEmbed = async (req, res, next) => {
  try {
    const result = await documentService.reEmbedDocument(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: 'Document chunks successfully re-embedded',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

