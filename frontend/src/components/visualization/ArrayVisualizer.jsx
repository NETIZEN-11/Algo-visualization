import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

function ArrayVisualizer({ data, highlights = {} }) {
  const [animatedValues, setAnimatedValues] = useState(data || [])

  useEffect(() => {
    setAnimatedValues(data || [])
  }, [data])

  const getBarColor = (index) => {
    if (highlights.comparing?.includes(index)) {
      return 'bg-yellow-500'
    }
    if (highlights.sorted?.includes(index)) {
      return 'bg-green-500'
    }
    if (highlights.current === index) {
      return 'bg-blue-500'
    }
    if (highlights.pivot === index) {
      return 'bg-purple-500'
    }
    if (highlights.window?.includes(index)) {
      return 'bg-cyan-500'
    }
    return 'bg-gray-600'
  }

  const getBarLabel = (index) => {
    if (highlights.current === index) return 'Current'
    if (highlights.pivot === index) return 'Pivot'
    if (highlights.comparing?.includes(index)) return 'Comparing'
    if (highlights.sorted?.includes(index)) return 'Sorted'
    return ''
  }

  if (!animatedValues || animatedValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No array data to visualize
      </div>
    )
  }

  const maxValue = Math.max(...animatedValues.map(v => Math.abs(v)))

  return (
    <div className="w-full h-full flex flex-col">
      {/* Array Visualization */}
      <div className="flex-1 flex items-end justify-center gap-2 px-4 pb-8">
        {animatedValues.map((value, index) => {
          const height = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 20
          const label = getBarLabel(index)

          return (
            <motion.div
              key={index}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Label */}
              {label && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs font-semibold text-white bg-black/50 px-2 py-1 rounded"
                >
                  {label}
                </motion.div>
              )}

              {/* Bar */}
              <motion.div
                className={`relative flex flex-col items-center justify-end min-w-[40px] rounded-t-lg ${getBarColor(
                  index
                )} shadow-lg`}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ minHeight: '40px' }}
              >
                {/* Value inside bar */}
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  {value}
                </div>
              </motion.div>

              {/* Index */}
              <div className="text-xs text-gray-400 font-mono">[{index}]</div>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-800">
        {Object.entries({
          Current: 'bg-blue-500',
          Comparing: 'bg-yellow-500',
          Pivot: 'bg-purple-500',
          Window: 'bg-cyan-500',
          Sorted: 'bg-green-500',
        }).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${color}`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Pointers */}
      {highlights.pointers && (
        <div className="flex gap-4 justify-center py-2 text-sm">
          {Object.entries(highlights.pointers).map(([name, index]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-gray-400">{name}:</span>
              <span className="text-white font-bold">{index}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ArrayVisualizer
