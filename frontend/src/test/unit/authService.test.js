import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the api module so the service test doesn't pull axios + the real
// interceptor stack.
vi.mock('../../services/api', () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
  return {
    default: mockApi,
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    registerAuthHandlers: vi.fn(),
  }
})

import api, { setAccessToken, clearAccessToken } from '../../services/api'
import { authService } from '../../services/authService'

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login() posts to /auth/login and stores the token', async () => {
    api.post.mockResolvedValueOnce({ data: { user: { id: 'u1' }, token: 'tok-1' } })
    const data = await authService.login({ email: 'a@b.com', password: 'pw' })
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' })
    expect(setAccessToken).toHaveBeenCalledWith('tok-1')
    expect(data.user).toEqual({ id: 'u1' })
  })

  it('register() posts to /auth/register and stores the token', async () => {
    api.post.mockResolvedValueOnce({ data: { user: { id: 'u2' }, token: 'tok-2' } })
    const data = await authService.register({ name: 'A', email: 'b', password: 'pw' })
    expect(api.post).toHaveBeenCalledWith('/auth/register', { name: 'A', email: 'b', password: 'pw' })
    expect(setAccessToken).toHaveBeenCalledWith('tok-2')
    expect(data.user.id).toBe('u2')
  })

  it('getProfile() GETs /auth/profile', async () => {
    api.get.mockResolvedValueOnce({ data: { user: { id: 'u3' } } })
    const data = await authService.getProfile()
    expect(api.get).toHaveBeenCalledWith('/auth/profile')
    expect(data.user.id).toBe('u3')
  })

  it('forgotPassword() posts the email', async () => {
    api.post.mockResolvedValueOnce({ data: { ok: true } })
    await authService.forgotPassword('a@b.com')
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.com' })
  })

  it('resetPassword() encodes the token and posts newPassword', async () => {
    api.post.mockResolvedValueOnce({ data: { ok: true } })
    await authService.resetPassword({ token: 'a/b+c', newPassword: 'newstrongPW!' })
    expect(api.post).toHaveBeenCalledWith(
      '/auth/reset-password?token=a%2Fb%2Bc',
      { newPassword: 'newstrongPW!' }
    )
  })

  it('verifyEmail() GETs the verify URL with token in query', async () => {
    api.get.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    await authService.verifyEmail('a/b+c')
    expect(api.get).toHaveBeenCalledWith('/auth/verify-email?token=a%2Fb%2Bc')
  })

  it('logout() always clears the access token, even if the API throws', async () => {
    api.post.mockRejectedValueOnce(new Error('boom'))
    await expect(authService.logout()).rejects.toThrow('boom')
    expect(clearAccessToken).toHaveBeenCalled()
  })

  it('deleteAccount() sends DELETE with password in body and clears the token', async () => {
    api.delete.mockResolvedValueOnce({ data: { ok: true } })
    await authService.deleteAccount({ password: 'pw' })
    expect(api.delete).toHaveBeenCalledWith('/auth/account', { data: { password: 'pw' } })
    expect(clearAccessToken).toHaveBeenCalled()
  })
})
