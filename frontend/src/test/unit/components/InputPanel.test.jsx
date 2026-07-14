import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import InputPanel from '../../../components/visualization/InputPanel'

describe('InputPanel', () => {
  const presets = {
    Standard: { input: [5, 3, 1, 4, 2], label: 'Standard' },
    Reversed: { input: [9, 8, 7, 6, 5], label: 'Reverse Sorted' },
  }

  it('shows preset tabs', () => {
    render(<InputPanel presets={presets} onRun={() => {}} />)
    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Reverse Sorted')).toBeInTheDocument()
  })

  it('parses custom `arr=[1, 2, 3]` and calls onRun on submit', () => {
    const onRun = vi.fn()
    render(<InputPanel presets={presets} onRun={onRun} />)
    const input = screen.getByPlaceholderText(/arr=/)
    fireEvent.change(input, { target: { value: 'arr=[7, 1, 5, 3]' } })
    const runBtn = screen.getByText(/Run/i)
    fireEvent.click(runBtn)
    expect(onRun).toHaveBeenCalled()
    const arg = onRun.mock.calls[0][0]
    // `arg` may be the array directly or wrapped in {array, ...}
    const arr = Array.isArray(arg) ? arg : arg.array
    expect(arr).toEqual([7, 1, 5, 3])
  })

  it('parses multiple key=value pairs separated by commas', () => {
    const onRun = vi.fn()
    render(<InputPanel presets={presets} onRun={onRun} customHint="arr=[...], target=N" />)
    const input = screen.getByPlaceholderText(/arr=/)
    fireEvent.change(input, { target: { value: 'arr=[1, 3, 5, 7, 9], target=7' } })
    fireEvent.click(screen.getByText(/Run/i))
    expect(onRun).toHaveBeenCalled()
    const arg = onRun.mock.calls[0][0]
    expect(arg.array ?? arg).toEqual([1, 3, 5, 7, 9])
    expect(arg.target).toBe(7)
  })

  it('parses key=value with a comma inside array brackets', () => {
    const onRun = vi.fn()
    render(<InputPanel presets={presets} onRun={onRun} />)
    const input = screen.getByPlaceholderText(/arr=/)
    fireEvent.change(input, { target: { value: 'arr=[10, 20, 30, 40]' } })
    fireEvent.click(screen.getByText(/Run/i))
    const arg = onRun.mock.calls[0][0]
    const arr = Array.isArray(arg) ? arg : arg.array
    expect(arr).toEqual([10, 20, 30, 40])
  })

  it('shows an error for malformed input (no = sign)', () => {
    const onRun = vi.fn()
    render(<InputPanel presets={presets} onRun={onRun} />)
    const input = screen.getByPlaceholderText(/arr=/)
    fireEvent.change(input, { target: { value: 'no_equals_sign' } })
    fireEvent.click(screen.getByText(/Run/i))
    waitFor(() => {
      expect(screen.getByText(/Invalid input|Expected key=value/)).toBeInTheDocument()
    })
    expect(onRun).not.toHaveBeenCalled()
  })

  it('selecting a preset fires onRun with that preset input', () => {
    const onRun = vi.fn()
    render(<InputPanel presets={presets} defaultPreset="Standard" onRun={onRun} />)
    fireEvent.click(screen.getByText('Reverse Sorted'))
    expect(onRun).toHaveBeenCalled()
    const arg = onRun.mock.calls[0][0]
    const arr = Array.isArray(arg) ? arg : arg.array
    expect(arr).toEqual([9, 8, 7, 6, 5])
  })
})
