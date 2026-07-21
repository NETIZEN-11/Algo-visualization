import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMicrophone, FaStop, FaStar } from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'
import InterviewSetup from '../components/interview/InterviewSetup'
import InterviewSession from '../components/interview/InterviewSession'
import InterviewResults from '../components/interview/InterviewResults'

function InterviewPage() {
  const [sessionState, setSessionState] = useState('setup')
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(1)

  const handleStartInterview = async (difficulty, type) => {
    try {
      const response = await api.post('/interview/start', {
        difficulty,
        type,
      })

      setSessionId(response.data.sessionId)
      setCurrentQuestion(response.data.question)
      setSessionState('active')
      setQuestionNumber(1)

      toast.success('Interview started! Good luck!')
    } catch (error) {
      console.error('Error starting interview:', error)
      toast.error(error.response?.data?.message || 'Failed to start interview')
    }
  }

  const handleEndInterview = async () => {
    if (!sessionId) return

    try {
      const response = await api.post(`/interview/${sessionId}/end`)
      setSessionData(response.data.summary)
      setSessionState('results')

      toast.success('Interview completed!')
    } catch (error) {
      console.error('Error ending interview:', error)
      toast.error('Failed to end interview')
    }
  }

  const handleNextQuestion = async () => {
    try {
      const response = await api.post(`/interview/${sessionId}/next`)
      setCurrentQuestion(response.data.question)
      setQuestionNumber(response.data.questionNumber)
    } catch (error) {
      console.error('Error getting next question:', error)
      toast.error(error.response?.data?.message || 'Failed to get next question')
    }
  }

  const handleRestartInterview = () => {
    setSessionState('setup')
    setSessionId(null)
    setCurrentQuestion(null)
    setSessionData(null)
    setQuestionNumber(1)
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <FaMicrophone className="text-orange-500" />
                <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  AI Mock Interview
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Practice with AI interviewer • Real-time feedback • Performance tracking
              </p>
            </div>

            {sessionState === 'active' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
                  <FaStar className="text-yellow-400" />
                  <span className="text-sm font-semibold">Question {questionNumber}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEndInterview}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
                >
                  <FaStop />
                  End Interview
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {sessionState === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewSetup onStart={handleStartInterview} />
            </motion.div>
          )}

          {sessionState === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewSession
                sessionId={sessionId}
                currentQuestion={currentQuestion}
                questionNumber={questionNumber}
                onNextQuestion={handleNextQuestion}
                onEndInterview={handleEndInterview}
              />
            </motion.div>
          )}

          {sessionState === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <InterviewResults
                sessionData={sessionData}
                onRestart={handleRestartInterview}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default InterviewPage
