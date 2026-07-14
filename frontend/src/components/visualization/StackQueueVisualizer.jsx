import { motion, AnimatePresence } from 'framer-motion'

function StackQueueVisualizer({ data, highlights = {}, type = 'stack' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">{type === 'stack' ? '📚' : '➡️'}</div>
          <p>No {type} data to visualize</p>
        </div>
      </div>
    )
  }

  const getItemColor = (index) => {
    if (highlights.top === index || highlights.front === index) {
      return 'from-blue-500 to-blue-600'
    }
    if (highlights.rear === index) {
      return 'from-purple-500 to-purple-600'
    }
    if (highlights.newItem === index) {
      return 'from-green-500 to-green-600'
    }
    if (highlights.removing === index) {
      return 'from-red-500 to-red-600'
    }
    return 'from-gray-600 to-gray-700'
  }

  const getItemLabel = (index) => {
    if (type === 'stack' && highlights.top === index) return 'TOP'
    if (type === 'queue' && highlights.front === index) return 'FRONT'
    if (type === 'queue' && highlights.rear === index) return 'REAR'
    if (highlights.newItem === index) return 'NEW'
    return null
  }

  // Stack renders bottom to top
  const renderStack = () => (
    <div className="flex flex-col-reverse items-center justify-end gap-2 h-full py-8">
      <AnimatePresence>
        {data.map((value, index) => {
          const actualIndex = data.length - 1 - index // Reverse for bottom-up
          const label = getItemLabel(actualIndex)

          return (
            <motion.div
              key={`stack-${actualIndex}-${value}`}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="relative w-64"
            >
              {/* Label */}
              {label && (
                <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 text-sm font-bold text-white bg-blue-500 px-3 py-1 rounded-full">
                  {label}
                </div>
              )}

              {/* Stack Item */}
              <motion.div
                className={`h-16 rounded-lg bg-gradient-to-r ${getItemColor(
                  actualIndex
                )} shadow-lg border-2 border-white/20 flex items-center justify-between px-6`}
                whileHover={{ scale: 1.02 }}
                animate={
                  highlights.top === actualIndex
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
                <span className="text-2xl font-bold text-white">{value}</span>
                <span className="text-sm text-white/70">Index: {actualIndex}</span>
              </motion.div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Stack Base */}
      <div className="w-72 h-4 bg-gray-700 rounded-b-xl border-t-2 border-gray-600 flex items-center justify-center">
        <span className="text-xs text-gray-400 font-semibold">STACK BASE</span>
      </div>
    </div>
  )

  // Queue renders left to right
  const renderQueue = () => (
    <div className="flex items-center justify-center gap-4 overflow-x-auto py-8 px-8">
      {/* FRONT Label */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-bold text-green-400 bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30">
          FRONT →
        </div>
      </div>

      {/* Queue Items */}
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {data.map((value, index) => {
            const label = getItemLabel(index)

            return (
              <motion.div
                key={`queue-${index}-${value}`}
                initial={{ opacity: 0, x: -30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Label */}
                {label && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-sm font-bold text-white bg-blue-500 px-3 py-1 rounded-full whitespace-nowrap">
                    {label}
                  </div>
                )}

                {/* Queue Item */}
                <motion.div
                  className={`w-24 h-24 rounded-xl bg-gradient-to-br ${getItemColor(
                    index
                  )} shadow-lg border-2 border-white/20 flex flex-col items-center justify-center`}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  animate={
                    highlights.front === index || highlights.rear === index
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
                  <span className="text-3xl font-bold text-white">{value}</span>
                  <span className="text-xs text-white/70 mt-1">[{index}]</span>
                </motion.div>

                {/* Arrow between items */}
                {index < data.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -right-2 top-1/2 transform translate-x-full -translate-y-1/2"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20">
                      <polygon points="0,10 15,5 15,15" fill="#6b7280" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* REAR Label */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-bold text-purple-400 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
          ← REAR
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col">
      {/* Visualization */}
      <div className="flex-1 overflow-auto">
        {type === 'stack' ? renderStack() : renderQueue()}
      </div>

      {/* Info Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-around text-sm">
          <div className="flex flex-col items-center">
            <span className="text-gray-400">Size</span>
            <span className="text-2xl font-bold text-white">{data.length}</span>
          </div>
          
          {type === 'stack' ? (
            <div className="flex flex-col items-center">
              <span className="text-gray-400">Top Element</span>
              <span className="text-2xl font-bold text-blue-400">
                {data.length > 0 ? data[data.length - 1] : 'Empty'}
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Front</span>
                <span className="text-2xl font-bold text-green-400">
                  {data.length > 0 ? data[0] : 'Empty'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400">Rear</span>
                <span className="text-2xl font-bold text-purple-400">
                  {data.length > 0 ? data[data.length - 1] : 'Empty'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-4 border-t border-gray-800 bg-gray-800/50">
        {[
          { label: type === 'stack' ? 'TOP' : 'FRONT', color: 'from-blue-500 to-blue-600' },
          ...(type === 'queue'
            ? [{ label: 'REAR', color: 'from-purple-500 to-purple-600' }]
            : []),
          { label: 'New Item', color: 'from-green-500 to-green-600' },
          { label: 'Removing', color: 'from-red-500 to-red-600' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded bg-gradient-to-br ${color}`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StackQueueVisualizer
