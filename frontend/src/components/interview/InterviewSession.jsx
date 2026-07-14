import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaLightbulb, FaPaperPlane, FaArrowRight, FaClock } from 'react-icons/fa'
import api from '../../services/api'
import toast from 'react-hot-toast'

function InterviewSession({
  sessionId,
  currentQuestion,
  questionNumber,
  onNextQuestion,
  onEndInterview,
}) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer')
      return
    }

    setIsSubmitting(true)
    try {
      // Backend reads { answer, timeTaken } from req.body — do NOT send `question`
      const response = await api.post(`/interview/${sessionId}/answer`, {
        answer,
        timeTaken: timer,
      })

      setFeedback(response.data.feedback)
      toast.success('Answer submitted!')
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error(error.response?.data?.message || 'Failed to submit answer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    setAnswer('')
    setFeedback(null)
    onNextQuestion()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Panel */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6"
          >
            {/* Timer */}
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <FaClock />
              <span className="font-mono">{formatTime(timer)}</span>
            </div>

            {/* Question */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Question {questionNumber}</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {currentQuestion || 'Loading question...'}
                </p>
              </div>
            </div>

            {/* Answer Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Your Answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... Explain your approach, discuss time/space complexity, and provide code if needed."
                className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300 placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answer.trim()}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <FaPaperPlane />
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </motion.button>

              {feedback && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  Next Question
                  <FaArrowRight />
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Feedback Panel */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaLightbulb className="text-yellow-400" />
                Interviewer Feedback
              </h3>

              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-400">
                    Score
                  </span>
                  {/* Backend stores rating 0-10; display as x/10 and scale bar to 100% */}
                  <span
                    className={`text-2xl font-bold ${
                      (feedback.rating ?? 0) >= 8
                        ? 'text-green-500'
                        : (feedback.rating ?? 0) >= 5
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {feedback.rating ?? 0}/10
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((feedback.rating ?? 0) / 10) * 100}%` }}
                    className={`h-2 rounded-full ${
                      (feedback.rating ?? 0) >= 8
                        ? 'bg-green-500'
                        : (feedback.rating ?? 0) >= 5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="text-gray-300 whitespace-pre-wrap">
                {feedback.comments || feedback.feedback || 'No feedback available.'}
              </div>
            </motion.div>
          )}
        </div>

        {/* Side Panel - Tips & Stats */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 sticky top-24"
          >
            <h3 className="text-lg font-bold mb-4">Interview Tips</h3>

            <div className="space-y-4">
              {[
                {
                  title: 'Clarify Requirements',
                  description: 'Ask about edge cases and constraints',
                },
                {
                  title: 'Explain Your Approach',
                  description: 'Talk through your thought process',
                },
                {
                  title: 'Analyze Complexity',
                  description: 'Discuss time and space complexity',
                },
                {
                  title: 'Test Your Solution',
                  description: 'Walk through examples',
                },
              ].map((tip, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-gray-400">{tip.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-400">
                💡 Take your time and think through the problem before coding
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default InterviewSession
