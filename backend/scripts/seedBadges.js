import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Badge from '../models/Badge.js'

dotenv.config()

const badges = [

  {
    id: 'first_problem',
    name: 'First Steps',
    description: 'Solve your first problem',
    icon: '🎯',
    category: 'problem_solving',
    tier: 'bronze',
    criteria: { type: 'problems_solved', target: 1 },
    xpReward: 50,
    rarity: 'common',
  },
  {
    id: 'problem_solver_10',
    name: 'Problem Solver',
    description: 'Solve 10 problems',
    icon: '💪',
    category: 'problem_solving',
    tier: 'silver',
    criteria: { type: 'problems_solved', target: 10 },
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'problem_solver_50',
    name: 'Dedicated Coder',
    description: 'Solve 50 problems',
    icon: '🔥',
    category: 'problem_solving',
    tier: 'gold',
    criteria: { type: 'problems_solved', target: 50 },
    xpReward: 250,
    rarity: 'rare',
  },
  {
    id: 'problem_solver_100',
    name: 'Century Club',
    description: 'Solve 100 problems',
    icon: '💯',
    category: 'problem_solving',
    tier: 'platinum',
    criteria: { type: 'problems_solved', target: 100 },
    xpReward: 500,
    rarity: 'epic',
  },
  {
    id: 'problem_solver_500',
    name: 'Legend',
    description: 'Solve 500 problems',
    icon: '👑',
    category: 'problem_solving',
    tier: 'diamond',
    criteria: { type: 'problems_solved', target: 500 },
    xpReward: 2000,
    rarity: 'legendary',
  },

  {
    id: 'array_master',
    name: 'Array Master',
    description: 'Solve 20 array problems',
    icon: '📊',
    category: 'pattern_mastery',
    tier: 'gold',
    criteria: { type: 'pattern_problems', target: 20, context: 'array' },
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'dp_master',
    name: 'DP Master',
    description: 'Solve 15 dynamic programming problems',
    icon: '🧩',
    category: 'pattern_mastery',
    tier: 'platinum',
    criteria: { type: 'pattern_problems', target: 15, context: 'dynamic_programming' },
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'graph_expert',
    name: 'Graph Expert',
    description: 'Solve 15 graph problems',
    icon: '🕸️',
    category: 'pattern_mastery',
    tier: 'platinum',
    criteria: { type: 'pattern_problems', target: 15, context: 'graph' },
    xpReward: 300,
    rarity: 'epic',
  },
  {
    id: 'sliding_window_pro',
    name: 'Sliding Window Pro',
    description: 'Solve 10 sliding window problems',
    icon: '🪟',
    category: 'pattern_mastery',
    tier: 'gold',
    criteria: { type: 'pattern_problems', target: 10, context: 'sliding_window' },
    xpReward: 200,
    rarity: 'rare',
  },
  {
    id: 'tree_wizard',
    name: 'Tree Wizard',
    description: 'Solve 15 tree problems',
    icon: '🌳',
    category: 'pattern_mastery',
    tier: 'gold',
    criteria: { type: 'pattern_problems', target: 15, context: 'tree' },
    xpReward: 250,
    rarity: 'rare',
  },

  {
    id: 'easy_champion',
    name: 'Easy Champion',
    description: 'Solve 30 easy problems',
    icon: '🌟',
    category: 'problem_solving',
    tier: 'silver',
    criteria: { type: 'difficulty_problems', target: 30, context: 'easy' },
    xpReward: 150,
    rarity: 'common',
  },
  {
    id: 'medium_warrior',
    name: 'Medium Warrior',
    description: 'Solve 30 medium problems',
    icon: '⚔️',
    category: 'problem_solving',
    tier: 'gold',
    criteria: { type: 'difficulty_problems', target: 30, context: 'medium' },
    xpReward: 300,
    rarity: 'rare',
  },
  {
    id: 'hard_conqueror',
    name: 'Hard Conqueror',
    description: 'Solve 10 hard problems',
    icon: '🏆',
    category: 'problem_solving',
    tier: 'platinum',
    criteria: { type: 'difficulty_problems', target: 10, context: 'hard' },
    xpReward: 500,
    rarity: 'epic',
  },

  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    criteria: { type: 'streak_days', target: 7 },
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '⚡',
    category: 'streak',
    tier: 'gold',
    criteria: { type: 'streak_days', target: 30 },
    xpReward: 500,
    rarity: 'epic',
  },
  {
    id: 'streak_100',
    name: 'Consistency King',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    category: 'streak',
    tier: 'diamond',
    criteria: { type: 'streak_days', target: 100 },
    xpReward: 2000,
    rarity: 'legendary',
  },

  {
    id: 'xp_1000',
    name: 'Rising Star',
    description: 'Earn 1000 XP',
    icon: '⭐',
    category: 'special',
    tier: 'silver',
    criteria: { type: 'xp_earned', target: 1000 },
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'xp_5000',
    name: 'Elite Coder',
    description: 'Earn 5000 XP',
    icon: '💎',
    category: 'special',
    tier: 'platinum',
    criteria: { type: 'xp_earned', target: 5000 },
    xpReward: 500,
    rarity: 'epic',
  },
  {
    id: 'xp_10000',
    name: 'Grandmaster',
    description: 'Earn 10000 XP',
    icon: '🎖️',
    category: 'special',
    tier: 'diamond',
    criteria: { type: 'xp_earned', target: 10000 },
    xpReward: 1000,
    rarity: 'legendary',
  },

  {
    id: 'first_interview',
    name: 'Interview Ready',
    description: 'Complete your first mock interview',
    icon: '🎤',
    category: 'interview',
    tier: 'bronze',
    criteria: { type: 'interview_score', target: 1 },
    xpReward: 150,
    rarity: 'common',
  },
  {
    id: 'interview_ace',
    name: 'Interview Ace',
    description: 'Score 90+ in a mock interview',
    icon: '🌟',
    category: 'interview',
    tier: 'platinum',
    criteria: { type: 'interview_score', target: 90 },
    xpReward: 400,
    rarity: 'epic',
  },
]

async function seedBadges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    await Badge.deleteMany({})
    console.log('Cleared existing badges')

    await Badge.insertMany(badges)
    console.log(`✅ Seeded ${badges.length} badges successfully!`)

    mongoose.connection.close()
  } catch (error) {
    console.error('Error seeding badges:', error)
    process.exit(1)
  }
}

seedBadges()
