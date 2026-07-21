import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'

export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MotionConfig reducedMotion="always" transition={{ duration: 0 }}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </MotionConfig>
  )
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
