import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const Tabs = ({ children, defaultTab = 0, variant = 'default', className }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  const tabs = children.filter(child => child.type === TabsList)?.[0]
  const panels = children.filter(child => child.type === TabsPanels)?.[0]
  
  return (
    <div className={clsx('w-full', className)}>
      {tabs && (
        <div className={clsx(
          'flex space-x-1',
          variant === 'pills' ? 'bg-dark-900 p-1 rounded-lg' : 'border-b border-dark-800'
        )}>
          {tabs.props.children.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={clsx(
                'relative px-4 py-2.5 font-medium text-sm transition-all duration-200 rounded-lg',
                {
                  'text-primary-400': activeTab === index && variant === 'default',
                  'text-gray-400 hover:text-gray-200': activeTab !== index && variant === 'default',
                  'bg-dark-800 text-gray-100': activeTab === index && variant === 'pills',
                  'text-gray-400 hover:bg-dark-800/50 hover:text-gray-200': activeTab !== index && variant === 'pills',
                }
              )}
            >
              {tab.props.icon && <tab.props.icon className="inline mr-2" size={16} />}
              {tab.props.children}
              
              {activeTab === index && variant === 'default' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      )}
      
      {panels && (
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {panels.props.children[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

const TabsList = ({ children }) => <>{children}</>
const Tab = ({ children }) => <>{children}</>
const TabsPanels = ({ children }) => <>{children}</>
const TabPanel = ({ children }) => <div>{children}</div>

Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Panels = TabsPanels
Tabs.Panel = TabPanel

export default Tabs
