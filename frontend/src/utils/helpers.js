export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const calculateLevel = (xp) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

export const calculateXPForNextLevel = (level) => {
  return level * level * 100
}

export const getProgressPercentage = (current, total) => {
  return Math.min(Math.round((current / total) * 100), 100)
}

export const getDifficultyColor = (difficulty) => {
  const colors = {
    Easy: 'text-green-400',
    Medium: 'text-yellow-400',
    Hard: 'text-red-400',
  }
  return colors[difficulty] || 'text-gray-400'
}

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const extractLeetCodeProblemNumber = (url) => {
  const match = url.match(/problems\/([^\/]+)/)
  return match ? match[1] : null
}

export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    return false
  }
}

export const downloadAsFile = (content, filename, contentType = 'text/plain') => {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const parseComplexity = (complexity) => {

  return complexity.replace(/O\((.*?)\)/, '<span class="font-mono">O($1)</span>')
}

export const getStreakMessage = (streak) => {
  if (streak === 0) return "Start your streak today!"
  if (streak === 1) return "Great start! Keep it up!"
  if (streak < 7) return `${streak} days streak! 🔥`
  if (streak < 30) return `${streak} days streak! You're on fire! 🔥🔥`
  return `${streak} days streak! Legendary! 🔥🔥🔥`
}

export const getReadinessLevel = (score) => {
  if (score >= 90) return { level: 'Expert', color: 'text-purple-400' }
  if (score >= 75) return { level: 'Advanced', color: 'text-blue-400' }
  if (score >= 60) return { level: 'Intermediate', color: 'text-green-400' }
  if (score >= 40) return { level: 'Beginner', color: 'text-yellow-400' }
  return { level: 'Novice', color: 'text-gray-400' }
}

export const generateAvatar = (name) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
  ]
  const index = name.charCodeAt(0) % colors.length
  return {
    color: colors[index],
    initial: name.charAt(0).toUpperCase(),
  }
}
