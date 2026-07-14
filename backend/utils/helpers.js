/**
 * General utilities.
 *
 * Level math lives in `utils/leveling.js`. Date helpers here.
 */

export const extractLeetCodeSlug = (url) => {
  const match = url.match(/problems\/([^/]+)/)
  return match ? match[1] : null
}

export const sanitizeInput = (input) => {
  return String(input ?? '').trim().replace(/[<>]/g, '')
}

export const generateProblemId = () => {
  return `prob_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0]
}

export const isToday = (date) => {
  const today = new Date()
  const compareDate = new Date(date)
  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  )
}

export const paginateResults = (results, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  return {
    data: results.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(results.length / limit),
      totalItems: results.length,
      hasNext: endIndex < results.length,
      hasPrev: startIndex > 0,
    },
  }
}
