import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,

    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [String],
    category: {
      type: String,
      enum: ['concept', 'solution', 'pattern', 'tip', 'mistake', 'general'],
      default: 'general',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    codeSnippets: [
      {
        language: String,
        code: String,
      },
    ],
    relatedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
)

noteSchema.index({ userId: 1, createdAt: -1 })
noteSchema.index({ tags: 1 })
noteSchema.index({ category: 1 })

const Note = mongoose.model('Note', noteSchema)

export default Note
