import { vi, beforeEach, it, expect } from 'vitest'
import {
  getCurrentSession,
  signInWithIdToken,
  sendOtpToEmail,
  verifyEmailOtp,
  signOutUser,
  updateUserPreferences,
  onAuthStateChange,
} from './auth'
import type { Session, AuthError, User } from '@supabase/supabase-js'

// Helper function to create a mock AuthError
const createAuthError = (message: string): AuthError =>
  ({
    name: 'AuthApiError',
    message,
    status: 400,
    code: 'invalid_request',
  }) as unknown as AuthError

// Mock the Supabase client
vi.mock('src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithIdToken: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

// Import the mocked client
import { supabase } from 'src/lib/supabase/client'

// Type helper for mocking
const mockSupabase = vi.mocked(supabase, true)

beforeEach(() => {
  vi.clearAllMocks()
})

// getCurrentSession tests
it('getCurrentSession should return session when successful', async () => {
  const mockSession: Session = {
    access_token: 'token',
    refresh_token: 'refresh',
    expires_in: 3600,
  } as Session
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

  const getSessionSpy = vi.spyOn(mockSupabase.auth, 'getSession')
  const result = await getCurrentSession()

  expect(getSessionSpy).toHaveBeenCalled()
  expect(result).toEqual(mockSession)
})

it('getCurrentSession should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to get session')
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: mockError })

  const getSessionSpy = vi.spyOn(mockSupabase.auth, 'getSession')
  await expect(getCurrentSession()).rejects.toThrow('Failed to get session')
  expect(getSessionSpy).toHaveBeenCalled()
})

// signInWithIdToken tests
it('signInWithIdToken should return auth data when successful', async () => {
  const mockUser = { id: 'user-id' } as User
  const mockSession = { access_token: 'token' } as Session
  const mockAuthData = { user: mockUser, session: mockSession }
  mockSupabase.auth.signInWithIdToken.mockResolvedValue({ data: mockAuthData, error: null })

  const params = { provider: 'google', token: 'token123', nonce: 'nonce123' }
  const signInWithIdTokenSpy = vi.spyOn(mockSupabase.auth, 'signInWithIdToken')
  const result = await signInWithIdToken(params)

  expect(signInWithIdTokenSpy).toHaveBeenCalledWith(params)
  expect(result).toEqual(mockAuthData)
})

it('signInWithIdToken should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to sign in with ID token')
  mockSupabase.auth.signInWithIdToken.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  const params = { provider: 'google', token: 'token123', nonce: 'nonce123' }
  const signInWithIdTokenSpy = vi.spyOn(mockSupabase.auth, 'signInWithIdToken')
  await expect(signInWithIdToken(params)).rejects.toThrow('Failed to sign in with ID token')
  expect(signInWithIdTokenSpy).toHaveBeenCalledWith(params)
})

// sendOtpToEmail tests
it('sendOtpToEmail should return data when successful', async () => {
  const mockOtpData = { user: null, session: null, messageId: 'message-id' }
  mockSupabase.auth.signInWithOtp.mockResolvedValue({ data: mockOtpData, error: null })

  const email = 'test@example.com'
  const redirectTo = 'https://example.com/auth/callback'
  const signInWithOtpSpy = vi.spyOn(mockSupabase.auth, 'signInWithOtp')
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
  mockSupabase.auth.signInWithOtp.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  const email = 'test@example.com'
  const redirectTo = 'https://example.com/auth/callback'
  const signInWithOtpSpy = vi.spyOn(mockSupabase.auth, 'signInWithOtp')
  await expect(sendOtpToEmail(email, redirectTo)).rejects.toThrow('Failed to send OTP')
  expect(signInWithOtpSpy).toHaveBeenCalledWith({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })
})

// verifyEmailOtp tests
it('verifyEmailOtp should return auth data when successful', async () => {
  const mockUser = { id: 'user-id' } as User
  const mockSession = { access_token: 'token' } as Session
  const mockAuthData = { user: mockUser, session: mockSession }
  mockSupabase.auth.verifyOtp.mockResolvedValue({ data: mockAuthData, error: null })

  const email = 'test@example.com'
  const token = 'otp-token-123'
  const verifyOtpSpy = vi.spyOn(mockSupabase.auth, 'verifyOtp')
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
  mockSupabase.auth.verifyOtp.mockResolvedValue({
    data: { user: null, session: null },
    error: mockError,
  })

  const email = 'test@example.com'
  const token = 'otp-token-123'
  const verifyOtpSpy = vi.spyOn(mockSupabase.auth, 'verifyOtp')
  await expect(verifyEmailOtp(email, token)).rejects.toThrow('Failed to verify OTP')
  expect(verifyOtpSpy).toHaveBeenCalledWith({
    email,
    token,
    type: 'magiclink',
  })
})

// signOutUser tests
it('signOutUser should complete successfully', async () => {
  mockSupabase.auth.signOut.mockResolvedValue({ error: null })

  const signOutSpy = vi.spyOn(mockSupabase.auth, 'signOut')
  await signOutUser()

  expect(signOutSpy).toHaveBeenCalled()
})

it('signOutUser should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to sign out')
  mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

  const signOutSpy = vi.spyOn(mockSupabase.auth, 'signOut')
  await expect(signOutUser()).rejects.toThrow('Failed to sign out')
  expect(signOutSpy).toHaveBeenCalled()
})

// updateUserPreferences tests
it('updateUserPreferences should return user data when successful', async () => {
  const mockUser = { id: 'user-id', email: 'updated@example.com' } as User
  mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: mockUser }, error: null })

  const updates = { email: 'updated@example.com', data: { name: 'Updated Name' } }
  const updateUserSpy = vi.spyOn(mockSupabase.auth, 'updateUser')
  const result = await updateUserPreferences(updates)

  expect(updateUserSpy).toHaveBeenCalledWith(updates)
  expect(result).toEqual({ user: mockUser })
})

it('updateUserPreferences should throw error when unsuccessful', async () => {
  const mockError = createAuthError('Failed to update user profile')
  mockSupabase.auth.updateUser.mockResolvedValue({ data: { user: null }, error: mockError })

  const updates = { email: 'updated@example.com' }
  const updateUserSpy = vi.spyOn(mockSupabase.auth, 'updateUser')
  await expect(updateUserPreferences(updates)).rejects.toThrow('Failed to update user profile')
  expect(updateUserSpy).toHaveBeenCalledWith(updates)
})

// onAuthStateChange tests
it('onAuthStateChange should call Supabase onAuthStateChange with callback', () => {
  const mockCallback = async () => {}
  const onAuthStateChangeSpy = vi.spyOn(mockSupabase.auth, 'onAuthStateChange')
  onAuthStateChange(mockCallback)

  expect(onAuthStateChangeSpy).toHaveBeenCalledWith(mockCallback)
})
