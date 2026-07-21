import { motion } from 'framer-motion'
import { memo } from 'react'

function DPTableVisualizer({ tableData, currentStep, highlights = {} }) {
  if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No DP table data to visualize
      </div>
    )
  }

  const rows = tableData.length
  const cols = Array.isArray(tableData[0]) ? tableData[0].length : 1

  const getCellColor = (i, j) => {
    if (highlights.current?.row === i && highlights.current?.col === j) {
      return 'bg-blue-500'
    }
    if (highlights.computed?.some(c => c.row === i && c.col === j)) {
      return 'bg-green-500'
    }
    if (highlights.dependencies?.some(c => c.row === i && c.col === j)) {
      return 'bg-yellow-500'
    }
    if (highlights.result?.row === i && highlights.result?.col === j) {
      return 'bg-purple-500'
    }
    return 'bg-gray-700'
  }

  const getCellValue = (i, j) => {
    if (Array.isArray(tableData[i])) {
      return tableData[i][j]
    }
    return tableData[i]
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg p-4 overflow-auto">
      {/* DP Table */}
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="inline-block">
          <table className="border-collapse">
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: cols }).map((_, j) => {
                    const value = getCellValue(i, j)
                    const cellColor = getCellColor(i, j)

                    return (
                      <motion.td
                        key={`${i}-${j}`}
                        className={`border-2 border-gray-600 ${cellColor} text-white font-mono text-center transition-all duration-300`}
                        style={{
                          width: '50px',
                          height: '50px',
                          minWidth: '50px',
                          minHeight: '50px',
                        }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: (i * cols + j) * 0.02 }}
                      >
                        <div className="flex items-center justify-center h-full text-sm font-bold">
                          {value !== undefined && value !== null ? value : '-'}
                        </div>
                      </motion.td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Row/Column indices */}
          <div className="flex mt-4 ml-12 gap-0">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="text-xs text-gray-400 text-center font-mono"
                style={{ width: '50px' }}
              >
                j={j}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-800 mt-4">
        {Object.entries({
          Current: 'bg-blue-500',
          Computed: 'bg-green-500',
          Dependencies: 'bg-yellow-500',
          Result: 'bg-purple-500',
          'Not Computed': 'bg-gray-700',
        }).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${color}`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Current step explanation */}
      {currentStep && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300 font-semibold">{currentStep.explanation}</p>
          {highlights.formula && (
            <p className="text-xs text-gray-400 mt-2 font-mono">
              Formula: {highlights.formula}
            </p>
          )}
          {highlights.computation && (
            <p className="text-xs text-blue-400 mt-1 font-mono">
              {highlights.computation}
            </p>
          )}
        </div>
      )}

      {/* Table dimensions */}
      <div className="mt-2 text-center text-xs text-gray-500">
        Dimensions: {rows} × {cols}
      </div>
    </div>
  )
}

export default memo(DPTableVisualizer)
