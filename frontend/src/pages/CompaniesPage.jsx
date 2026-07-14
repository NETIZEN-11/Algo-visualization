import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaBuilding, FaSearch, FaCodeBranch, FaArrowRight } from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const COMPANIES = [
  { name: 'Google', color: 'from-blue-500 to-green-500', initials: 'G' },
  { name: 'Amazon', color: 'from-orange-500 to-yellow-500', initials: 'A' },
  { name: 'Meta', color: 'from-blue-600 to-indigo-600', initials: 'M' },
  { name: 'Microsoft', color: 'from-blue-500 to-cyan-500', initials: 'MS' },
  { name: 'Apple', color: 'from-gray-400 to-gray-600', initials: '' },
  { name: 'Netflix', color: 'from-red-600 to-red-800', initials: 'N' },
  { name: 'Uber', color: 'from-gray-700 to-black', initials: 'U' },
  { name: 'Airbnb', color: 'from-pink-500 to-red-500', initials: 'Ab' },
  { name: 'LinkedIn', color: 'from-blue-700 to-blue-900', initials: 'in' },
  { name: 'Twitter', color: 'from-blue-400 to-blue-600', initials: 'X' },
  { name: 'Tesla', color: 'from-red-500 to-red-700', initials: 'T' },
  { name: 'Stripe', color: 'from-indigo-500 to-purple-600', initials: 'S' },
]

function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(false)

  const filtered = COMPANIES.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (!selected) {
      setProblems([])
      return
    }
    setLoading(true)
    api
      .get(`/problems/company/${encodeURIComponent(selected)}`)
      .then((res) => setProblems(res.data.problems || []))
      .catch(() => {
        // Fallback: no backend data, show a friendly message
        setProblems([])
        toast('No tagged problems for this company yet', { icon: 'ℹ️' })
      })
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaBuilding className="text-orange-400" />
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Company Questions
          </span>
        </h1>
        <p className="text-gray-400">Pick a company to see problems frequently asked in their interviews.</p>
      </motion.div>

      <div className="relative mb-6 max-w-md">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company grid */}
        <div className="lg:col-span-1 grid grid-cols-2 gap-3">
          {filtered.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelected(c.name)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected === c.name
                  ? 'bg-orange-500/20 border-orange-500/50'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center font-bold text-white text-xl mb-2`}
              >
                {c.initials}
              </div>
              <div className="font-semibold text-sm">{c.name}</div>
            </button>
          ))}
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
                {selected} Problems
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
                </div>
              ) : problems.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                  No problems tagged with {selected} yet. Add tags to your analyzed problems to see them here.
                </p>
              ) : (
                <div className="space-y-2">
                  {problems.map((p) => (
                    <Link
                      key={p._id}
                      to={`/problem/${p.problemId}`}
                      className="flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500">{p.difficulty}</div>
                      </div>
                      <FaArrowRight className="text-gray-500" />
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
