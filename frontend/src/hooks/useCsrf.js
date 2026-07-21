import { useEffect, useState } from 'react'

function readCookie(name) {
  if (typeof document === 'undefined') return null
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = document.cookie.match(new RegExp('(^|;\\s*)' + escaped + '=([^;]*)'))
  return m ? decodeURIComponent(m[2]) : null
}

export function useCsrf() {
  const [token, setToken] = useState(() => readCookie('XSRF-TOKEN'))
  useEffect(() => {

    const id = setInterval(() => setToken(readCookie('XSRF-TOKEN')), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  return token
}

export default useCsrf
