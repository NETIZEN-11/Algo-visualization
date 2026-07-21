import mongoose from 'mongoose'

const leaderboardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['global', 'weekly', 'monthly', 'contest'],
      required: true,
      index: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest',
      default: null,
    },
    rankings: [
      {
        rank: {
          type: Number,
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        problemsSolved: {
          type: Number,
          default: 0,
        },
        xpEarned: {
          type: Number,
          default: 0,
        },
        streak: {
          type: Number,
          default: 0,
        },
        totalTime: {
          type: Number,
          default: 0,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

leaderboardSchema.index({ type: 1, 'period.endDate': -1, isActive: 1 })
leaderboardSchema.index({ 'rankings.userId': 1 })

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema)

export default Leaderboard
