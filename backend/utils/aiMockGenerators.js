/**
 * Mock content generators.
 *
 * When `MOCK_AI=true` (or no OpenAI key is present), the AI service
 * returns templated-but-problem-specific responses built from the
 * problem title and description. The previous version returned the
 * SAME hard-coded "Two Sum" content for every problem, which was
 * misleading. This module generates content that varies by the
 * problem's actual title.
 */
const TIPS = [
  'Trace the algorithm on a small example before writing code.',
  'Identify the bottleneck — time or space — and optimise from there.',
  'Consider the input size: O(n) is fine for n=10^5 but O(n²) is not.',
  'Think about edge cases: empty input, single element, duplicates.',
  'A hashmap can usually turn an O(n²) lookup into O(n).',
  'Two pointers work well on sorted arrays or arrays of pairs.',
  'Sliding window is the go-to pattern for contiguous subarray problems.',
  'BFS for shortest path on unweighted graphs; DFS for exploring all paths.',
  'Dynamic programming is recursion + memoisation; identify the state first.',
  'Binary search needs a monotonic predicate; check boundary conditions.',
  'For trees, decide top-down or bottom-up traversal before coding.',
  'Use a stack for LIFO problems; a queue for FIFO; a deque for both.',
  'Greedy works when local choices lead to a globally optimal solution.',
  'Bit manipulation is often O(1) for single-number and parity problems.',
  'A union-find data structure is great for connectivity queries.',
]

const EDGE_CASES = [
  'Empty input array',
  'Single-element input',
  'All elements equal',
  'Very large input (10^5+ elements)',
  'Negative numbers',
  'Duplicate values',
  'Inputs at boundary of constraints',
  'Off-by-one indices',
]

const PATTERN_KEYWORDS = {
  hash: { pattern: 'Hashing', dataStructure: 'Hash Map / Set' },
  hashmap: { pattern: 'Hashing', dataStructure: 'Hash Map / Set' },
  'two sum': { pattern: 'Hashing', dataStructure: 'Hash Map' },
  anagram: { pattern: 'Hashing', dataStructure: 'Hash Map' },
  sliding: { pattern: 'Sliding Window', dataStructure: 'Array' },
  subarray: { pattern: 'Sliding Window', dataStructure: 'Array' },
  substring: { pattern: 'Sliding Window', dataStructure: 'String' },
  'binary search': { pattern: 'Binary Search', dataStructure: 'Sorted Array' },
  sorted: { pattern: 'Binary Search', dataStructure: 'Sorted Array' },
  tree: { pattern: 'Tree Traversal', dataStructure: 'Binary Tree' },
  bst: { pattern: 'Tree Traversal', dataStructure: 'Binary Search Tree' },
  graph: { pattern: 'Graph Traversal', dataStructure: 'Graph' },
  bfs: { pattern: 'BFS', dataStructure: 'Queue' },
  dfs: { pattern: 'DFS', dataStructure: 'Stack / Recursion' },
  dp: { pattern: 'Dynamic Programming', dataStructure: 'Array' },
  dynamic: { pattern: 'Dynamic Programming', dataStructure: 'Array' },
  knapsack: { pattern: 'Dynamic Programming', dataStructure: 'Array' },
  longest: { pattern: 'Dynamic Programming', dataStructure: 'Array' },
  stack: { pattern: 'Stack', dataStructure: 'Stack' },
  parentheses: { pattern: 'Stack', dataStructure: 'Stack' },
  queue: { pattern: 'Queue', dataStructure: 'Queue' },
  linkedlist: { pattern: 'Linked List', dataStructure: 'Linked List' },
  'linked list': { pattern: 'Linked List', dataStructure: 'Linked List' },
  'reverse linked': { pattern: 'Linked List', dataStructure: 'Linked List' },
  heap: { pattern: 'Heap', dataStructure: 'Priority Queue' },
  priority: { pattern: 'Heap', dataStructure: 'Priority Queue' },
  greedy: { pattern: 'Greedy', dataStructure: 'Array' },
  interval: { pattern: 'Greedy / Intervals', dataStructure: 'Array' },
  merge: { pattern: 'Greedy / Intervals', dataStructure: 'Array' },
  bit: { pattern: 'Bit Manipulation', dataStructure: 'Integer' },
  xor: { pattern: 'Bit Manipulation', dataStructure: 'Integer' },
  backtrack: { pattern: 'Backtracking', dataStructure: 'Recursion' },
  permutation: { pattern: 'Backtracking', dataStructure: 'Recursion' },
  combination: { pattern: 'Backtracking', dataStructure: 'Recursion' },
  trie: { pattern: 'Trie', dataStructure: 'Trie' },
  union: { pattern: 'Union-Find', dataStructure: 'Disjoint Set' },
  lru: { pattern: 'Design / LRU', dataStructure: 'HashMap + Doubly Linked List' },
}

