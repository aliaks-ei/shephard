import { vi, beforeEach, it, expect } from 'vitest'
import type { Session, AuthError } from '@supabase/supabase-js'
import {
  getCurrentUser,
  signInWithIdToken,
  sendOtpToEmail,
  verifyEmailOtp,
  signOutUser,
  updateUserPreferences,
  onAuthStateChange,
} from './auth'
import { supabase } from 'src/lib/supabase/client'

const createMockUser = (overrides = {}) => ({
  id: 'user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T12:00:00Z',
  ...overrides,
})

const createMockSession = (): Session => ({
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockUser(),
})

const createAuthError = (message: string): AuthError =>
  ({
    message,
    name: 'AuthApiError',
    status: 400,
  }) as AuthError

vi.mock('src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithIdToken: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

const mockSupabase = vi.mocked(supabase, true)

beforeEach(() => {
  vi.clearAllMocks()
})

it('getCurrentUser should return user when user is authenticated', async () => {
  const mockUser = createMockUser()
  const getUserSpy = vi.spyOn(mockSupabase.auth, 'getUser')
  getUserSpy.mockResolvedValue({ data: { user: mockUser }, error: null })

  const result = await getCurrentUser()

  expect(getUserSpy).toHaveBeenCalled()
  expect(result).toEqual(mockUser)
})

it('getCurrentUser should return null when no user is authenticated', async () => {
  const getUserSpy = vi.spyOn(mockSupabase.auth, 'getUser')
  getUserSpy.mockResolvedValue({ data: { user: null }, error: null } as never)

  const result = await getCurrentUser()

  expect(getUserSpy).toHaveBeenCalled()
  expect(result).toBeNull()
})

it('getCurrentUser should throw error when authentication check fails', async () => {
  const mockError = createAuthError('Failed to get current user')
  const getUserSpy = vi.spyOn(mockSupabase.auth, 'getUser')
  getUserSpy.mockResolvedValue({ data: { user: null }, error: mockError })

  await expect(getCurrentUser()).rejects.toThrow('Failed to get current user')
  expect(getUserSpy).toHaveBeenCalled()
})

it('signInWithIdToken should return auth data when successful', async () => {
  const mockUser = createMockUser()
  const mockSession = createMockSession()
  const mockAuthData = { user: mockUser, session: mockSession }

  const signInWithIdTokenSpy = vi.spyOn(mockSupabase.auth, 'signInWithIdToken')
  signInWithIdTokenSpy.mockResolvedValue({ data: mockAuthData, error: null })

  const params = { provider: 'google', token: 'token123', nonce: 'nonce123' }
  const result = await signInWithIdToken(params)

  expect(signInWithIdTokenSpy).toHaveBeenCalledWith(params)
  expect(result).toEqual(mockAuthData)
})

it('signInWithIdToken should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to sign in with ID token')
  const signInWithIdTokenSpy = vi.spyOn(mockSupabase.auth, 'signInWithIdToken')
  signInWithIdTokenSpy.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  const params = { provider: 'google', token: 'token123', nonce: 'nonce123' }

  await expect(signInWithIdToken(params)).rejects.toThrow('Failed to sign in with ID token')
  expect(signInWithIdTokenSpy).toHaveBeenCalledWith(params)
})

it('sendOtpToEmail should return data when successful', async () => {
  const mockOtpData = { user: null, session: null, messageId: 'message-id' }
  const signInWithOtpSpy = vi.spyOn(mockSupabase.auth, 'signInWithOtp')
  signInWithOtpSpy.mockResolvedValue({ data: mockOtpData, error: null })

  const email = 'test@example.com'
  const redirectTo = 'https://example.com/auth/callback'
  const result = await sendOtpToEmail(email, redirectTo)

  expect(signInWithOtpSpy).toHaveBeenCalledWith({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })
  expect(result).toEqual(mockOtpData)
})

it('sendOtpToEmail should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to send OTP')
  const signInWithOtpSpy = vi.spyOn(mockSupabase.auth, 'signInWithOtp')
  signInWithOtpSpy.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  const email = 'test@example.com'
  const redirectTo = 'https://example.com/auth/callback'
  await expect(sendOtpToEmail(email, redirectTo)).rejects.toThrow('Failed to send OTP')
  expect(signInWithOtpSpy).toHaveBeenCalledWith({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })
})

it('verifyEmailOtp should return auth data when successful', async () => {
  const mockUser = createMockUser()
  const mockSession = createMockSession()
  const mockAuthData = { user: mockUser, session: mockSession }
  const verifyOtpSpy = vi.spyOn(mockSupabase.auth, 'verifyOtp')
  verifyOtpSpy.mockResolvedValue({ data: mockAuthData, error: null })

  const email = 'test@example.com'
  const token = 'otp-token-123'
  const result = await verifyEmailOtp(email, token)

  expect(verifyOtpSpy).toHaveBeenCalledWith({
    email,
    token,
    type: 'magiclink',
  })
  expect(result).toEqual(mockAuthData)
})

it('verifyEmailOtp should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to verify OTP')
  const verifyOtpSpy = vi.spyOn(mockSupabase.auth, 'verifyOtp')
  verifyOtpSpy.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  const email = 'test@example.com'
  const token = 'otp-token-123'
  await expect(verifyEmailOtp(email, token)).rejects.toThrow('Failed to verify OTP')
  expect(verifyOtpSpy).toHaveBeenCalledWith({
    email,
    token,
    type: 'magiclink',
  })
})

it('signOutUser should complete successfully', async () => {
  const signOutSpy = vi.spyOn(mockSupabase.auth, 'signOut')
  signOutSpy.mockResolvedValue({ error: null })

  await signOutUser()

  expect(signOutSpy).toHaveBeenCalled()
})

it('signOutUser should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to sign out')
  const signOutSpy = vi.spyOn(mockSupabase.auth, 'signOut')
  signOutSpy.mockResolvedValue({ error: mockError })

  await expect(signOutUser()).rejects.toThrow('Failed to sign out')
  expect(signOutSpy).toHaveBeenCalled()
})

it('updateUserPreferences should return user data when successful', async () => {
  const mockUser = createMockUser({ email: 'updated@example.com' })
  const updateUserSpy = vi.spyOn(mockSupabase.auth, 'updateUser')
  updateUserSpy.mockResolvedValue({ data: { user: mockUser }, error: null })

  const updates = { email: 'updated@example.com', data: { name: 'Updated Name' } }
  const result = await updateUserPreferences(updates)

  expect(updateUserSpy).toHaveBeenCalledWith(updates)
  expect(result).toEqual({ user: mockUser })
})

it('updateUserPreferences should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to update user profile')
  const updateUserSpy = vi.spyOn(mockSupabase.auth, 'updateUser')
  updateUserSpy.mockResolvedValue({ data: { user: null }, error: mockError })

  const updates = { email: 'updated@example.com' }
  await expect(updateUserPreferences(updates)).rejects.toThrow('Failed to update user profile')
  expect(updateUserSpy).toHaveBeenCalledWith(updates)
})

it('onAuthStateChange should call Supabase onAuthStateChange with callback', () => {
  const mockCallback = async () => {}
  const onAuthStateChangeSpy = vi.spyOn(mockSupabase.auth, 'onAuthStateChange')
  onAuthStateChange(mockCallback)

  expect(onAuthStateChangeSpy).toHaveBeenCalledWith(mockCallback)
})
