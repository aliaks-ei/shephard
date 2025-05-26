import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAuthStore } from './auth'
import { usePreferencesStore } from './preferences'
import type { UserPreferences } from 'src/services/user.service'
import type { GoogleSignInResponse } from 'src/boot/google-auth'

/**
 * User store that provides a unified interface for user data
 * Combines auth data and application-specific user data
 */
export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()
  const preferencesStore = usePreferencesStore()

  // Email OTP state
  const isEmailSent = computed(() => authStore.isEmailSent)
  const emailError = computed(() => authStore.emailError)

  // Computed properties that combine data from auth and preferences stores
  const currentUser = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => authStore.isLoading || preferencesStore.isLoading)
  const userEmail = computed(() => authStore.user?.email)
  const userId = computed(() => authStore.user?.id)
  const userPreferences = computed(() => preferencesStore.preferences)
  const isDarkMode = computed(() => preferencesStore.isDark)
  const areNotificationsEnabled = computed(() => preferencesStore.areNotificationsEnabled)
  const avatarUrl = computed(() => authStore.user?.user_metadata?.avatar_url)
  const authProvider = computed(() => authStore.user?.app_metadata?.provider)
  const createdAt = computed(() => authStore.user?.created_at)

  const displayName = computed(() => {
    if (!authStore.user) return ''

    const fullName = authStore.user.user_metadata?.full_name || authStore.user.user_metadata?.name

    if (fullName) return fullName

    const email = authStore.user.email || ''
    const atIndex = email.indexOf('@')

    return atIndex > 0 ? email.substring(0, atIndex) : email
  })

  const nameInitial = computed(() => {
    const email = authStore.user?.email || ''
    if (!email) return '?'
    return email.charAt(0).toUpperCase()
  })

  const formattedCreatedAt = computed(() => {
    if (!createdAt.value) return 'Not available'

    const date = new Date(createdAt.value)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  })

  const userProfile = computed(() => {
    if (!authStore.user) return null

    return {
      id: authStore.user.id,
      email: authStore.user.email,
      displayName: displayName.value,
      avatarUrl: avatarUrl.value,
      nameInitial: nameInitial.value,
      authProvider: authProvider.value,
      createdAt: createdAt.value,
      formattedCreatedAt: formattedCreatedAt.value,
      preferences: userPreferences.value,
    }
  })

  async function initUser() {
    if (authStore.isLoading) {
      await authStore.init()
    }

    if (authStore.isAuthenticated) {
      await preferencesStore.loadPreferences()
    }
  }

  function toggleDarkMode() {
    preferencesStore.toggleDarkMode()
  }

  function setNotificationsEnabled(enabled: boolean) {
    preferencesStore.setNotificationsEnabled(enabled)
  }

  async function updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) {
    await preferencesStore.savePreference(key, value)
  }

  async function signOut() {
    return authStore.signOut()
  }

  async function updateProfile(updates: { email?: string; data?: object }) {
    return authStore.updateProfile(updates)
  }

  async function signInWithOtp(email: string) {
    return authStore.signInWithOtp(email)
  }

  async function verifyOtp(email: string, token: string) {
    return authStore.verifyOtp(email, token)
  }

  function resetEmailState() {
    authStore.resetEmailState()
  }

  async function signInWithGoogle(response: GoogleSignInResponse) {
    return authStore.signInWithGoogle(response)
  }

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    userEmail,
    userId,
    displayName,
    avatarUrl,
    nameInitial,
    authProvider,
    createdAt,
    formattedCreatedAt,
    userPreferences,
    isDarkMode,
    areNotificationsEnabled,
    userProfile,
    isEmailSent,
    emailError,

    initUser,
    toggleDarkMode,
    setNotificationsEnabled,
    updatePreference,
    signOut,
    updateProfile,
    signInWithOtp,
    verifyOtp,
    resetEmailState,
    signInWithGoogle,
  }
})