const STARTERS = [
  'def',
  'public',
  'function',
  'class',
  'int',
  'vector',
  'ListNode',
  'TreeNode',
  'const',
]

/** Detect a likely pattern from the problem title. */
export function detectPattern(title = '') {
  const t = String(title).toLowerCase()
  for (const [k, v] of Object.entries(PATTERN_KEYWORDS)) {
    if (t.includes(k)) return v
  }
  return { pattern: 'General DSA', dataStructure: 'Array / Hash Map' }
}

/** Pick N distinct items from a pool, deterministic on the seed. */
function pickN(arr, n, seed = 0) {
  const out = []
  let s = seed || 1
  const taken = new Set()
  while (out.length < n && taken.size < arr.length) {
    s = (s * 9301 + 49297) % 233280
    const idx = Math.floor((s / 233280) * arr.length)
    if (!taken.has(idx)) {
      taken.add(idx)
      out.push(arr[idx])
    }
  }
  return out
}

const seedFrom = (s) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return Math.abs(h)
}

export const mockAnalysis = (problemData) => {
  const { title = 'Untitled', description = '' } = problemData || {}
  const seed = seedFrom(title)
  const { pattern, dataStructure } = detectPattern(title)
  const tips = pickN(TIPS, 3, seed)
  const edges = pickN(EDGE_CASES, 4, seed)

  return {
    problem_summary: {
      title,
      description,
      input: 'See problem description above',
      output: 'See problem description above',
    },
    example_walkthrough: {
      sample_input: problemData.examples?.[0]?.input || 'Input from the examples',
      sample_output: problemData.examples?.[0]?.output || 'Output from the examples',
      explanation_steps: [
        `Read the problem carefully and identify the desired output.`,
        `Trace through the first example to understand the input/output contract.`,
        `Think about which data structure fits the access pattern: ${dataStructure}.`,
        `Apply the ${pattern} pattern to derive the algorithm.`,
        `Verify your solution on the second example.`,
      ],
    },
    pattern_identification: {
      data_structure: dataStructure,
      pattern,
      why_this_pattern: `The keywords in "${title}" strongly suggest the ${pattern} pattern, which leverages ${dataStructure} for efficient access.`,
    },
    bruteforce_approach: {
      idea: 'Enumerate all possible candidates and check each one.',
      steps: [
        'Iterate over all elements (or pairs / subsets) of the input.',
        'For each candidate, verify whether it satisfies the constraint.',
        'Track the best (or first) valid candidate.',
      ],
      dry_run: [
        'i=0: candidate=A[0] → invalid',
        'i=1: candidate=A[1] → valid → record as answer',
        'i=2: candidate=A[2] → valid → update best',
        'Return best.',
      ],
      time_complexity: 'O(n²) or worse',
      space_complexity: 'O(1) to O(n)',
    },
    optimal_approach: {
      core_intuition: `Use a single pass with ${dataStructure} to avoid redundant work.`,
      why_it_works:
        'By caching intermediate results, each element is processed in O(1) amortised time, yielding an O(n) overall solution.',
      optimization_logic: `Replace the inner loop with a direct lookup in ${dataStructure}.`,
      edge_cases: edges,
    },
    visualization: {
      type: pattern === 'Tree Traversal' ? 'tree' : 'array',
      steps: [
        { step_number: 1, state: { i: 0 }, highlight: { i: 0 }, explanation: 'Initialise the data structure.' },
        { step_number: 2, state: { i: 1 }, highlight: { i: 1 }, explanation: 'Process the first element.' },
        { step_number: 3, state: { i: 2 }, highlight: { i: 2 }, explanation: 'Update the answer.' },
        { step_number: 4, state: { done: true }, highlight: {}, explanation: 'Return the result.' },
      ],
    },
    code_solutions: mockCodeSolutions(title, problemData.examples?.[0]?.input),
    complexity_analysis: {
      time_complexity: 'O(n) on average',
      space_complexity: 'O(n)',
      reason: `A single pass with ${dataStructure} gives linear time; the extra space is the cache.`,
    },
    core_concept_deep_dive: {
      concept_name: pattern,
      definition: `${pattern} is a reusable strategy for solving a class of problems sharing a similar structure.`,
      when_to_use: 'When the input has repeated lookups, sliding access, or recursive substructure.',
      important_tricks: tips,
      common_patterns: [pattern, 'Hashing', 'Two Pointers', 'Sliding Window'],
    },
    interview_insights: {
      common_mistakes: [
        'Forgetting to handle empty input.',
        'Off-by-one in pointer updates.',
        'Using the wrong data structure for the access pattern.',
      ],
      edge_cases: edges,
      follow_up_questions: [
        'How would you solve this with O(1) extra space?',
        'What if the input is a stream?',
        'Can you generalise to k-sum?',
      ],
    },
    related_problems: {
      easy: ['Two Sum', 'Valid Parentheses', 'Best Time to Buy and Sell Stock'],
      medium: ['Longest Substring Without Repeating Characters', 'Product of Array Except Self'],
      hard: ['Sliding Window Maximum', 'Minimum Window Substring'],
    },
    revision_notes: {
      pattern,
      key_idea: `Single pass with ${dataStructure} for O(n) time.`,
      tc: 'O(n)',
      sc: 'O(n)',
      important_trick: tips[0],
      mistakes_to_avoid: ['Off-by-one', 'Empty input', 'Wrong data structure'],
    },
    mocked: true,
  }
}

