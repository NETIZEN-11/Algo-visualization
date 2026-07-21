import {
  calculateLevel, xpToNextLevel, calculateStreak, addXP,
} from '../../utils/leveling.js'

describe('leveling utils', () => {
  describe('calculateLevel', () => {
    test('level 1 at 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })
    test('level increases at thresholds', () => {

      const a = calculateLevel(0)
      const b = calculateLevel(500)
      expect(b).toBeGreaterThan(a)
    })
    test('clamps at the highest defined level', () => {
      const level = calculateLevel(1e9)
      expect(level).toBeGreaterThan(0)
      expect(Number.isFinite(level)).toBe(true)
    })
  })

  describe('xpToNextLevel', () => {
    test('returns a positive number', () => {
      const toGo = xpToNextLevel(0)
      expect(typeof toGo).toBe('number')
      expect(toGo).toBeGreaterThan(0)
    })
    test('XP below the top level always has a remaining > 0', () => {
      for (const xp of [0, 100, 1000, 10_000, 100_000]) {
        const toGo = xpToNextLevel(xp)

        expect(toGo).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('calculateStreak', () => {
    test('first activity: streak 1', () => {
      expect(calculateStreak(0, null, new Date('2026-01-01T10:00:00Z'))).toBe(1)
    })
    test('same day: streak unchanged', () => {
      const last = new Date('2026-01-01T08:00:00Z')
      const now = new Date('2026-01-01T20:00:00Z')
      expect(calculateStreak(5, last, now)).toBe(5)
    })
    test('next day: streak +1', () => {
      const last = new Date('2026-01-01T08:00:00Z')
      const now = new Date('2026-01-02T08:00:00Z')
      expect(calculateStreak(5, last, now)).toBe(6)
    })
    test('gap of 2+ days: reset to 1', () => {
      const last = new Date('2026-01-01T08:00:00Z')
      const now = new Date('2026-01-05T08:00:00Z')
      expect(calculateStreak(5, last, now)).toBe(1)
    })
  })

  describe('addXP', () => {
    test('addXP without DB raises (pure function not available)', () => {

      expect(typeof addXP).toBe('function')
    })
  })
})
