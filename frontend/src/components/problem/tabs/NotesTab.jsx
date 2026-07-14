import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaSave, FaTrash, FaEdit } from 'react-icons/fa'
import toast from 'react-hot-toast'

function NotesTab({ problemData }) {
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Load saved notes from localStorage
    if (problemData?.title) {
      const savedNotes = localStorage.getItem(`notes_${problemData.title}`)
      if (savedNotes) {
        setNotes(savedNotes)
      }
    }
  }, [problemData])

  const handleSave = () => {
    if (!problemData?.title) return

    setIsSaving(true)
    localStorage.setItem(`notes_${problemData.title}`, notes)
    
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Notes saved!')
    }, 500)
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all notes?')) {
      setNotes('')
      if (problemData?.title) {
        localStorage.removeItem(`notes_${problemData.title}`)
      }
      toast.success('Notes cleared')
    }
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
          <FaEdit />
          Personal Notes
        </h4>
        <p className="text-sm text-gray-300">
          Write down your thoughts, approach, and key learnings. Notes are saved locally.
        </p>
      </div>

      {/* Notes Editor */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-300">Your Notes</span>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FaSave />
              {isSaving ? 'Saving...' : 'Save'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FaTrash />
              Clear
            </motion.button>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your notes here...&#10;&#10;Some ideas:&#10;- Key observations&#10;- Approach and algorithm&#10;- Time/Space complexity&#10;- Edge cases to remember&#10;- Mistakes made&#10;- Alternative solutions"
          className="w-full h-96 p-4 bg-transparent text-gray-300 text-sm leading-relaxed resize-none focus:outline-none"
        />
      </div>

      {/* Quick Templates */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
        <h4 className="text-sm font-bold text-purple-400 mb-3">📝 Quick Templates</h4>
        <div className="space-y-2">
          {[
            {
              label: 'Problem Breakdown',
              template: `# Problem Breakdown
- Input: 
- Output: 
- Constraints: 
- Pattern: 
- Key Observation: 

# Approach
1. 
2. 
3. 

# Complexity
- Time: O()
- Space: O()

# Edge Cases
- 
`,
            },
            {
              label: 'Interview Notes',
              template: `# Interview Notes
- Initial thought: 
- Clarifying questions: 
- Approach explained: 
- Optimization discussed: 
- Follow-up questions: 

# What went well:
- 

# What to improve:
- 
`,
            },
            {
              label: 'Revision Notes',
              template: `# Revision Notes
- Pattern: 
- Key Trick: 
- Time Complexity: 
- Space Complexity: 
- Similar Problems: 
- Mistakes to Avoid: 
`,
            },
          ].map((template, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setNotes(template.template)}
              className="block w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
            >
              {template.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NotesTab
