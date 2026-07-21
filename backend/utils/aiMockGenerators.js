import { detectPattern, PATTERNS } from '../engine/patternDetector.js'
import { patternLabel } from '../engine/stepGenerator.js'

const PATTERN_GUIDE = {
  array: {
    intuition: 'A single pass over the array accumulating the answer.',
    dataStructure: 'Array',
    template: 'Iterate once, update the answer in O(1) per element.',
    code: (title) => `def solve(nums):\n    """${title} (mock — array)"""\n    n = len(nums)\n    ans = 0\n    for i, x in enumerate(nums):\n        ans = max(ans, x) if x > ans else ans\n    return ans\n`,
  },
  two_pointer: {
    intuition: 'Two pointers move towards each other (or in the same direction) avoiding the inner loop.',
    dataStructure: 'Array (sorted or pairable)',
    template: 'left=0, right=n-1, move based on the comparison.',
    code: (title) => `def solve(nums, target):\n    """${title} (mock — two pointer)"""\n    l, r = 0, len(nums) - 1\n    while l < r:\n        s = nums[l] + nums[r]\n        if s == target: return [l, r]\n        if s < target: l += 1\n        else: r -= 1\n    return []\n`,
  },
  sliding_window: {
    intuition: 'Maintain a window [l, r] and slide it to keep the constraint satisfied.',
    dataStructure: 'Array / HashMap',
    template: 'Expand r, shrink l while invalid, record best.',
    code: (title) => `def solve(s):\n    """${title} (mock — sliding window)"""\n    seen = {}\n    l = best = 0\n    for r, ch in enumerate(s):\n        if ch in seen and seen[ch] >= l:\n            l = seen[ch] + 1\n        seen[ch] = r\n        best = max(best, r - l + 1)\n    return best\n`,
  },
  binary_search: {
    intuition: 'Maintain a monotonic predicate; binary-search the boundary.',
    dataStructure: 'Sorted array',
    template: 'lo, hi = 0, n; while lo < hi: mid = (lo+hi)//2.',
    code: (title) => `def solve(nums, target):\n    """${title} (mock — binary search)"""\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target: return mid\n        if nums[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1\n`,
  },
  stack: {
    intuition: 'Use a stack to remember the most recent unmatched element.',
    dataStructure: 'Stack',
    template: 'For each char, push or pop based on the rule.',
    code: (title) => `def solve(s):\n    """${title} (mock — stack)"""\n    st = []\n    pairs = {')':'(', ']':'[', '}':'{'}\n    for ch in s:\n        if ch in '([{':\n            st.append(ch)\n        elif not st or st.pop() != pairs[ch]:\n            return False\n    return not st\n`,
  },
  queue: {
    intuition: 'BFS-style: process items in FIFO order, often with a level counter.',
    dataStructure: 'Queue (deque)',
    template: 'while q: cur = q.popleft(); for n in cur.neighbors: q.append(n).',
    code: (title) => `from collections import deque\ndef solve(root):\n    """${title} (mock — queue)"""\n    if not root: return 0\n    q = deque([root])\n    depth = 0\n    while q:\n        for _ in range(len(q)):\n            node = q.popleft()\n            if node.left: q.append(node.left)\n            if node.right: q.append(node.right)\n        depth += 1\n    return depth\n`,
  },
  linkedlist: {
    intuition: 'Walk the list, possibly with fast/slow pointers.',
    dataStructure: 'Linked list',
    template: 'Use two pointers — slow moves 1, fast moves 2.',
    code: (title) => `def solve(head):\n    """${title} (mock — linked list)"""\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    return slow\n`,
  },
  tree: {
    intuition: 'Decide top-down (pass info down) or bottom-up (return info up).',
    dataStructure: 'Binary tree',
    template: 'DFS with a helper that returns the answer for the subtree.',
    code: (title) => `def solve(root):\n    """${title} (mock — tree)"""\n    def dfs(node):\n        if not node: return 0\n        return 1 + max(dfs(node.left), dfs(node.right))\n    return dfs(root)\n`,
  },
  bst: {
    intuition: 'Walk the BST using the ordering property; insertion is O(h).',
    dataStructure: 'Binary search tree',
    template: 'cur = root; while cur: go left or right based on key.',
    code: (title) => `def solve(root, target):\n    """${title} (mock — BST)"""\n    cur = root\n    while cur:\n        if cur.val == target: return cur\n        cur = cur.left if target < cur.val else cur.right\n    return None\n`,
  },
  trie: {
    intuition: 'Walk character by character; each node has 26 children.',
    dataStructure: 'Trie (prefix tree)',
    template: 'Insert: walk/create; search: walk/null-check.',
    code: (title) => `def solve(words, prefix):\n    """${title} (mock — trie)"""\n    node = {'children': {}, 'is_end': False}\n    for w in words:\n        cur = node\n        for ch in w:\n            cur = cur['children'].setdefault(ch, {'children': {}, 'is_end': False})\n        cur['is_end'] = True\n    cur = node\n    for ch in prefix:\n        if ch not in cur['children']: return False\n        cur = cur['children'][ch]\n    return True\n`,
  },
  heap: {
    intuition: 'Use a min-heap or max-heap to get the next best element in O(log n).',
    dataStructure: 'Heap (priority queue)',
    template: 'heapq.heappush / heappop.',
    code: (title) => `import heapq\ndef solve(nums, k):\n    """${title} (mock — heap)"""\n    return heapq.nlargest(k, nums)[-1]\n`,
  },
  union_find: {
    intuition: 'Path-compressed union by rank; amortised α(n) per op.',
    dataStructure: 'Disjoint set',
    template: 'find(x), union(x, y) — connect if different roots.',
    code: (title) => `def solve(n, edges):\n    """${title} (mock — union-find)"""\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    def union(a, b):\n        ra, rb = find(a), find(b)\n        if ra == rb: return False\n        parent[ra] = rb\n        return True\n    return sum(union(u, v) for u, v in edges)\n`,
  },
  graph: {
    intuition: 'BFS for shortest path; DFS for connectivity/components.',
    dataStructure: 'Adjacency list + set',
    template: 'Build adj; traverse with BFS or DFS.',
    code: (title) => `def solve(n, edges, src, dst):\n    """${title} (mock — graph)"""\n    from collections import deque\n    adj = [[] for _ in range(n)]\n    for u, v in edges:\n        adj[u].append(v)\n    q = deque([(src, 0)])\n    seen = {src}\n    while q:\n        u, d = q.popleft()\n        if u == dst: return d\n        for v in adj[u]:\n            if v not in seen:\n                seen.add(v)\n                q.append((v, d+1))\n    return -1\n`,
  },
  bfs: {
    intuition: 'Breadth-first search — process level by level.',
    dataStructure: 'Queue',
    template: 'q = deque([start]); while q: pop, visit, enqueue neighbors.',
    code: (title) => `from collections import deque\ndef solve(start):\n    """${title} (mock — BFS)"""\n    q = deque([start])\n    seen = {start}\n    order = []\n    while q:\n        u = q.popleft()\n        order.append(u)\n        for v in graph[u]:\n            if v not in seen:\n                seen.add(v)\n                q.append(v)\n    return order\n`,
  },
  dfs: {
    intuition: 'Depth-first search — go deep, then backtrack.',
    dataStructure: 'Stack / recursion',
    template: 'rec(node): mark visited; for n in node.neighbors: rec(n).',
    code: (title) => `def solve(node, visited):\n    """${title} (mock — DFS)"""\n    if node in visited: return\n    visited.add(node)\n    for n in graph[node]:\n        solve(n, visited)\n    return visited\n`,
  },
  dp: {
    intuition: 'Define dp[i] or dp[i][j], find the recurrence, base cases first.',
    dataStructure: 'Array (1D or 2D)',
    template: 'Bottom-up: for i in range(n): dp[i] = ...; or top-down with memo.',
    code: (title) => `def solve(n):\n    """${title} (mock — DP)"""\n    if n < 2: return n\n    a, b = 0, 1\n    for _ in range(2, n+1):\n        a, b = b, a + b\n    return b\n`,
  },
  greedy: {
    intuition: 'Make the locally optimal choice; prove it leads to a global optimum.',
    dataStructure: 'Sorted array',
    template: 'Sort first; then pick or skip based on the rule.',
    code: (title) => `def solve(intervals):\n    """${title} (mock — greedy)"""\n    intervals.sort()\n    count = 0\n    end = float('-inf')\n    for s, e in intervals:\n        if s >= end:\n            count += 1\n            end = e\n    return count\n`,
  },
  interval: {
    intuition: 'Sort by start; merge overlapping runs.',
    dataStructure: 'Sorted intervals',
    template: 'Sort; keep last end; merge when overlap.',
    code: (title) => `def solve(intervals):\n    """${title} (mock — interval)"""\n    intervals.sort()\n    merged = []\n    for s, e in intervals:\n        if merged and s <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], e)\n        else:\n            merged.append([s, e])\n    return merged\n`,
  },
  backtracking: {
    intuition: 'Build the solution incrementally; prune invalid branches.',
    dataStructure: 'Recursion + state',
    template: 'def backtrack(path, choices): for c in choices: try, recurse, undo.',
    code: (title) => `def solve(nums):\n    """${title} (mock — backtrack)"""\n    res, path = [], []\n    def bt(start):\n        if len(path) == len(nums):\n            res.append(path[:])\n            return\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            bt(i + 1)\n            path.pop()\n    bt(0)\n    return res\n`,
  },
  bit_manipulation: {
    intuition: 'Use XOR, AND, SHIFT — O(1) per op.',
    dataStructure: 'Integer',
    template: 'XOR cancels pairs; mask with &; shift with << >>.',
    code: (title) => `def solve(nums):\n    """${title} (mock — bit)"""\n    x = 0\n    for n in nums:\n        x ^= n\n    return x\n`,
  },
  recursion: {
    intuition: 'Break the problem into a smaller instance plus a combine step.',
    dataStructure: 'Call stack',
    template: 'def f(n): if n <= 1: return base; return combine(n, f(n-1)).',
    code: (title) => `def solve(n):\n    """${title} (mock — recursion)"""\n    if n < 2: return n\n    return solve(n - 1) + solve(n - 2)\n`,
  },
  sorting: {
    intuition: 'Choose the right sort for the data: O(n log n) generic, O(n) for special cases.',
    dataStructure: 'Array',
    template: 'sorted() in Python; sort(arr) in JS.',
    code: (title) => `def solve(nums):\n    """${title} (mock — sorting)"""\n    return sorted(nums, reverse=True)\n`,
  },
}

