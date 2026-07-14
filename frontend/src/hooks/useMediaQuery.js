import { useEffect, useState } from 'react'

/**
 * Tiny media-query hook.
 *   const isMd = useMediaQuery('(min-width: 768px)')
 */
export function useMediaQuery(query) {
  const get = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  }
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [query])
  return matches
}

export default useMediaQuery
