import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  registerAuthHandlers: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  authService: {
    getProfile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    deleteAccount: vi.fn(),
  },
}))

import useAuthStore from '../../store/useAuthStore'
import { authService } from '../../services/authService'

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rehydrated: false,
    })
    localStorage.clear()
  })

  it('starts in unauthenticated state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('rehydrate() marks rehydrated=true after success', async () => {
    authService.getProfile.mockResolvedValueOnce({ user: { id: 'u1', name: 'Test' } })
    await useAuthStore.getState().rehydrate()
    const state = useAuthStore.getState()
    expect(state.rehydrated).toBe(true)
    expect(state.user).toEqual({ id: 'u1', name: 'Test' })
    expect(state.isAuthenticated).toBe(true)
  })

  it('rehydrate() clears state on failure', async () => {
    authService.getProfile.mockRejectedValueOnce(new Error('401'))
    await useAuthStore.getState().rehydrate()
    const state = useAuthStore.getState()
    expect(state.rehydrated).toBe(true)
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('rehydrate() is idempotent', async () => {
    authService.getProfile.mockResolvedValue({ user: { id: 'u1' } })
    await useAuthStore.getState().rehydrate()

    await useAuthStore.getState().rehydrate()
    expect(authService.getProfile).toHaveBeenCalledTimes(1)
  })

  it('login() success populates user + authenticated', async () => {
    authService.login.mockResolvedValueOnce({ user: { id: 'u1', name: 'Alice' }, token: 't1' })
    const result = await useAuthStore.getState().login('a@b.com', 'pw')
    expect(result).toEqual({ success: true })
    const state = useAuthStore.getState()
    expect(state.user).toEqual({ id: 'u1', name: 'Alice' })
    expect(state.isAuthenticated).toBe(true)
  })

  it('login() failure returns error and stays unauthenticated', async () => {
    const err = new Error('bad creds')
    err.response = { data: { message: 'Invalid credentials' } }
    authService.login.mockRejectedValueOnce(err)
    const result = await useAuthStore.getState().login('a@b.com', 'wrong')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid credentials')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('updateUser() merges with existing user', () => {
    useAuthStore.setState({ user: { id: 'u1', name: 'Old' } })
    useAuthStore.getState().updateUser({ name: 'New', xp: 100 })
    expect(useAuthStore.getState().user).toEqual({ id: 'u1', name: 'New', xp: 100 })
  })

  it('logout() clears user and auth state', async () => {
    useAuthStore.setState({ user: { id: 'u1' }, isAuthenticated: true })
    await useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('deleteAccount() clears state even if the API call fails', async () => {
    useAuthStore.setState({ user: { id: 'u1' }, isAuthenticated: true })
    authService.deleteAccount.mockRejectedValueOnce(new Error('boom'))
    await useAuthStore.getState().deleteAccount('pw')
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