const DEFAULT_GUIDE = PATTERN_GUIDE.array

const guideFor = (pattern) => PATTERN_GUIDE[pattern] || DEFAULT_GUIDE

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

const patternOf = (spec) => detectPattern(spec).pattern

function codeSolutionsFor(title, pattern) {
  const py = guideFor(pattern).code(title)
  const jsLogic = py
    .split('\n')
    .map((l) => l.replace(/^    /, '  ').replace(/^def\s+(\w+)\(([^)]*)\):/, 'function $1($2) {'))
    .join('\n')
    .replace(/"""[^"]*"""/g, '// ' + title)

  const javaLogic = py
    .replace(/def\s+(\w+)\(([^)]*)\):/, 'public Object $1($2) {')
    .replace(/^    /gm, '    ')
    + '\n}'
  const cppLogic = py
    .replace(/def\s+(\w+)\(([^)]*)\):/, 'auto $1($2) {')
    + '\n}'

  return {
    python: py,
    javascript: jsLogic,
    java: javaLogic,
    cpp: cppLogic,
  }
}

export const mockAnalysis = (problemData) => {
  const { title = 'Untitled', description = '', examples = [], constraints = [] } = problemData || {}
  const pattern = patternOf(problemData)
  const guide = guideFor(pattern)
  const seed = seedFrom(title + pattern)
  const tips = pickN(TIPS, 3, seed)
  const edges = pickN(EDGE_CASES, 4, seed)
  const label = patternLabel(pattern)
  const ex = examples[0] || {}

  return {
    problem_summary: {
      title,
      description,
      input: ex.input ?? 'See problem description above',
      output: ex.output ?? 'See problem description above',
      constraints,
    },
    example_walkthrough: {
      sample_input: ex.input ?? 'Input from the examples',
      sample_output: ex.output ?? 'Output from the examples',
      explanation_steps: [
        `Read the problem carefully and identify the desired output.`,
        `Trace through the first example to understand the input/output contract.`,
        `Think about which data structure fits the access pattern: ${guide.dataStructure}.`,
        `Apply the ${label} pattern (${guide.template.toLowerCase()}).`,
        `Verify your solution on the second example.`,
      ],
    },
    pattern_identification: {
      data_structure: guide.dataStructure,
      pattern: label,
      why_this_pattern: `Detected "${label}" from the problem text. Intuition: ${guide.intuition}`,
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
      core_intuition: guide.intuition,
      why_it_works: guide.template,
      optimization_logic: `Replace the inner loop with a direct lookup / pointer / DP transition.`,
      edge_cases: edges,
      tips,
    },
    code_solutions: codeSolutionsFor(title, pattern),
    complexity_analysis: {
      time_complexity: 'O(n) on average',
      space_complexity: 'O(n)',
      reason: `A single pass with ${guide.dataStructure} gives linear time; the extra space is the cache.`,
    },
    core_concept_deep_dive: {
      concept_name: label,
      definition: `${label} is a reusable strategy for problems sharing the structure: ${guide.intuition}`,
      when_to_use: 'When the input has repeated lookups, sliding access, or recursive substructure.',
      important_tricks: tips,
      common_patterns: [label, 'Hashing', 'Two Pointers', 'Sliding Window'],
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
      pattern: label,
      key_idea: guide.intuition,
      tc: 'O(n)',
      sc: 'O(n)',
      important_trick: tips[0],
      mistakes_to_avoid: ['Off-by-one', 'Empty input', 'Wrong data structure'],
    },
    detected_pattern: pattern,
    confidence: detectPattern(problemData).confidence,
    mocked: true,
  }
}

