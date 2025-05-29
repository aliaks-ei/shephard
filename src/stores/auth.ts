import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { supabase } from 'src/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { GoogleSignInResponse } from 'src/boot/google-auth'
import { useNonce } from 'src/composables/useNonce'
import { useError } from 'src/composables/useError'
import {
  getCurrentSession,
  signInWithIdToken,
  sendOtpToEmail,
  verifyEmailOtp,
  signOutUser,
  updateUserProfile,
} from 'src/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const { getCurrentNonce } = useNonce()
  const { handleError } = useError()

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

  // Send OTP to email
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

  // Verify OTP sent to email
  async function verifyOtp(email: string, token: string) {
    try {
      const data = await verifyEmailOtp(email, token)

      return data
    } catch (error) {
      handleError(error, 'AUTH.OTP_VERIFY_FAILED')
    }
  }

  // Sign out
  async function signOut() {
    try {
      await signOutUser()

      session.value = null
      user.value = null
    } catch (error) {
      handleError(error, 'AUTH.SIGNOUT_FAILED')
    }
  }

  // Update profile
  async function updateProfile(updates: { email?: string; data?: object }) {
    try {
      const data = await updateUserProfile(updates)

      user.value = data.user

      return data
    } catch (error) {
      handleError(error, 'AUTH.PROFILE_UPDATE_FAILED')
    }
  }

  // Reset email state
  function resetEmailState() {
    isEmailSent.value = false
    emailError.value = null
  }

  // Subscribe to auth state changes
  supabase.auth.onAuthStateChange((_event, currentSession) => {
    session.value = currentSession
    user.value = currentSession?.user ?? null
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
