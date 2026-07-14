import { motion } from 'framer-motion'
import clsx from 'clsx'

const Card = ({ 
  children, 
  className,
  hover = false,
  gradient = false,
  glass = false,
  onClick,
  ...props 
}) => {
  const baseStyles = 'rounded-2xl p-6 border transition-all duration-300'
  
  const styles = clsx(
    baseStyles,
    {
      'bg-dark-900 border-dark-800 shadow-card': !gradient && !glass,
      'bg-gradient-glass backdrop-blur-xl border-white/10': glass,
      'bg-gradient-blue-purple border-transparent': gradient,
      'hover:border-primary-600 hover:shadow-card-hover cursor-pointer': hover,
      'hover:shadow-glow': hover && !gradient,
    },
    className
  )
  
  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className={styles}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
  
  return (
    <div className={styles} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

const CardHeader = ({ children, className }) => (
  <div className={clsx('mb-4', className)}>
    {children}
  </div>
)

const CardTitle = ({ children, className }) => (
  <h3 className={clsx('text-xl font-bold text-gray-100', className)}>
    {children}
  </h3>
)

const CardDescription = ({ children, className }) => (
  <p className={clsx('text-sm text-gray-400 mt-1', className)}>
    {children}
  </p>
)

const CardContent = ({ children, className }) => (
  <div className={clsx(className)}>
    {children}
  </div>
)

const CardFooter = ({ children, className }) => (
  <div className={clsx('mt-4 pt-4 border-t border-dark-800', className)}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
