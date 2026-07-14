import { motion } from 'framer-motion'

/**
 * Renders the live variables of the current step.
 *
 * Each step from a step-generator may include a `variables` map. We
 * pretty-print it as a key/value list with sensible number/array/string
 * formatting. This is the equivalent of Algomaster's "current step
 * info" panel, but pulled out as a dedicated widget so it sits
 * next to the visualization and updates on every step change.
 */
function VariablesPanel({ variables, explanation, codeLine, complexity }) {
  if (!variables && !explanation && !codeLine) {
    return null
  }

  const entries = variables ? Object.entries(variables) : []

  return (
    <motion.div
      key={codeLine + (explanation || '')}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 font-mono text-sm space-y-3"
    >
      {/* Explanation (plain language summary) */}
      {explanation && (
        <p className="text-gray-200 leading-relaxed font-sans text-[15px]">
          {explanation}
        </p>
      )}

      {/* Variables */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 pt-2 border-t border-gray-800">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 min-w-0">
              <span className="text-blue-400 font-semibold">{k}</span>
              <span className="text-gray-500">=</span>
              <span className="text-yellow-300 truncate" title={formatVal(v)}>
                {formatVal(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current code line + complexity badge */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-800 text-xs">
        {codeLine && (
          <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded truncate">
            {codeLine}
          </code>
        )}
        {complexity && (
          <span className="text-orange-300 bg-orange-500/10 px-2 py-1 rounded whitespace-nowrap">
            {complexity}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function formatVal(v) {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN'
    if (!Number.isFinite(v)) return '∞'
    return v.toString()
  }
  if (typeof v === 'string') return v
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]'
    if (v.length <= 6) return '[' + v.map(formatVal).join(', ') + ']'
    return '[' + v.slice(0, 5).map(formatVal).join(', ') + `, … +${v.length - 5}]`
  }
  if (typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v)
}

export default VariablesPanel
