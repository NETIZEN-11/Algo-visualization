import { motion } from 'framer-motion'
import { FaChartPie, FaCode, FaBrain } from 'react-icons/fa'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

function InterviewReadinessCard({ readiness }) {
  if (!readiness) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Interview Readiness</h3>
        <div className="text-center py-8 text-gray-400">
          <p>Calculating readiness...</p>
        </div>
      </div>
    )
  }

  const getReadinessColor = (score) => {
    if (score >= 80) return { color: '#10b981', label: 'Expert', bg: 'bg-green-500/10', border: 'border-green-500/30' }
    if (score >= 60) return { color: '#3b82f6', label: 'Advanced', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
    if (score >= 40) return { color: '#f59e0b', label: 'Intermediate', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }
    return { color: '#ef4444', label: 'Beginner', bg: 'bg-red-500/10', border: 'border-red-500/30' }
  }

  const readinessInfo = getReadinessColor(readiness.overall_score)

  const categories = [
    { label: 'Data Structures', score: readiness.data_structures_score, icon: FaChartPie },
    { label: 'Algorithms', score: readiness.algorithms_score, icon: FaCode },
    { label: 'Problem Solving', score: readiness.problem_solving_score, icon: FaBrain },
  ]

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-6">Interview Readiness</h3>

      {}
      <div className={`${readinessInfo.bg} border ${readinessInfo.border} rounded-xl p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-white mb-1">
              {readiness.overall_score}/100
            </p>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: readinessInfo.color + '20', color: readinessInfo.color }}
            >
              {readinessInfo.label}
            </span>
          </div>
          <div className="w-24 h-24">
            <CircularProgressbar
              value={readiness.overall_score}
              text={`${readiness.overall_score}%`}
              styles={buildStyles({
                pathColor: readinessInfo.color,
                textColor: '#ffffff',
                trailColor: '#1f2937',
                textSize: '20px',
              })}
            />
          </div>
        </div>
      </div>

      {}
      <div className="space-y-3 mb-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 rounded-lg p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <category.icon className="text-blue-400 text-sm" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-300">{category.label}</span>
                  <span className="text-xs font-bold text-white">{category.score}/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.score}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {}
      {readiness.strengths && readiness.strengths.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-green-400 mb-2">✓ Strengths</p>
          <ul className="space-y-1">
            {readiness.strengths.slice(0, 2).map((strength, index) => (
              <li key={index} className="text-xs text-gray-400">
                • {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {readiness.weaknesses && readiness.weaknesses.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-red-400 mb-2">⚠ Areas to Improve</p>
          <ul className="space-y-1">
            {readiness.weaknesses.slice(0, 2).map((weakness, index) => (
              <li key={index} className="text-xs text-gray-400">
                • {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default InterviewReadinessCard
