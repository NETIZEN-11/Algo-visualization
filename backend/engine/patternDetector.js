export const PATTERNS = Object.freeze({
  ARRAY: 'array',
  TWO_POINTER: 'two_pointer',
  SLIDING_WINDOW: 'sliding_window',
  BINARY_SEARCH: 'binary_search',
  SORTING: 'sorting',
  STACK: 'stack',
  QUEUE: 'queue',
  LINKED_LIST: 'linkedlist',
  TREE: 'tree',
  BST: 'bst',
  TRIE: 'trie',
  GRAPH: 'graph',
  BFS: 'bfs',
  DFS: 'dfs',
  UNION_FIND: 'union_find',
  HEAP: 'heap',
  DP: 'dp',
  GREEDY: 'greedy',
  INTERVAL: 'interval',
  BACKTRACK: 'backtracking',
  BIT: 'bit_manipulation',
  RECURSION: 'recursion',
})

const KEYWORD_MAP = [
  { pattern: PATTERNS.BINARY_SEARCH, words: ['binary search', 'search in rotated', 'find minimum in rotated', 'search insert', 'sqrt', 'first bad version', 'koko eats'] },
  { pattern: PATTERNS.SLIDING_WINDOW, words: ['sliding window', 'minimum size subarray', 'longest substring', 'longest subarray', 'minimum window', 'permutation in string', 'fruit into basket', 'max consecutive', 'subarray sum k'] },
  { pattern: PATTERNS.TWO_POINTER, words: ['two sum ii', 'two sum iv', '3sum', '3sum closest', '4sum', 'container with most water', 'trapping rain water', 'sort colors', 'remove duplicates', 'palindrome linked list', 'partition labels'] },
  { pattern: PATTERNS.LINKED_LIST, words: ['linked list', 'reverse linked', 'merge two sorted lists', 'merge k sorted lists', 'remove nth from end', 'add two numbers', 'copy list with random', 'cycle', 'intersection of two linked'] },
  { pattern: PATTERNS.STACK, words: ['valid parentheses', 'min stack', 'daily temperatures', 'next greater element', 'largest rectangle in histogram', 'decode string', 'simplify path', 'evaluate reverse polish'] },
  { pattern: PATTERNS.QUEUE, words: ['sliding window maximum', 'implement queue', 'number of recent calls', 'design circular queue', 'task scheduler'] },
  { pattern: PATTERNS.TRIE, words: ['implement trie', 'word search ii', 'longest word in dictionary', 'replace words', 'prefix tree'] },
  { pattern: PATTERNS.HEAP, words: ['kth largest', 'kth smallest', 'top k frequent', 'find median from data stream', 'merge k sorted lists', 'task scheduler', 'seat reservation', 'sliding window median'] },
  { pattern: PATTERNS.UNION_FIND, words: ['number of connected components', 'redundant connection', 'accounts merge', 'satisfiability of equality', 'regions cut by slashes', 'friend circles', 'most stones removed'] },
  { pattern: PATTERNS.BST, words: ['binary search tree', 'validate bst', 'kth smallest in bst', 'lowest common ancestor of bst', 'convert sorted array to bst', 'inorder successor', 'recover bst'] },
  { pattern: PATTERNS.TREE, words: ['binary tree', 'level order', 'zigzag level order', 'symmetric tree', 'same tree', 'invert binary tree', 'maximum depth', 'diameter of binary tree', 'path sum', 'serialize and deserialize', 'vertical order', 'right side view', 'flatten'] },
  { pattern: PATTERNS.BFS, words: ['bfs', 'breadth first', 'level order', 'rotting oranges', 'shortest path in a grid', 'word ladder', 'open the lock'] },
  { pattern: PATTERNS.DFS, words: ['dfs', 'depth first', 'flood fill', 'number of islands', 'surrounded regions', 'word search', 'path sum', 'clone graph', 'course schedule', 'keys and rooms'] },
  { pattern: PATTERNS.GRAPH, words: ['graph', 'clone graph', 'course schedule', 'network delay time', 'cheapest flights', 'reconstruct itinerary', 'min cost to connect', 'graph valid tree', 'alien dictionary'] },
  { pattern: PATTERNS.INTERVAL, words: ['merge intervals', 'insert interval', 'non overlapping intervals', 'meeting rooms', 'meeting rooms ii', 'minimum intervals to remove'] },
  { pattern: PATTERNS.GREEDY, words: ['jump game', 'gas station', 'candy', 'partition labels', 'two city scheduling', 'best time to buy and sell stock ii', 'assign cookies', 'minimum number of arrows'] },
  { pattern: PATTERNS.DP, words: ['climbing stairs', 'coin change', 'longest increasing subsequence', 'longest common subsequence', 'edit distance', 'minimum path sum', 'unique paths', 'word break', 'house robber', 'decode ways', 'maximum subarray', 'best time to buy and sell stock', 'partition equal subset sum', 'target sum', 'interleaving string', 'burst balloons', 'palindromic substrings'] },
  { pattern: PATTERNS.BACKTRACK, words: ['permutations', 'combinations', 'combination sum', 'subsets', 'word search', 'n queens', 'sudoku solver', 'generate parentheses', 'letter combinations', 'palindrome partitioning'] },
  { pattern: PATTERNS.BIT, words: ['single number', 'number of 1 bits', 'counting bits', 'reverse bits', 'missing number', 'sum of two integers', 'bitwise and of numbers range', 'power of two', 'hamming distance'] },
  { pattern: PATTERNS.SORTING, words: ['sort an array', 'sort colors', 'merge sort', 'quick sort', 'largest number', 'kth largest', 'top k frequent'] },
  { pattern: PATTERNS.QUEUE, words: ['queue', 'implement queue', 'recent counter', 'design circular queue'] },
]