const HINTS = {
  1: [
    (title) => `Restate the problem in your own words: what is the input, what is the output of "${title}"?`,
    (title) => `Look at the constraints of "${title}". Do they hint at O(n log n) or O(n)?`,
    () => `Trace a small example by hand before writing any code.`,
  ],
  2: [
    (_title, label) => `The ${label} pattern applies here. Ask: can you avoid an inner loop with a ${guideFor(patternOf({ title: _title, description: '' })).dataStructure}?`,
    () => `What's the invariant your algorithm should maintain? Write it down.`,
    () => `Can you split the problem into a smaller instance plus a combine step?`,
  ],
  3: [
    () => `You are close — re-check edge cases (empty, single element, duplicates) and the boundary indices.`,
    () => `Trace through once more. Where could it break? Which input makes it fail?`,
    (_title, label) => `Consider the time/space trade-off one more time. Is your chosen ${label} implementation optimal?`,
  ],
}

export const mockHint = (problemData, level = 1) => {
  const lv = Math.min(3, Math.max(1, level))
  const list = HINTS[lv]
  const seed = seedFrom((problemData?.title || '') + lv)
  const tpl = list[seed % list.length]
  const label = patternLabel(patternOf(problemData || {}))
  return { hint: tpl(problemData?.title || 'the problem', label), level: lv, mocked: true }
}

