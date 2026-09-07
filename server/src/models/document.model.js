import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module reference is required'],
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user reference is required'],
      index: true
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storedName: {
      type: String,
      required: [true, 'Stored file name is required'],
      unique: true,
      trim: true
    },
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      default: 'application/pdf'
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required']
    },
    pageCount: {
      type: Number,
      default: 0
    },
    chunkCount: {
      type: Number,
      default: 0
    },
    extractedText: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['uploaded', 'processing', 'processed', 'failed'],
        message: 'Status must be uploaded, processing, processed, or failed'
      },
      default: 'uploaded',
      index: true
    },
    processingError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        // Do not leak internal disk paths in standard client responses
        delete ret.filePath;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for fast queries of documents belonging to a module
documentSchema.index({ module: 1, createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
