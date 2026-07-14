import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaLink, FaFileAlt, FaSpinner, FaMagic } from 'react-icons/fa'
import api from '../../services/api'
import toast from 'react-hot-toast'

function ProblemInputPanel({ onProblemAnalyzed, isAnalyzing, setIsAnalyzing }) {
  const [inputMode, setInputMode] = useState('url') // 'url' or 'manual'
  const [problemUrl, setProblemUrl] = useState('')
  const [manualProblem, setManualProblem] = useState({
    title: '',
    description: '',
    examples: '',
    constraints: '',
  })

  const handleAnalyze = async () => {
    setIsAnalyzing(true)

    try {
      let problemData

      if (inputMode === 'url') {
        if (!problemUrl.trim()) {
          toast.error('Please enter a LeetCode URL')
          return
        }

        // Scrape LeetCode problem
        const scrapeResponse = await api.post('/problems/scrape', {
          url: problemUrl,
        })

        problemData = scrapeResponse.data.data
      } else {
        if (!manualProblem.title || !manualProblem.description) {
          toast.error('Please fill in title and description')
          return
        }

        problemData = {
          title: manualProblem.title,
          description: manualProblem.description,
          examples: manualProblem.examples
            .split('\n\n')
            .filter(e => e.trim())
            .map(e => ({ input: e, output: '', explanation: '' })),
          constraints: manualProblem.constraints
            .split('\n')
            .filter(c => c.trim()),
          difficulty: 'Medium',
          tags: [],
        }
      }

      // Analyze with AI
      const analysisResponse = await api.post('/problems/analyze', {
        problemData,
      })

      const analysis = analysisResponse.data.data

      toast.success('Problem analyzed successfully!')
      onProblemAnalyzed(problemData, analysis)
    } catch (error) {
      console.error('Error analyzing problem:', error)
      toast.error(error.response?.data?.message || 'Failed to analyze problem')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FaMagic />
          Input Problem
        </h2>
      </div>

      {/* Input Mode Toggle */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('url')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              inputMode === 'url'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <FaLink className="inline mr-2" />
            LeetCode URL
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              inputMode === 'manual'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <FaFileAlt className="inline mr-2" />
            Manual Input
          </button>
        </div>
      </div>

      {/* Input Fields */}
      <div className="p-4 space-y-4">
        {inputMode === 'url' ? (
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              LeetCode Problem URL
            </label>
            <input
              type="url"
              value={problemUrl}
              onChange={(e) => setProblemUrl(e.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isAnalyzing}
            />
            <p className="text-xs text-gray-500 mt-2">
              Paste any LeetCode problem URL and we'll extract everything automatically
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Problem Title *
              </label>
              <input
                type="text"
                value={manualProblem.title}
                onChange={(e) =>
                  setManualProblem({ ...manualProblem, title: e.target.value })
                }
                placeholder="e.g., Two Sum"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Problem Description *
              </label>
              <textarea
                value={manualProblem.description}
                onChange={(e) =>
                  setManualProblem({ ...manualProblem, description: e.target.value })
                }
                placeholder="Describe the problem..."
                rows={6}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Examples (Optional)
              </label>
              <textarea
                value={manualProblem.examples}
                onChange={(e) =>
                  setManualProblem({ ...manualProblem, examples: e.target.value })
                }
                placeholder="Input: [2,7,11,15], target = 9&#10;Output: [0,1]"
                rows={4}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Constraints (Optional)
              </label>
              <textarea
                value={manualProblem.constraints}
                onChange={(e) =>
                  setManualProblem({ ...manualProblem, constraints: e.target.value })
                }
                placeholder="1 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
                rows={3}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                disabled={isAnalyzing}
              />
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <motion.button
          whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
          whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            isAnalyzing
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              Analyzing with AI...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <FaMagic />
              Analyze Problem
            </span>
          )}
        </motion.button>
      </div>

      {/* Quick Examples */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-800">
        <p className="text-xs font-semibold text-gray-400 mb-2">Try these examples:</p>
        <div className="space-y-1">
          {[
            'https://leetcode.com/problems/two-sum/',
            'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
            'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
          ].map((url, index) => (
            <button
              key={index}
              onClick={() => {
                setInputMode('url')
                setProblemUrl(url)
              }}
              className="block w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-gray-800 rounded transition-colors truncate"
              disabled={isAnalyzing}
            >
              {url}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProblemInputPanel
