import {
  detectPattern, PATTERNS, SUPPORTED_PATTERNS,
} from '../../engine/patternDetector.js'
import {
  buildSteps, patternLabel,
} from '../../engine/stepGenerator.js'
import { parseProblemText } from '../../engine/problemParser.js'

describe('engine/patternDetector', () => {
  test('all 22 supported patterns are exported', () => {
    expect(SUPPORTED_PATTERNS.length).toBe(22)
  })

  test('every pattern in PATTERNS has a label', () => {
    for (const p of Object.values(PATTERNS)) {
      const label = patternLabel(p)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  test('detectPattern returns a result with confidence in [0,1]', () => {
    for (const title of [
      'Two Sum', 'Reverse Linked List', 'Valid Parentheses',
      'Container With Most Water', 'Climbing Stairs', '???',
    ]) {
      const r = detectPattern({ title })
      expect(r.confidence).toBeGreaterThanOrEqual(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    }
  })

  test('detectPattern does not throw on garbage input', () => {
    expect(() => detectPattern(null)).not.toThrow()
    expect(() => detectPattern(undefined)).not.toThrow()
    expect(() => detectPattern({ title: 42, tags: 'not-an-array' })).not.toThrow()
  })
})

describe('engine/stepGenerator', () => {

  function assertStepShape(step) {
    expect(typeof step.id).toBe('number')
    expect(typeof step.title).toBe('string')
    expect(typeof step.explanation).toBe('string')
    expect(step.title.length).toBeGreaterThan(0)
    expect(step.explanation.length).toBeGreaterThan(0)
    expect(step.state).toBeDefined()
    expect(typeof step.state).toBe('object')
    expect(step.highlights).toBeDefined()
    expect(typeof step.highlights).toBe('object')
  }

  test('buildSteps always returns the documented envelope', () => {
    const out = buildSteps({ title: 'Some random thing' })
    expect(out).toHaveProperty('pattern')
    expect(out).toHaveProperty('confidence')
    expect(out).toHaveProperty('steps')
    expect(out).toHaveProperty('meta')
    expect(Array.isArray(out.steps)).toBe(true)
    expect(out.steps.length).toBeGreaterThan(0)
    expect(['tracer', 'derived']).toContain(out.meta.source)
  })

  test('buildSteps assigns monotonically increasing step ids', () => {
    const out = buildSteps({
      title: 'Container With Most Water',
      examples: [{ input: [1, 8, 6, 2, 5, 4, 8, 3, 7], output: 49 }],
    })
    const ids = out.steps.map((s) => s.id)
    for (let i = 0; i < ids.length; i++) {
      expect(ids[i]).toBe(i)
    }
  })

  test.each([
    { title: 'Container With Most Water', examples: [{ input: [1, 8, 6, 2, 5, 4, 8, 3, 7], output: 49 }] },
    { title: 'Reverse Linked List', examples: [{ input: [1, 2, 3, 4, 5], output: [5, 4, 3, 2, 1] }] },
    { title: 'Valid Parentheses', examples: [{ input: '()[]{}', output: true }] },
    { title: 'Climbing Stairs', examples: [{ input: 3, output: 3 }] },
    { title: 'Two Sum', examples: [{ input: [[2, 7, 11, 15], 9], output: [0, 1] }] },
    { title: 'Longest Substring Without Repeating Characters', examples: [{ input: 'abcabcbb', output: 3 }] },
  ])('produces a well-formed step list for "$title"', (spec) => {
    const out = buildSteps(spec)
    expect(out.steps.length).toBeGreaterThan(0)
    out.steps.forEach(assertStepShape)
  })

  test('buildSteps falls back to generic when pattern is unknown', () => {
    const out = buildSteps({
      title: '???',
      description: 'no signal here',
      examples: [{ input: [1, 2, 3], output: 0 }],
    })
    expect(out.steps.length).toBeGreaterThan(0)
    out.steps.forEach(assertStepShape)
  })

  test('buildSteps catches tracer errors and returns a single safe step', () => {

    const out = buildSteps({
      title: 'Container With Most Water',
      examples: [{ input: 'not-an-array', output: 0 }],
    })
    expect(out.steps.length).toBeGreaterThan(0)
    out.steps.forEach(assertStepShape)
  })

  test('container-with-most-water highlights the active pointers', () => {
    const out = buildSteps({
      title: 'Container With Most Water',
      examples: [{ input: [1, 8, 6, 2, 5, 4, 8, 3, 7], output: 49 }],
    })

    const hasBoth = out.steps.some((s) => {
      const idx = s.highlights.indices || []
      return idx.length >= 2
    })
    expect(hasBoth).toBe(true)
  })
})

describe('engine/problemParser', () => {
  test('extracts a title from a one-line problem', () => {
    const r = parseProblemText('Two Sum\nGiven an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.')
    expect(r.spec.title).toBe('Two Sum')
  })

  test('extracts a LeetCode URL when present', () => {
    const text = `Two Sum
Given an array of integers nums and an integer target...
https://leetcode.com/problems/two-sum/
Constraints:
2 <= nums.length <= 10^4`
    const r = parseProblemText(text)
    expect(r.leetcodeSlug).toBe('two-sum')
  })

  test('captures examples when present', () => {
    const text = `Two Sum
Given an array of integers nums...
Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]`
    const r = parseProblemText(text)
    expect(Array.isArray(r.spec.examples)).toBe(true)
    expect(r.spec.examples.length).toBeGreaterThanOrEqual(2)
  })

  test('returns warnings (does not throw) for empty input', () => {
    const r = parseProblemText('')
    expect(r.spec).toBeDefined()
    expect(Array.isArray(r.warnings)).toBe(true)
  })

  test('returns a buildable spec even on hostile input', () => {

    const r = parseProblemText('   \n  random text   \n  ')
    const out = buildSteps(r.spec)
    expect(out.steps.length).toBeGreaterThan(0)
  })
})
