import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

/**
 * Apply the persisted theme synchronously, before the first render, so
 * we don't flash the wrong palette while React mounts. The useTheme
 * hook will re-apply on every change after that.
 */
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
  } catch { /* no-op — default to dark */ }
})()

/**
 * Dev-time SW cleanup.
 *
 * A stale service worker installed by an older Vite dev server (or a
 * prior build) will intercept the very request that's loading this
 * app, which surfaces as `sw.js?v=…  Failed to fetch` in the console
 * and a downstream "Cannot read properties of null (reading 'useState')"
 * crash. We must unregister *before* the first render so the SW can't
 * race React's mount.
 *
 * We do this by waiting for the unregister promise to settle (with a
 * short timeout so a stuck SW doesn't block the app), then mounting.
 * Production builds don't ship a SW so this is a no-op there.
 */
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

/**
 * Pre-warm the CSRF cookie before the first unsafe request.
 *
 * The server issues `XSRF-TOKEN` on every safe request, but if the very
 * first thing the SPA does is a POST (login, register, refresh) there
 * is no cookie yet and the request 403s. Hitting /api/csrf up front
 * guarantees the cookie is in the jar before any auth call.
 *
 * Best-effort, with a 1s timeout so a slow backend doesn't block the
 * first paint.
 */
async function prewarmCsrf(timeoutMs = 1000) {
  if (typeof window === 'undefined') return
  // If we already have the cookie (returning user), skip the network call.
  if (document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=/)) return
  try {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    await fetch(`${base}/csrf`, { credentials: 'include', signal: ctrl.signal })
    clearTimeout(t)
  } catch { /* no-op — first POST may still 403, the app surfaces a clear error */ }
}

waitForSwCleanup()
  .then(prewarmCsrf)
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <App />
    )
  })
