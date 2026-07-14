import { motion } from 'framer-motion'

function LinkedListVisualizer({ data, currentStep, highlights = {} }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No linked list data to visualize
      </div>
    )
  }

  const getNodeColor = (index) => {
    if (highlights.current === index) return 'from-blue-500 to-blue-600'
    if (highlights.comparing?.includes(index)) return 'from-yellow-500 to-yellow-600'
    if (highlights.head === index) return 'from-green-500 to-green-600'
    if (highlights.tail === index) return 'from-red-500 to-red-600'
    if (highlights.newNode === index) return 'from-purple-500 to-purple-600'
    return 'from-gray-600 to-gray-700'
  }

  const getNodeLabel = (index) => {
    if (highlights.head === index) return 'HEAD'
    if (highlights.tail === index) return 'TAIL'
    if (highlights.current === index) return 'CURR'
    if (highlights.newNode === index) return 'NEW'
    return null
  }

  return (
    <div className="w-full h-full flex flex-col p-8">
      {/* Linked List Visualization */}
      <div className="flex-1 flex items-center justify-start gap-4 overflow-x-auto">
        {data.map((value, index) => (
          <motion.div
            key={`node-${index}`}
            className="flex items-center gap-4"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Node */}
            <div className="flex flex-col items-center gap-2">
              {/* Label */}
              {getNodeLabel(index) && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full"
                >
                  {getNodeLabel(index)}
                </motion.div>
              )}

              {/* Node Container */}
              <div className="relative">
                <motion.div
                  className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getNodeColor(
                    index
                  )} shadow-xl flex items-center justify-center border-2 border-white/20`}
                  whileHover={{ scale: 1.05 }}
                  animate={
                    highlights.current === index
                      ? {
                          boxShadow: [
                            '0 0 20px rgba(59, 130, 246, 0.5)',
                            '0 0 40px rgba(59, 130, 246, 0.8)',
                            '0 0 20px rgba(59, 130, 246, 0.5)',
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-white/70">Node {index}</div>
                  </div>
                </motion.div>

                {/* Next pointer label */}
                {index < data.length - 1 && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                    next
                  </div>
                )}
              </div>
            </div>

            {/* Arrow to next node */}
            {index < data.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex flex-col items-center"
              >
                <svg
                  width="60"
                  height="8"
                  viewBox="0 0 60 8"
                  className="text-gray-500"
                  fill="currentColor"
                >
                  <line
                    x1="0"
                    y1="4"
                    x2="50"
                    y2="4"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <polygon points="50,0 60,4 50,8" fill="currentColor" />
                </svg>
              </motion.div>
            )}

            {/* NULL at the end */}
            {index === data.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: data.length * 0.1 }}
                className="flex flex-col items-center"
              >
                <svg
                  width="60"
                  height="8"
                  viewBox="0 0 60 8"
                  className="text-gray-600"
                  fill="currentColor"
                >
                  <line
                    x1="0"
                    y1="4"
                    x2="50"
                    y2="4"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <polygon points="50,0 60,4 50,8" fill="currentColor" />
                </svg>
                <div className="mt-8 px-4 py-2 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                  <span className="text-gray-400 font-mono text-sm">NULL</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-6 border-t border-gray-800 mt-4">
        {[
          { label: 'HEAD', color: 'from-green-500 to-green-600' },
          { label: 'Current', color: 'from-blue-500 to-blue-600' },
          { label: 'New Node', color: 'from-purple-500 to-purple-600' },
          { label: 'TAIL', color: 'from-red-500 to-red-600' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded bg-gradient-to-br ${color}`} />
            <span className="text-sm text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Pointers display */}
      {highlights.pointers && (
        <div className="flex gap-4 justify-center py-4 text-sm bg-gray-800/50 rounded-lg">
          {Object.entries(highlights.pointers).map(([name, index]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="text-gray-400 font-semibold">{name}:</span>
              <span className="text-white font-bold bg-gray-700 px-3 py-1 rounded">
                {index !== null && index !== undefined ? `Node ${index}` : 'NULL'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LinkedListVisualizer
