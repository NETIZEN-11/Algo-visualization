import { useEffect, useState, useCallback } from 'react'

/**
 * App-wide theme toggle (dark / light).
 *
 *   - Defaults to the OS preference (`prefers-color-scheme`).
 *   - Persists the user's explicit choice in localStorage under
 *     `algovision-theme` so it survives reloads.
 *   - Applies the theme by setting `data-theme="dark"|"light"` on the
 *     <html> element, plus the legacy `dark` class Tailwind uses.
 *   - Stays in sync across tabs via the `storage` event.
 */
const STORAGE_KEY = 'algovision-theme'

function systemPref() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function initialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : systemPref()
}

function apply(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

export function useTheme() {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    apply(theme)
    if (localStorage.getItem(STORAGE_KEY) == null) {
      // First run — don't persist the auto-detected value; let it track
      // OS preference until the user explicitly toggles.
      return
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, setTheme, toggle }
}

export default useTheme
