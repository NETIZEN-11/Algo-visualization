const UNITS = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

export function msFromDuration(s) {
  if (typeof s === 'number' && Number.isFinite(s)) return s
  const str = String(s ?? '').trim()
  const m = /^(\d+)([smhd])$/.exec(str)
  if (!m) {

    const n = Number(str)
    if (Number.isFinite(n) && n > 0) return n
    return 30 * 24 * 60 * 60 * 1000
  }
  return Number(m[1]) * UNITS[m[2]]
}
