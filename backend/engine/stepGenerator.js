/**
 * Step generator — turns a `ProblemSpec` (and optionally user code) into
 * an animation script. The script is a list of `Step`s, each one a
 * snapshot of state the visualizer renders.
 *
 * No LLM, no network. The generator uses pattern-specific deterministic
 * tracers for the most common patterns, and falls back to a generic
 * "walk-the-input" trace when the pattern is unknown.
 *
 * Schema:
 *   Step = {
 *     id: number
 *     title: string                 // short label for the timeline
 *     explanation: string            // one-sentence "why" for the tooltip
 *     state: Record<string, unknown> // pattern-specific
 *     highlights: { indices?: number[], ids?: string[], range?: [number, number] }
 *   }
 *
 * The visualizer reads `state` and `highlights`; the rest is for the UI.
 */

import { detectPattern, PATTERNS } from './patternDetector.js'

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Build a step script for a problem.
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   tags?: string[],
 *   examples?: Array<{ input?: any, output?: any, explanation?: string }>,
 *   input?: any,                     // optional runtime input
 *   code?: string,                    // optional user code
 *   language?: string,
 * }} spec
 * @returns {{
 *   pattern: string,
 *   confidence: number,
 *   steps: Step[],
 *   meta: { source: 'tracer' | 'derived', patternLabel: string, generatedAt: string }
 * }}
 */
export function buildSteps(spec) {
  const detection = detectPattern(spec)
  const example = pickExample(spec)
  const input = example?.input ?? spec.input ?? []
  const { pattern } = detection

  let result
  try {
    const tracer = TRACERS[pattern]
    if (tracer) {
      result = tracer(spec, input, example?.output)
    } else {
      result = genericTracer(spec, input, example?.output)
    }
  } catch (err) {
    // A buggy tracer should never break the page — fall back to a
    // single-step "unable to animate" step.
    result = {
      steps: [
        {
          id: 0,
          title: 'Unable to animate',
          explanation: `Could not generate steps for this problem: ${err.message}`,
          state: { input },
          highlights: {},
        },
      ],
    }
  }

  return {
    pattern,
    confidence: detection.confidence,
    patternLabel: patternLabel(pattern),
    steps: result.steps,
    meta: {
      source: result.source || 'tracer',
      generatedAt: new Date().toISOString(),
      problemTitle: spec.title,
    },
  }
}

