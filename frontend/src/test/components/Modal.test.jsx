import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../utils/renderWithProviders'
import Modal from '../../components/ui/Modal'

describe('Modal', () => {
  it('does not render when isOpen=false', () => {
    renderWithProviders(
      <Modal isOpen={false} onClose={() => {}} title="Hello">
        <p>Body</p>
      </Modal>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders with role=dialog and aria-modal when open', () => {
    renderWithProviders(
      <Modal isOpen onClose={() => {}} title="Greetings">
        <p>Body content</p>
      </Modal>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Greetings')).toBeInTheDocument()
  })

  it('has an accessible close button', () => {
    renderWithProviders(
      <Modal isOpen onClose={() => {}} title="Test">
        <p>x</p>
      </Modal>
    )
    const closeBtn = screen.getByRole('button', { name: /close dialog/i })
    expect(closeBtn).toBeInTheDocument()
  })

  it('clicking the close button calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <Modal isOpen onClose={onClose} title="Test">
        <p>x</p>
      </Modal>
    )
    await user.click(screen.getByRole('button', { name: /close dialog/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('pressing Escape calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <Modal isOpen onClose={onClose} title="Test">
        <p>x</p>
      </Modal>
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the backdrop calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { container } = renderWithProviders(
      <Modal isOpen onClose={onClose} title="Test">
        <p>x</p>
      </Modal>
    )
    // backdrop is the first .fixed.inset-0 in the tree
    const backdrops = container.querySelectorAll('.fixed.inset-0')
    const backdrop = backdrops[0]
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('hides the close button when showCloseButton=false', () => {
    renderWithProviders(
      <Modal isOpen onClose={() => {}} title="Test" showCloseButton={false}>
        <p>x</p>
      </Modal>
    )
    expect(screen.queryByRole('button', { name: /close dialog/i })).toBeNull()
  })
})
