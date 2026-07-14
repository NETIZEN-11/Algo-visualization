import { useState } from 'react'
import { motion } from 'framer-motion'
import ProblemInputPanel from '../components/problem/ProblemInputPanel'
import ProblemDetailsPanel from '../components/problem/ProblemDetailsPanel'
import VisualizationPanel from '../components/problem/VisualizationPanel'
import AITutorPanel from '../components/problem/AITutorPanel'

function ProblemSolverPage() {
  const [problemData, setProblemData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleProblemAnalyzed = (data, analysisData) => {
    setProblemData(data)
    setAnalysis(analysisData)
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Problem Solver
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Paste any LeetCode problem and get AI-powered deep analysis with visualization
          </p>
        </div>
      </motion.div>

      {/* Main 4-Column Layout */}
      <div className="grid grid-cols-12 gap-6 p-6">
        {/* Column 1: Problem Input & Details (27% ~ 3.24 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 lg:col-span-3 space-y-6"
        >
          {!problemData ? (
            <ProblemInputPanel
              onProblemAnalyzed={handleProblemAnalyzed}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          ) : (
            <ProblemDetailsPanel
              problemData={problemData}
              onReset={() => {
                setProblemData(null)
                setAnalysis(null)
              }}
            />
          )}
        </motion.div>

        {/* Column 2: Visualization (30% ~ 3.6 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-4"
        >
          <VisualizationPanel analysis={analysis} isAnalyzing={isAnalyzing} />
        </motion.div>

        {/* Column 3: AI Tutor (25% ~ 3 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-12 lg:col-span-5"
        >
          <AITutorPanel
            analysis={analysis}
            problemData={problemData}
            isAnalyzing={isAnalyzing}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default ProblemSolverPage
