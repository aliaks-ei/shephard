import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  const preferences = ref<CompleteUserPreferences>({ ...DEFAULT_PREFERENCES })
  const isLoading = ref(false)

  const isDark = computed(() => preferences.value.darkMode)
  const arePushNotificationsEnabled = computed(() => preferences.value.pushNotificationsEnabled)
  const currency = computed(() => preferences.value.currency)

  const { systemDarkMode } = useTheme(isDark, {
    onSystemDarkModeChange: (isSystemDark: boolean) => {
      if (preferences.value.darkMode === undefined) {
        preferences.value = {
          ...preferences.value,
          darkMode: isSystemDark,
        }
      }
    },
  })

  function initializeWithDefaults() {
    preferences.value = {
      ...DEFAULT_PREFERENCES,
      darkMode: systemDarkMode.value,
    }
  }

  async function loadPreferences() {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      initializeWithDefaults()
      return
    }

    isLoading.value = true

    try {
      const userPreferences = await getUserPreferences(authStore.user.id)
      if (!userPreferences) return

      preferences.value = {
        darkMode: userPreferences.darkMode ?? DEFAULT_PREFERENCES.darkMode,
        pushNotificationsEnabled:
          userPreferences.pushNotificationsEnabled ?? DEFAULT_PREFERENCES.pushNotificationsEnabled,
        currency: userPreferences.currency ?? DEFAULT_PREFERENCES.currency,
      }
    } catch (err) {
      handleError('USER.PREFERENCES_LOAD_FAILED', err, { userId: authStore.user?.id })
      initializeWithDefaults()
    } finally {
      isLoading.value = false
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

  function reset() {
    preferences.value = { ...DEFAULT_PREFERENCES }
    isLoading.value = false
  }

  return {
    preferences,
    isLoading,
    isDark,
    arePushNotificationsEnabled,
    currency,
    loadPreferences,
    updatePreferences,
    initializeWithDefaults,
    reset,
  }
})
