import { motion } from 'framer-motion'
import {
  FaTrophy,
  FaStar,
  FaRedo,
  FaChartLine,
  FaCheckCircle,
} from 'react-icons/fa'

function InterviewResults({ sessionData, onRestart }) {
  const {
    totalQuestions = 0,
    answeredQuestions = 0,
    score = 0,
    duration = 0,
    xpEarned = 0,
    questions = [],
  } = sessionData || {}

  // `score` is 0-100 average across answered questions
  const averageScore = Math.round(score)

  // Derive strengths/improvements from question feedback when available
  const strengths = questions
    .filter(q => q.feedback?.rating >= 7)
    .map(q => `Strong answer on: "${q.question?.slice(0, 60)}..."`)
    .slice(0, 3)

  const improvements = questions
    .filter(q => q.feedback?.rating < 5 && q.answered)
    .map(q => `Review: "${q.question?.slice(0, 60)}..."`)
    .slice(0, 3)

  const overallFeedback = averageScore >= 80
    ? 'Excellent performance! You demonstrated strong problem-solving skills.'
    : averageScore >= 60
    ? 'Good effort! Keep practicing to improve your consistency.'
    : 'Keep practicing! Focus on explaining your approach clearly and discussing complexity.'

  const formatDuration = (minutes) => {
    if (!minutes) return '0 minutes'
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const getPerformanceLevel = (score) => {
    if (score >= 80) return { label: 'Excellent', color: 'green' }
    if (score >= 60) return { label: 'Good', color: 'yellow' }
    if (score >= 40) return { label: 'Fair', color: 'orange' }
    return { label: 'Needs Improvement', color: 'red' }
  }

  const performance = getPerformanceLevel(averageScore)

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-block mb-4"
        >
          <FaTrophy className="text-8xl text-yellow-400" />
        </motion.div>
        <h1 className="text-4xl font-bold mb-2">Interview Complete!</h1>
        <p className="text-gray-400 text-lg">
          Here's how you performed in this session
        </p>
      </motion.div>

      {/* Overall Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <div className="text-3xl font-bold text-orange-500 mb-2">
            {answeredQuestions}/{totalQuestions}
          </div>
          <div className="text-sm text-gray-400">Questions Answered</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <div
            className={`text-3xl font-bold mb-2 ${
              performance.color === 'green'
                ? 'text-green-500'
                : performance.color === 'yellow'
                ? 'text-yellow-500'
                : performance.color === 'orange'
                ? 'text-orange-500'
                : 'text-red-500'
            }`}
          >
            {averageScore}
          </div>
          <div className="text-sm text-gray-400">Average Score</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <div className="text-3xl font-bold text-blue-500 mb-2">
            {formatDuration(duration)}
          </div>
          <div className="text-sm text-gray-400">Total Duration</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center col-span-3 md:col-span-1">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            +{xpEarned} XP
          </div>
          <div className="text-sm text-gray-400">XP Earned</div>
        </div>
      </motion.div>

      {/* Performance Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Performance Rating</h3>
            <p className="text-gray-400">Based on your overall performance</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`text-2xl ${
                    i < Math.round(averageScore / 20)
                      ? 'text-yellow-400'
                      : 'text-gray-700'
                  }`}
                />
              ))}
            </div>
            <span
              className={`text-lg font-bold ${
                performance.color === 'green'
                  ? 'text-green-500'
                  : performance.color === 'yellow'
                  ? 'text-yellow-500'
                  : performance.color === 'orange'
                  ? 'text-orange-500'
                  : 'text-red-500'
              }`}
            >
              {performance.label}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-300"
                >
                  <span className="text-green-500 mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-400">
                Keep practicing to identify your strengths!
              </li>
            )}
          </ul>
        </motion.div>

        {/* Areas for Improvement */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaChartLine className="text-orange-500" />
            Areas to Improve
          </h3>
          <ul className="space-y-2">
            {improvements.length > 0 ? (
              improvements.map((improvement, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-300"
                >
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{improvement}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-400">
                Great job! Continue refining your skills.
              </li>
            )}
          </ul>
        </motion.div>
      </div>

      {/* Overall Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8"
      >
        <h3 className="text-lg font-bold mb-4">Overall Feedback</h3>
        <p className="text-gray-300 leading-relaxed">{overallFeedback}</p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg font-bold flex items-center justify-center gap-3 transition-all"
        >
          <FaRedo />
          Start New Interview
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.history.back()}
          className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-colors"
        >
          Back to Dashboard
        </motion.button>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold mb-3 text-blue-400">
          Recommended Next Steps
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Review the problems you found challenging
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Practice similar problems on the platform
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Schedule another mock interview in a few days
          </li>
        </ul>
      </motion.div>
    </div>
  )
}

export default InterviewResults
