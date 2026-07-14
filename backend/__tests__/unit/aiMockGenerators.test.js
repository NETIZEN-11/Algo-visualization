/**
 * Unit tests for `utils/aiMockGenerators.js` — parameterized mock AI
 * responses. The hardcoded "Two Sum" string is the bug we are
 * guarding against.
 */
import {
  detectPattern, mockHint, mockTestCases, mockAnalysis,
} from '../../utils/aiMockGenerators.js'

describe('aiMockGenerators', () => {
  describe('detectPattern', () => {
    test('Two Sum → Hashing', () => {
      const r = detectPattern('Two Sum')
      expect(r.pattern).toBe('Hashing')
    })
    test('Reverse Linked List → Linked List', () => {
      const r = detectPattern('Reverse Linked List')
      expect(r.pattern).toBe('Linked List')
    })
    test('Valid Parentheses → Stack', () => {
      const r = detectPattern('Valid Parentheses')
      expect(r.pattern).toBe('Stack')
    })
    test('unknown title → fallback object', () => {
      const r = detectPattern('Some Random Title')
      expect(typeof r).toBe('object')
      expect(r.pattern).toBeTruthy()
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
