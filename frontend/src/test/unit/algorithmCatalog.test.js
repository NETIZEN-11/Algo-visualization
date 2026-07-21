import { describe, it, expect } from 'vitest'
import { ALGORITHMS, CATEGORIES, generateSteps } from '../../data/algorithmCatalog'

describe('algorithmCatalog', () => {
  it('has at least 15 algorithms', () => {
    expect(Object.keys(ALGORITHMS).length).toBeGreaterThanOrEqual(15)
  })

  it('every algorithm has the required fields', () => {
    for (const [id, a] of Object.entries(ALGORITHMS)) {
      expect(a.id, `${id}.id`).toBe(id)
      expect(a.name, `${id}.name`).toBeTruthy()
      expect(a.category, `${id}.category`).toBeTruthy()
      expect(['Easy', 'Medium', 'Hard'], `${id}.difficulty`).toContain(a.difficulty)
      expect(a.timeComplexity, `${id}.timeComplexity`).toMatch(/O\(/)
      expect(a.spaceComplexity, `${id}.spaceComplexity`).toMatch(/O\(/)
      expect(a.description, `${id}.description`).toBeTruthy()
      expect(a.presets, `${id}.presets`).toBeTruthy()
      expect(Object.keys(a.presets).length, `${id}.presets non-empty`).toBeGreaterThan(0)
      expect(a.code, `${id}.code`).toBeTruthy()
      expect(a.code.javascript, `${id}.code.javascript`).toBeTruthy()
      expect(a.code.pseudocode, `${id}.code.pseudocode`).toBeTruthy()
      expect(typeof a.steps, `${id}.steps is a function`).toBe('function')
    }
  })

  it('every algorithm is in a known category', () => {
    const known = new Set(CATEGORIES.map((c) => c.id))
    for (const a of Object.values(ALGORITHMS)) {
      expect(known.has(a.category), `category ${a.category}`).toBe(true)
    }
  })
})

describe('step generators', () => {
  it('bubble-sort: every step has a state and explanation', () => {
    const steps = generateSteps('bubble-sort', [3, 1, 2])
    expect(steps.length).toBeGreaterThan(0)
    for (const s of steps) {
      expect(s.state).toBeTruthy()
      expect(s.state.array).toBeTruthy()
      expect(s.explanation).toBeTruthy()
    }

    const last = steps[steps.length - 1]
    expect(last.state.array).toEqual([1, 2, 3])
  })

  it('bubble-sort: input is never mutated', () => {
    const input = [5, 3, 1, 4, 2]
    const original = [...input]
    generateSteps('bubble-sort', input)
    expect(input).toEqual(original)
  })

  it('selection-sort: final array is sorted', () => {
    const steps = generateSteps('selection-sort', [9, 7, 5, 3, 1])
    const last = steps[steps.length - 1]
    expect(last.state.array).toEqual([1, 3, 5, 7, 9])
  })

  it('insertion-sort: final array is sorted', () => {
    const steps = generateSteps('insertion-sort', [5, 4, 3, 2, 1])
    expect(steps[steps.length - 1].state.array).toEqual([1, 2, 3, 4, 5])
  })

  it('merge-sort: sorts correctly and is not in-place on input', () => {
    const input = [38, 27, 43, 3, 9, 82, 10]
    const steps = generateSteps('merge-sort', input)
    expect(steps[steps.length - 1].state.array).toEqual([3, 9, 10, 27, 38, 43, 82])

    expect(input).toEqual([38, 27, 43, 3, 9, 82, 10])
  })

  it('quick-sort: sorts correctly', () => {
    const steps = generateSteps('quick-sort', [10, 7, 8, 9, 1, 5])
    expect(steps[steps.length - 1].state.array).toEqual([1, 5, 7, 8, 9, 10])
  })

  it('heap-sort: sorts correctly', () => {
    const steps = generateSteps('heap-sort', [4, 10, 3, 5, 1])
    expect(steps[steps.length - 1].state.array).toEqual([1, 3, 4, 5, 10])
  })

  it('binary-search: finds the target', () => {
    const steps = generateSteps('binary-search', { array: [1, 3, 5, 7, 9, 11], target: 7 })
    const last = steps[steps.length - 1]
    expect(last.variables.found).toBe(true)
  })

  it('binary-search: not-found path completes', () => {
    const steps = generateSteps('binary-search', { array: [1, 3, 5, 7, 9], target: 100 })
    expect(steps[steps.length - 1].variables.found).toBe(false)
  })

  it('linear-search: finds at first index', () => {
    const steps = generateSteps('linear-search', { array: [4, 2, 7, 1, 9], target: 4 })
    expect(steps[steps.length - 1].variables.found).toBe(true)
  })

  it('two-sum-sorted: finds the pair', () => {
    const steps = generateSteps('two-sum-sorted', { array: [1, 3, 4, 5, 7, 11], target: 9 })
    expect(steps[steps.length - 1].variables.found).toBe(true)
  })

  it('sliding-window-max: produces a result', () => {
    const steps = generateSteps('sliding-window-max', { array: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 })
    const last = steps[steps.length - 1]
    expect(last.variables.result).toEqual([3, 3, 5, 5, 6, 7])
  })

  it('valid-parentheses: valid string validates', () => {
    const steps = generateSteps('valid-parentheses', '()[]{}')
    const last = steps[steps.length - 1]
    expect(last.variables.valid).toBe(true)
  })

  it('valid-parentheses: interleaved string fails', () => {
    const steps = generateSteps('valid-parentheses', '([)]')

    const failed = steps.find((s) => s.variables.invalid === true)
    expect(failed).toBeTruthy()
  })

  it('reverse-linked-list: produces a steps array', () => {
    const steps = generateSteps('reverse-linked-list', [1, 2, 3, 4, 5])
    expect(steps.length).toBeGreaterThan(0)
  })

  it('bfs-graph: visits the right set', () => {
    const input = {
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }],
      edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'E'], ['D', 'E']],
      source: 'A',
    }
    const steps = generateSteps('bfs-graph', input)
    const last = steps[steps.length - 1]
    expect(last.variables.visited.sort()).toEqual(['A', 'B', 'C', 'D', 'E'].sort())
  })

  it('dijkstra: computes correct distances', () => {
    const input = {
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }],
      edges: [['A', 'B', 4], ['A', 'C', 2], ['C', 'B', 1], ['B', 'D', 5], ['C', 'D', 8], ['C', 'E', 10], ['D', 'E', 2]],
      source: 'A',
    }
    const steps = generateSteps('dijkstra', input)
    const dist = steps[steps.length - 1].variables.dist
    expect(dist.A).toBe(0)
    expect(dist.B).toBe(3)
    expect(dist.C).toBe(2)
    expect(dist.D).toBe(8)
    expect(dist.E).toBe(10)
  })

  it('fibonacci-dp: produces the right value', () => {
    const steps = generateSteps('fibonacci-dp', 10)
    expect(steps[steps.length - 1].variables.result).toBe(55)
  })

  it('coin-change: solves 11 with [1,2,5]', () => {
    const steps = generateSteps('coin-change', { amount: 11, coins: [1, 2, 5] })
    expect(steps[steps.length - 1].variables.result).toBe(3)
  })

  it('coin-change: detects impossible case', () => {
    const steps = generateSteps('coin-change', { amount: 3, coins: [2] })
    expect(steps[steps.length - 1].variables.result).toBe(-1)
  })

  it('bst-insert: produces steps', () => {
    const steps = generateSteps('bst-insert', { tree: [5, 3, 7], value: 1 })
    expect(steps.length).toBeGreaterThan(0)
  })
})

describe('step shape', () => {
  it('sorting steps expose a "variables.comparisons" counter where applicable', () => {
    const a = generateSteps('bubble-sort', [3, 1, 2])
    const b = generateSteps('selection-sort', [3, 1, 2])
    const c = generateSteps('insertion-sort', [3, 1, 2])
    for (const steps of [a, b, c]) {

      const last = steps[steps.length - 1]
      expect(typeof last.variables.comparisons).toBe('number')
      expect(last.variables.comparisons).toBeGreaterThan(0)
    }
  })

  it('every step has a "codeLine" string for the code panel to highlight', () => {

    const ids = ['bubble-sort', 'selection-sort', 'merge-sort', 'binary-search', 'dijkstra', 'fibonacci-dp', 'valid-parentheses']
    for (const id of ids) {

      const algo = ALGORITHMS[id]
      const firstPreset = Object.values(algo.presets)[0]
      let input
      if (id === 'binary-search' || id === 'linear-search') input = { array: firstPreset.input, target: firstPreset.target }
      else if (id === 'fibonacci-dp') input = firstPreset.input
      else if (id === 'valid-parentheses') input = firstPreset.input
      else input = firstPreset.input
      const steps = generateSteps(id, input)
      expect(steps.length, `${id} produced steps`).toBeGreaterThan(0)

      const jsSource = algo.code.javascript
      const matched = steps.some((s) => s.codeLine && jsSource.includes(s.codeLine))
      expect(matched, `${id} has at least one step whose codeLine appears in JS source`).toBe(true)
    }
  })
})
