import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaProjectDiagram, FaSearch, FaListAlt, FaCubes, FaThLarge } from 'react-icons/fa'
import useProblemStore from '../store/useProblemStore'
import VisualizationEngine from '../components/visualization/VisualizationEngine'
import api from '../services/api'
import toast from 'react-hot-toast'

const DEFAULT_VISUALIZATIONS = {
  array: {
    steps: [
      { step_number: 1, state: { array: [5, 3, 8, 1, 9, 2], highlight: [0, 1] }, explanation: 'Compare elements 5 and 3' },
      { step_number: 2, state: { array: [3, 5, 8, 1, 9, 2], highlight: [1, 2] }, explanation: 'Swap if needed; here 3 < 5' },
      { step_number: 3, state: { array: [3, 5, 8, 1, 9, 2], highlight: [2, 3] }, explanation: 'Compare 8 and 1' },
      { step_number: 4, state: { array: [3, 5, 1, 8, 9, 2], highlight: [2, 3] }, explanation: 'Swap 8 and 1' },
      { step_number: 5, state: { array: [3, 5, 1, 8, 9, 2], highlight: [3, 4] }, explanation: 'Compare 8 and 9' },
      { step_number: 6, state: { array: [3, 5, 1, 8, 9, 2], highlight: [4, 5] }, explanation: 'Compare 9 and 2' },
      { step_number: 7, state: { array: [3, 5, 1, 8, 2, 9], highlight: [4, 5] }, explanation: 'Swap 9 and 2' },
    ],
  },
  two_pointer: {
    steps: [
      { step_number: 1, state: { array: [1, 2, 3, 4, 6], left: 0, right: 4, target: 6 }, explanation: 'Two pointers at both ends looking for pair that sums to 6' },
      { step_number: 2, state: { array: [1, 2, 3, 4, 6], left: 0, right: 3, target: 6 }, explanation: 'Sum 1+4=5 too small, move right pointer left' },
      { step_number: 3, state: { array: [1, 2, 3, 4, 6], left: 1, right: 3, target: 6 }, explanation: 'Sum 2+4=6 found!' },
    ],
  },
  sliding_window: {
    steps: [
      { step_number: 1, state: { array: [2, 1, 5, 1, 3, 2], window: [0, 0], sum: 2 }, explanation: 'Window starts at index 0' },
      { step_number: 2, state: { array: [2, 1, 5, 1, 3, 2], window: [0, 1], sum: 3 }, explanation: 'Expand window right' },
      { step_number: 3, state: { array: [2, 1, 5, 1, 3, 2], window: [0, 2], sum: 8 }, explanation: 'Expand to include 5' },
      { step_number: 4, state: { array: [2, 1, 5, 1, 3, 2], window: [1, 2], sum: 6 }, explanation: 'Shrink from left to find max' },
    ],
  },
}

function VisualizationPage() {
  const { problems, getUserProblems } = useProblemStore()
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [vizType, setVizType] = useState('array')
  const [visualization, setVisualization] = useState(DEFAULT_VISUALIZATIONS.array)
  const [search, setSearch] = useState('')
  const [loadingViz, setLoadingViz] = useState(false)

  useEffect(() => {
    getUserProblems()
  }, [getUserProblems])

  const handleSelectProblem = async (problem) => {
    setSelectedProblem(problem)
    setLoadingViz(true)
    try {
      const res = await api.get(`/problems/${problem.problemId}/visualization`)
      const data = res.data.visualization
      if (data && data.steps && data.steps.length > 0) {
        setVisualization(data)
        setVizType(data.type || 'array')
        toast.success('Visualization loaded')
      } else {
        // Fall back to a default
        setVisualization(DEFAULT_VISUALIZATIONS.array)
        setVizType('array')
        toast('No saved visualization — using a demo walkthrough', { icon: 'ℹ️' })
      }
    } catch (err) {
      setVisualization(DEFAULT_VISUALIZATIONS.array)
      setVizType('array')
      toast('Could not load saved visualization — using a demo', { icon: 'ℹ️' })
    } finally {
      setLoadingViz(false)
    }
  }

  const handleUseDemo = (type) => {
    setVizType(type)
    setVisualization(DEFAULT_VISUALIZATIONS[type] || DEFAULT_VISUALIZATIONS.array)
    setSelectedProblem(null)
  }

  const filtered = problems.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaProjectDiagram className="text-orange-400" />
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Algorithm Visualization Lab
          </span>
        </h1>
        <p className="text-gray-400">
          Pick one of your analyzed problems to step through its visualization, or try a built-in demo.
        </p>
        <Link
          to="/visualization/catalog"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold rounded-lg"
        >
          <FaThLarge /> Browse the full algorithm catalog
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: problem list + demo picker */}
        <div className="space-y-6">
          {/* Demos */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FaCubes className="text-yellow-400" />
              Built-in Demos
            </h2>
            <div className="space-y-2">
              {Object.keys(DEFAULT_VISUALIZATIONS).map((t) => (
                <button
                  key={t}
                  onClick={() => handleUseDemo(t)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    vizType === t && !selectedProblem
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t.replace('_', ' ').toUpperCase()} walkthrough
                </button>
              ))}
            </div>
          </div>

          {/* Problem list */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FaListAlt className="text-blue-400" />
              Your Problems
            </h2>
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">
                  No problems yet. Analyze a problem to see it here.
                </p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => handleSelectProblem(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedProblem?._id === p._id
                        ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-gray-500">{p.difficulty}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: visualizer */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 min-h-[500px]">
            {loadingViz ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {selectedProblem ? selectedProblem.title : `Demo: ${vizType.replace('_', ' ').toUpperCase()}`}
                  </h2>
                  <span className="text-xs text-gray-500">
                    {visualization?.steps?.length || 0} steps
                  </span>
                </div>
                <VisualizationEngine visualizationData={visualization} type={vizType} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisualizationPage
