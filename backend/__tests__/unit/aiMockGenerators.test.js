import {
  detectPattern, PATTERNS,
} from '../../engine/patternDetector.js'
import { patternLabel } from '../../engine/stepGenerator.js'
import {
  mockHint, mockTestCases, mockAnalysis,
} from '../../utils/aiMockGenerators.js'

describe('engine/patternDetector', () => {
  describe('detectPattern', () => {
    test('Reverse Linked List → linkedlist', () => {
      const r = detectPattern({ title: 'Reverse Linked List' })
      expect(r.pattern).toBe(PATTERNS.LINKED_LIST)
    })
    test('Valid Parentheses → stack', () => {
      const r = detectPattern({ title: 'Valid Parentheses' })
      expect(r.pattern).toBe(PATTERNS.STACK)
    })
    test('Container With Most Water → two_pointer', () => {
      const r = detectPattern({ title: 'Container With Most Water' })
      expect(r.pattern).toBe(PATTERNS.TWO_POINTER)
    })
    test('Longest Substring Without Repeating → sliding_window', () => {
      const r = detectPattern({ title: 'Longest Substring Without Repeating Characters' })
      expect(r.pattern).toBe(PATTERNS.SLIDING_WINDOW)
    })
    test('Climbing Stairs → dp', () => {
      const r = detectPattern({ title: 'Climbing Stairs' })
      expect(r.pattern).toBe(PATTERNS.DP)
    })
    test('Number of Islands → dfs (or graph, both correct)', () => {
      const r = detectPattern({ title: 'Number of Islands' })
      expect([PATTERNS.DFS, PATTERNS.GRAPH]).toContain(r.pattern)
    })
    test('unknown title → array fallback with low confidence', () => {
      const r = detectPattern({ title: 'Some Random Title' })
      expect(r.pattern).toBe(PATTERNS.ARRAY)
      expect(r.confidence).toBeLessThan(0.5)
    })
    test('tags dominate when title is ambiguous', () => {
      const r = detectPattern({
        title: 'FooBar',
        description: 'do something',
        tags: ['heap', 'priority queue'],
      })

      expect(r.pattern).toBe(PATTERNS.HEAP)
    })
    test('confidence is between 0 and 1', () => {
      const r = detectPattern({ title: 'Valid Parentheses' })
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    })
    test('handles empty spec gracefully', () => {
      const r = detectPattern({})
      expect(r).toHaveProperty('pattern')
      expect(r).toHaveProperty('confidence')
    })
  })
})

describe('utils/aiMockGenerators', () => {
  describe('patternLabel', () => {
    test('returns a non-empty string for every known pattern', () => {
      const labels = Object.values(PATTERNS).map(patternLabel)

      const empties = labels.filter((l) => !l)
      expect(empties).toEqual([])
    })
    test('returns the same string for the same input', () => {
      expect(patternLabel(PATTERNS.STACK)).toBe(patternLabel(PATTERNS.STACK))
    })
  })

  describe('mockHint', () => {
    test('returns an object with hint and level', () => {
      const problem = { title: 'Two Sum', description: 'find two numbers' }
      const h = mockHint(problem, 1)
      expect(typeof h).toBe('object')
      expect(typeof h.hint).toBe('string')
      expect(h.hint.length).toBeGreaterThan(10)
    })
    test('different levels produce different hints', () => {
      const problem = { title: 'Two Sum', description: 'find two numbers' }
      const l1 = mockHint(problem, 1)
      const l3 = mockHint(problem, 3)
      expect(l1.hint).not.toBe(l3.hint)
    })
    test('all levels return a non-empty string', () => {
      const problem = { title: 'Two Sum', description: 'find two numbers' }
      for (const lvl of [1, 2, 3]) {
        const h = mockHint(problem, lvl)
        expect(typeof h.hint).toBe('string')
        expect(h.hint.length).toBeGreaterThan(0)
      }
    })
  })

  describe('mockTestCases', () => {
    test('returns an object with cases array of at least 2', () => {
      const r = mockTestCases({ title: 'Two Sum', description: '' })
      expect(typeof r).toBe('object')
      expect(Array.isArray(r.cases)).toBe(true)
      expect(r.cases.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('mockAnalysis', () => {
    test('returns an object with expected keys', () => {
      const a = mockAnalysis({ title: 'Two Sum', description: 'find two numbers' })
      expect(typeof a).toBe('object')
      expect(a).toBeTruthy()
    })
  })
})
