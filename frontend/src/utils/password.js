const COMMON = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'letmein',
  'iloveyou', 'admin', 'welcome', 'monkey', 'dragon', 'password1',
  'qwerty123', '111111', '000000', 'login', 'starwars',
])

function classify(password) {
  if (!password) return { score: 0, feedback: { warning: 'Password is required', suggestions: ['Enter at least 8 characters.'] } }
  if (password.length < 8) {
    return { score: 0, feedback: { warning: 'Too short', suggestions: ['Use at least 8 characters.'] } }
  }
  if (COMMON.has(password.toLowerCase())) {
    return { score: 0, feedback: { warning: 'Common password', suggestions: ['Avoid common passwords.'] } }
  }
  let score = 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (Array.isArray(userInputsFakeArg) && userInputsFakeArg.some((u) => u && password.toLowerCase().includes(String(u).toLowerCase()))) {
    score = Math.max(0, score - 2)
  }
  score = Math.min(4, score)
  const suggestions = []
  if (score < 3) suggestions.push('Add a mix of letters, numbers, and symbols.')
  if (password.length < 12) suggestions.push('Lengthen to 12+ characters.')
  return { score, feedback: { warning: '', suggestions } }
}

let userInputsFakeArg = []
export function validatePasswordStrength(password, userInputs = []) {
  userInputsFakeArg = userInputs
  return classify(password)
}
