import mongoose from 'mongoose'

const testCaseSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    input: {
      type: String,
      required: true,
    },
    expectedOutput: {
      type: String,
      required: true,
    },
    actualOutput: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['sample', 'edge', 'stress', 'custom', 'hidden'],
      default: 'custom',
    },
    passed: {
      type: Boolean,
      default: null,
    },
    executionTime: {
      type: Number,
      default: null,
    },
    memoryUsed: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

testCaseSchema.index({ problemId: 1 })
testCaseSchema.index({ userId: 1 })
testCaseSchema.index({ type: 1 })

const TestCase = mongoose.model('TestCase', testCaseSchema)

export default TestCase
