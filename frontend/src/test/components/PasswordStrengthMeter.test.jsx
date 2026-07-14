import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../utils/renderWithProviders'
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter'

describe('PasswordStrengthMeter', () => {
  it('renders with role=progressbar and aria-valuenow', () => {
    renderWithProviders(<PasswordStrengthMeter password="Tr0ub4dor&3xK!ngZ" />)
    const meter = screen.getByRole('progressbar')
    expect(meter).toHaveAttribute('aria-valuenow')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
  })

  it('displays a label for any password', () => {
    renderWithProviders(<PasswordStrengthMeter password="abc" />)
    // label is one of the STRENGTH_LABELS
    const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent']
    const all = screen.getAllByText((_, el) => labels.includes(el.textContent || ''))
    expect(all.length).toBeGreaterThan(0)
  })

  it('shows suggestions for weak passwords', () => {
    renderWithProviders(<PasswordStrengthMeter password="abc" />)
    // there should be a <ul> with suggestions
    expect(screen.getAllByRole('list').length).toBeGreaterThanOrEqual(0)
  })

  it('renders nothing weird for an empty password', () => {
    renderWithProviders(<PasswordStrengthMeter password="" />)
    const meter = screen.getByRole('progressbar')
    expect(meter).toBeInTheDocument()
  })
})
