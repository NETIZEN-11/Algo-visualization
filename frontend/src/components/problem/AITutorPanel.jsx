import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBrain,
  FaCode,
  FaLightbulb,
  FaStickyNote,
  FaFlask,
  FaSpinner,
} from 'react-icons/fa'
import ExplanationTab from './tabs/ExplanationTab'
import CodeTab from './tabs/CodeTab'
import HintsTab from './tabs/HintsTab'
import NotesTab from './tabs/NotesTab'
import TestsTab from './tabs/TestsTab'

const tabs = [
  { id: 'explanation', label: 'Explanation', icon: FaBrain },
  { id: 'code', label: 'Code', icon: FaCode },
  { id: 'hints', label: 'Hints', icon: FaLightbulb },
  { id: 'notes', label: 'Notes', icon: FaStickyNote },
  { id: 'tests', label: 'Tests', icon: FaFlask },
]

function AITutorPanel({ analysis, problemData, isAnalyzing }) {
  const [activeTab, setActiveTab] = useState('explanation')

  const renderTabContent = () => {
    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <FaSpinner className="text-4xl animate-spin mb-4 text-blue-500" />
          <p className="text-sm">AI is analyzing the problem...</p>
        </div>
      )
    }

    if (!analysis) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <FaBrain className="text-6xl mb-4 text-blue-500/30" />
          <p className="text-lg font-semibold">AI Tutor Ready</p>
          <p className="text-sm mt-2 text-center max-w-md">
            Analyze a problem to get AI-powered explanations, hints, code solutions, and more
          </p>
        </div>
      )
    }

    switch (activeTab) {
      case 'explanation':
        return <ExplanationTab analysis={analysis} />
      case 'code':
        return <CodeTab analysis={analysis} />
      case 'hints':
        return <HintsTab problemData={problemData} />
      case 'notes':
        return <NotesTab problemData={problemData} />
      case 'tests':
        return <TestsTab problemData={problemData} />
      default:
        return null
    }
  }

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-140px)] flex flex-col">
      {}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4">
        <h2 className="text-lg font-bold text-white mb-3">AI Tutor</h2>

        {}
        <div className="flex gap-2 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <tab.icon className="text-sm" />
              <span className="text-sm">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AITutorPanel
