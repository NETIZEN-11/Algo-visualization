import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

describe('useMediaQuery', () => {
  it('returns false for an unmatched query in jsdom', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 99999px)'))
    expect(result.current).toBe(false)
  })

  it('returns the current matchMedia value', () => {

    const { result } = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'))
    expect(result.current).toBe(false)
  })
})
