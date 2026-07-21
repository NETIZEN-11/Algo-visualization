import { motion } from 'framer-motion'
import { FaEye, FaSpinner } from 'react-icons/fa'
import VisualizationEngine from '../visualization/VisualizationEngine'

function VisualizationPanel({ analysis, isAnalyzing }) {

  const vizData = analysis?.visualization
  const hasSteps = vizData?.steps?.length > 0

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-140px)]">
      {}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FaEye />
          Visualization Engine
        </h2>
        <p className="text-xs text-white/80 mt-1">
          Step-by-step algorithm execution
        </p>
      </div>

      {}
      <div className="p-4 h-[calc(100%-80px)]">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FaSpinner className="text-4xl animate-spin mb-4 text-purple-500" />
            <p className="text-sm">Generating visualization...</p>
          </div>
        ) : !vizData || !hasSteps ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="relative w-32 h-32 mb-6">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg opacity-20"
              />
              <FaEye className="absolute inset-0 m-auto text-6xl text-purple-500/50" />
            </div>
            <p className="text-lg font-semibold">
              {analysis && !hasSteps ? 'No Visualization Data' : 'No Visualization Yet'}
            </p>
            <p className="text-sm mt-2 text-center max-w-xs text-gray-500">
              {analysis && !hasSteps
                ? 'The AI did not return step data for this problem. Try with OpenAI configured for full visualization.'
                : 'Analyze a problem to see step-by-step algorithm visualization'}
            </p>
          </div>
        ) : (
          <VisualizationEngine
            visualizationData={vizData}
            type={vizData.type}
          />
        )}
      </div>
    </div>
  )
}

export default VisualizationPanel
