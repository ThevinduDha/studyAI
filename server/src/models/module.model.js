import mongoose from 'mongoose';

/**
 * Document metadata sub-schema
 * Designed to be extensible for future Phase RAG & chunking pipelines.
 */
const documentSubSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    fileName: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      default: 'application/pdf'
    },
    pageCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'],
      default: 'PENDING'
    }
  },
  {
    timestamps: true
  }
);

const moduleSchema = new mongoose.Schema(
  {
    moduleCode: {
      type: String,
      required: [true, 'Module code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, 'Module code must be at least 2 characters'],
      maxlength: [20, 'Module code cannot exceed 20 characters']
    },
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
      minlength: [2, 'Module name must be at least 2 characters'],
      maxlength: [150, 'Module name cannot exceed 150 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    lecturer: {
      type: String,
      default: '',
      trim: true
    },
    semester: {
      type: String,
      default: 'Semester 1',
      trim: true
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    documents: [documentSubSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Helpful index for search
moduleSchema.index({ moduleCode: 1, moduleName: 1 });

const Module = mongoose.model('Module', moduleSchema);

export default Module;
