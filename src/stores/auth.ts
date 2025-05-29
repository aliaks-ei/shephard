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
  updateUserProfile,
  onAuthStateChange,
} from 'src/api/auth'
import { usePreferencesStore } from './preferences'
import type { Session } from 'src/api/auth'
import type { User } from 'src/api/user'
import type { GoogleSignInResponse } from 'src/types'

export const useAuthStore = defineStore('auth', () => {
  const { getCurrentNonce } = useNonce()
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
      handleError(error, 'AUTH.INIT_FAILED')
    } finally {
      isLoading.value = false
    }
  }

  async function signInWithGoogle(response: GoogleSignInResponse) {
    const currentNonce = getCurrentNonce()

    if (!currentNonce) {
      const error = new Error('No nonce available for authentication')
      handleError(error, 'AUTH.GOOGLE_SIGNIN_NO_NONCE')
      return
    }

    try {
      const data = await signInWithIdToken({
        provider: 'google',
        token: response.credential || '',
        nonce: currentNonce.nonce,
      })

      return data
    } catch (error) {
      handleError(error, 'AUTH.GOOGLE_SIGNIN_FAILED')
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
      handleError(error, 'AUTH.OTP_SEND_FAILED')
    }
  }

  async function verifyOtp(email: string, token: string) {
    try {
      const data = await verifyEmailOtp(email, token)

      return data
    } catch (error) {
      handleError(error, 'AUTH.OTP_VERIFY_FAILED')
    }
  }

  async function signOut() {
    try {
      await signOutUser()

      session.value = null
      user.value = null

      preferencesStore.reset()
    } catch (error) {
      handleError(error, 'AUTH.SIGNOUT_FAILED')
    }
  }

  async function updateProfile(updates: { email?: string; data?: object }) {
    try {
      const data = await updateUserProfile(updates)

      user.value = data.user

      return data
    } catch (error) {
      handleError(error, 'AUTH.PROFILE_UPDATE_FAILED')
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
