import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaMapSigns, FaCheckCircle, FaCircle, FaLock, FaRoad, FaArrowRight, FaSync } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { roadmapService } from '../services/roadmapService'
import { useReducedMotion } from '../hooks/useReducedMotion'

const ROADMAP = [
  {
    phase: 'Foundations',
    color: 'from-green-500 to-emerald-500',
    topics: [
      { id: 'arrays', name: 'Arrays & Hashing', problems: 12 },
      { id: 'strings', name: 'Strings', problems: 8 },
      { id: 'two-pointer', name: 'Two Pointers', problems: 6 },
      { id: 'sliding-window', name: 'Sliding Window', problems: 6 },
    ],
  },
  {
    phase: 'Core Patterns',
    color: 'from-blue-500 to-indigo-500',
    topics: [
      { id: 'stack', name: 'Stack', problems: 7 },
      { id: 'linkedlist', name: 'Linked List', problems: 8 },
      { id: 'binary-search', name: 'Binary Search', problems: 7 },
      { id: 'sorting', name: 'Sorting & Searching', problems: 6 },
    ],
  },
  {
    phase: 'Trees & Graphs',
    color: 'from-purple-500 to-pink-500',
    topics: [
      { id: 'trees', name: 'Trees & BST', problems: 12 },
      { id: 'tries', name: 'Tries', problems: 4 },
      { id: 'graphs', name: 'Graphs (BFS/DFS)', problems: 10 },
      { id: 'advanced-graphs', name: 'Advanced Graphs', problems: 5 },
    ],
  },
  {
    phase: 'Dynamic Programming',
    color: 'from-orange-500 to-red-500',
    topics: [
      { id: 'dp-1d', name: '1-D DP', problems: 8 },
      { id: 'dp-2d', name: '2-D DP', problems: 8 },
      { id: 'dp-strings', name: 'DP on Strings', problems: 5 },
      { id: 'dp-intervals', name: 'Interval DP', problems: 4 },
    ],
  },
  {
    phase: 'Advanced',
    color: 'from-red-500 to-rose-700',
    topics: [
      { id: 'greedy', name: 'Greedy', problems: 7 },
      { id: 'backtracking', name: 'Backtracking', problems: 8 },
      { id: 'bit-manipulation', name: 'Bit Manipulation', problems: 5 },
      { id: 'design', name: 'Design Problems', problems: 6 },
    ],
  },
]

function RoadmapPage() {
  const reduceMotion = useReducedMotion()
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await roadmapService.get()
      const data = r.data || r

      const map = {}
      const topics = data?.topics || []
      topics.forEach((t) => { map[t.topicId] = t })
      setProgress(map)
    } catch (err) {

      setProgress({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const isComplete = (id) => !!progress[id]?.completed
  const isUnlocked = (phaseIdx, topicIdx) => {
    if (phaseIdx === 0 && topicIdx === 0) return true
    if (topicIdx > 0) return isComplete(ROADMAP[phaseIdx].topics[topicIdx - 1].id)
    return isComplete(ROADMAP[phaseIdx - 1].topics[ROADMAP[phaseIdx - 1].topics.length - 1].id)
  }

  const toggleComplete = async (phaseIdx, topicIdx) => {
    const topic = ROADMAP[phaseIdx].topics[topicIdx]
    if (!isUnlocked(phaseIdx, topicIdx) && !isComplete(topic.id)) {
      toast.error('Finish the previous topic first')
      return
    }
    const newDone = !isComplete(topic.id)

    setProgress((p) => ({ ...p, [topic.id]: { ...(p[topic.id] || {}), topicId: topic.id, completed: newDone } }))
    try {
      await roadmapService.updateProgress({ topicId: topic.id, completed: newDone })
    } catch (err) {

      setProgress((p) => ({ ...p, [topic.id]: { ...(p[topic.id] || {}), completed: !newDone } }))
      toast.error(err.response?.data?.message || 'Could not update progress')
    }
  }

  const totalTopics = ROADMAP.reduce((sum, p) => sum + p.topics.length, 0)
  const completedTopics = Object.values(progress).filter((t) => t?.completed).length
  const percent = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FaMapSigns className="text-orange-400" aria-hidden="true" />
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              DSA Learning Roadmap
            </span>
          </h1>
          <p className="text-gray-400">A structured path from foundations to advanced topics — synced to your account.</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700" aria-label="Refresh roadmap">
          <FaSync className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm font-bold text-orange-400">{percent}%</span>
        </div>
        <div
          className="w-full bg-gray-800 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${percent}%` }}
            className="h-full bg-gradient-to-r from-orange-500 to-red-500"
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {completedTopics} / {totalTopics} topics completed
        </div>
      </div>

      <div className="space-y-8">
        {ROADMAP.map((phase, phaseIdx) => (
          <motion.section
            key={phase.phase}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: phaseIdx * 0.05 }}
            aria-labelledby={`phase-${phaseIdx}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${phase.color} flex items-center justify-center`}>
                <FaRoad aria-hidden="true" />
              </div>
              <div>
                <h2 id={`phase-${phaseIdx}`} className="text-xl font-bold">Phase {phaseIdx + 1}: {phase.phase}</h2>
                <p className="text-xs text-gray-400">{phase.topics.length} topics</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {phase.topics.map((topic, topicIdx) => {
                const done = isComplete(topic.id)
                const unlocked = isUnlocked(phaseIdx, topicIdx)
                const status = done ? 'completed' : unlocked ? 'available' : 'locked'
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleComplete(phaseIdx, topicIdx)}
                    disabled={!unlocked && !done}
                    aria-label={`${topic.name}, ${status}`}
                    className={`p-4 rounded-xl text-left transition-all border focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
                      done
                        ? 'bg-green-500/10 border-green-500/40'
                        : unlocked
                        ? 'bg-gray-900 border-gray-800 hover:border-orange-500/40'
                        : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-semibold">{topic.name}</div>
                      {!unlocked && !done ? (
                        <FaLock className="text-gray-600" aria-hidden="true" />
                      ) : done ? (
                        <FaCheckCircle className="text-green-400" aria-hidden="true" />
                      ) : (
                        <FaCircle className="text-gray-600" aria-hidden="true" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {topic.problems} problems <FaArrowRight className="text-[10px]" aria-hidden="true" />
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  )
}

export default RoadmapPage
