import clsx from 'clsx'
import { forwardRef } from 'react'

const Textarea = forwardRef(({ 
  label,
  error,
  helperText,
  className,
  containerClassName,
  rows = 4,
  ...props 
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'w-full bg-dark-900 border text-gray-100 rounded-lg px-4 py-2.5 transition-all duration-200 resize-y',
          'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
          'placeholder:text-gray-500',
          {
            'border-dark-700': !error,
            'border-danger-500 focus:ring-danger-500': error,
          },
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
