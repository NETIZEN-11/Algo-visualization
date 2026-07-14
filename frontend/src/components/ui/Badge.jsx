import clsx from 'clsx'
import { motion } from 'framer-motion'

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  icon: Icon,
  glow = false,
  className,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-full border'
  
  const variants = {
    default: 'bg-dark-800 text-gray-300 border-dark-700',
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    success: 'bg-success-500/10 text-success-400 border-success-500/20',
    warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
    danger: 'bg-danger-500/10 text-danger-400 border-danger-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    easy: 'bg-success-500/10 text-success-400 border-success-500/20',
    medium: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
    hard: 'bg-danger-500/10 text-danger-400 border-danger-500/20',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }
  
  const glowStyles = {
    primary: 'shadow-glow',
    success: 'shadow-glow-success',
    purple: 'shadow-glow-purple',
  }
  
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        glow && glowStyles[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="mr-1.5" size={14} />}
      {children}
    </motion.span>
  )
}

export default Badge
