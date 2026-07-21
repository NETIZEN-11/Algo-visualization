import { useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { FaBookmark, FaCheckCircle } from 'react-icons/fa'
import { Card, Badge, Button } from '../components/ui'
import ProblemPanel from '../components/problem/ProblemPanel'
import VisualizationPanel from '../components/problem/VisualizationPanel'
import AITutorPanel from '../components/problem/AITutorPanel'
import problemService from '../services/problemService'
import useAuthStore from '../store/useAuthStore'
import toast from 'react-hot-toast'

function ProblemPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSolved, setIsSolved] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [visualizationStep, setVisualizationStep] = useState(0)

  const loadProblem = useCallback(async () => {
    setLoading(true)
    try {
      const data = await problemService.getProblem(id)
      const p = data.problem || data
      setProblem(p)
      // Server now returns `userSolved`; fall back to the user's local
      // solvedProblems list if not.
      const solvedFromServer = p.userSolved
      const solvedFromUser = user?.solvedProblems?.some(
        (pid) => String(pid) === String(p._id)
      )
      setIsSolved(Boolean(solvedFromServer ?? solvedFromUser))
      setIsSaved(Boolean(p.isSaved))
    } catch (error) {
      toast.error('Failed to load problem')
      // eslint-disable-next-line no-console
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => { loadProblem() }, [loadProblem])

  const handleSaveProblem = async () => {
    if (!problem || busy) return
    setBusy(true)
    const wasSaved = isSaved
    // Optimistic update
    setIsSaved(!wasSaved)
    try {
      if (wasSaved) {
        await problemService.unsaveProblem(id)
        toast.success('Removed from saved')
      } else {
        await problemService.saveProblem(id)
        toast.success('Problem saved!')
      }
    } catch {
      // Roll back on failure
      setIsSaved(wasSaved)
      toast.error('Failed to update saved problems')
    } finally {
      setBusy(false)
    }
  }

  const handleMarkSolved = async () => {
    if (!problem || busy || isSolved) return
    setBusy(true)
    try {
      const result = await problemService.markSolved(id)
      setIsSolved(true)
      toast.success(`Problem marked as solved! +${result.xpEarned || 0} XP 🎉`)
    } catch {
      toast.error('Failed to mark as solved')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
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
            <Badge variant={String(problem.difficulty || 'medium').toLowerCase()}>
              {problem.difficulty}
            </Badge>
            {isSolved && (
              <Badge variant="success">✓ Solved</Badge>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant={isSaved ? 'primary' : 'secondary'}
              size="sm"
              icon={FaBookmark}
              onClick={handleSaveProblem}
              disabled={busy}
            >
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            {!isSolved && (
              <Button
                variant="success"
                size="sm"
                icon={FaCheckCircle}
                onClick={handleMarkSolved}
                disabled={busy}
              >
                Mark Solved
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4-Column Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)] p-4 overflow-hidden">
        {/* Problem Panel - 25% */}
        <div className="col-span-3 overflow-y-auto scrollbar-thin">
          <ProblemPanel problem={problem} />
        </div>

        {/* Visualization Panel - 33% */}
        <div className="col-span-4 overflow-y-auto scrollbar-thin">
          <VisualizationPanel
            problem={problem}
            currentStep={visualizationStep}
            onStepChange={setVisualizationStep}
          />
        </div>

        {/* AI Tutor Panel - 42% (combines explanation and code) */}
        <div className="col-span-5 overflow-y-auto scrollbar-thin">
          <AITutorPanel problem={problem} />
        </div>
      </div>
    </div>
  )
}

export default ProblemPage
