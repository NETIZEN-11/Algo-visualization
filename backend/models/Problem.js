import mongoose from 'mongoose'

const problemSchema = new mongoose.Schema(
  {
    problemId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,

    },
    source: {
      type: String,
      enum: ['leetcode', 'codeforces', 'system', 'user', 'seed'],
      required: true,
    },
    leetcodeId: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: 'text',
    },
    slug: {
      type: String,
      default: null,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    description: { type: String, required: true },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    constraints: [String],
    tags: [{ type: String, lowercase: true, trim: true }],
    companies: [{ type: String, uppercase: true, trim: true }],
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },

    analysis: { type: mongoose.Schema.Types.Mixed, default: null },
    isSaved: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    avgTimeSpent: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

problemSchema.index({ userId: 1, createdAt: -1 })
problemSchema.index({ difficulty: 1 })
problemSchema.index({ 'analysis.pattern_identification.pattern': 1 })
problemSchema.index({ tags: 1 })
problemSchema.index({ companies: 1 })
problemSchema.index({ createdAt: -1 })

problemSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastViewedAt = Date.now()
  }
  next()
})

const Problem = mongoose.model('Problem', problemSchema)

export default Problem
