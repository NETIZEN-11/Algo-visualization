import { useEffect, useState } from 'react'

/**
 * Shared client for the in-app notifications feed.
 *
 * Backed by localStorage (the backend has no `/notifications` resource yet).
 * Exposes:
 *   - list() / save(list) — read & write the full feed
 *   - subscribe(listener) — listen for cross-tab + same-tab changes
 *   - useUnreadCount() — React hook for the navbar badge
 *   - markRead(id) / markAllRead() / remove(id) / clear() — mutations
 *
 * The same `storage` event fires from any tab, so the bell badge stays
 * in sync if the user marks items read in two tabs at once.
 */

const STORAGE_KEY = 'algovision-notifications'
const listeners = new Set()

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function write(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  listeners.forEach((l) => { try { l(list) } catch { /* ignore */ } })
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const notificationService = {
  list: read,
  unreadCount: () => read().filter((n) => !n.read).length,

  markRead: (id) => {
    const next = read().map((n) => (n.id === id ? { ...n, read: true } : n))
    write(next)
  },

  markAllRead: () => {
    write(read().map((n) => ({ ...n, read: true })))
  },

  remove: (id) => {
    write(read().filter((n) => n.id !== id))
  },

  clear: () => {
    write([])
  },

  // Convenience for other parts of the app to push new notifications
  push: (n) => {
    const item = { id: n.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ts: Date.now(), read: false, ...n }
    write([item, ...read()])
    return item
  },

  subscribe,
}

export default notificationService

/**
 * Live unread count. Uses a custom event channel (the service fires on
 * every mutation) so a `mark all read` click on the notifications page
 * immediately clears the navbar badge.
 */
export function useUnreadCount() {
  const [count, setCount] = useState(notificationService.unreadCount())

  useEffect(() => {
    // Pick up changes from the same tab (write) AND from other tabs (storage)
    const offSame = subscribe((list) => setCount(list.filter((n) => !n.read).length))
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setCount(notificationService.unreadCount())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      offSame()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return count
}
