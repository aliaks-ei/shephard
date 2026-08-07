import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import {
  getUserPreferences,
  saveUserPreferences,
  type UserPreferences,
  type CompleteUserPreferences,
  DEFAULT_PREFERENCES,
} from 'src/api/user'
import { useError } from 'src/composables/useError'
import { useTheme } from 'src/composables/useTheme'
import { defaultNotificationPushPreferences } from 'src/types/notifications'

export const usePreferencesStore = defineStore('preferences', () => {
  const { handleError } = useError()
  const activeUserId = ref<string | null>(null)

  const preferences = ref<CompleteUserPreferences>({
    ...DEFAULT_PREFERENCES,
  })
  const isLoading = ref(false)

  const theme = computed(() => preferences.value.theme)
  const arePushNotificationsEnabled = computed(() => preferences.value.pushNotificationsEnabled)
  const pushNotificationsByType = computed(() => preferences.value.pushNotificationsByType)
  const currency = computed(() => preferences.value.currency)
  const isPrivacyModeEnabled = computed(() => preferences.value.isPrivacyModeEnabled)

  const { isDark } = useTheme(theme)

  function initializeWithDefaults() {
    preferences.value = { ...DEFAULT_PREFERENCES }
  }

  function storageKey(userId: string) {
    return `user-preferences:${userId}`
  }

  function persistLocally(userId: string) {
    localStorage.setItem(storageKey(userId), JSON.stringify(preferences.value))
  }

  async function loadPreferences(userId = activeUserId.value) {
    activeUserId.value = userId
    if (!userId) {
      initializeWithDefaults()
      return
    }

    try {
      const cached = localStorage.getItem(storageKey(userId))
      if (cached) preferences.value = JSON.parse(cached) as CompleteUserPreferences
      const userPreferences = await getUserPreferences(userId)

      preferences.value = {
        theme: userPreferences.theme ?? DEFAULT_PREFERENCES.theme,
        pushNotificationsEnabled:
          userPreferences.pushNotificationsEnabled ?? DEFAULT_PREFERENCES.pushNotificationsEnabled,
        pushNotificationsByType: {
          ...defaultNotificationPushPreferences,
          ...(userPreferences.pushNotificationsByType ?? {}),
        },
        currency: userPreferences.currency ?? DEFAULT_PREFERENCES.currency,
        isPrivacyModeEnabled:
          userPreferences.isPrivacyModeEnabled ?? DEFAULT_PREFERENCES.isPrivacyModeEnabled,
      }
      persistLocally(userId)
    } catch (err) {
      handleError('USER.PREFERENCES_LOAD_FAILED', err, { userId })
    }
  }

  async function updatePreferences(updates: Partial<UserPreferences>, userId = activeUserId.value) {
    if (!userId) return

    const previous = JSON.parse(JSON.stringify(preferences.value)) as CompleteUserPreferences

    preferences.value = {
      ...preferences.value,
      ...updates,
      pushNotificationsByType: {
        ...preferences.value.pushNotificationsByType,
        ...(updates.pushNotificationsByType ?? {}),
      },
    }

    try {
      await saveUserPreferences(userId, preferences.value)
      persistLocally(userId)
    } catch (err) {
      preferences.value = previous
      handleError('USER.PREFERENCES_SAVE_FAILED', err, { userId })
      throw err
    }
  }

  async function togglePrivacyMode(userId = activeUserId.value) {
    const newValue = !preferences.value.isPrivacyModeEnabled

    await updatePreferences({ isPrivacyModeEnabled: newValue }, userId)
  }

  function reset() {
    activeUserId.value = null
    preferences.value = { ...DEFAULT_PREFERENCES }
    isLoading.value = false
  }

  return {
    preferences,
    isLoading,
    theme,
    isDark,
    arePushNotificationsEnabled,
    pushNotificationsByType,
    currency,
    isPrivacyModeEnabled,
    loadPreferences,
    updatePreferences,
    togglePrivacyMode,
    initializeWithDefaults,
    reset,
  }
})