/** Human-friendly label for a pattern. */
export function patternLabel(pattern) {
  const labels = {
    array: 'Array',
    two_pointer: 'Two Pointer',
    sliding_window: 'Sliding Window',
    binary_search: 'Binary Search',
    sorting: 'Sorting',
    stack: 'Stack',
    queue: 'Queue',
    linkedlist: 'Linked List',
    tree: 'Tree',
    bst: 'Binary Search Tree',
    trie: 'Trie',
    graph: 'Graph',
    bfs: 'BFS',
    dfs: 'DFS',
    union_find: 'Union-Find',
    heap: 'Heap',
    dp: 'Dynamic Programming',
    greedy: 'Greedy',
    interval: 'Intervals',
    backtracking: 'Backtracking',
    bit_manipulation: 'Bit Manipulation',
    recursion: 'Recursion',
  }
  return labels[pattern] || 'Array'
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const numArr = (x) => {
  if (Array.isArray(x)) return x.map(Number).filter((n) => Number.isFinite(n))
  if (typeof x === 'string') {
    return x
      .replace(/[\[\]"'`]/g, '')
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n))
  }
  return []
}

const stepCounter = (() => {
  let id = 0
  return () => ++id
})()

const newStep = (title, explanation, state, highlights = {}) => ({
  id: stepCounter(),
  title,
  explanation,
  state,
  highlights,
})

/**
 * Pick the first example that has an `input` we can serialize, falling
 * back to the raw `input` field, then to an empty array.
 */
function pickExample(spec) {
  if (Array.isArray(spec.examples) && spec.examples.length > 0) {
    for (const e of spec.examples) {
      if (e?.input !== undefined && e?.input !== null) return e
    }
    return spec.examples[0]
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Tracers — one per pattern                                            */
/* ------------------------------------------------------------------ */

const TRACERS = {
  [PATTERNS.ARRAY]: arrayTracer,
  [PATTERNS.TWO_POINTER]: twoPointerTracer,
  [PATTERNS.SLIDING_WINDOW]: slidingWindowTracer,
  [PATTERNS.BINARY_SEARCH]: binarySearchTracer,
  [PATTERNS.STACK]: stackTracer,
  [PATTERNS.QUEUE]: queueTracer,
  [PATTERNS.LINKED_LIST]: linkedListTracer,
  [PATTERNS.TREE]: treeTracer,
  [PATTERNS.BST]: bstTracer,
  [PATTERNS.TRIE]: trieTracer,
  [PATTERNS.HEAP]: heapTracer,
  [PATTERNS.UNION_FIND]: unionFindTracer,
  [PATTERNS.GRAPH]: graphTracer,
  [PATTERNS.BFS]: graphTracer,
  [PATTERNS.DFS]: graphTracer,
  [PATTERNS.DP]: dpTracer,
  [PATTERNS.GREEDY]: greedyTracer,
  [PATTERNS.INTERVAL]: intervalTracer,
  [PATTERNS.BACKTRACK]: genericTracer, // for now
  [PATTERNS.BIT]: bitTracer,
  [PATTERNS.RECURSION]: recursionTracer,
  [PATTERNS.SORTING]: sortingTracer,
}

/* ---------- array / generic ---------- */

function arrayTracer(spec, input) {
  const arr = numArr(input)
  const steps = []
  steps.push(newStep('Initial', 'The input array as given.', { array: [...arr] }))
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
    steps.push(
      newStep(
        `Add a[${i}] = ${arr[i]}`,
        `Accumulator += ${arr[i]}. Running sum is ${sum}.`,
        { array: [...arr], accumulator: sum },
        { indices: [i] }
      )
    )
  }
  steps.push(newStep('Done', `Final accumulated value: ${sum}.`, { array: [...arr], accumulator: sum }))
  return { steps, source: 'tracer' }
}

/* ---------- two pointer ---------- */

function twoPointerTracer(spec, input) {
  const arr = numArr(input)
  const steps = []
  let l = 0, r = arr.length - 1
  steps.push(
    newStep(
      'Initialize',
      `Two pointers: left at index 0, right at index ${r}.`,
      { array: [...arr], pointers: { l, r } },
      { indices: [l, r] }
    )
  )
  let safety = 0
  while (l < r && safety++ < 50) {
    const sum = arr[l] + arr[r]
    if (sum === 0) {
      steps.push(
        newStep(
          `Match at (${l}, ${r})`,
          `a[${l}] + a[${r}] = ${arr[l]} + ${arr[r]} = ${sum}. Goal reached.`,
          { array: [...arr], pointers: { l, r }, result: { l, r } },
          { indices: [l, r] }
        )
      )
      break
    }
    if (sum < 0) {
      steps.push(
        newStep(
          `Sum too low`,
          `${sum} < 0, move left pointer right.`,
          { array: [...arr], pointers: { l, r } },
          { indices: [l, r] }
        )
      )
      l++
    } else {
      steps.push(
        newStep(
          `Sum too high`,
          `${sum} > 0, move right pointer left.`,
          { array: [...arr], pointers: { l, r } },
          { indices: [l, r] }
        )
      )
      r--
    }
  }
  steps.push(newStep('Done', 'Search complete.', { array: [...arr], pointers: { l, r } }))
  return { steps, source: 'tracer' }
}

/* ---------- sliding window ---------- */

function slidingWindowTracer(spec, input) {
  const arr = numArr(input)
  const target = parseInt(String(spec.examples?.[0]?.output || 0), 10) || 0
  const steps = []
  let l = 0, sum = 0
  steps.push(
    newStep('Initialize', 'Window is empty. Sum = 0.', { array: [...arr], window: { l, r: -1 }, sum })
  )
  for (let r = 0; r < arr.length; r++) {
    sum += arr[r]
    steps.push(
      newStep(
        `Extend to a[${r}]`,
        `Add ${arr[r]} to window. Sum = ${sum}.`,
        { array: [...arr], window: { l, r }, sum },
        { range: [l, r] }
      )
    )
    while (sum > target && l <= r) {
      sum -= arr[l]
      steps.push(
        newStep(
          `Shrink from left`,
          `Sum > target. Drop a[${l}] (${arr[l] - (sum + arr[l] - sum)}).`,
          { array: [...arr], window: { l: l + 1, r }, sum: sum + arr[l] },
          { range: [l + 1, r] }
        )
      )
      // Correct accounting for the explanation
      sum += arr[l] // restore for clarity
      sum -= arr[l]
      l++
      steps.push(
        newStep(
          `Window shrunk`,
          `Window now [${l}, ${r}], sum = ${sum}.`,
          { array: [...arr], window: { l, r }, sum },
          { range: [l, r] }
        )
      )
    }
  }
  steps.push(newStep('Done', `Final window sum = ${sum}.`, { array: [...arr], window: { l, r: arr.length - 1 }, sum }))
  return { steps, source: 'tracer' }
}

/* ---------- binary search ---------- */

function binarySearchTracer(spec, input) {
  const arr = numArr(input)
  const target = arr[Math.floor(arr.length / 2)] || 0
  const steps = []
  let l = 0, r = arr.length - 1
  while (l <= r) {
    const m = Math.floor((l + r) / 2)
    steps.push(
      newStep(
        `Mid = ${m}`,
        `Compare a[${m}]=${arr[m]} with target=${target}.`,
        { array: [...arr], pointers: { l, m, r } },
        { indices: [l, m, r] }
      )
    )
    if (arr[m] === target) {
      steps.push(newStep('Found', `Target at index ${m}.`, { array: [...arr], result: m }, { indices: [m] }))
      return { steps, source: 'tracer' }
    }
    if (arr[m] < target) {
      steps.push(newStep('Go right', 'Discard left half.', { array: [...arr], pointers: { l: m + 1, m, r } }, { range: [l, m] }))
      l = m + 1
    } else {
      steps.push(newStep('Go left', 'Discard right half.', { array: [...arr], pointers: { l, m, r } }, { range: [m, r] }))
      r = m - 1
    }
  }
  steps.push(newStep('Not found', 'Target not in array.', { array: [...arr] }))
  return { steps, source: 'tracer' }
}

/* ---------- stack ---------- */

function stackTracer(spec, input) {
  const seq = Array.isArray(input) ? input : numArr(input)
  const steps = []
  const stack = []
  for (let i = 0; i < seq.length; i++) {
    stack.push(seq[i])
    steps.push(
      newStep(
        `Push ${seq[i]}`,
        `Stack now: [${stack.join(', ')}].`,
        { stack: [...stack] }
      )
    )
  }
  while (stack.length) {
    const v = stack.pop()
    steps.push(
      newStep(
        `Pop ${v}`,
        `Removed ${v} from top.`,
        { stack: [...stack] }
      )
    )
  }
  return { steps, source: 'tracer' }
}

/* ---------- queue ---------- */

function queueTracer(spec, input) {
  const seq = Array.isArray(input) ? input : numArr(input)
  const steps = []
  const queue = []
  for (let i = 0; i < seq.length; i++) {
    queue.push(seq[i])
    steps.push(
      newStep(
        `Enqueue ${seq[i]}`,
        `Queue: [${queue.join(' ← ')}].`,
        { queue: [...queue] }
      )
    )
  }
  while (queue.length) {
    const v = queue.shift()
    steps.push(
      newStep(
        `Dequeue ${v}`,
        `Removed front. Remaining: [${queue.join(' ← ')}].`,
        { queue: [...queue] }
      )
    )
  }
  return { steps, source: 'tracer' }
}

/* ---------- linked list ---------- */

function linkedListTracer(spec, input) {
  const arr = numArr(input)
  const steps = []
  // Build forward then reverse
  const list = arr.map((v) => ({ value: v, next: null }))
  for (let i = 0; i < list.length - 1; i++) list[i].next = i + 1
  steps.push(newStep('Build list', 'Linked list constructed from input.', { list: list.map((n) => n.value), highlight: 'all' }))
  // Walk
  let node = 0
  while (node != null && node < list.length) {
    steps.push(newStep(`Visit ${list[node].value}`, `At node ${node}.`, { list: list.map((n) => n.value), cursor: node }, { ids: [String(node)] }))
    node = list[node].next
  }
  return { steps, source: 'tracer' }
}

/* ---------- tree (BST-ish, from input array) ---------- */

function treeTracer(spec, input) {
  const arr = numArr(input)
  const steps = []
  if (arr.length === 0) {
    return { steps: [newStep('Empty', 'No tree to visualise.', { tree: null })], source: 'tracer' }
  }
  // Build a binary tree by level from the input array.
  const nodes = arr.map((v) => ({ value: v, left: null, right: null }))
  for (let i = 0; i < nodes.length; i++) {
    const l = 2 * i + 1
    const r = 2 * i + 2
    if (l < nodes.length) nodes[i].left = l
    if (r < nodes.length) nodes[i].right = r
  }
  steps.push(newStep('Build tree', 'Constructed from level-order input.', { tree: nodes, cursor: 0 }))
  // DFS traversal
  const dfs = (i) => {
    if (i == null || i >= nodes.length) return
    steps.push(newStep(`Visit ${nodes[i].value}`, `DFS at index ${i}.`, { tree: nodes, cursor: i }, { ids: [String(i)] }))
    dfs(nodes[i].left)
    dfs(nodes[i].right)
  }
  dfs(0)
  return { steps, source: 'tracer' }
}

function bstTracer(spec, input) {
  // Same as tree but with insertion semantics
  const arr = numArr(input)
  const steps = []
  if (arr.length === 0) {
    return { steps: [newStep('Empty', 'No tree to visualise.', { tree: null })], source: 'tracer' }
  }
  const nodes = []
  for (const v of arr) {
    const node = { value: v, left: null, right: null }
    if (nodes.length === 0) {
      nodes.push(node)
    } else {
      let cur = 0
      while (true) {
        if (v < nodes[cur].value) {
          if (nodes[cur].left == null) { nodes[cur].left = nodes.length; break }
          cur = nodes[cur].left
        } else {
          if (nodes[cur].right == null) { nodes[cur].right = nodes.length; break }
          cur = nodes[cur].right
        }
      }
      nodes.push(node)
    }
    steps.push(
      newStep(
        `Insert ${v}`,
        `Inserted into BST.`,
        { tree: nodes.map((n) => ({ ...n })), cursor: nodes.length - 1 }
      )
    )
  }
  return { steps, source: 'tracer' }
}

/* ---------- trie ---------- */

function trieTracer(spec, input) {
  const words = (Array.isArray(input) ? input : [input]).map(String)
  const steps = []
  const root = { char: '', children: {}, isEnd: false }
  for (const w of words) {
    let node = root
    for (const ch of w) {
      if (!node.children[ch]) node.children[ch] = { char: ch, children: {}, isEnd: false }
      node = node.children[ch]
      steps.push(
        newStep(
          `Visit '${ch}'`,
          `Following character '${ch}'.`,
          { trie: structuredClone(root), cursor: node },
          { ids: [idForTrieNode(node)] }
        )
      )
    }
    node.isEnd = true
    steps.push(newStep(`End of '${w}'`, `Marked as end of word.`, { trie: structuredClone(root) }))
  }
  return { steps, source: 'tracer' }
}

const trieNodeCounter = (() => { let n = 0; return () => `n${n++}` })()
function idForTrieNode(node) {
  if (!node.__id) node.__id = trieNodeCounter()
  return node.__id
}

/* ---------- heap ---------- */

function heapTracer(spec, input) {
  const arr = numArr(input)
  const steps = []
  const heap = []
  for (const v of arr) {
    heap.push(v)
    let i = heap.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (heap[parent] <= heap[i]) break
      ;[heap[parent], heap[i]] = [heap[i], heap[parent]]
      i = parent
    }
    steps.push(
      newStep(
        `Insert ${v}`,
        `Sift up. Heap: [${heap.join(', ')}].`,
        { heap: [...heap] }
      )
    )
  }
  return { steps, source: 'tracer' }
}

/* ---------- union-find ---------- */

function unionFindTracer(spec, input) {
  const arr = numArr(input)
  const n = arr.length || 5
  const parent = Array.from({ length: n }, (_, i) => i)
  const rank = Array(n).fill(0)
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] } return x }
  const union = (a, b) => {
    const ra = find(a), rb = find(b)
    if (ra === rb) return false
    if (rank[ra] < rank[rb]) parent[ra] = rb
    else if (rank[ra] > rank[rb]) parent[rb] = ra
    else { parent[rb] = ra; rank[ra]++ }
    return true
  }
  const steps = []
  steps.push(newStep('Init', 'Each node is its own parent.', { parent: [...parent] }))
  for (let i = 1; i < n; i++) {
    const merged = union(i - 1, i)
    steps.push(
      newStep(
        `Union ${i - 1}, ${i}`,
        merged ? 'Merged into one component.' : 'Already in same set.',
        { parent: [...parent] }
      )
    )
  }
  return { steps, source: 'tracer' }
}

