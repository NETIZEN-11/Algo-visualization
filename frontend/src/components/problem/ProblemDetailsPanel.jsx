import { FaArrowLeft, FaTag, FaBuilding, FaThumbsUp, FaThumbsDown } from 'react-icons/fa'

function ProblemDetailsPanel({ problemData, onReset }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'hard':
        return 'text-red-400 bg-red-500/10 border-red-500/30'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-lg overflow-hidden h-full">
      {}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-2"
        >
          <FaArrowLeft />
          <span className="text-sm">New Problem</span>
        </button>
        <h2 className="text-lg font-bold text-white">{problemData.title}</h2>
      </div>

      {}
      <div className="p-4 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
        {}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(
              problemData.difficulty
            )}`}
          >
            {problemData.difficulty}
          </span>

          {problemData.likes !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FaThumbsUp className="text-green-400" />
              <span>{problemData.likes}</span>
            </div>
          )}

          {problemData.dislikes !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FaThumbsDown className="text-red-400" />
              <span>{problemData.dislikes}</span>
            </div>
          )}
        </div>

        {}
        {problemData.tags && problemData.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <FaTag />
              Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {problemData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {}
        {problemData.companies && problemData.companies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <FaBuilding />
              Companies
            </h3>
            <div className="flex flex-wrap gap-2">
              {problemData.companies.slice(0, 5).map((company, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-xs font-medium"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        )}

        {}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {problemData.description}
          </div>
        </div>

        {}
        {problemData.examples && problemData.examples.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Examples</h3>
            <div className="space-y-3">
              {problemData.examples.map((example, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Example {index + 1}
                  </p>
                  {example.input && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-400">Input: </span>
                      <code className="text-xs text-blue-400 font-mono">
                        {example.input}
                      </code>
                    </div>
                  )}
                  {example.output && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-400">Output: </span>
                      <code className="text-xs text-green-400 font-mono">
                        {example.output}
                      </code>
                    </div>
                  )}
                  {example.explanation && (
                    <div>
                      <span className="text-xs text-gray-400">Explanation: </span>
                      <span className="text-xs text-gray-300">{example.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {problemData.constraints && problemData.constraints.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Constraints</h3>
            <ul className="space-y-1 text-xs text-gray-400">
              {problemData.constraints.map((constraint, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span className="font-mono">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProblemDetailsPanel
