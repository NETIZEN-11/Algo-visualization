import ProblemDetailsPanel from './ProblemDetailsPanel'

// Simple wrapper component for backward compatibility
function ProblemPanel({ problem }) {
  return <ProblemDetailsPanel problem={problem} />
}

export default ProblemPanel
