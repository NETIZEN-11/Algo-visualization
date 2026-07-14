import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaStickyNote, FaPlus, FaTrash, FaThumbtack, FaSearch, FaTags, FaSync } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { noteService } from '../services/noteService'
import { useReducedMotion } from '../hooks/useReducedMotion'

const CATEGORIES = ['general', 'concept', 'solution', 'pattern', 'tip', 'mistake']
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

function NotesPage() {
  const reduceMotion = useReducedMotion()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [draft, setDraft] = useState({ title: '', content: '', category: 'general', color: COLORS[0] })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await noteService.list()
      setNotes(Array.isArray(data?.data) ? data.data : data?.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e?.preventDefault?.()
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    try {
      const r = await noteService.create(draft)
      setNotes((prev) => [r.data || r, ...prev])
      setDraft({ title: '', content: '', category: 'general', color: COLORS[0] })
      toast.success('Note added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add note')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await noteService.delete(id)
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== id))
      toast.success('Note deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete note')
    }
  }

  const togglePin = async (id) => {
    try {
      const r = await noteService.togglePin(id)
      const updated = r.data || r
      setNotes((prev) => prev.map((n) => ((n._id || n.id) === id ? updated : n)))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not pin')
    }
  }

  const filtered = notes
    .filter((n) => activeCategory === 'all' || n.category === activeCategory)
    .filter((n) => !pinnedOnly || n.pinned)
    .filter(
      (n) =>
        !search ||
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.content?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FaStickyNote className="text-yellow-400" aria-hidden="true" />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Notes & Cheatsheets
            </span>
          </h1>
          <p className="text-gray-400">Capture patterns, gotchas, and concepts as you learn. Synced to your account.</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
          aria-label="Refresh notes"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer */}
        <form onSubmit={handleAdd} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 h-fit">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaPlus className="text-green-400" aria-hidden="true" /> New Note
          </h2>
          <label htmlFor="note-title" className="sr-only">Title</label>
          <input
            id="note-title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title"
            className="w-full mb-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
          <label htmlFor="note-content" className="sr-only">Content</label>
          <textarea
            id="note-content"
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="Write your note…"
            rows={8}
            className="w-full mb-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
          <div className="flex gap-2 mb-3">
            <label htmlFor="note-category" className="sr-only">Category</label>
            <select
              id="note-category"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <fieldset className="flex items-center gap-1 px-2 bg-gray-800 border border-gray-700 rounded-lg">
              <legend className="sr-only">Color</legend>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft({ ...draft, color: c })}
                  className={`w-5 h-5 rounded-full border-2 ${draft.color === c ? 'border-white' : 'border-transparent'}`}
                  style={{ background: c }}
                  aria-label={`Pick color ${c}`}
                />
              ))}
            </fieldset>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </form>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
              <label htmlFor="note-search" className="sr-only">Search</label>
              <input
                id="note-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
              />
            </div>
            <label className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-lg text-xs cursor-pointer">
              <input type="checkbox" checked={pinnedOnly} onChange={(e) => setPinnedOnly(e.target.checked)} />
              Pinned only
            </label>
            <div className="flex gap-1 flex-wrap" role="tablist" aria-label="Filter by category">
              {['all', ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  role="tab"
                  aria-selected={activeCategory === c}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    activeCategory === c
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">
              <FaSync className="animate-spin text-3xl mx-auto mb-3" />
              Loading notes…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FaStickyNote className="text-5xl mx-auto mb-3 opacity-50" aria-hidden="true" />
              <p>No notes yet. Create your first note!</p>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence>
                {filtered.map((n) => {
                  const id = n._id || n.id
                  return (
                    <motion.li
                      key={id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, x: -10 }}
                      className="bg-gray-900 rounded-xl p-4 border-l-4"
                      style={{ borderLeftColor: n.color || COLORS[0] }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold flex items-center gap-2">
                          {n.pinned && <FaThumbtack className="text-yellow-400" aria-label="Pinned" />}
                          {n.title}
                        </h3>
                        <div className="flex gap-1">
                          <button
                            onClick={() => togglePin(id)}
                            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-yellow-400"
                            aria-label={n.pinned ? 'Unpin' : 'Pin'}
                          >
                            <FaThumbtack />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400"
                            aria-label="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap mb-2">{n.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaTags aria-hidden="true" /> {n.category} • {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotesPage
