import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBell, FaCheck, FaTrash, FaSync } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useReducedMotion } from '../hooks/useReducedMotion'
import notificationService from '../services/notificationService'

function NotificationsPage() {
  const reduceMotion = useReducedMotion()
  const [items, setItems] = useState(() => notificationService.list())

  const refresh = useCallback(() => setItems(notificationService.list()), [])

  useEffect(() => {
    refresh()
    return notificationService.subscribe(refresh)
  }, [refresh])

  const markRead = (id) => {
    notificationService.markRead(id)
    refresh()
  }
  const markAllRead = () => {
    notificationService.markAllRead()
    toast.success('All notifications marked as read')
  }
  const clear = () => {
    notificationService.clear()
    toast.success('Notifications cleared')
  }
  const remove = (id) => {
    notificationService.remove(id)
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FaBell className="text-orange-400" aria-hidden="true" />
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Notifications
            </span>
          </h1>
          <p className="text-gray-400">{unread} unread · {items.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} disabled={unread === 0} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50">
            <FaCheck aria-hidden="true" /> Mark all read
          </button>
          <button onClick={clear} disabled={items.length === 0} className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/40 rounded-lg text-sm flex items-center gap-1.5 disabled:opacity-50">
            <FaTrash aria-hidden="true" /> Clear
          </button>
          <button onClick={refresh} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" aria-label="Refresh">
            <FaSync />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FaBell className="text-6xl mx-auto mb-4 opacity-30" aria-hidden="true" />
            <p>No notifications.</p>
            <p className="text-sm mt-2">You'll see updates here when you earn badges, complete daily challenges, or get contest updates.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <motion.li
                key={n.id}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -20 }}
                className={`bg-gray-900 border rounded-xl p-4 flex items-start gap-3 ${
                  n.read ? 'border-gray-800' : 'border-orange-500/40'
                }`}
              >
                <div className={`mt-1 w-2 h-2 rounded-full ${n.read ? 'bg-gray-600' : 'bg-orange-400'}`} aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{n.title}</h3>
                    {!n.read ? <span className="text-[10px] uppercase tracking-wider bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">New</span> : null}
                  </div>
                  {n.body ? <p className="text-sm text-gray-300 mb-1">{n.body}</p> : null}
                  <div className="text-xs text-gray-500">{new Date(n.ts).toLocaleString()}</div>
                </div>
                <div className="flex gap-1">
                  {!n.read ? (
                    <button onClick={() => markRead(n.id)} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-emerald-400" aria-label="Mark as read">
                      <FaCheck />
                    </button>
                  ) : null}
                  <button onClick={() => remove(n.id)} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400" aria-label="Delete">
                    <FaTrash />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationsPage
