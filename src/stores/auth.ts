import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { useNonce } from 'src/composables/useNonce'
import { useError } from 'src/composables/useError'
import {
  getCurrentSession,
  signInWithIdToken,
  sendOtpToEmail,
  verifyEmailOtp,
  signOutUser,
  updateUserPreferences,
  onAuthStateChange,
} from 'src/api/auth'
import { usePreferencesStore } from './preferences'
import type { Session } from 'src/api/auth'
import type { User } from 'src/api/user'
import type { GoogleSignInResponse } from 'src/types'

export const useAuthStore = defineStore('auth', () => {
  const { currentNonce } = useNonce()
  const { handleError } = useError()
  const preferencesStore = usePreferencesStore()

  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isLoading = ref(true)
  const isEmailSent = ref(false)
  const emailError = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function init() {
    try {
      const currentSession = await getCurrentSession()

      session.value = currentSession
      user.value = currentSession?.user ?? null
    } catch (error) {
      handleError('AUTH.INIT_FAILED', error)
    } finally {
      isLoading.value = false
    }
  }

  async function signInWithGoogle(response: GoogleSignInResponse) {
    if (!currentNonce.value) {
      const error = new Error('No nonce available for authentication')
      handleError('AUTH.GOOGLE_SIGNIN_NO_NONCE', error)
      return
    }

    try {
      const data = await signInWithIdToken({
        provider: 'google',
        token: response.credential || '',
        nonce: currentNonce.value.nonce,
      })

      return data
    } catch (error) {
      handleError('AUTH.GOOGLE_SIGNIN_FAILED', error)
    }
  }

  async function signInWithOtp(email: string) {
    try {
      isEmailSent.value = false
      emailError.value = null

      const data = await sendOtpToEmail(email, `${window.location.origin}/auth/callback`)

      isEmailSent.value = true

      return data
    } catch (error) {
      emailError.value = error instanceof Error ? error.message : 'An unknown error occurred'
      handleError('AUTH.OTP_SEND_FAILED', error, { action: 'sending OTP' })
    }
  }

  async function verifyOtp(email: string, token: string) {
    try {
      const data = await verifyEmailOtp(email, token)

      return data
    } catch (error) {
      handleError('AUTH.OTP_VERIFY_FAILED', error, { action: 'verifying OTP' })
    }
  }

  async function signOut() {
    try {
      await signOutUser()

      session.value = null
      user.value = null

      preferencesStore.reset()
    } catch (error) {
      const context = user.value?.id ? { userId: user.value.id } : undefined
      handleError('AUTH.SIGNOUT_FAILED', error, context)
    }
  }

  async function updateProfile(updates: { email?: string; data?: object }) {
    try {
      const data = await updateUserPreferences(updates)

      user.value = data.user

      return data
    } catch (error) {
      const context = user.value?.id ? { userId: user.value.id } : undefined
      handleError('AUTH.PROFILE_UPDATE_FAILED', error, context)
    }
  }

  function resetEmailState() {
    isEmailSent.value = false
    emailError.value = null
  }

  // Subscribe to auth state changes
  onAuthStateChange(async (event, currentSession) => {
    const previousUserId = user.value?.id

    session.value = currentSession
    user.value = currentSession?.user ?? null

    if (currentSession?.user && currentSession.user.id !== previousUserId) {
      await preferencesStore.loadPreferences()
    }
  })

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    isEmailSent,
    emailError,

    init,
    signOut,
    updateProfile,
    signInWithGoogle,
    signInWithOtp,
    verifyOtp,
    resetEmailState,
  }
})
