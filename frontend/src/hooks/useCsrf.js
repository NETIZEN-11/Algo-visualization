import { useEffect, useState } from 'react'

/**
 * Reads a non-httpOnly cookie by name. We use this to echo the CSRF
 * token back to the server on state-changing requests.
 */
function readCookie(name) {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp('(^|;\\s*)' + escaped + '=([^;]*)'))
  return m ? decodeURIComponent(m[2]) : null
}

/**
 * Returns the current CSRF token from the `XSRF-TOKEN` cookie.
 * Updates whenever a relevant state change happens.
 */
export function useCsrf() {
  const [token, setToken] = useState(() => readCookie('XSRF-TOKEN'))
  useEffect(() => {
    // Refresh periodically — long-lived sessions may have the cookie
    // rotated by the server.
    const id = setInterval(() => setToken(readCookie('XSRF-TOKEN')), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  return token
}

export default useCsrf
