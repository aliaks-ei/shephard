import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { supabase } from 'src/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { GoogleSignInResponse } from 'src/boot/google-auth'
import { useNonce } from 'src/composables/useNonce'
import { useError } from 'src/composables/useError'

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
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

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
      return { data: null, error }
    }

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential || '',
        nonce: currentNonce.nonce,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      handleError(error, 'AUTH.GOOGLE_SIGNIN_FAILED')
      return { data: null, error }
    }
  }

  // Send OTP to email
  async function signInWithOtp(email: string) {
    try {
      isEmailSent.value = false
      emailError.value = null

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      isEmailSent.value = true

      return { data, error: null }
    } catch (error) {
      emailError.value = error instanceof Error ? error.message : 'An unknown error occurred'
      handleError(error, 'AUTH.OTP_SEND_FAILED')

      return { data: null, error }
    }
  }

  // Verify OTP sent to email
  async function verifyOtp(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'magiclink',
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      handleError(error, 'AUTH.OTP_VERIFY_FAILED')
      return { data: null, error }
    }
  }

  // Sign out
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      session.value = null
      user.value = null

      return { error: null }
    } catch (error) {
      handleError(error, 'AUTH.SIGNOUT_FAILED')
      return { error }
    }
  }

  // Update profile
  async function updateProfile(updates: { email?: string; data?: object }) {
    try {
      const { data, error } = await supabase.auth.updateUser(updates)

      if (error) throw error

      user.value = data.user

      return { data, error: null }
    } catch (error) {
      handleError(error, 'AUTH.PROFILE_UPDATE_FAILED')
      return { data: null, error }
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