export const mockCodeReview = (code, language) => {
  const lines = String(code || '').split('\n').length
  const issues = []
  if (lines > 50) issues.push('Consider breaking the function into smaller helpers for readability.')
  if (/console\.log/.test(code) && language === 'javascript') issues.push('Remove debug console.log statements.')
  if (/print\(/.test(code) && language === 'python') issues.push('Remove debug print() calls before submission.')
  if (/TODO|FIXME/i.test(code)) issues.push('Unfinished TODO/FIXME markers found in the code.')
  if (/\bvar\b/.test(code)) issues.push('Avoid `var` — use `const` or `let` instead.')
  return {
    analysis: 'Code is syntactically reasonable. Review the suggestions below to improve quality and performance.',
    hasErrors: issues.length > 0,
    suggestions: issues.length ? issues : ['Looks good. Add comments to explain the algorithm in plain English.'],
    mocked: true,
  }
}

export const mockTestCases = (problemData) => {
  const base = problemData?.examples?.[0]?.input
  const baseOut = problemData?.examples?.[0]?.output
  const pattern = patternOf(problemData || {})
  const cases = []
  if (base !== undefined) cases.push({ input: base, expected: baseOut, explanation: 'Sample case from the problem description.' })
  cases.push({ input: 'edge case: empty', expected: 'depends on problem', explanation: 'Empty input handling.' })
  cases.push({ input: 'edge case: single element', expected: 'depends on problem', explanation: 'One-element boundary.' })
  cases.push({ input: 'edge case: duplicates', expected: 'depends on problem', explanation: 'Duplicates must not break the algorithm.' })
  if (pattern === PATTERNS.TWO_POINTER || pattern === PATTERNS.SLIDING_WINDOW) {
    cases.push({ input: 'all elements equal', expected: 'depends on problem', explanation: 'Pointer / window must still move.' })
  }
  if (pattern === PATTERNS.TREE || pattern === PATTERNS.BST) {
    cases.push({ input: 'single-node tree', expected: 'depends on problem', explanation: 'Empty/singleton tree.' })
  }
  return { cases, mocked: true }
}

export const mockDryRun = (code, customInput) => {
  const lines = (code || '').split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))
  return {
    steps: [
      { step: 1, description: 'Read the input from stdin.', state: { input: customInput } },
      { step: 2, description: `Parse the input (${typeof customInput}).`, state: { parsed: customInput } },
      ...lines.slice(0, 3).map((l, i) => ({
        step: 3 + i,
        description: `Line ${i + 1}: ${l.trim().slice(0, 80)}`,
        state: { lineNumber: i + 1 },
      })),
      { step: 3 + lines.length, description: 'Return the final result.', state: { done: true } },
    ],
    finalOutput: 'The algorithm terminates successfully. Verify on the example cases.',
    mocked: true,
  }
}

