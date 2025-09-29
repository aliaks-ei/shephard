import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import { useAuthStore } from './auth'
import { usePreferencesStore } from './preferences'
import { useNonce } from 'src/composables/useNonce'
import { useError } from 'src/composables/useError'
import * as authApi from 'src/api/auth'
import type { Session } from 'src/api/auth'
import type { User } from 'src/api/user'
import type { GoogleSignInResponse } from 'src/types'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import type { NonceData } from 'src/utils/nonce'
import { setupTestingPinia } from 'test/helpers/pinia-mocks'
import { createTestingPinia } from '@pinia/testing'

vi.mock('src/composables/useNonce', () => ({
  useNonce: vi.fn(),
}))

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

vi.mock('src/api/auth', () => ({
  signInWithIdToken: vi.fn(),
  sendOtpToEmail: vi.fn(),
  verifyEmailOtp: vi.fn(),
  signOutUser: vi.fn(),
  updateUserPreferences: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('./preferences', () => ({
  usePreferencesStore: vi.fn(),
}))

describe('Auth Store', () => {
  const mockCurrentNonce = ref<NonceData>({
    nonce: 'test-nonce',
    createdAt: Date.now(),
    hashedNonce: 'hashed-test-nonce',
  })
  const mockHandleError = vi.fn()
  const mockPreferencesLoadPreferences = vi.fn()
  const mockPreferencesReset = vi.fn()

  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useNonce).mockReturnValue({
      currentNonce: mockCurrentNonce,
      hashedNonce: ref('hashed-nonce'),
      isNonceReady: computed(() => true),
      generateNonce: vi.fn().mockResolvedValue('test-nonce'),
      resetNonce: vi.fn(),
      ensureFreshNonce: vi.fn().mockResolvedValue({
        nonce: 'test-nonce',
        createdAt: Date.now(),
        hashedNonce: 'hashed-test-nonce',
      }),
    })

    vi.mocked(useError).mockReturnValue({
      handleError: mockHandleError,
    })

    vi.mocked(usePreferencesStore).mockReturnValue({
      loadPreferences: mockPreferencesLoadPreferences,
      reset: mockPreferencesReset,
    } as unknown as ReturnType<typeof usePreferencesStore>)

    setupTestingPinia({
      stubActions: false,
    })

    authStore = useAuthStore()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
      expect(authStore.isLoading).toBe(true)
      expect(authStore.isEmailSent).toBe(false)
      expect(authStore.emailError).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('signInWithGoogle()', () => {
    it('should sign in successfully with Google', async () => {
      const mockResponse = {
        credential: 'test-credential',
        select_by: 'user',
      } as GoogleSignInResponse

      const mockUser = { id: 'google-user' } as User
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session

      const mockSignInResult = {
        user: mockUser,
        session: mockSession,
      }

      vi.mocked(authApi.signInWithIdToken).mockResolvedValue(mockSignInResult)

      const result = await authStore.signInWithGoogle(mockResponse)

      expect(authApi.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'test-credential',
        nonce: 'test-nonce',
      })
      expect(result).toEqual(mockSignInResult)
    })

    it('should handle missing nonce error', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useNonce).mockReturnValueOnce({
        currentNonce: ref(null),
        hashedNonce: ref(''),
        isNonceReady: computed(() => false),
        generateNonce: vi.fn(),
        resetNonce: vi.fn(),
        ensureFreshNonce: vi.fn(),
      })

      const testAuthStore = useAuthStore()

      const mockResponse = {
        credential: 'test-credential',
        select_by: 'user',
      } as GoogleSignInResponse

      await testAuthStore.signInWithGoogle(mockResponse)

      expect(authApi.signInWithIdToken).not.toHaveBeenCalled()
      expect(mockHandleError).toHaveBeenCalledWith('AUTH.GOOGLE_SIGNIN_NO_NONCE', expect.any(Error))
    })

    it('should handle sign-in error', async () => {
      const mockResponse = {
        credential: 'test-credential',
        select_by: 'user',
      } as GoogleSignInResponse

      const mockError = new Error('Sign in failed')

      vi.mocked(useNonce).mockReturnValueOnce({
        currentNonce: mockCurrentNonce,
        hashedNonce: ref('hashed-nonce'),
        isNonceReady: computed(() => true),
        generateNonce: vi.fn(),
        resetNonce: vi.fn(),
        ensureFreshNonce: vi.fn(),
      })

      vi.mocked(authApi.signInWithIdToken).mockRejectedValueOnce(mockError)

      const testAuthStore = useAuthStore()

      await testAuthStore.signInWithGoogle(mockResponse)

      expect(mockHandleError).toHaveBeenCalledWith('AUTH.GOOGLE_SIGNIN_FAILED', mockError)
    })
  })

  describe('signInWithOtp()', () => {
    it('should send OTP successfully', async () => {
      const mockEmail = 'test@example.com'
      const mockResult = {
        user: null,
        session: null,
        messageId: 'test-message-id',
      }

      vi.mocked(authApi.sendOtpToEmail).mockResolvedValue(mockResult)

      const result = await authStore.signInWithOtp(mockEmail)

      expect(authApi.sendOtpToEmail).toHaveBeenCalledWith(
        mockEmail,
        `${window.location.origin}/auth/callback`,
      )
      expect(authStore.isEmailSent).toBe(true)
      expect(authStore.emailError).toBeNull()
      expect(result).toEqual(mockResult)
    })

    it('should handle OTP send error', async () => {
      const mockEmail = 'test@example.com'
      const mockError = new Error('Failed to send OTP')

      vi.mocked(authApi.sendOtpToEmail).mockRejectedValue(mockError)

      await authStore.signInWithOtp(mockEmail)

      expect(authStore.isEmailSent).toBe(false)
      expect(authStore.emailError).toBe('Failed to send OTP')
      expect(mockHandleError).toHaveBeenCalledWith('AUTH.OTP_SEND_FAILED', mockError, {
        action: 'sending OTP',
      })
    })
  })

  describe('verifyOtp()', () => {
    it('should verify OTP successfully', async () => {
      const mockEmail = 'test@example.com'
      const mockToken = 'test-token'
      const mockUser = { id: 'otp-user' } as User
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session

      const mockResult = {
        user: mockUser,
        session: mockSession,
      }

      vi.mocked(authApi.verifyEmailOtp).mockResolvedValue(mockResult)

      const result = await authStore.verifyOtp(mockEmail, mockToken)

      expect(authApi.verifyEmailOtp).toHaveBeenCalledWith(mockEmail, mockToken)
      expect(result).toEqual(mockResult)
    })

    it('should handle OTP verification error', async () => {
      const mockEmail = 'test@example.com'
      const mockToken = 'test-token'
      const mockError = new Error('Failed to verify OTP')

      vi.mocked(authApi.verifyEmailOtp).mockRejectedValue(mockError)

      await authStore.verifyOtp(mockEmail, mockToken)

      expect(mockHandleError).toHaveBeenCalledWith('AUTH.OTP_VERIFY_FAILED', mockError, {
        action: 'verifying OTP',
      })
    })
  })

  describe('signOut()', () => {
    it('should sign out successfully', async () => {
      authStore.user = { id: 'test-user' } as User
      authStore.session = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session

      vi.mocked(authApi.signOutUser).mockResolvedValue(undefined)

      await authStore.signOut()

      expect(authApi.signOutUser).toHaveBeenCalled()
      expect(authStore.user).toBeNull()
      expect(authStore.session).toBeNull()
      expect(mockPreferencesReset).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      authStore.user = { id: 'test-user' } as User

      const mockError = new Error('Failed to sign out')
      vi.mocked(authApi.signOutUser).mockRejectedValue(mockError)

      await authStore.signOut()

      expect(mockHandleError).toHaveBeenCalledWith('AUTH.SIGNOUT_FAILED', mockError, {
        userId: 'test-user',
      })
    })
  })

  describe('updateProfile()', () => {
    it('should update profile successfully', async () => {
      const mockUpdates = { email: 'new@example.com' }
      const mockResult = { user: { id: 'test-user', email: 'new@example.com' } as User }

      vi.mocked(authApi.updateUserPreferences).mockResolvedValue(mockResult)

      const result = await authStore.updateProfile(mockUpdates)

      expect(authApi.updateUserPreferences).toHaveBeenCalledWith(mockUpdates)
      expect(authStore.user).toEqual(mockResult.user)
      expect(result).toEqual(mockResult)
    })

    it('should handle update profile error', async () => {
      authStore.user = { id: 'test-user' } as User

      const mockUpdates = { email: 'new@example.com' }
      const mockError = new Error('Failed to update profile')

      vi.mocked(authApi.updateUserPreferences).mockRejectedValue(mockError)

      await authStore.updateProfile(mockUpdates)

      expect(mockHandleError).toHaveBeenCalledWith('AUTH.PROFILE_UPDATE_FAILED', mockError, {
        userId: 'test-user',
      })
    })
  })

  describe('resetEmailState()', () => {
    it('should reset email state', () => {
      authStore.isEmailSent = true
      authStore.emailError = 'Some error'

      authStore.resetEmailState()

      expect(authStore.isEmailSent).toBe(false)
      expect(authStore.emailError).toBeNull()
    })
  })

  describe('onAuthStateChange', () => {
    it('should update user and session on auth state change', () => {
      let callbackFunction: (event: AuthChangeEvent, session: Session | null) => void = vi.fn()

      vi.mocked(authApi.onAuthStateChange).mockImplementation((callback) => {
        callbackFunction = callback as unknown as typeof callbackFunction
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      useAuthStore()

      expect(authApi.onAuthStateChange).toHaveBeenCalled()

      mockPreferencesLoadPreferences.mockClear()

      const mockUser = { id: 'new-user-id', email: 'new@example.com' } as User
      const mockSession = {
        user: mockUser,
        access_token: 'new-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session

      callbackFunction('SIGNED_IN', mockSession)

      expect(mockPreferencesLoadPreferences).toHaveBeenCalled()
    })

    it('should not reload preferences if same user signs in', () => {
      let callbackFunction: (event: AuthChangeEvent, session: Session | null) => void = vi.fn()

      vi.mocked(authApi.onAuthStateChange).mockImplementation((callback) => {
        callbackFunction = callback as unknown as typeof callbackFunction
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
        initialState: {
          auth: {
            user: { id: 'existing-user-id' } as User,
          },
        },
      })

      useAuthStore()

      mockPreferencesLoadPreferences.mockClear()

      const mockUser = { id: 'existing-user-id', email: 'existing@example.com' } as User
      const mockSession = {
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session

      callbackFunction('SIGNED_IN', mockSession)

      expect(mockPreferencesLoadPreferences).not.toHaveBeenCalled()
    })

    it('should clear user and session when signed out', () => {
      let callbackFunction: (event: AuthChangeEvent, session: Session | null) => void = vi.fn()

      vi.mocked(authApi.onAuthStateChange).mockImplementation((callback) => {
        callbackFunction = callback as unknown as typeof callbackFunction
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
        initialState: {
          auth: {
            user: { id: 'existing-user-id' } as User,
            session: {
              access_token: 'token',
              refresh_token: 'refresh-token',
              expires_in: 3600,
              token_type: 'bearer',
            } as Session,
          },
        },
      })

      const store = useAuthStore()

      callbackFunction('SIGNED_OUT', null)

      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
    })
  })
})
