import {
  generateState,
  getAuthorizationUrl,
  normalizeProfile,
  isSupportedProvider,
  getProviderConfig,
} from '../../services/oauthService.js'

beforeAll(() => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_xxxxxxxxxx'
  process.env.GOOGLE_CLIENT_ID = 'g-client-id-123'
  process.env.GOOGLE_CLIENT_SECRET = 'g-client-secret-456'
  process.env.GITHUB_CLIENT_ID = 'gh-client-id-789'
  process.env.GITHUB_CLIENT_SECRET = 'gh-client-secret-012'
  process.env.OAUTH_REDIRECT_BASE = 'http://localhost:5000'
})

describe('oauthService', () => {
  describe('isSupportedProvider', () => {
    test('accepts google and github', () => {
      expect(isSupportedProvider('google')).toBe(true)
      expect(isSupportedProvider('github')).toBe(true)
    })
    test('rejects unknowns', () => {
      expect(isSupportedProvider('facebook')).toBe(false)
      expect(isSupportedProvider('twitter')).toBe(false)
      expect(isSupportedProvider('')).toBe(false)
    })
  })

  describe('getProviderConfig', () => {
    test('returns config for known providers', () => {
      expect(getProviderConfig('google').tokenUrl).toBe('https://oauth2.googleapis.com/token')
      expect(getProviderConfig('github').tokenUrl).toBe('https://github.com/login/oauth/access_token')
    })
    test('throws for unknown provider', () => {
      expect(() => getProviderConfig('facebook')).toThrow(/Unsupported OAuth provider/)
    })
  })

  describe('generateState', () => {
    test('returns a non-empty string', () => {
      const s = generateState()
      expect(typeof s).toBe('string')
      expect(s.length).toBeGreaterThan(20)
    })
    test('produces different output on every call', () => {
      const states = new Set(Array.from({ length: 10 }, generateState))
      expect(states.size).toBe(10)
    })
    test('output is base64url (no +, /, or =)', () => {
      const s = generateState()
      expect(s).not.toMatch(/[+/=]/)
    })
  })

  describe('getAuthorizationUrl', () => {
    test('builds a Google auth URL with state + client_id + redirect_uri', () => {
      const url = getAuthorizationUrl('google', { state: 'abc' })
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth')
      expect(url).toContain('client_id=g-client-id-123')
      expect(url).toContain('state=abc')
      expect(url).toContain('redirect_uri=')
      expect(url).toContain(encodeURIComponent('/api/auth/oauth/google/callback'))
    })
    test('builds a GitHub auth URL with the user:email scope', () => {
      const url = getAuthorizationUrl('github', { state: 'xyz' })
      expect(url).toContain('https://github.com/login/oauth/authorize')
      expect(url).toContain('client_id=gh-client-id-789')
      expect(url).toContain('state=xyz')
      expect(url).toContain('scope=')
      expect(url).toContain(encodeURIComponent('user:email'))
    })
    test('throws a clear 500 when client ID is missing', () => {
      const saved = process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_ID
      try {
        expect(() => getAuthorizationUrl('google', { state: 'a' })).toThrow(/not configured/)
      } finally {
        process.env.GOOGLE_CLIENT_ID = saved
      }
    })
    test('throws on unknown provider', () => {
      expect(() => getAuthorizationUrl('facebook', { state: 'a' })).toThrow(/Unsupported/)
    })
  })

  describe('normalizeProfile', () => {
    test('maps a Google userinfo payload to the common shape', () => {
      const p = normalizeProfile('google', {
        id: '108123456789012345678',
        email: 'Alice@Gmail.com',
        name: 'Alice Example',
        picture: 'https://example.com/a.png',
      })
      expect(p).toEqual({
        provider: 'google',
        providerId: '108123456789012345678',
        email: 'alice@gmail.com',
        name: 'Alice Example',
        avatar: 'https://example.com/a.png',
      })
    })
    test('falls back to `sub` when `id` is missing on Google', () => {
      const p = normalizeProfile('google', { sub: '42', email: 'a@b.co' })
      expect(p.providerId).toBe('42')
    })
    test('maps a GitHub /user payload to the common shape', () => {
      const p = normalizeProfile('github', {
        id: 12345,
        login: 'octocat',
        name: 'Mona Octocat',
        email: 'octo@github.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345',
      })
      expect(p).toEqual({
        provider: 'github',
        providerId: '12345',
        email: 'octo@github.com',
        name: 'Mona Octocat',
        avatar: 'https://avatars.githubusercontent.com/u/12345',
      })
    })
    test('falls back to login when name is missing on GitHub', () => {
      const p = normalizeProfile('github', { id: 1, login: 'octocat', email: 'o@x.co' })
      expect(p.name).toBe('octocat')
    })
    test('returns null email when provider omits it', () => {
      const p = normalizeProfile('github', { id: 1, login: 'octo' })
      expect(p.email).toBeNull()
    })
    test('throws on unknown provider', () => {
      expect(() => normalizeProfile('facebook', {})).toThrow(/unsupported provider/i)
    })
  })
})
