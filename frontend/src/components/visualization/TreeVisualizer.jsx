import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function TreeNode({ node, x, y, level, highlights = {}, onNodeClick }) {
  if (!node) return null

  const isHighlighted = highlights.current === node.val
  const isVisited = highlights.visited?.includes(node.val)
  const isPath = highlights.path?.includes(node.val)

  const nodeColor = isHighlighted
    ? 'bg-blue-500'
    : isPath
    ? 'bg-purple-500'
    : isVisited
    ? 'bg-green-500'
    : 'bg-gray-700'

  return (
    <g>
      {/* Node circle */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: level * 0.2 }}
      >
        <circle
          cx={x}
          cy={y}
          r="25"
          className={`${nodeColor} cursor-pointer transition-all duration-300`}
          onClick={() => onNodeClick?.(node)}
          strokeWidth="3"
          stroke={isHighlighted ? '#60a5fa' : '#374151'}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white font-bold text-sm pointer-events-none"
        >
          {node.val}
        </text>
      </motion.g>

      {/* Left child connection */}
      {node.left && (
        <motion.line
          x1={x}
          y1={y + 25}
          x2={x - 60}
          y2={y + 80}
          stroke="#4b5563"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: level * 0.2 }}
        />
      )}

      {/* Right child connection */}
      {node.right && (
        <motion.line
          x1={x}
          y1={y + 25}
          x2={x + 60}
          y2={y + 80}
          stroke="#4b5563"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: level * 0.2 }}
        />
      )}

      {/* Recursively render children */}
      {node.left && (
        <TreeNode
          node={node.left}
          x={x - 60}
          y={y + 80}
          level={level + 1}
          highlights={highlights}
          onNodeClick={onNodeClick}
        />
      )}
      {node.right && (
        <TreeNode
          node={node.right}
          x={x + 60}
          y={y + 80}
          level={level + 1}
          highlights={highlights}
          onNodeClick={onNodeClick}
        />
      )}
    </g>
  )
}

const getTreeDepth = (node) => {
  if (!node) return 0
  return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right))
}

function TreeVisualizer({ treeData, currentStep, highlights = {} }) {
  const [viewBox, setViewBox] = useState('0 0 800 600')

  useEffect(() => {
    // Auto-adjust viewBox based on tree size
    if (treeData) {
      const depth = getTreeDepth(treeData)
      const width = Math.max(800, depth * 100)
      const height = Math.max(600, depth * 100)
      setViewBox(`0 0 ${width} ${height}`)
    }
  }, [treeData])

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No tree data to visualize
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* Tree SVG */}
      <div className="flex-1 overflow-auto">
        <svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          className="min-h-[500px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <TreeNode node={treeData} x={400} y={50} level={0} highlights={highlights} />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-800 bg-gray-800/50">
        {Object.entries({
          Current: 'bg-blue-500',
          Visited: 'bg-green-500',
          Path: 'bg-purple-500',
          Default: 'bg-gray-700',
        }).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${color}`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Tree info */}
      {currentStep && (
        <div className="px-4 py-2 bg-gray-800/50 text-sm text-gray-300">
          <p className="font-semibold">{currentStep.explanation}</p>
        </div>
      )}
    </div>
  )
}

export default TreeVisualizer
