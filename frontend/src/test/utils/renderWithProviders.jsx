import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'

/**
 * Wraps the element in a MemoryRouter and disables framer-motion animations
 * so tests render synchronously and don't fight the test runner.
 *
 * Pass `route` to seed the history.
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MotionConfig reducedMotion="always" transition={{ duration: 0 }}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </MotionConfig>
  )
}

// Re-export everything from @testing-library so test files only need one import.
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
