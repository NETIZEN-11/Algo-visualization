import { useEffect, useState, useCallback } from 'react'

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

      return
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

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
