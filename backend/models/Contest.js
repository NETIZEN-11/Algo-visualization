import mongoose from 'mongoose'

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
    },
    problems: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Problem',
        },
        points: Number,
        solvedCount: { type: Number, default: 0 },
      },
    ],
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        score: { type: Number, default: 0 },
        rank: { type: Number, default: 0 },
        problemsSolved: { type: Number, default: 0 },
        submissions: [
          {
            problemId: mongoose.Schema.Types.ObjectId,
            submittedAt: Date,
            status: String,
            points: Number,
          },
        ],
      },
    ],
    leaderboard: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rank: Number,
        score: Number,
        problemsSolved: Number,
      },
    ],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
      default: 'Mixed',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
)

contestSchema.index({ startTime: 1 })
contestSchema.index({ status: 1 })
contestSchema.index({ isPublic: 1 })

const Contest = mongoose.model('Contest', contestSchema)

export default Contest
