import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaPlay, FaCode, FaBriefcase, FaClock } from 'react-icons/fa'

function InterviewSetup({ onStart }) {
  const [difficulty, setDifficulty] = useState('medium')
  const [interviewType, setInterviewType] = useState('general')

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'green' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'hard', label: 'Hard', color: 'red' },
  ]

  const interviewTypes = [
    {
      value: 'general',
      label: 'General DSA',
      icon: FaCode,
      description: 'Classic data structures and algorithms questions',
    },
    {
      value: 'company-specific',
      label: 'Company Style',
      icon: FaBriefcase,
      description: 'FAANG-style behavioral + technical questions',
    },
  ]

  const handleStart = () => {
    onStart(difficulty, interviewType)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-xl p-8 border border-gray-800"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Setup Your Mock Interview</h2>
          <p className="text-gray-400">
            Choose your difficulty level and interview style to get started
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-8">
          <label className="block text-lg font-semibold mb-4">
            Select Difficulty
          </label>
          <div className="grid grid-cols-3 gap-4">
            {difficulties.map((diff) => (
              <motion.button
                key={diff.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(diff.value)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  difficulty === diff.value
                    ? diff.color === 'green'
                      ? 'border-green-500 bg-green-500/10'
                      : diff.color === 'yellow'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-red-500 bg-red-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <span
                    className={`text-2xl font-bold ${
                      difficulty === diff.value
                        ? diff.color === 'green'
                          ? 'text-green-500'
                          : diff.color === 'yellow'
                          ? 'text-yellow-500'
                          : 'text-red-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {diff.label}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Interview Type Selection */}
        <div className="mb-8">
          <label className="block text-lg font-semibold mb-4">
            Interview Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            {interviewTypes.map((type) => {
              const Icon = type.icon
              return (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInterviewType(type.value)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    interviewType === type.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <Icon
                    className={`text-3xl mb-3 ${
                      interviewType === type.value
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <h3 className="text-xl font-semibold mb-2">{type.label}</h3>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Expected Duration */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <FaClock className="text-orange-500 text-xl" />
            <div>
              <p className="font-semibold">Expected Duration</p>
              <p className="text-sm text-gray-400">45-60 minutes</p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all"
        >
          <FaPlay />
          Start Interview
        </motion.button>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 grid grid-cols-3 gap-4"
      >
        {[
          {
            title: 'Think Aloud',
            description: 'Explain your thought process clearly',
          },
          {
            title: 'Ask Questions',
            description: 'Clarify requirements before coding',
          },
          {
            title: 'Test Your Code',
            description: 'Walk through test cases at the end',
          },
        ].map((tip, index) => (
          <div
            key={index}
            className="bg-gray-900 rounded-lg p-4 border border-gray-800"
          >
            <h4 className="font-semibold mb-2">{tip.title}</h4>
            <p className="text-sm text-gray-400">{tip.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default InterviewSetup
