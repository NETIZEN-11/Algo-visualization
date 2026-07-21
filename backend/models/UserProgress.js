import mongoose from 'mongoose'

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,

    },
    overallStats: {
      totalProblemsSolved: { type: Number, default: 0 },
      totalTimeSpent: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: Date.now },
    },
    difficultyBreakdown: {
      easy: {
        solved: { type: Number, default: 0 },
        attempted: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      medium: {
        solved: { type: Number, default: 0 },
        attempted: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
      hard: {
        solved: { type: Number, default: 0 },
        attempted: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
      },
    },
    patternMastery: [
      {
        pattern: String,
        problemsSolved: { type: Number, default: 0 },
        problemsAttempted: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        averageTime: { type: Number, default: 0 },
        masteryLevel: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'beginner',
        },
        lastPracticedAt: { type: Date, default: Date.now },
      },
    ],
    topicStrength: [
      {
        topic: String,
        strength: {
          type: String,
          enum: ['weak', 'average', 'strong', 'expert'],
          default: 'weak',
        },
        problemsSolved: { type: Number, default: 0 },
        lastPracticedAt: { type: Date, default: Date.now },
      },
    ],
    weeklyActivity: [
      {
        week: { type: Date, required: true },
        problemsSolved: { type: Number, default: 0 },
        timeSpent: { type: Number, default: 0 },
        xpEarned: { type: Number, default: 0 },
        dailyActivity: [
          {
            date: { type: Date },
            problemsSolved: { type: Number, default: 0 },
            timeSpent: { type: Number, default: 0 },
          },
        ],
      },
    ],
    interviewReadinessScore: {
      overall: { type: Number, min: 0, max: 100, default: 0 },
      dataStructures: { type: Number, min: 0, max: 100, default: 0 },
      algorithms: { type: Number, min: 0, max: 100, default: 0 },
      problemSolving: { type: Number, min: 0, max: 100, default: 0 },
      systemDesign: { type: Number, min: 0, max: 100, default: 0 },
      lastCalculated: { type: Date, default: Date.now },
    },
    recommendations: [
      {
        type: {
          type: String,
          enum: ['weak_topic', 'pattern_practice', 'difficulty_challenge'],
        },
        message: String,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    achievements: [
      {
        achievementId: String,
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
)

userProgressSchema.index({ 'overallStats.lastActiveDate': -1 })

const UserProgress = mongoose.model('UserProgress', userProgressSchema)

export default UserProgress
