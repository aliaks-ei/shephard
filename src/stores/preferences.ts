import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

import { useAuthStore } from 'src/stores/auth'
import {
  getUserPreferences,
  saveUserPreferences,
  type UserPreferences,
  type CompleteUserPreferences,
  DEFAULT_PREFERENCES,
} from 'src/api/user'
import { useError } from 'src/composables/useError'
import { useTheme } from 'src/composables/useTheme'

export const usePreferencesStore = defineStore('preferences', () => {
  const authStore = useAuthStore()
  const { handleError } = useError()

  const preferences = useStorage<CompleteUserPreferences>('user-preferences', {
    ...DEFAULT_PREFERENCES,
  })
  const isLoading = ref(false)

  const theme = computed(() => preferences.value.theme)
  const arePushNotificationsEnabled = computed(() => preferences.value.pushNotificationsEnabled)
  const currency = computed(() => preferences.value.currency)
  const isPrivacyModeEnabled = computed(() => preferences.value.isPrivacyModeEnabled)

  const { isDark } = useTheme(theme)

  function initializeWithDefaults() {
    preferences.value = { ...DEFAULT_PREFERENCES }
  }

  async function loadPreferences() {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      initializeWithDefaults()
      return
    }

    try {
      const userPreferences = await getUserPreferences(authStore.user.id)

      preferences.value = {
        theme: userPreferences.theme ?? DEFAULT_PREFERENCES.theme,
        pushNotificationsEnabled:
          userPreferences.pushNotificationsEnabled ?? DEFAULT_PREFERENCES.pushNotificationsEnabled,
        currency: userPreferences.currency ?? DEFAULT_PREFERENCES.currency,
        isPrivacyModeEnabled:
          userPreferences.isPrivacyModeEnabled ?? DEFAULT_PREFERENCES.isPrivacyModeEnabled,
      }
    } catch (err) {
      handleError('USER.PREFERENCES_LOAD_FAILED', err, { userId: authStore.user?.id })
    }
  }

  async function updatePreferences(updates: Partial<UserPreferences>) {
    if (!authStore.user?.id) return

    preferences.value = {
      ...preferences.value,
      ...updates,
    }

    try {
      await saveUserPreferences(authStore.user.id, preferences.value)
    } catch (err) {
      handleError('USER.PREFERENCES_SAVE_FAILED', err, { userId: authStore.user?.id })
    }
  }

  async function togglePrivacyMode() {
    const newValue = !preferences.value.isPrivacyModeEnabled

    await updatePreferences({ isPrivacyModeEnabled: newValue })
  }

  function reset() {
    preferences.value = { ...DEFAULT_PREFERENCES }
    isLoading.value = false
  }

  return {
    preferences,
    isLoading,
    theme,
    isDark,
    arePushNotificationsEnabled,
    currency,
    isPrivacyModeEnabled,
    loadPreferences,
    updatePreferences,
    togglePrivacyMode,
    initializeWithDefaults,
    reset,
  }
})
