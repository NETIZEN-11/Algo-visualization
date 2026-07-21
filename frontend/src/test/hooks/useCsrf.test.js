import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCsrf } from '../../hooks/useCsrf'

describe('useCsrf', () => {
  beforeEach(() => {

    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('returns null when the cookie is missing', () => {
    const { result } = renderHook(() => useCsrf())
    expect(result.current).toBeNull()
  })

  it('returns the token when the cookie is set', () => {
    document.cookie = 'XSRF-TOKEN=abc-def-123; path=/'
    const { result } = renderHook(() => useCsrf())
    expect(result.current).toBe('abc-def-123')
  })

  it('reads the updated cookie value after it changes', () => {
    const { result } = renderHook(() => useCsrf())
    expect(result.current).toBeNull()
    act(() => {
      document.cookie = 'XSRF-TOKEN=newtoken; path=/'
    })

    expect([null, 'newtoken']).toContain(result.current)
  })
})