/* ---------- graph (BFS/DFS) ---------- */

function graphTracer(spec, input) {
  // Expect input as [node count, [edges...]] OR a flat array of edges
  let n = 5
  let edges = []
  if (Array.isArray(input) && input.length === 2 && typeof input[0] === 'number') {
    n = input[0]
    edges = input[1] || []
  } else if (Array.isArray(input)) {
    edges = input
  }
  const adj = Array.from({ length: n }, () => [])
  for (const [u, v] of edges) {
    if (u < n && v < n) {
      adj[u].push(v)
      adj[v].push(u)
    }
  }
  const steps = []
  const visited = new Array(n).fill(false)
  const order = []
  const stack = [0]
  visited[0] = true
  while (stack.length) {
    const u = stack.pop()
    order.push(u)
    steps.push(newStep(`Visit ${u}`, `Visited node ${u}.`, { graph: { nodes: n, adj, visited: [...visited], cursor: u, order: [...order] } }, { ids: [String(u)] }))
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true
        stack.push(v)
        steps.push(newStep(`Discover ${v}`, `From ${u}, push ${v}.`, { graph: { nodes: n, adj, visited: [...visited], cursor: u, order: [...order] } }, { ids: [String(v)] }))
      }
    }
  }
  return { steps, source: 'tracer' }
}