const TAG_MAP = {
  'hash table': PATTERNS.ARRAY,
  'array': PATTERNS.ARRAY,
  'string': PATTERNS.ARRAY,
  'two pointers': PATTERNS.TWO_POINTER,
  'sliding window': PATTERNS.SLIDING_WINDOW,
  'binary search': PATTERNS.BINARY_SEARCH,
  'divide and conquer': PATTERNS.RECURSION,
  'linked list': PATTERNS.LINKED_LIST,
  'stack': PATTERNS.STACK,
  'queue': PATTERNS.QUEUE,
  'trie': PATTERNS.TRIE,
  'heap': PATTERNS.HEAP,
  'priority queue': PATTERNS.HEAP,
  'union find': PATTERNS.UNION_FIND,
  'tree': PATTERNS.TREE,
  'binary search tree': PATTERNS.BST,
  'binary tree': PATTERNS.TREE,
  'graph': PATTERNS.GRAPH,
  'bfs': PATTERNS.BFS,
  'dfs': PATTERNS.DFS,
  'topological sort': PATTERNS.DFS,
  'greedy': PATTERNS.GREEDY,
  'dynamic programming': PATTERNS.DP,
  'backtracking': PATTERNS.BACKTRACK,
  'bit manipulation': PATTERNS.BIT,
  'sorting': PATTERNS.SORTING,
  'recursion': PATTERNS.RECURSION,
  'interval': PATTERNS.INTERVAL,
}

const norm = (s) => String(s || '').toLowerCase()

export function detectPattern(spec = {}) {
  if (!spec || typeof spec !== 'object') spec = {}
  const title = norm(spec.title)
  const desc = norm(spec.description)
  const tags = Array.isArray(spec.tags) ? spec.tags.map(norm) : []
  const signals = []
  const scores = new Map()

  for (const tag of tags) {
    const pat = TAG_MAP[tag]
    if (pat) {
      scores.set(pat, (scores.get(pat) || 0) + 2)
      signals.push(`tag:${tag}=${pat}`)
    }
  }

  for (const { pattern, words } of KEYWORD_MAP) {
    for (const w of words) {
      if (title.includes(w) || (desc && desc.includes(w))) {
        scores.set(pattern, (scores.get(pattern) || 0) + 1)
        signals.push(`kw:${w}=${pattern}`)
        break
      }
    }
  }

  if (scores.size === 0) {
    return { pattern: PATTERNS.ARRAY, confidence: 0.2, signals: [] }
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1])
  const [best, score] = sorted[0]
  const totalSignal = sorted.reduce((s, [, v]) => s + v, 0)
  return {
    pattern: best,
    confidence: Math.min(1, score / Math.max(totalSignal, 1)),
    signals,
  }
}

export const SUPPORTED_PATTERNS = Object.values(PATTERNS)
