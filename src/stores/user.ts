import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useDateFormat } from '@vueuse/core'

import { useAuthStore } from './auth'
import { usePreferencesStore } from './preferences'
import { getUserInitial, getUserDisplayName } from 'src/utils/name'
import type { UserPreferences } from 'src/api/user'

export type UserProfile = {
  id: string
  email: string | undefined
  displayName: string
  avatarUrl: string | undefined
  nameInitial: string
  authProvider: string | undefined
  createdAt: string | undefined
  formattedCreatedAt: string
  preferences: UserPreferences | null
}

export type UserProfileUpdates = {
  preferences: Partial<UserPreferences>
}

/**
 * User store that provides a unified interface for user data
 * Focuses on combining auth data and preferences into a cohesive user profile
 */
export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()
  const preferencesStore = usePreferencesStore()

  const userProfile = computed((): UserProfile | null => {
    if (!authStore.user) return null

    return {
      id: authStore.user.id,
      email: authStore.user.email,
      displayName: getUserDisplayName(
        authStore.user.user_metadata?.full_name || authStore.user.user_metadata?.name,
        authStore.user.email,
      ),
      avatarUrl: authStore.user.user_metadata?.avatar_url,
      nameInitial: getUserInitial(authStore.user.email),
      authProvider: authStore.user.app_metadata?.provider,
      createdAt: authStore.user.created_at,
      formattedCreatedAt: useDateFormat(new Date(authStore.user.created_at), 'MMMM D, YYYY').value,
      preferences: preferencesStore.preferences,
    }
  })

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => authStore.isLoading || preferencesStore.isLoading)

  async function updateUserPreferences({ preferences }: UserProfileUpdates) {
    await preferencesStore.updatePreferences(preferences)
  }

  async function signOut() {
    await authStore.signOut()
  }

  return {
    userProfile,
    isAuthenticated,
    isLoading,

    updateUserPreferences,
    signOut,

    auth: authStore,
    preferences: preferencesStore,
  }
})
