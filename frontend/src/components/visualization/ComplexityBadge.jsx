import { motion } from 'framer-motion'

function ComplexityBadge({ time, space, current }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 flex-wrap"
    >
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        Complexity
      </span>
      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
        ⏱ Time: {current || time}
      </span>
      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
        💾 Space: {space}
      </span>
    </motion.div>
  )
}

export default ComplexityBadge
