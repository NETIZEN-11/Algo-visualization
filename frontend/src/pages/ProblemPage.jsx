import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FaBookmark, FaCheckCircle } from 'react-icons/fa'
import { Card, Badge, Button } from '../components/ui'
import ProblemPanel from '../components/problem/ProblemPanel'
import VisualizationPanel from '../components/problem/VisualizationPanel'
import AITutorPanel from '../components/problem/AITutorPanel'
import problemService from '../services/problemService'
import toast from 'react-hot-toast'

function ProblemPage() {
  const { id } = useParams()
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visualizationStep, setVisualizationStep] = useState(0)

  useEffect(() => {
    loadProblem()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadProblem = async () => {
    setLoading(true)
    try {
      // API returns { success: true, problem: {...} }
      const data = await problemService.getProblem(id)
      setProblem(data.problem || data)
    } catch (error) {
      toast.error('Failed to load problem')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProblem = async () => {
    if (!problem) return
    try {
      await problemService.saveProblem(id)
      setProblem({ ...problem, isSaved: !problem.isSaved })
      toast.success(problem.isSaved ? 'Problem unsaved' : 'Problem saved!')
    } catch (error) {
      toast.error('Failed to save problem')
    }
  }

  const handleMarkSolved = async () => {
    if (!problem) return
    try {
      await problemService.markSolved(id)
      setProblem({ ...problem, isSolved: true })
      toast.success('Problem marked as solved! 🎉')
    } catch (error) {
      toast.error('Failed to mark as solved')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Analyzing problem...</p>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card>
          <p className="text-gray-400">Problem not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="bg-dark-900 border-b border-dark-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-100">{problem.title}</h1>
            <Badge variant={problem.difficulty.toLowerCase()}>
              {problem.difficulty}
            </Badge>
            {problem.isSolved && (
              <Badge variant="success">
                ✓ Solved
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant={problem.isSaved ? 'primary' : 'secondary'}
              size="sm"
              icon={FaBookmark}
              onClick={handleSaveProblem}
            >
              {problem.isSaved ? 'Saved' : 'Save'}
            </Button>
            {!problem.isSolved && (
              <Button
                variant="success"
                size="sm"
                icon={FaCheckCircle}
                onClick={handleMarkSolved}
              >
                Mark Solved
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4-Column Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)] p-4 overflow-hidden">
        {/* Problem Panel - 27% */}
        <div className="col-span-3 overflow-y-auto scrollbar-thin">
          <ProblemPanel problem={problem} />
        </div>

        {/* Visualization Panel - 30% */}
        <div className="col-span-4 overflow-y-auto scrollbar-thin">
          <VisualizationPanel 
            problem={problem}
            currentStep={visualizationStep}
            onStepChange={setVisualizationStep}
          />
        </div>

        {/* AI Tutor Panel - 43% (combines explanation and code) */}
        <div className="col-span-5 overflow-y-auto scrollbar-thin">
          <AITutorPanel problem={problem} />
        </div>
      </div>
    </div>
  )
}

export default ProblemPage
