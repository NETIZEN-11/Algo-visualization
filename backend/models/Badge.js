import mongoose from 'mongoose'

const badgeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'problem_solving',
        'pattern_mastery',
        'streak',
        'contest',
        'interview',
        'special',
      ],
      required: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'bronze',
    },
    criteria: {
      type: {
        type: String,
        enum: [
          'problems_solved',
          'pattern_problems',
          'difficulty_problems',
          'streak_days',
          'contest_wins',
          'interview_score',
          'xp_earned',
        ],
        required: true,
      },
      target: {
        type: Number,
        required: true,
      },
      context: {
        type: String, // e.g., "array", "hard", "sliding_window"
        default: null,
      },
    },
    xpReward: {
      type: Number,
      default: 100,
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
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

// Index for active badges
badgeSchema.index({ isActive: 1, category: 1 })

const Badge = mongoose.model('Badge', badgeSchema)

export default Badge
