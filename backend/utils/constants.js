export const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
}

export const PATTERNS = [
  'Sliding Window',
  'Two Pointer',
  'Binary Search',
  'DFS/BFS',
  'Dynamic Programming',
  'Greedy',
  'Heap',
  'Stack',
  'Queue',
  'Prefix Sum',
  'Hashing',
  'Backtracking',
  'Trie',
  'Union Find',
  'Bit Manipulation',
  'Graph',
  'Tree',
  'Linked List',
  'Array',
  'String',
]

export const XP_REWARDS = {
  PROBLEM_SOLVED_EASY: 10,
  PROBLEM_SOLVED_MEDIUM: 25,
  PROBLEM_SOLVED_HARD: 50,
  INTERVIEW_COMPLETED: 30,
  DAILY_STREAK: 5,
  FIRST_SOLVE: 20,
}

export const BADGE_REQUIREMENTS = {
  ARRAY_MASTER: { pattern: 'Array', count: 50 },
  DP_EXPERT: { pattern: 'Dynamic Programming', count: 25 },
  GRAPH_GURU: { pattern: 'Graph', count: 30 },
  SPEED_DEMON: { type: 'optimal_solutions', count: 10 },
  CONSISTENT_LEARNER: { type: 'streak', days: 30 },
}

export const USER_LEVELS = [
  { level: 1, minXP: 0, name: 'Novice' },
  { level: 2, minXP: 100, name: 'Beginner' },
  { level: 3, minXP: 300, name: 'Learner' },
  { level: 4, minXP: 600, name: 'Intermediate' },
  { level: 5, minXP: 1000, name: 'Advanced' },
  { level: 6, minXP: 1500, name: 'Expert' },
  { level: 7, minXP: 2500, name: 'Master' },
  { level: 8, minXP: 4000, name: 'Grandmaster' },
]

export const COMPANIES = [
  'Google',
  'Amazon',
  'Microsoft',
  'Meta',
  'Apple',
  'Netflix',
  'Tesla',
  'Uber',
  'Airbnb',
  'LinkedIn',
]
