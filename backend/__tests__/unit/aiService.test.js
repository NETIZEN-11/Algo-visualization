/**
 * Tests for the AI service. Forces MOCK_AI=true so no real OpenAI calls
 * are made. Exercises every exported function and the `isMocked` /
 * `aiServiceInfo` helpers, which in turn drive the mock-generator code
 * path on `aiMockGenerators.js`.
 */
process.env.MOCK_AI = 'true'
process.env.OPENAI_API_KEY = ''
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_unit_tests_only_xxxxxxxx'
process.env.COOKIE_SECRET = 'test_cookie_secret_for_unit_tests_xxxxx'

import { setupTestDB, teardownTestDB, clearTestDB } from '../setup.js'
import {
  analyzeProblemWithAI,
  generateHintsWithAI,
  analyzeCodeWithAI,
  generateTestCasesWithAI,
  generateDryRunWithAI,
  conductInterviewWithAI,
  calculateInterviewReadinessWithAI,
  generateFlashcardsWithAI,
  generateVisualizationWithAI,
  aiServiceInfo,
  isMocked,
  generateInterviewFeedbackWithAI,
} from '../../services/aiService.js'

const sampleProblem = {
  title: 'Two Sum',
  description: 'Find two numbers that add up to a target.',
  examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
  constraints: ['2 <= nums.length <= 10^4'],
}

beforeAll(async () => { await setupTestDB() })
afterAll(async () => { await teardownTestDB() })
beforeEach(async () => { await clearTestDB() })

describe('aiService (mock mode)', () => {
  test('isMocked() is true and aiServiceInfo reports the model', () => {
    expect(isMocked()).toBe(true)
    const info = aiServiceInfo()
    expect(info.mocked).toBe(true)
    expect(typeof info.model).toBe('string')
    expect(typeof info.uptimeMs).toBe('number')
  })

  test('analyzeProblemWithAI returns a complete, problem-specific mock', async () => {
    const r = await analyzeProblemWithAI(sampleProblem, { userId: null })
    expect(r).toBeTruthy()
    expect(r.mocked).toBe(true)
    expect(r.problem_summary.title).toBe('Two Sum')
    expect(r.pattern_identification.pattern).toBe('Hashing')
    expect(Array.isArray(r.optimal_approach.edge_cases)).toBe(true)
    expect(r.code_solutions.python).toMatch(/def solve/)
  })

  test('generateHintsWithAI returns a hint object for each level', async () => {
    for (let level = 1; level <= 3; level++) {
      const r = await generateHintsWithAI(sampleProblem, level, { userId: null })
      expect(r).toBeTruthy()
      expect(typeof r.hint).toBe('string')
      expect(r.hint.length).toBeGreaterThan(5)
      expect(r.level).toBe(level)
      expect(r.mocked).toBe(true)
    }
  })

  test('generateHintsWithAI clamps out-of-range levels', async () => {
    const r1 = await generateHintsWithAI(sampleProblem, 99, { userId: null })
    const r2 = await generateHintsWithAI(sampleProblem, -3, { userId: null })
    expect(r1.level).toBe(3)
    expect(r2.level).toBe(1)
  })

  test('analyzeCodeWithAI returns review for JS and Python', async () => {
    const js = await analyzeCodeWithAI('console.log("hi")\n' + 'x;\n'.repeat(60), 'javascript', '', { userId: null })
    expect(js.hasErrors).toBe(true)
    expect(js.suggestions.some(s => s.includes('console.log'))).toBe(true)

    const py = await analyzeCodeWithAI('print(1)\n' + 'x;\n'.repeat(60), 'python', '', { userId: null })
    expect(py.hasErrors).toBe(true)
    expect(py.suggestions.some(s => s.includes('print'))).toBe(true)
  })

  test('analyzeCodeWithAI short code is clean', async () => {
    const r = await analyzeCodeWithAI('return 42', 'javascript', '', { userId: null })
    expect(r.hasErrors).toBe(false)
  })

  test('generateTestCasesWithAI returns a few cases', async () => {
    const r = await generateTestCasesWithAI(sampleProblem, { userId: null })
    expect(r).toBeTruthy()
    expect(r.mocked).toBe(true)
    expect(Array.isArray(r.cases)).toBe(true)
    expect(r.cases.length).toBeGreaterThan(0)
  })

  test('generateDryRunWithAI returns steps and a final output', async () => {
    const r = await generateDryRunWithAI(sampleProblem, 'def solve(): return 1', 'custom', 'python', { userId: null })
    expect(r.mocked).toBe(true)
    expect(Array.isArray(r.steps)).toBe(true)
    expect(typeof r.finalOutput).toBe('string')
  })

  test('conductInterviewWithAI returns a question by default', async () => {
    const r = await conductInterviewWithAI({ difficulty: 'Medium' }, { userId: null })
    expect(r.question).toBeTruthy()
    expect(r.difficulty).toBe('Medium')
  })

  test('conductInterviewWithAI handles followup action', async () => {
    const r = await conductInterviewWithAI({ difficulty: 'Hard', action: 'followup' }, { userId: null })
    expect(r.category).toBe('Follow-up')
    expect(r.difficulty).toBe('Hard')
  })

  test('conductInterviewWithAI evaluate action returns feedback object', async () => {
    const r = await conductInterviewWithAI(
      { action: 'evaluate', question: 'Reverse a linked list.', answer: 'Iterate through the list using three pointers: prev, curr, next. At each step, flip the pointer and advance. This is O(n) time and O(1) space. Edge cases include empty list and single node — both should just return head as-is.' },
      { userId: null }
    )
    expect(r.score).toBeGreaterThan(0)
    expect(r.mocked).toBe(true)
  })

  test('generateInterviewFeedbackWithAI is an alias of conductInterviewWithAI', () => {
    expect(generateInterviewFeedbackWithAI).toBe(conductInterviewWithAI)
  })

  test('calculateInterviewReadinessWithAI returns a scored object', async () => {
    const r = await calculateInterviewReadinessWithAI(
      { totalProblemsSolved: 20, easy: 10, medium: 7, hard: 3 },
      Array(20).fill('prob'),
      { userId: null }
    )
    expect(r.mocked).toBe(true)
    expect(r.overall_score).toBeGreaterThan(0)
    expect(Array.isArray(r.recommendations)).toBe(true)
  })

  test('generateFlashcardsWithAI returns a card list', async () => {
    const r = await generateFlashcardsWithAI(sampleProblem, { pattern_identification: { pattern: 'Hashing' } }, { userId: null })
    expect(r.mocked).toBe(true)
    expect(r.flashcards.length).toBeGreaterThan(0)
  })

  test('generateVisualizationWithAI returns steps', async () => {
    const r = await generateVisualizationWithAI(sampleProblem, { userId: null })
    expect(r.mocked).toBe(true)
    expect(r.type).toBe('array')
    expect(Array.isArray(r.steps)).toBe(true)
  })
})
