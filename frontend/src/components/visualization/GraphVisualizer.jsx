import { motion } from 'framer-motion'
import { memo, useEffect, useState } from 'react'

function GraphVisualizer({ graphData, currentStep, highlights = {} }) {
  const [positions, setPositions] = useState({})

  useEffect(() => {
    if (graphData?.nodes) {

      const nodePositions = {}
      const centerX = 400
      const centerY = 300
      const radius = 200

      graphData.nodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / graphData.nodes.length
        nodePositions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        }
      })

      setPositions(nodePositions)
    }
  }, [graphData])

  if (!graphData || !graphData.nodes) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No graph data to visualize
      </div>
    )
  }

  const getNodeColor = (nodeId) => {
    if (highlights.current === nodeId) return '#3b82f6'
    if (highlights.visited?.includes(nodeId)) return '#10b981'
    if (highlights.queue?.includes(nodeId)) return '#f59e0b'
    if (highlights.stack?.includes(nodeId)) return '#8b5cf6'
    return '#4b5563'
  }

  const getEdgeColor = (from, to) => {
    if (highlights.currentEdge?.[0] === from && highlights.currentEdge?.[1] === to) {
      return '#3b82f6'
    }
    if (highlights.visitedEdges?.some(e => e[0] === from && e[1] === to)) {
      return '#10b981'
    }
    return '#6b7280'
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {}
      <div className="flex-1 overflow-auto">
        <svg width="100%" height="100%" viewBox="0 0 800 600" className="min-h-[500px]">
          {}
          {graphData.edges?.map((edge, index) => {
            const from = positions[edge.from]
            const to = positions[edge.to]

            if (!from || !to) return null

            return (
              <g key={index}>
                <motion.line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={getEdgeColor(edge.from, edge.to)}
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  markerEnd={graphData.directed ? 'url(#arrowhead)' : undefined}
                />
                {}
                {edge.weight !== undefined && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-xs font-bold"
                    style={{
                      textShadow: '0 0 4px rgba(0,0,0,0.8)',
                    }}
                  >
                    {edge.weight}
                  </text>
                )}
              </g>
            )
          })}

          {}
          {graphData.directed && (
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
              </marker>
            </defs>
          )}

          {}
          {graphData.nodes?.map((node, index) => {
            const pos = positions[node.id]
            if (!pos) return null

            return (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="30"
                  fill={getNodeColor(node.id)}
                  stroke="#1f2937"
                  strokeWidth="3"
                  className="cursor-pointer transition-all duration-300 hover:stroke-blue-400"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-bold text-base pointer-events-none"
                >
                  {node.label || node.id}
                </text>
                {}
                {node.value !== undefined && (
                  <text
                    x={pos.x}
                    y={pos.y + 45}
                    textAnchor="middle"
                    className="fill-gray-400 text-xs"
                  >
                    val: {node.value}
                  </text>
                )}
              </motion.g>
            )
          })}
        </svg>
      </div>

      {}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-800 bg-gray-800/50">
        {Object.entries({
          Current: '#3b82f6',
          Visited: '#10b981',
          Queue: '#f59e0b',
          Stack: '#8b5cf6',
          Unvisited: '#4b5563',
        }).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {}
      {currentStep && (
        <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700">
          <p className="text-sm text-gray-300 font-semibold">{currentStep.explanation}</p>
          {highlights.distance && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-gray-400">
                Distance: <span className="text-white font-bold">{highlights.distance}</span>
              </span>
              {highlights.queue && (
                <span className="text-gray-400">
                  Queue: <span className="text-white font-mono">[{highlights.queue.join(', ')}]</span>
                </span>
              )}
              {highlights.stack && (
                <span className="text-gray-400">
                  Stack: <span className="text-white font-mono">[{highlights.stack.join(', ')}]</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(GraphVisualizer)