/* ---------- DP ---------- */

function dpTracer(spec, input) {
  const arr = numArr(input)
  if (arr.length === 0) {
    return { steps: [newStep('Empty input', 'Need an array to DP on.', { dp: [] })], source: 'tracer' }
  }
  const n = Math.min(arr.length, 12)
  const dp = new Array(n).fill(0)
  const steps = []
  dp[0] = arr[0]
  steps.push(newStep('Base case', `dp[0] = ${dp[0]}.`, { dp: [...dp], array: arr.slice(0, n) }, { indices: [0] }))
  for (let i = 1; i < n; i++) {
    dp[i] = Math.max(dp[i - 1] + arr[i], arr[i])
    steps.push(
      newStep(
        `dp[${i}]`,
        `dp[${i}] = max(dp[${i - 1}] + ${arr[i]}, ${arr[i]}) = ${dp[i]}.`,
        { dp: [...dp], array: arr.slice(0, n) },
        { indices: [i] }
      )
    )
  }
  return { steps, source: 'tracer' }
}

/* ---------- greedy ---------- */

function greedyTracer(spec, input) {
  // Generic: jump-game style — track the farthest reachable index
  const arr = numArr(input)
  const steps = []
  let reach = 0
  for (let i = 0; i < arr.length; i++) {
    const newReach = Math.max(reach, i + arr[i])
    steps.push(
      newStep(
        `i=${i}, a[${i}]=${arr[i]}`,
        `Reach extends to ${newReach}.`,
        { array: [...arr], reach, greedy: true },
        { indices: [i] }
      )
    )
    reach = newReach
    if (i > reach) {
      steps.push(newStep('Stuck', `Cannot reach beyond ${reach}.`, { array: [...arr], reach, greedy: true }))
      return { steps, source: 'tracer' }
    }
  }
  steps.push(newStep('Reached end', 'Greedy succeeded.', { array: [...arr], reach, greedy: true }))
  return { steps, source: 'tracer' }
}

