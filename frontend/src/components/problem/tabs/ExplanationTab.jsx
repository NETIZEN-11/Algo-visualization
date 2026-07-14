import { motion } from 'framer-motion'
import { FaBookOpen, FaLightbulb, FaChartLine, FaBrain } from 'react-icons/fa'

function ExplanationTab({ analysis }) {
  const sections = [
    {
      id: 'summary',
      title: 'Problem Summary',
      icon: FaBookOpen,
      color: 'blue',
      data: analysis?.problem_summary,
    },
    {
      id: 'pattern',
      title: 'Pattern Identification',
      icon: FaBrain,
      color: 'purple',
      data: analysis?.pattern_identification,
    },
    {
      id: 'bruteforce',
      title: 'Brute Force Approach',
      icon: FaLightbulb,
      color: 'yellow',
      data: analysis?.bruteforce_approach,
    },
    {
      id: 'optimal',
      title: 'Optimal Approach',
      icon: FaChartLine,
      color: 'green',
      data: analysis?.optimal_approach,
    },
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      green: 'bg-green-500/10 border-green-500/30 text-green-400',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
        >
          {/* Section Header */}
          <div className={`p-4 border-b border-gray-800 ${getColorClasses(section.color)}`}>
            <h3 className="font-bold flex items-center gap-2">
              <section.icon />
              {section.title}
            </h3>
          </div>

          {/* Section Content */}
          <div className="p-4 space-y-3">
            {section.data ? (
              <>
                {section.id === 'summary' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">Title</p>
                      <p className="text-sm text-gray-200">{section.data.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">Description</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {section.data.description}
                      </p>
                    </div>
                    {section.data.input && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Input</p>
                        <p className="text-sm text-gray-300">{section.data.input}</p>
                      </div>
                    )}
                    {section.data.output && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Output</p>
                        <p className="text-sm text-gray-300">{section.data.output}</p>
                      </div>
                    )}
                  </>
                )}

                {section.id === 'pattern' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">
                        Data Structure
                      </p>
                      <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                        {section.data.data_structure}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1">Pattern</p>
                      <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                        {section.data.pattern}
                      </span>
                    </div>
                    {section.data.why_this_pattern && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">
                          Why This Pattern?
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {section.data.why_this_pattern}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {section.id === 'bruteforce' && (
                  <>
                    {section.data.idea && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Idea</p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {section.data.idea}
                        </p>
                      </div>
                    )}
                    {section.data.steps && section.data.steps.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2">Steps</p>
                        <ol className="space-y-2">
                          {section.data.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-300">
                              <span className="text-yellow-400 font-semibold">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Time: </span>
                        <span className="text-yellow-400 font-mono">
                          {section.data.time_complexity || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Space: </span>
                        <span className="text-yellow-400 font-mono">
                          {section.data.space_complexity || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {section.id === 'optimal' && (
                  <>
                    {section.data.core_intuition && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">
                          Core Intuition
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {section.data.core_intuition}
                        </p>
                      </div>
                    )}
                    {section.data.why_it_works && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">
                          Why It Works
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {section.data.why_it_works}
                        </p>
                      </div>
                    )}
                    {section.data.optimization_logic && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">
                          Optimization Logic
                        </p>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {section.data.optimization_logic}
                        </p>
                      </div>
                    )}
                    {section.data.edge_cases && section.data.edge_cases.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2">Edge Cases</p>
                        <ul className="space-y-1">
                          {section.data.edge_cases.map((edge, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-300">
                              <span className="text-green-400">•</span>
                              <span>{edge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No data available</p>
            )}
          </div>
        </motion.div>
      ))}

      {/* Complexity Analysis */}
      {analysis?.complexity_analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/30 p-4"
        >
          <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
            <FaChartLine />
            Complexity Analysis
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-400">Time Complexity: </span>
              <span className="text-lg font-mono font-bold text-blue-400">
                {analysis.complexity_analysis.time_complexity}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Space Complexity: </span>
              <span className="text-lg font-mono font-bold text-purple-400">
                {analysis.complexity_analysis.space_complexity}
              </span>
            </div>
            {analysis.complexity_analysis.reason && (
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                {analysis.complexity_analysis.reason}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ExplanationTab
