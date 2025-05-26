import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Dark } from 'quasar'
import { useAuthStore } from './auth'
import {
  getUserPreferences,
  saveUserPreference,
  type UserPreferences,
} from 'src/services/user.service'
import { useError } from 'src/composables/useError'

export const usePreferencesStore = defineStore('preferences', () => {
  const authStore = useAuthStore()
  const { handleError } = useError()

  const preferences = ref<UserPreferences>({
    darkMode: false,
    pushNotificationsEnabled: false,
  })
  const isLoading = ref(false)

  const isDark = computed(() => preferences.value.darkMode)
  const arePushNotificationsEnabled = computed(() => preferences.value.pushNotificationsEnabled)

  function getSystemDarkMode(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function initializeWithDefaults() {
    preferences.value = {
      ...preferences.value,
      darkMode: getSystemDarkMode(),
    }
    applyPreferences()
  }

  function applyPreferences() {
    Dark.set(!!preferences.value.darkMode)

    // Apply other preferences as needed
    // ...
  }

  async function loadPreferences() {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      initializeWithDefaults()
      return
    }

    isLoading.value = true

    try {
      const userPrefs = await getUserPreferences(authStore.user.id)

      if (userPrefs) {
        preferences.value = {
          darkMode: userPrefs.darkMode ?? false,
          pushNotificationsEnabled: userPrefs.pushNotificationsEnabled ?? false,
        }
      }

      applyPreferences()
    } catch (err) {
      handleError(err, 'USER.PREFERENCES_LOAD_FAILED')
      initializeWithDefaults()
    } finally {
      isLoading.value = false
    }
  }

  async function savePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) {
    preferences.value[key] = value

    applyPreferences()

    if (authStore.isAuthenticated && authStore.user?.id) {
      try {
        await saveUserPreference(authStore.user.id, key, value as boolean | string | number | null)
      } catch (err) {
        handleError(err, 'USER.PREFERENCE_UPDATE_FAILED', { entityName: key.toString() })
      }
    }
  }

  function toggleDarkMode() {
    savePreference('darkMode', !preferences.value.darkMode)
  }

  function setPushNotificationsEnabled(enabled: boolean) {
    savePreference('pushNotificationsEnabled', enabled)
  }

  // Watch for changes in auth state and reload preferences accordingly
  watch(
    () => authStore.user,
    (newUser, oldUser) => {
      if (newUser?.id !== oldUser?.id) {
        loadPreferences()
      }
    },
  )

  return {
    preferences,
    isLoading,
    isDark,
    arePushNotificationsEnabled,
    loadPreferences,
    savePreference,
    toggleDarkMode,
    setPushNotificationsEnabled,
    initializeWithDefaults,
  }
})
