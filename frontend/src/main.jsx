import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

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

waitForSwCleanup().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
})
