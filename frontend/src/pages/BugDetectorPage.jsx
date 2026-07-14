import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaBug, FaExclamationTriangle, FaCheckCircle, FaLightbulb, FaCode } from 'react-icons/fa'
import api from '../services/api'
import toast from 'react-hot-toast'

const LANGUAGES = ['python', 'javascript', 'java', 'cpp']

const SAMPLE_BUGGY_CODE = `def find_duplicate(nums):
    # Looks for a duplicate but has an off-by-one error
    seen = set()
    for i in range(len(nums) + 1):
        if nums[i] in seen:
            return nums[i]
        seen.add(nums[i])
    return -1

print(find_duplicate([1, 3, 4, 2, 2]))
`

function BugDetectorPage() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error('Paste some code first')
      return
    }
    setIsLoading(true)
    setAnalysis(null)
    try {
      const res = await api.post('/problems/analyze-code', {
        code,
        language,
        problemId: null,
      })
      setAnalysis(res.data.analysis)
      toast.success('Analysis complete')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseSample = () => {
    setCode(SAMPLE_BUGGY_CODE)
    setLanguage('python')
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <FaBug className="text-red-400" />
          <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            AI Bug Detector
          </span>
        </h1>
        <p className="text-gray-400">
          Paste your code and let AI spot bugs, suggest fixes, and explain what's wrong.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaCode className="text-blue-400" />
              Your Code
            </h2>
            <button
              onClick={handleUseSample}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Load sample
            </button>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full mb-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="Paste your code here..."
            className="w-full h-80 p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full mt-3 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <FaBug />
            {isLoading ? 'Analyzing...' : 'Detect Bugs'}
          </button>
        </div>

        {/* Output panel */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 min-h-[500px]">
          <h2 className="text-lg font-semibold mb-3">Analysis Report</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-3" />
                <p className="text-gray-400">Scanning for issues...</p>
              </div>
            </div>
          ) : !analysis ? (
            <div className="flex items-center justify-center h-80 text-gray-500 text-sm">
              Paste code and click "Detect Bugs" to see results
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  analysis.hasErrors
                    ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                    : 'bg-green-500/10 border border-green-500/30 text-green-300'
                }`}
              >
                {analysis.hasErrors ? (
                  <>
                    <FaExclamationTriangle />
                    <span className="font-semibold">Issues detected</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    <span className="font-semibold">No major issues found</span>
                  </>
                )}
              </div>

              {analysis.feedback && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-1">FEEDBACK</h3>
                  <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                    {analysis.feedback}
                  </p>
                </div>
              )}

              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-1">
                    <FaLightbulb className="text-yellow-400" /> SUGGESTIONS
                  </h3>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 bg-gray-800 rounded-lg p-2">
                        • {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BugDetectorPage
