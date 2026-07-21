import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

;(function applyInitialTheme() {
  try {
    const stored = localStorage.getItem('algovision-theme')
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  } catch {  }
})()

function waitForSwCleanup(timeoutMs = 1500) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve()
  }
  const cleanup = navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => {}))))
    .then(() => {
      if ('caches' in window) {
        return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k).catch(() => {}))))
      }
      return undefined
    })
    .catch(() => undefined)
  return Promise.race([
    cleanup,
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ])
}

async function prewarmCsrf(timeoutMs = 1000) {
  if (typeof window === 'undefined') return

  if (document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=/)) return
  try {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    await fetch(`${base}/csrf`, { credentials: 'include', signal: ctrl.signal })
    clearTimeout(t)
  } catch {  }
}

waitForSwCleanup()
  .then(prewarmCsrf)
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <App />
    )
  })
