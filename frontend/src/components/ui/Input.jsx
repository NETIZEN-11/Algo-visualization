import clsx from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  icon: Icon,
  className,
  containerClassName,
  ...props 
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-dark-900 border text-gray-100 rounded-lg px-4 py-2.5 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
            'placeholder:text-gray-500',
            {
              'pl-10': Icon,
              'border-dark-700': !error,
              'border-danger-500 focus:ring-danger-500': error,
            },
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
