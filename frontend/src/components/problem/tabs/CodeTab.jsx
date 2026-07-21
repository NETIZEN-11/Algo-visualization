import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaCode, FaCopy, FaCheck } from 'react-icons/fa'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const languages = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '📜' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C++', icon: '⚡' },
]

function CodeTab({ analysis }) {
  const [selectedLanguage, setSelectedLanguage] = useState('python')
  const [copied, setCopied] = useState(false)

  const codeSolutions = analysis?.code_solutions || {}
  const currentCode = codeSolutions[selectedLanguage] || '// No code available'

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {}
      <div className="flex gap-2 flex-wrap">
        {languages.map((lang) => (
          <motion.button
            key={lang.id}
            onClick={() => setSelectedLanguage(lang.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedLanguage === lang.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">{lang.icon}</span>
            {lang.label}
          </motion.button>
        ))}
      </div>

      {}
      <div className="relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FaCode className="text-blue-400" />
            <span className="text-sm font-semibold text-gray-300">
              {languages.find((l) => l.id === selectedLanguage)?.label} Solution
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300 transition-colors"
          >
            {copied ? (
              <>
                <FaCheck className="text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <FaCopy />
                Copy
              </>
            )}
          </button>
        </div>

        {}
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.875rem',
            }}
            showLineNumbers
          >
            {currentCode}
          </SyntaxHighlighter>
        </div>
      </div>

      {}
      {analysis?.optimal_approach && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <h4 className="text-sm font-bold text-blue-400 mb-2">💡 Key Points</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            {analysis.optimal_approach.core_intuition && (
              <li className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>{analysis.optimal_approach.core_intuition}</span>
              </li>
            )}
            {analysis.optimal_approach.edge_cases?.map((edge, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>{edge}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {}
      {analysis?.interview_insights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
        >
          <h4 className="text-sm font-bold text-yellow-400 mb-3">🎯 Interview Tips</h4>

          {analysis.interview_insights.common_mistakes?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">Common Mistakes:</p>
              <ul className="space-y-1">
                {analysis.interview_insights.common_mistakes.map((mistake, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-red-400">✗</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.interview_insights.follow_up_questions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Follow-up Questions:</p>
              <ul className="space-y-1">
                {analysis.interview_insights.follow_up_questions.map((question, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400">?</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default CodeTab
