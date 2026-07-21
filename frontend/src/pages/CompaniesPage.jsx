import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaBuilding, FaSearch, FaCodeBranch, FaArrowRight } from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const TIER_COLORS = {
  FAANG: 'from-blue-500 to-purple-600',
  'Tier-1': 'from-orange-500 to-red-500',
  'Tier-2': 'from-emerald-500 to-cyan-500',
  Startup: 'from-pink-500 to-rose-500',
}

const TIER_BADGE = {
  FAANG: 'bg-blue-500/20 text-blue-300',
  'Tier-1': 'bg-orange-500/20 text-orange-300',
  'Tier-2': 'bg-emerald-500/20 text-emerald-300',
  Startup: 'bg-pink-500/20 text-pink-300',
}

function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [companies, setCompanies] = useState([])
  const [selected, setSelected] = useState(null) // {slug, name}
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(false)
  const [companiesLoading, setCompaniesLoading] = useState(true)

  useEffect(() => {
    setCompaniesLoading(true)
    const params = new URLSearchParams()
    if (tier) params.set('tier', tier)
    if (search) params.set('q', search)
    api
      .get(`/companies?${params.toString()}`)
      .then((r) => setCompanies(r.data.data || []))
      .catch(() => toast.error('Could not load companies'))
      .finally(() => setCompaniesLoading(false))
  }, [tier, search])

  useEffect(() => {
    if (!selected) {
      setProblems([])
      return
    }
    setLoading(true)
    api
      .get(`/companies/${encodeURIComponent(selected.slug)}/problems`)
      .then((res) => setProblems(res.data.data?.problems || []))
      .catch(() => {
        setProblems([])
        toast('No problems tagged for this company yet', { icon: 'ℹ️' })
      })
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaBuilding className="text-orange-400" />
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Company Questions
          </span>
        </h1>
        <p className="text-gray-400">
          Pick a company to see problems frequently asked in their interviews. Each problem shows
          how often it shows up (1 = rare, 5 = asked every loop) and which round.
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or focus tag…"
            className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
          />
        </div>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
        >
          <option value="">All tiers</option>
          <option value="FAANG">FAANG</option>
          <option value="Tier-1">Tier-1</option>
          <option value="Tier-2">Tier-2</option>
          <option value="Startup">Startup</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company list */}
        <div className="lg:col-span-1 space-y-2">
          {companiesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading…</div>
          ) : companies.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 text-center text-gray-400 text-sm">
              No companies match. <br />
              <span className="text-xs">Run the company seed (admin → POST /api/admin/seed/companies) to populate.</span>
            </div>
          ) : (
            companies.map((c) => {
              const colour = TIER_COLORS[c.tier] || TIER_COLORS['Tier-1']
              const isActive = selected?.slug === c.slug
              return (
                <button
                  key={c.slug}
                  onClick={() => setSelected({ slug: c.slug, name: c.name })}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-orange-500/20 border-orange-500/50'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colour} flex items-center justify-center font-bold text-white`}>
                    {c.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-gray-500">
                      {c.problemCount} problems
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${TIER_BADGE[c.tier] || TIER_BADGE['Tier-1']}`}>
                    {c.tier}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Problems list */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-10 text-center text-gray-500">
              <FaBuilding className="text-5xl mx-auto mb-3 opacity-50" />
              <p>Select a company to view their problems</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaCodeBranch className="text-blue-400" />
                {selected.name} Problems
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
                </div>
              ) : problems.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No problems tagged with {selected.name} yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {problems.map((p) => (
                    <Link
                      key={p.problemId}
                      to={`/problem/${p.slug || p.problemId}`}
                      className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full ${
                            p.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                            p.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {p.difficulty}
                          </span>
                          {p.pattern && <span className="text-gray-400">· {p.pattern}</span>}
                          {p.round !== 'any' && <span className="text-gray-400">· {p.round}</span>}
                          {p.lists?.length > 0 && (
                            <span className="text-blue-400">
                              · {p.lists.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">frequency</div>
                          <div className="text-orange-300 font-semibold">
                            {'★'.repeat(p.frequency)}{'☆'.repeat(5 - p.frequency)}
                          </div>
                        </div>
                        <FaArrowRight className="text-gray-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompaniesPage
