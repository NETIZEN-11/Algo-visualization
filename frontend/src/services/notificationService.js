import { useEffect, useState } from 'react'

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

  push: (n) => {
    const item = { id: n.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ts: Date.now(), read: false, ...n }
    write([item, ...read()])
    return item
  },

  subscribe,
}

export default notificationService

export function useUnreadCount() {
  const [count, setCount] = useState(notificationService.unreadCount())

  useEffect(() => {

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
