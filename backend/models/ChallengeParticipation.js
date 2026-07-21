import mongoose from 'mongoose'

const challengeParticipationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyChallenge',
      required: true,
    },
    completedAt: { type: Date, default: null },
    timeTaken: { type: Number, default: null },
    earnedBonus: { type: Boolean, default: false },
    xpAwarded: { type: Number, default: 0 },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      default: null,
    },
  },
  { timestamps: true }
)

challengeParticipationSchema.index({ userId: 1, challengeId: 1 }, { unique: true })
challengeParticipationSchema.index({ challengeId: 1, completedAt: -1 })
challengeParticipationSchema.index({ userId: 1, completedAt: -1 })

const ChallengeParticipation = mongoose.model('ChallengeParticipation', challengeParticipationSchema)

export default ChallengeParticipation
