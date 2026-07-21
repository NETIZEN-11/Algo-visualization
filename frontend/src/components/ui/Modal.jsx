import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'
import clsx from 'clsx'
import { useEffect, useId, useRef, useCallback } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  }

  const reduceMotion = useReducedMotion()
  const titleId = useId()
  const dialogRef = useRef(null)
  const previouslyFocused = useRef(null)

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    previouslyFocused.current = document.activeElement
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
        return
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]),' +
          'textarea:not([disabled]), button:not([disabled]), iframe, object,' +
          'embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
        )
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)

    const t = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelector(
          'a[href], button:not([disabled]), input:not([disabled]),' +
          'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        ;(focusable || dialogRef.current).focus()
      }
    }, 30)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      clearTimeout(t)

      const prev = previouslyFocused.current
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus() } catch {  }
      }
    }
  }, [isOpen, handleClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.3 }}
              className={clsx(
                'relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full my-8 outline-none',
                sizes[size],
                className
              )}
            >
              {}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                  {title && (
                    <h2 id={titleId} className="text-2xl font-bold text-gray-100">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={handleClose}
                      className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-gray-800 rounded-lg focus-visible:ring-2 focus-visible:ring-orange-500"
                      aria-label="Close dialog"
                    >
                      <FaTimes size={20} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}

              {}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

const ModalHeader = ({ children, className }) => (
  <div className={clsx('mb-4', className)}>
    {children}
  </div>
)

const ModalBody = ({ children, className }) => (
  <div className={clsx(className)}>
    {children}
  </div>
)

const ModalFooter = ({ children, className }) => (
  <div className={clsx('flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-800', className)}>
    {children}
  </div>
)

Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter

export default Modal
