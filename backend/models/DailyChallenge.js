import mongoose from 'mongoose'

const dailyChallengeSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    pattern: {
      type: String,
      required: true,
    },
    xpReward: {
      type: Number,
      default: 50,
    },
    bonusXp: {
      type: Number,
      default: 25,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        completedAt: {
          type: Date,
        },
        timeTaken: {
          type: Number,
        },
        earnedBonus: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalParticipants: {
      type: Number,
      default: 0,
    },
    totalCompleted: {
      type: Number,
      default: 0,
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

dailyChallengeSchema.index({ date: -1, isActive: 1 })

const DailyChallenge = mongoose.model('DailyChallenge', dailyChallengeSchema)

export default DailyChallenge
