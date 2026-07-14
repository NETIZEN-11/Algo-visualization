import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['python', 'javascript', 'java', 'cpp', 'c', 'go', 'rust'],
    },
    status: {
      type: String,
      enum: ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compile_error', 'pending'],
      default: 'pending',
    },
    executionTime: {
      type: Number,
      default: null,
    },
    memoryUsed: {
      type: Number,
      default: null,
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    isOptimal: {
      type: Boolean,
      default: false,
    },
    approach: {
      type: String,
      enum: ['brute_force', 'optimized', 'optimal'],
      default: 'brute_force',
    },
    timeComplexity: {
      type: String,
      default: null,
    },
    spaceComplexity: {
      type: String,
      default: null,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
submissionSchema.index({ userId: 1, problemId: 1, createdAt: -1 })
submissionSchema.index({ status: 1 })
submissionSchema.index({ language: 1 })

const Submission = mongoose.model('Submission', submissionSchema)

export default Submission