export const mockInterviewFeedback = (question, answer) => {
  const length = (answer || '').length
  let rating = 5
  if (length < 30) rating = 3
  else if (length > 200) rating = 7
  else if (length > 600) rating = 8
  return {
    score: rating * 10,
    correctness: rating >= 7 ? 'Mostly correct' : 'Partially correct',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    codeQuality: rating >= 7 ? 'Good' : 'Decent',
    communicationSkills: rating >= 6 ? 'Good' : 'Adequate',
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

const QUESTION_TEMPLATES = [
  (d) => `Given a binary tree, find the maximum depth. Difficulty: ${d}.`,
  (d) => `Given an array of integers, find the longest subarray with sum equal to k. Difficulty: ${d}.`,
  (d) => `Implement an LRU cache. Difficulty: ${d}.`,
  (d) => `Find the k-th largest element in an unsorted array. Difficulty: ${d}.`,
  (d) => `Given a string, find the length of the longest substring without repeating characters. Difficulty: ${d}.`,
  (d) => `Given a graph, determine if there is a path between two nodes. Difficulty: ${d}.`,
  (d) => `Reverse a linked list in place. Difficulty: ${d}.`,
  (d) => `Design a rate limiter for an API. Difficulty: ${d}.`,
  (d) => `Given an array of meeting intervals, find the minimum number of rooms required. Difficulty: ${d}.`,
  (d) => `Rotate an n×n matrix 90 degrees clockwise in place. Difficulty: ${d}.`,
]

export const mockInterviewQuestion = (difficulty = 'Medium', action = 'start', lastAnswer) => {
  if (action === 'followup') {
    return { question: 'What is the time complexity of your solution? How would you improve it?', category: 'Follow-up', difficulty }
  }
  const seed = seedFrom(action + difficulty + (lastAnswer || ''))
  const tpl = QUESTION_TEMPLATES[seed % QUESTION_TEMPLATES.length]
  return { question: tpl(difficulty), category: 'DSA', difficulty }
}

export const mockReadiness = (userStats, _solvedProblems) => {
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

export const mockFlashcards = (problemData, analysis) => {
  const title = problemData?.title || 'Problem'
  const label = patternLabel(patternOf(problemData || {}))
  return {
    flashcards: [
      { front: `What pattern does "${title}" belong to?`, back: analysis?.pattern_identification?.pattern || label, category: 'pattern' },
      { front: `What is the time complexity of the optimal approach?`, back: analysis?.complexity_analysis?.time_complexity || 'O(n)', category: 'complexity' },
      { front: `What data structure is used?`, back: analysis?.pattern_identification?.data_structure || guideFor(patternOf(problemData || {})).dataStructure, category: 'data-structure' },
      { front: 'What is the brute-force time complexity?', back: analysis?.bruteforce_approach?.time_complexity || 'O(n²)', category: 'complexity' },
      { front: 'Name a common mistake to avoid.', back: 'Off-by-one errors and empty input handling.', category: 'mistake' },
    ],
    mocked: true,
  }
}

import { buildSteps } from '../engine/stepGenerator.js'

export const mockVisualisation = (problemData) => {

  const r = buildSteps(problemData || {})
  return {
    type: r.pattern,
    steps: r.steps.map((s) => ({
      step_number: s.id,
      state: s.state,
      explanation: `${s.title}: ${s.explanation}`,
      highlight: s.highlights,
    })),
    pattern: r.pattern,
    pattern_label: r.patternLabel,
    confidence: r.confidence,
    mocked: true,
  }
}
