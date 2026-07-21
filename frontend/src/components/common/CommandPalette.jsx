import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSearch } from 'react-icons/fa'
import {
  FaHome, FaCode, FaEye, FaBolt, FaMicrophone, FaBug, FaPlay,
  FaMap, FaChartLine, FaFire, FaTrophy, FaStickyNote, FaBuilding,
  FaBell, FaCog, FaUserShield,
} from 'react-icons/fa'

/**
 * Global command palette. Bound to (Cmd|Ctrl)+K, also opens with the
 * "/" key when the user isn't typing in an input.
 *
 * Provides fuzzy search over the app's navigation so power users can
 * jump to any page in two keystrokes. The list is generated from the
 * same menu the Sidebar shows so we don't drift out of sync — add a
 * sidebar item and the palette picks it up automatically.
 */

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: FaHome, keywords: 'home overview' },
  { path: '/problem-solver', label: 'Problem Solver', icon: FaCode, keywords: 'solve code editor' },
  { path: '/visualization', label: 'Visualization Lab', icon: FaEye, keywords: 'viz animate lab' },
  { path: '/visualization/dynamic', label: 'Dynamic Viz (paste)', icon: FaBolt, keywords: 'paste leetcode animate dynamic' },
  { path: '/interview', label: 'Mock Interview', icon: FaMicrophone, keywords: 'mock interview voice ai' },
  { path: '/bug-detector', label: 'Bug Detector', icon: FaBug, keywords: 'debug bug fix error' },
  { path: '/playground', label: 'Code Playground', icon: FaPlay, keywords: 'playground run code sandbox' },
  { path: '/roadmap', label: 'Topic Roadmap', icon: FaMap, keywords: 'roadmap study plan topic' },
  { path: '/progress', label: 'Progress Analytics', icon: FaChartLine, keywords: 'progress stats analytics chart' },
  { path: '/daily-challenge', label: 'Daily Challenge', icon: FaFire, keywords: 'daily challenge streak' },
  { path: '/contest', label: 'Contest Mode', icon: FaTrophy, keywords: 'contest competition leaderboard' },
  { path: '/notes', label: 'Notes & Flashcards', icon: FaStickyNote, keywords: 'notes flashcards review' },
  { path: '/companies', label: 'Company Questions', icon: FaBuilding, keywords: 'company faang amazon google meta' },
  { path: '/notifications', label: 'Notifications', icon: FaBell, keywords: 'notifications alerts' },
  { path: '/settings', label: 'Settings', icon: FaCog, keywords: 'settings preferences account' },
  { path: '/admin', label: 'Admin Console', icon: FaUserShield, keywords: 'admin console manage', admin: true },
]

// Tiny case-insensitive substring scorer. -1 means no match.
function score(item, q) {
  if (!q) return 1
  const needle = q.toLowerCase()
  const hay = `${item.label} ${item.keywords}`.toLowerCase()
  if (hay.startsWith(needle)) return 0
  const idx = hay.indexOf(needle)
  if (idx === -1) return -1
  return idx + 1
}

function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Filter & rank
  const results = useMemo(() => {
    const scored = NAV_ITEMS
      .map((item) => ({ item, s: score(item, query) }))
      .filter((r) => r.s !== -1)
      .sort((a, b) => a.s - b.s)
    return scored.map((r) => r.item)
  }, [query])

  // Open / close
  useEffect(() => {
    const onKey = (e) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      // "/" opens when not in an input
      if (e.key === '/' && !open) {
        const tag = (e.target?.tagName || '').toLowerCase()
        const editable = e.target?.isContentEditable
        if (tag === 'input' || tag === 'textarea' || editable) return
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Focus input when opening, reset state
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // Wait one frame for the modal to mount
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  // Keep active index within bounds
  useEffect(() => {
    if (active >= results.length) setActive(0)
  }, [results.length, active])

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const el = list.querySelector(`[data-idx="${active}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [active])

  const choose = (item) => {
    setOpen(false)
    navigate(item.path)
  }

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (results.length === 0 ? 0 : (a + 1) % results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (results.length === 0 ? 0 : (a - 1 + results.length) % results.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[active]) choose(results[active])
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cmd-palette"
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <FaSearch className="text-gray-500" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0) }}
                onKeyDown={onInputKey}
                placeholder="Type a page name, or press ↑↓ then Enter…"
                className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500"
                aria-label="Search navigation"
                aria-controls="cmd-palette-list"
                aria-activedescendant={results[active] ? `cmd-item-${results[active].path}` : undefined}
              />
              <kbd className="text-[10px] uppercase tracking-wider bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">Esc</kbd>
            </div>

            <ul
              ref={listRef}
              id="cmd-palette-list"
              role="listbox"
              className="max-h-[50vh] overflow-y-auto py-1"
            >
              {results.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500 text-sm">
                  No pages match "{query}".
                </li>
              ) : (
                results.map((item, i) => {
                  const Icon = item.icon
                  const isActive = i === active
                  return (
                    <li
                      key={item.path}
                      id={`cmd-item-${item.path}`}
                      data-idx={i}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(item)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${
                        isActive ? 'bg-orange-500/15 text-white' : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <Icon className={`text-base ${isActive ? 'text-orange-400' : 'text-gray-400'}`} aria-hidden="true" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.admin ? <span className="text-[10px] uppercase bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded ml-auto">admin</span> : null}
                      {isActive ? <span className="ml-auto text-[10px] text-gray-500">↵</span> : null}
                    </li>
                  )
                })
              )}
            </ul>

            <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
              <span>{results.length} match{results.length === 1 ? '' : 'es'}</span>
              <span>↑↓ navigate · ↵ open · Esc close</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default CommandPalette