/* ---------- interval ---------- */

function intervalTracer(spec, input) {
  const arr = numArr(input)
  // Treat arr as flat [a0,b0,a1,b1,...]
  const intervals = []
  for (let i = 0; i + 1 < arr.length; i += 2) intervals.push([arr[i], arr[i + 1]])
  intervals.sort((a, b) => a[0] - b[0])
  const steps = []
  const merged = []
  for (const [s, e] of intervals) {
    if (merged.length === 0 || s > merged[merged.length - 1][1]) {
      merged.push([s, e])
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e)
    }
    steps.push(
      newStep(
        `Process [${s}, ${e}]`,
        `Merged so far: ${JSON.stringify(merged)}.`,
        { intervals: merged.map((m) => [...m]) }
      )
    )
  }
  return { steps, source: 'tracer' }
}

/* ---------- bit manipulation ---------- */

function bitTracer(spec, input) {
  const n = Number(input) || 0
  const steps = []
  steps.push(newStep('Input', `n = ${n}.`, { value: n, bits: toBits(n) }))
  let x = n
  let i = 0
  while (x > 0 && i < 16) {
    const b = x & 1
    steps.push(newStep(`Bit ${i}`, `LSB of ${x} is ${b}.`, { value: x, bits: toBits(x), currentBit: i }))
    x = x >>> 1
    i++
  }
  return { steps, source: 'tracer' }
}

function toBits(n) {
  return Array.from({ length: 8 }, (_, i) => (n >> (7 - i)) & 1)
}

/* ---------- recursion (factorial) ---------- */

function recursionTracer(spec, input) {
  const n = Math.max(1, Math.min(6, Number(input) || 4))
  const steps = []
  const stack = []
  const recurse = (k) => {
    stack.push(k)
    steps.push(newStep(`Call f(${k})`, `Push frame for f(${k}).`, { stack: [...stack] }))
    if (k <= 1) {
      steps.push(newStep('Base case', 'Return 1.', { stack: [...stack], result: 1 }))
      stack.pop()
      steps.push(newStep('Return', 'Frame popped.', { stack: [...stack] }))
      return 1
    }
    const v = k * recurse(k - 1)
    steps.push(newStep(`Return ${v}`, `f(${k}) = ${k} * f(${k - 1}) = ${v}.`, { stack: [...stack], result: v }))
    stack.pop()
    steps.push(newStep('Pop', `Frame for f(${k}) popped.`, { stack: [...stack] }))
    return v
  }
  recurse(n)
  return { steps, source: 'tracer' }
}

/* ---------- sorting (bubble sort) ---------- */

function sortingTracer(spec, input) {
  const arr = numArr(input)
  const steps = []
  const a = [...arr]
  steps.push(newStep('Initial', 'Bubble sort starting.', { array: [...a] }))
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      steps.push(newStep(`Compare (${j}, ${j + 1})`, `Comparing a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}.`, { array: [...a] }, { indices: [j, j + 1] }))
      if (a[j] > a[j + 1]) {
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        steps.push(newStep('Swap', 'Swapped.', { array: [...a] }, { indices: [j, j + 1] }))
      }
    }
    steps.push(newStep(`Pass ${i + 1} done`, `a[${a.length - i - 1}] is in place.`, { array: [...a] }))
  }
  return { steps, source: 'tracer' }
}

/* ---------- generic fallback ---------- */

function genericTracer(spec, input) {
  const arr = numArr(input)
  const steps = [newStep('Input', 'Displaying the input as-is.', { array: [...arr] })]
  for (let i = 0; i < arr.length; i++) {
    steps.push(newStep(`Inspect a[${i}]`, `Value = ${arr[i]}.`, { array: [...arr] }, { indices: [i] }))
  }
  return { steps, source: 'derived' }
}
