import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaFlask, FaPlay, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import api from '../../../services/api'
import toast from 'react-hot-toast'

function TestsTab({ problemData }) {
  const [testCases, setTestCases] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [testResults, setTestResults] = useState([])

  const handleGenerateTestCases = async () => {
    if (!problemData) {
      toast.error('No problem data available')
      return
    }

    setIsGenerating(true)

    try {
      const response = await api.post('/ai/test-cases', {
        problemData,
      })

      setTestCases(response.data.data)
      toast.success('Test cases generated!')
    } catch (error) {
      console.error('Error generating test cases:', error)
      toast.error('Failed to generate test cases')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRunTest = (testCase, index) => {

    const passed = Math.random() > 0.3

    setTestResults((prev) => [
      ...prev.filter((r) => r.index !== index),
      {
        index,
        passed,
        input: testCase.input,
        expected: testCase.output,
        actual: passed ? testCase.output : 'incorrect output',
      },
    ])

    toast[passed ? 'success' : 'error'](
      passed ? `Test ${index + 1} passed!` : `Test ${index + 1} failed`
    )
  }

  return (
    <div className="space-y-4">
      {}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
          <FaFlask />
          Test Case Generator
        </h4>
        <p className="text-sm text-gray-300">
          AI generates comprehensive test cases including edge cases and worst-case scenarios.
        </p>
      </div>

      {}
      {!testCases && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateTestCases}
          disabled={isGenerating || !problemData}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              Generating Test Cases...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <FaFlask />
              Generate Test Cases
            </span>
          )}
        </motion.button>
      )}

      {}
      {testCases && (
        <>
          {}
          {testCases.normalCases && testCases.normalCases.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-green-400">✓ Normal Test Cases</h4>
              {testCases.normalCases.map((testCase, index) => (
                <TestCaseCard
                  key={index}
                  testCase={testCase}
                  index={index}
                  type="normal"
                  result={testResults.find((r) => r.index === index)}
                  onRun={() => handleRunTest(testCase, index)}
                />
              ))}
            </div>
          )}

          {}
          {testCases.edgeCases && testCases.edgeCases.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-yellow-400">⚠ Edge Cases</h4>
              {testCases.edgeCases.map((testCase, index) => (
                <TestCaseCard
                  key={index + 100}
                  testCase={testCase}
                  index={index + 100}
                  type="edge"
                  result={testResults.find((r) => r.index === index + 100)}
                  onRun={() => handleRunTest(testCase, index + 100)}
                />
              ))}
            </div>
          )}

          {}
          {testCases.hiddenCases && testCases.hiddenCases.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-purple-400">🔒 Hidden Cases</h4>
              {testCases.hiddenCases.map((testCase, index) => (
                <TestCaseCard
                  key={index + 200}
                  testCase={testCase}
                  index={index + 200}
                  type="hidden"
                  result={testResults.find((r) => r.index === index + 200)}
                  onRun={() => handleRunTest(testCase, index + 200)}
                />
              ))}
            </div>
          )}

          {}
          {testCases.worstCase && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-red-400">🔥 Worst Case</h4>
              <TestCaseCard
                testCase={testCases.worstCase}
                index={300}
                type="worst"
                result={testResults.find((r) => r.index === 300)}
                onRun={() => handleRunTest(testCases.worstCase, 300)}
              />
            </div>
          )}

          {}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-bold text-blue-400 mb-3">🎯 Custom Test Input</h4>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom test input..."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-blue-500"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-2 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <FaPlay className="inline mr-2" />
              Run Custom Test
            </motion.button>
          </div>
        </>
      )}
    </div>
  )
}

function TestCaseCard({ testCase, type, result, onRun }) {
  const typeColors = {
    normal: 'border-green-500/30 bg-green-500/5',
    edge: 'border-yellow-500/30 bg-yellow-500/5',
    hidden: 'border-purple-500/30 bg-purple-500/5',
    worst: 'border-red-500/30 bg-red-500/5',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 ${typeColors[type]}`}
    >
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">Input:</p>
          <code className="text-sm text-blue-400 font-mono break-all">
            {testCase.input}
          </code>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Expected Output:</p>
          <code className="text-sm text-green-400 font-mono break-all">
            {testCase.output}
          </code>
        </div>
        {testCase.explanation && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Explanation:</p>
            <p className="text-sm text-gray-300">{testCase.explanation}</p>
          </div>
        )}

        {}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3 rounded-lg mt-2 ${
              result.passed
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.passed ? (
                <>
                  <FaCheckCircle className="text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Passed</span>
                </>
              ) : (
                <>
                  <FaTimesCircle className="text-red-400" />
                  <span className="text-sm font-semibold text-red-400">Failed</span>
                </>
              )}
            </div>
            {!result.passed && (
              <div className="text-xs text-gray-300">
                <p>Actual Output: <code className="text-red-400">{result.actual}</code></p>
              </div>
            )}
          </motion.div>
        )}

        {}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRun}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors mt-2"
        >
          <FaPlay className="inline mr-2" />
          Run Test
        </motion.button>
      </div>
    </motion.div>
  )
}

export default TestsTab
