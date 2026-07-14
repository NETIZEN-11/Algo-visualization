import { useEffect, useState } from 'react'

/**
 * Returns true when the user has `prefers-reduced-motion: reduce`.
 * Components should use this to disable framer-motion animations and
 * large CSS transitions for users with motion sensitivity.
 */
export function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const get = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  }
  const [reduced, setReduced] = useState(get)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

export default useReducedMotion