function mockCodeSolutions(title, firstInput) {
  const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return {
    python: `def solve(${firstInput ? 'nums, target' : 'nums'}):\n    """${title} (mock)"""\n    seen = {}\n    for i, n in enumerate(${firstInput ? 'nums' : 'nums'}):\n        # TODO: implement ${patternSafe(title)} using hash map\n        if n in seen:\n            return [seen[n], i]\n        seen[n] = i\n    return []\n`,
    javascript: `function solve(nums${firstInput ? ', target' : ''}) {\n  // ${title} (mock)\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    if (seen.has(nums[i])) return [seen.get(nums[i]), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}\n`,
    java: `class Solution {\n    public int[] solve(int[] nums${firstInput ? ', int target' : ''}) {\n        // ${title} (mock)\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            if (seen.containsKey(nums[i])) return new int[]{seen.get(nums[i]), i};\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}\n`,
    cpp: `class Solution {\npublic:\n    vector<int> solve(vector<int>& nums${firstInput ? ', int target' : ''}) {\n        // ${title} (mock)\n        unordered_map<int,int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            if (seen.count(nums[i])) return {seen[nums[i]], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};\n`,
  }
}

function patternSafe(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/* ------------------------------------------------------------------ */
/* Hint pool                                                            */
/* ------------------------------------------------------------------ */
const HINTS = {
  1: [
    'Start by restating the problem in your own words — what is the input, what is the output?',
    'Look at the constraints. Do they hint at a particular time complexity?',
    'Identify the simplest example and trace a brute-force approach by hand.',
  ],
  2: [
    'What data structure gives you the access pattern you need in O(1) or O(log n)?',
    'Can you split the problem into smaller subproblems? Recursion or DP may apply.',
    'Is there a way to avoid the inner loop by caching intermediate results?',
  ],
  3: [
    'You are very close — think about edge cases: empty input, single element, duplicates.',
    'Trace through your algorithm once more. Where could it break?',
    'Consider the time vs space trade-off. Have you picked the right data structure?',
  ],
}

export const mockHint = (problemData, level = 1) => {
  const lv = Math.min(3, Math.max(1, level))
  const list = HINTS[lv]
  const seed = seedFrom((problemData?.title || '') + lv)
  return { hint: list[seed % list.length], level: lv, mocked: true }
}

/* ------------------------------------------------------------------ */
/* Code review                                                          */
/* ------------------------------------------------------------------ */
export const mockCodeReview = (code, language) => {
  const lines = String(code || '').split('\n').length
  const issues = []
  if (lines > 50) issues.push('Consider breaking the function into smaller helpers for readability.')
  if (/console\.log/.test(code) && language === 'javascript') issues.push('Remove debug console.log statements.')
  if (/print\(/.test(code) && language === 'python') issues.push('Remove debug print() calls before submission.')
  return {
    analysis: 'Code is syntactically reasonable. Review the suggestions below to improve quality and performance.',
    hasErrors: issues.length > 0,
    suggestions: issues.length ? issues : ['Looks good. Add comments to explain the algorithm in plain English.'],
    mocked: true,
  }
}

/* ------------------------------------------------------------------ */
/* Test cases                                                           */
/* ------------------------------------------------------------------ */
export const mockTestCases = (problemData) => {
  const base = problemData?.examples?.[0]?.input || 'nums = [1,2,3]'
  return {
    cases: [
      { input: base, expected: 'true', explanation: 'Sample case from the problem description.' },
      { input: 'empty input', expected: 'edge case', explanation: 'Boundary condition: empty input.' },
      { input: 'single element', expected: 'edge case', explanation: 'Boundary condition: one element.' },
    ],
    mocked: true,
  }
}

/* ------------------------------------------------------------------ */
/* Dry run                                                              */
/* ------------------------------------------------------------------ */
export const mockDryRun = (code, customInput) => {
  return {
    steps: [
      { step: 1, description: 'Read the input from stdin.', state: { input: customInput } },
      { step: 2, description: 'Initialise the data structure.', state: {} },
      { step: 3, description: 'Process each element one by one.', state: {} },
      { step: 4, description: 'Return the final result.', state: { done: true } },
    ],
    finalOutput: 'The algorithm terminates successfully. Verify on the example cases.',
    mocked: true,
  }
}

/* ------------------------------------------------------------------ */
/* Interview feedback                                                   */
/* ------------------------------------------------------------------ */
export const mockInterviewFeedback = (question, answer) => {
  const length = (answer || '').length
  let rating = 5
  if (length < 30) rating = 3
  else if (length > 200) rating = 7
  return {
    score: rating * 10,
    correctness: rating >= 7 ? 'Mostly correct' : 'Partially correct',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    codeQuality: 'Decent',
    communicationSkills: 'Good',
    suggestions: [
      'Explain your thought process step-by-step.',
      'Discuss time and space complexity up front.',
      'Consider edge cases and how to handle them.',
    ],
    strengths: ['Clear structure', 'Reasonable approach'],
    weaknesses: ['Could discuss trade-offs more'],
    mocked: true,
  }
}

/* ------------------------------------------------------------------ */
/* Interview question                                                   */
/* ------------------------------------------------------------------ */
const QUESTION_TEMPLATES = [
  (d) => `Given a binary tree, find the maximum depth. Difficulty: ${d}.`,
  (d) => `Given an array of integers, find the longest subarray with sum equal to k. Difficulty: ${d}.`,
  (d) => `Implement an LRU cache. Difficulty: ${d}.`,
  (d) => `Find the k-th largest element in an unsorted array. Difficulty: ${d}.`,
  (d) => `Given a string, find the length of the longest substring without repeating characters. Difficulty: ${d}.`,
  (d) => `Given a graph, determine if there is a path between two nodes. Difficulty: ${d}.`,
  (d) => `Reverse a linked list in place. Difficulty: ${d}.`,
  (d) => `Design a rate limiter for an API. Difficulty: ${d}.`,
]

export const mockInterviewQuestion = (difficulty = 'Medium', action = 'start', lastAnswer) => {
  if (action === 'followup') {
    return { question: 'What is the time complexity of your solution? How would you improve it?', category: 'Follow-up', difficulty }
  }
  const seed = seedFrom(action + difficulty + (lastAnswer || ''))
  const tpl = QUESTION_TEMPLATES[seed % QUESTION_TEMPLATES.length]
  return { question: tpl(difficulty), category: 'DSA', difficulty }
}

/* ------------------------------------------------------------------ */
/* Interview readiness                                                  */
/* ------------------------------------------------------------------ */
export const mockReadiness = (userStats, solvedProblems) => {
  const total = userStats?.totalProblemsSolved || 0
  const weighted =
    (userStats?.easy || 0) * 1 +
    (userStats?.medium || 0) * 3 +
    (userStats?.hard || 0) * 6
  const overall = Math.min(100, Math.round(Math.sqrt(weighted) * 10))
  return {
    overall_score: overall,
    data_structures_score: Math.min(100, overall + 5),
    algorithms_score: Math.min(100, overall - 5),
    problem_solving_score: Math.min(100, overall + 10),
    recommendations: [
      'Practise 5 more medium-difficulty problems this week.',
      'Review dynamic programming patterns.',
      'Mock-interview twice before the real one.',
    ],
    mocked: true,
  }
}

/* ------------------------------------------------------------------ */
/* Flashcards                                                           */
/* ------------------------------------------------------------------ */
export const mockFlashcards = (problemData, analysis) => {
  const title = problemData?.title || 'Problem'
  return {
    flashcards: [
      { front: `What pattern does "${title}" belong to?`, back: analysis?.pattern_identification?.pattern || 'General DSA', category: 'pattern' },
      { front: `What is the time complexity of the optimal approach?`, back: analysis?.complexity_analysis?.time_complexity || 'O(n)', category: 'complexity' },
      { front: `What data structure is used?`, back: analysis?.pattern_identification?.data_structure || 'Hash Map', category: 'data-structure' },
      { front: 'What is the brute-force time complexity?', back: analysis?.bruteforce_approach?.time_complexity || 'O(n²)', category: 'complexity' },
      { front: 'Name a common mistake to avoid.', back: 'Off-by-one errors and empty input handling.', category: 'mistake' },
    ],
    mocked: true,
  }
}

/* ------------------------------------------------------------------ */
/* Visualisation                                                        */
/* ------------------------------------------------------------------ */
export const mockVisualisation = (problemData) => {
  return {
    type: 'array',
    steps: [
      { step_number: 1, state: { arr: [1, 2, 3, 4, 5] }, highlight: { i: 0 }, explanation: 'Initial array' },
      { step_number: 2, state: { arr: [1, 2, 3, 4, 5] }, highlight: { i: 1 }, explanation: 'Process element 1' },
      { step_number: 3, state: { arr: [1, 2, 3, 4, 5] }, highlight: { i: 2 }, explanation: 'Process element 2' },
      { step_number: 4, state: { done: true }, highlight: {}, explanation: 'Done' },
    ],
    mocked: true,
  }
}
