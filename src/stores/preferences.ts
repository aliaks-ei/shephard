import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Dark } from 'quasar'
import { useAuthStore } from './auth'
import {
  getUserPreferences,
  saveUserPreference,
  type UserPreferences,
} from 'src/services/user.service'

export const usePreferencesStore = defineStore('preferences', () => {
  const authStore = useAuthStore()

  const preferences = ref<UserPreferences>({
    darkMode: false,
    notificationsEnabled: false,
  })
  const isLoading = ref(false)

  const isDark = computed(() => preferences.value.darkMode)
  const areNotificationsEnabled = computed(() => preferences.value.notificationsEnabled)

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
          notificationsEnabled: userPrefs.notificationsEnabled ?? false,
        }
      }

      applyPreferences()
    } catch (err) {
      console.error('Error loading user preferences:', err)
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
        console.error(`Error saving preference ${key}:`, err)
      }
    }
  }

  function toggleDarkMode() {
    savePreference('darkMode', !preferences.value.darkMode)
  }

  function setNotificationsEnabled(enabled: boolean) {
    savePreference('notificationsEnabled', enabled)
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
    areNotificationsEnabled,
    loadPreferences,
    savePreference,
    toggleDarkMode,
    setNotificationsEnabled,
    initializeWithDefaults,
  }
})
