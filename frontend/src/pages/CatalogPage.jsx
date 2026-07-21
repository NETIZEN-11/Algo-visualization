import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaSearch, FaBookmark, FaCode, FaProjectDiagram, FaSortAmountDown,
  FaTree, FaLink, FaLayerGroup, FaCalculator, FaSearchPlus,
  FaArrowsAltH, FaWindowMaximize,
} from 'react-icons/fa'
import { ALGORITHMS, CATEGORIES } from '../data/algorithmCatalog'
import api from '../services/api'

const ICON_MAP = {
  FaSortAmountDown, FaSearchPlus, FaArrowsAltH, FaWindowMaximize,
  FaLink, FaLayerGroup, FaTree, FaProjectDiagram, FaCalculator,
}

function CatalogPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeDifficulty, setActiveDifficulty] = useState('all')
  const [bookmarks, setBookmarks] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/bookmarks')
        const ids = (res.data?.bookmarks || []).map((b) => b.algorithmId)
        if (!cancelled) setBookmarks(new Set(ids))
      } catch {
        // Bookmarks fetch failed - ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return Object.values(ALGORITHMS).filter((a) => {
      if (activeCategory !== 'all' && a.category !== activeCategory) return false
      if (activeDifficulty !== 'all' && a.difficulty !== activeDifficulty) return false
      if (q && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, activeCategory, activeDifficulty])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const a of filtered) {
      if (!map.has(a.category)) map.set(a.category, [])
      map.get(a.category).push(a)
    }
    return map
  }, [filtered])

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl lg:text-5xl font-bold flex items-center gap-3">
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Algorithm Visualizations
            </span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Step-by-step interactive animations for {Object.keys(ALGORITHMS).length}+ algorithms.
          </p>
        </motion.div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search algorithms..."
              className="w-full pl-10 pr-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeCategory === 'all'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
              }`}
            >
              All ({Object.keys(ALGORITHMS).length})
            </button>
            {CATEGORIES.map((c) => {
              const count = Object.values(ALGORITHMS).filter((a) => a.category === c.id).length
              if (count === 0) return null
              const Icon = ICON_MAP[c.icon] || FaCode
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    activeCategory === c.id
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <Icon className="text-xs" /> {c.label} ({count})
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 justify-end">
            {['all', 'Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeDifficulty === d
                    ? difficultyActive(d)
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                }`}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>
        </div>

        {}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <FaSearch className="text-5xl mx-auto mb-3" />
            <p>No algorithms match your filters.</p>
          </div>
        )}

        {}
        {[...grouped.entries()].map(([cat, algos]) => {
          const catMeta = CATEGORIES.find((c) => c.id === cat) || { label: cat, icon: 'FaCode' }
          const Icon = ICON_MAP[catMeta.icon] || FaCode
          return (
            <section key={cat} className="space-y-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-200">
                <Icon className="text-orange-400" />
                {catMeta.label}
                <span className="text-xs text-gray-500 font-normal">
                  ({algos.length} {algos.length === 1 ? 'algorithm' : 'algorithms'})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {algos.map((a) => (
                  <AlgorithmCard
                    key={a.id}
                    algo={a}
                    isBookmarked={bookmarks.has(a.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function AlgorithmCard({ algo, isBookmarked }) {
  return (
    <Link to={`/visualization/${algo.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-full flex flex-col gap-2 hover:border-orange-500/40 transition-colors relative"
      >
        {isBookmarked && (
          <FaBookmark className="absolute top-3 right-3 text-orange-400 text-sm" />
        )}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-white truncate">{algo.name}</h3>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${difficultyPill(
              algo.difficulty
            )}`}
          >
            {algo.difficulty}
          </span>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 flex-1">{algo.description}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono pt-2 border-t border-gray-800">
          <span className="text-blue-400">{algo.timeComplexity}</span>
          <span>·</span>
          <span className="text-purple-400">{algo.spaceComplexity}</span>
        </div>
      </motion.div>
    </Link>
  )
}

function difficultyActive(d) {
  if (d === 'Easy') return 'bg-green-500/20 text-green-300 border border-green-500/40'
  if (d === 'Medium') return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
  if (d === 'Hard') return 'bg-red-500/20 text-red-300 border border-red-500/40'
  return 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
}

function difficultyPill(d) {
  if (d === 'Easy') return 'bg-green-500/15 text-green-300 border border-green-500/30'
  if (d === 'Medium') return 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
  if (d === 'Hard') return 'bg-red-500/15 text-red-300 border border-red-500/30'
  return 'bg-gray-700 text-gray-300'
}

export default CatalogPage
