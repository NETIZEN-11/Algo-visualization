import mongoose from 'mongoose'

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Index built via the compound (userId, startedAt) below.
    },
    sessionId: {
      type: String,
      unique: true,
      default: () => `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    questions: [
      {
        questionNumber: {
          type: Number,
          // Auto-assigned in controller; not required on push
        },
        question: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          default: 'DSA',
        },
        askedAt: {
          type: Date,
          default: Date.now,
        },
        answer: {
          type: String,
          default: null,
        },
        answeredAt: {
          type: Date,
          default: null,
        },
        feedback: {
          rating: {
            type: Number,
            min: 0,
            max: 10,
          },
          correctness: String,
          timeComplexity: String,
          spaceComplexity: String,
          codeQuality: String,
          communicationSkills: String,
          suggestions: [String],
          strengths: [String],
          weaknesses: [String],
          rubricVersion: { type: String, default: 'v1' },
        },
        systemDesignScore: {
          type: Number,
          min: 0,
          max: 100,
          default: null, // null unless this was a system-design question
        },
        timeSpent: {
          type: Number,
          default: 0,
        },
      },
    ],
    overallFeedback: {
      totalScore: {
        type: Number,
        default: 0,
      },
      strengths: [String],
      areasForImprovement: [String],
      recommendation: String,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    systemDesignScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0, // populated when at least one system-design answer exists
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    interviewType: {
      type: String,
      enum: ['technical', 'behavioral', 'system-design', 'mixed'],
      default: 'technical',
    },
    targetCompany: {
      type: String,
      default: null,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
interviewSchema.index({ userId: 1, startedAt: -1 })
interviewSchema.index({ status: 1 })
interviewSchema.index({ difficulty: 1 })

// Calculate duration before saving
interviewSchema.pre('save', function (next) {
  if (this.endedAt && this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000 / 60) // in minutes
  }
  next()
})

// Virtual for total questions
interviewSchema.virtual('totalQuestions').get(function () {
  return this.questions.length
})

// Virtual for answered questions
interviewSchema.virtual('answeredQuestions').get(function () {
  return this.questions.filter(q => q.answer).length
})

const Interview = mongoose.model('Interview', interviewSchema)

export default Interview
